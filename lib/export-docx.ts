"use client";

import { formatTime12 as formatTime12Stable } from "@/lib/time";
import type { FormData, PhotoData } from "@/lib/export";

function S(v: unknown) { return v == null ? "" : String(v).trim(); }

async function fetchToDataURL(url: string): Promise<string> {
  try {
    if (!url || url.startsWith("data:")) return url;
    const r = await fetch(`/api/image-proxy?url=${encodeURIComponent(url)}`, { cache: "no-store" });
    if (!r.ok) return "";
    const blob = await r.blob();
    return await new Promise<string>((res, rej) => {
      const reader = new FileReader();
      reader.onloadend = () => res(String(reader.result || ""));
      reader.onerror = rej;
      reader.readAsDataURL(blob);
    });
  } catch { return ""; }
}

function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  try {
    const base64 = dataUrl.split(",")[1];
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch { return new Uint8Array(); }
}

export async function generateFullReportDOCXEditable(
  form: FormData,
  sectionPhotos: Record<string, PhotoData[]>,
  signatureData: string | null,
  siteMap?: PhotoData,
  _options?: { includeSiteMap?: boolean }
): Promise<void> {
  const { Document, Packer, Paragraph, HeadingLevel, TextRun, ImageRun, Table, TableRow, TableCell, WidthType } = await import("docx");
  // @ts-ignore
  const fs_mod = await import("file-saver");
  const saveAs = (fs_mod as any).saveAs || (fs_mod as any).default;

  const children: any[] = [];

  // Title
  const coverTitle = S((form as any).purposeOfFieldVisit) || "CONSTRUCTION PROGRESS REPORT";
  children.push(new Paragraph({ text: coverTitle, heading: HeadingLevel.TITLE }));
  const locLine = [S(form.companyName), S(form.location)].filter(Boolean).join(" | ");
  if (locLine) children.push(new Paragraph({ text: locLine }));
  const today = (d?: string) => (d ? new Date(d) : new Date()).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  children.push(new Paragraph({ text: `Report Date: ${today(form.inspectionDate)}` }));

  // TOC
  children.push(new Paragraph({ text: "Table of Contents", heading: HeadingLevel.HEADING_1 }));
  ["1. Site Location and Field Condition Summary","2. Background","3. Field Observation","4. Conclusion"].forEach((t)=>{
    children.push(new Paragraph({ children: [ new TextRun({ text: t }) ] }));
  });

  // Section 1 table
  children.push(new Paragraph({ text: "1. Site Location and Field Condition Summary", heading: HeadingLevel.HEADING_1 }));
  const addr = [form.streetAddress, [form.city, form.state].filter(Boolean).join(", "), [form.country, form.zipCode].filter(Boolean).join(" ")]
    .filter(Boolean).map(S).filter(Boolean).join(", ") || S(form.location);
  const weatherBits: string[] = [];
  if (S((form as any).temperature)) weatherBits.push(`${S((form as any).temperature)} deg C`);
  if (S((form as any).weatherDescription)) weatherBits.push(S((form as any).weatherDescription));
  if (S((form as any).humidity)) weatherBits.push(`Humidity ${S((form as any).humidity)}%`);
  if (S((form as any).windSpeed)) weatherBits.push(`Wind ${S((form as any).windSpeed)} km/h`);
  const kv: Array<[string,string]> = [
    ["PURPOSE OF FIELD VISIT", S((form as any).purposeOfFieldVisit)],
    ["Report ID (If any)", S(form.reportId)],
    ["Name of Inspector", S(form.inspectorName)],
    ["Address of Inspection Company", S(form.nameandAddressOfCompany)],
    ["Client / Owner Name", S(form.clientName)],
    ["Inspection Company Name", S(form.companyName)],
    ["Phone Number of Inspection Company", S(form.contactPhone)],
    ["Email of Inspection Company", S(form.contactEmail)],
    ["Date of Inspection", today(form.inspectionDate)],
    ["Start Time of Inspection", formatTime12Stable(S((form as any).startInspectionTime))],
    ["Address of Inspection Property", addr],
    ["Weather Conditions", weatherBits.join(" | ")],
    ["Current work progress", S((form as any).workProgress)],
    ["All safety protocols & PPE followed?", S((form as any).safetyCompliance)],
    ["Safety signage & access control in place?", S((form as any).safetySignage)],
  ].filter(([,v]) => S(v));
  const rows = kv.map(([k,v]) => new TableRow({ children: [
    new TableCell({ children: [ new Paragraph({ children: [ new TextRun({ text: k, bold: true }) ] }) ] }),
    new TableCell({ children: [ new Paragraph({ children: [ new TextRun({ text: v }) ] }) ] }),
  ] }));
  const table = new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows });
  children.push(table);

  // Background
  children.push(new Paragraph({ text: "2. Background", heading: HeadingLevel.HEADING_1 }));
  const backgroundHTML = [ S(form.backgroundManual), S(form.backgroundAuto) ].filter(Boolean).join("\n\n");
  if (backgroundHTML) backgroundHTML.split(/\n+/).forEach((t)=> children.push(new Paragraph({ children: [ new TextRun({ text: t }) ] })));

  // Field Observation
  children.push(new Paragraph({ text: "3. Field Observation", heading: HeadingLevel.HEADING_1 }));
  if (S(form.fieldObservationText)) children.push(new Paragraph({ children: [ new TextRun({ text: S(form.fieldObservationText) }) ] }));

  // Photos sequence (images remain images; captions/descriptions editable)
  const seq: PhotoData[] = [];
  (sectionPhotos.background || []).forEach((p)=>seq.push(p));
  (sectionPhotos.fieldObservation || []).forEach((p)=>seq.push(p));
  (sectionPhotos.additional || []).forEach((p)=>seq.push(p));
  (sectionPhotos.equipment || []).forEach((p)=>seq.push(p));
  const section1 = [ ...(sectionPhotos.work || []), ...(sectionPhotos.safety || []) ];
  section1.forEach((p)=>seq.push(p));
  let num = 1;
  for (const p of seq) {
    const cap = S(p.caption) || S(p.name) || "Photo";
    children.push(new Paragraph({ children: [ new TextRun({ text: `Photo ${num}: ${cap}`, bold: true }) ] }));
    let src = p.data;
    if (src && src.startsWith("http")) { try { const d = await fetchToDataURL(src); if (d) src = d; } catch {} }
    if (src && src.startsWith("data:")) {
      try {
        const buf = dataUrlToUint8Array(src);
        // @ts-ignore
        if (buf.length) children.push(new Paragraph({ children: [ new ImageRun({ data: buf, transformation: { width: 520, height: 320 } }) ] }));
      } catch {}
    }
    if (S(p.description)) children.push(new Paragraph({ children: [ new TextRun({ text: S(p.description) }) ] }));
    num++;
  }

  // Conclusion + signature
  children.push(new Paragraph({ text: "4. Conclusion", heading: HeadingLevel.HEADING_1 }));
  const parts: string[] = [];
  if (S(form.status)) parts.push(`Overall status: ${S(form.status)}.`);
  if (S(form.scheduleCompliance)) parts.push(`Schedule: ${S(form.scheduleCompliance)}.`);
  if (S(form.materialAvailability)) parts.push(`Materials: ${S(form.materialAvailability)}.`);
  if (S(form.safetyCompliance)) parts.push(`Safety: ${S(form.safetyCompliance)}.`);
  const extras = [S(form.additionalComments), S(form.inspectorSummary), S(form.recommendations)].filter(Boolean);
  const concl = parts.concat(extras).filter(Boolean);
  concl.forEach((t)=> children.push(new Paragraph({ children: [ new TextRun({ text: t }) ] })));
  const sig = signatureData || (form as any).signatureData;
  if (sig && String(sig).startsWith("data:")) {
    try { const buf = dataUrlToUint8Array(sig as string); if (buf.length) children.push(new Paragraph({ children: [ new ImageRun({ data: buf, transformation: { width: 300, height: 120 } }) ] })); } catch {}
  }

  const docMod = await import("docx");
  const doc = new docMod.Document({ sections: [{ children }] });
  const blob = await docMod.Packer.toBlob(doc);
  const dateStr = new Date().toISOString().split("T")[0];
  const nameBase = (S(form.reportId) || "report").replace(/[^\w.-]+/g, "_");
  saveAs(blob, `ninekiwi_report_${nameBase}_${dateStr}.docx`);
}

