// eslint-disable @typescript-eslint/no-explicit-any
"use client";

import type { jsPDF as JsPDFType } from "jspdf";
import { jsPDF as JsPDFClass } from "jspdf";
import { formatTime12 as formatTime12Stable } from "@/lib/time";

export interface PhotoData {
  name: string;
  data: string;
  includeInSummary?: boolean;
  caption?: string;
  figureNumber?: number;
  description?: string;
}

interface WeatherData {
  temperature?: string | number;
  humidity?: string | number;
  windSpeed?: string | number;
  weatherDescription?: string;
}

export interface FormData extends WeatherData {
  companyName?: string;
  nameandAddressOfCompany?: string;
  contactPhone?: string;
  contactEmail?: string;
  status?: "In Progress" | "Completed" | "On Track" | "";
  purposeOfFieldVisit?: string;
  reportId?: string;
  inspectionDate?: string;
  startInspectionTime?: string;
  inspectorName?: string;
  clientName?: string;
  location?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  lat?: string | number;
  lon?: string | number;
  workProgress?: string;
  safetyCompliance?: string;
  safetySignage?: string;
  scheduleCompliance?: string;
  materialAvailability?: string;
  workerAttendance?: string;
  additionalComments?: string;
  inspectorSummary?: string;
  recommendations?: string;
  backgroundManual?: string;
  backgroundAuto?: string;
  fieldObservationText?: string;
  signatureData?: string;
}

/* ============================= THEME (B&W, Word-like) ============================= */
const THEME_CSS = `
@page { size: A4; margin: 0; }
.nk-root, .nk-root * {
  box-sizing: border-box !important;
  color: #111 !important;
  font-family: Calibri, Arial, 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
.nk-page {
  width: 210mm;
  min-height: 297mm;
  /* slightly tighter top padding since header is smaller */
  padding: 16mm 18mm 24mm 18mm;
  page-break-after: always;
  background: #fff;
  position: relative;
}
.nk-page:last-child { page-break-after: auto; }

/* Header (simple) */
.nk-header {
  /* reduce vertical footprint of header */
  margin: 0 0 6mm 0;
  padding-bottom: 2.5mm;
  border-bottom: 1px solid #222;
  position: relative;
  z-index: 2;
}
.nk-head-title {
  text-align: center;
  /* smaller title font */
  font-size: 9.8pt;
  font-weight: 700;
  letter-spacing: 0.2px;
  color: #111 !important;
  text-transform: uppercase;
}

/* Footer */
.nk-footer {
  position: absolute;
  left: 18mm;
  right: 18mm;
  bottom: 12mm;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 10pt;
  font-weight: 600;
  color: #444 !important;
  padding-top: 3mm;
  border-top: 1px solid #ddd;
}

/* Section Titles (centered; no bottom border) */
.nk-block-title {
  font-size: 14pt;
  font-weight: 700;
  margin: 6mm 0 6mm 0;
  text-align: center;
  letter-spacing: 0.2px;
  color: #000 !important;
  padding-bottom: 0;
  border-bottom: 0;
}

.nk-subtitle {
  font-size: 12pt;
  font-weight: 700;
  margin: 3mm 0 2mm 0;
  text-align: left;
  color: #000 !important;
}

.nk-p {
  font-size: 11pt;
  line-height: 1.5;
  text-align: justify;
  margin-bottom: 3mm;
}
/* Generic text elements (Word-friendly) */
p { font-size: 11pt; line-height: 1.5; margin: 0 0 3mm 0; }
ul, ol { margin: 0 0 3mm 4mm; padding: 0 0 0 4mm; }
li { margin: 0 0 1.5mm 0; font-size: 11pt; line-height: 1.5; }
strong { font-weight: 700; }
em { font-style: italic; }

/* Tables (minimal Word look) */
.nk-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 10.5pt;
  margin: 2mm 0 1mm 0;
}
.nk-table th, .nk-table td { border: 0; padding: 4px 2px; vertical-align: top; }
.nk-table td:first-child {
  width: 38%;
  font-weight: 700;
  color: #111 !important;
}
.nk-meta { font-size: 10.5pt; color: #222 !important; }
.nk-muted { color: #666 !important; }

/* Key-Value table like Image 2 */
.nk-table.kv { margin-top: 4mm; }
.nk-table.kv thead th {
  font-weight: 700;
  text-transform: uppercase;
  border-bottom: 1px solid #000;
  padding: 2px 0 6px 0;
}
.nk-table.kv tbody td { padding: 6px 0; }
.nk-table.kv tbody td:first-child { width: 46%; }

/* Callout: no background or border (clean text block) */
.nk-callout {
  background: transparent;
  padding: 0;
  border: 0;
  margin: 4mm 0;
}
.nk-callout h3 {
  margin: 0 0 3mm 0;
  font-size: 11pt;
  font-weight: 700;
  color: #000 !important;
}

/* Grids */
.nk-grid-2 { display: grid; grid-template-columns: 1.15fr 1fr; gap: 6mm; align-items: start; }
.nk-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; }
.nk-one-col { display: grid; grid-template-columns: 1fr; gap: 6mm; }

/* Photo layouts (edge-to-edge, large) */
.nk-photo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; margin-top: 2mm; }
.nk-photo-grid.single { grid-template-columns: 1fr; }
.nk-photo-card { page-break-inside: avoid; margin-bottom: 6mm; background: transparent; border: 0; border-radius: 0; position: relative; }
.nk-photo-img-wrap { background: transparent; min-height: auto; max-height: 150mm; width: 100%; display: flex; align-items: center; justify-content: center; padding: 0; border-bottom: 0; position: relative; z-index: 1; }
.nk-photo-img { display: block !important; max-width: 100% !important; height: auto !important; max-height: 150mm !important; object-fit: contain !important; }
.nk-block-title, .nk-callout { position: relative; z-index: 2; page-break-inside: avoid; }
img { max-width: 100% !important; height: auto !important; }
.nk-caption { margin: 3mm 0 0 0; padding: 0; font-size: 10pt; font-weight: 600; text-align: center; line-height: 1.4; color: #000 !important; }
.nk-desc { margin: 2mm 0 0 0; padding: 0; font-size: 9.5pt; line-height: 1.5; text-align: justify; background: transparent; color: #333 !important; border: 0; word-break: break-word; }

/* Signature */
.nk-sign { margin-top: 12mm; border: 0; padding: 8mm 0 0 0; display: flex; align-items: center; gap: 12mm; page-break-inside: avoid; background: transparent; }
.nk-sign img { max-width: 70mm; max-height: 30mm; object-fit: contain; }

/* TOC (simple, B&W) */
.nk-toc { width: 100%; border-collapse: collapse; font-size: 11pt; margin-top: 4mm; }
.nk-toc td { border: 0; padding: 8px 4px; border-bottom: 0; }
.nk-toc .nk-toc-num { width: 15mm; text-align: right; padding-right: 8mm; font-weight: 700; color: #000 !important; }
`;

const S = (v: unknown) => (v == null ? "" : String(v).trim());

/* ----------------------- Helpers (maps, images, etc.) ----------------------- */
async function resolveCoords(form: FormData): Promise<{ lat: number; lon: number } | null> {
  const latNum = Number((form as any)?.lat);
  const lonNum = Number((form as any)?.lon);
  if (Number.isFinite(latNum) && Number.isFinite(lonNum)) return { lat: latNum, lon: lonNum };

  const addr = [form.streetAddress,
    [form.city, form.state].filter(Boolean).join(", "),
    [form.country, form.zipCode].filter(Boolean).join(" "),
  ].filter(Boolean).map(S).filter(Boolean).join(", ") || S(form.location);

  if (!addr) return null;
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(addr)}&count=1`;
    const r = await fetch(url, { headers: { 'Accept-Language': 'en' }, cache: 'no-store' });
    if (!r.ok) return null;
    const j = await r.json();
    const first = j?.results?.[0];
    const lat = Number(first?.latitude);
    const lon = Number(first?.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lon)) return { lat, lon };
  } catch {}
  return null;
}

async function buildSiteMapFromForm(form: FormData): Promise<PhotoData | undefined> {
  try {
    const coords = await resolveCoords(form);
    if (!coords) return undefined;
    const gkey = (process.env.NEXT_PUBLIC_GOOGLE_STATIC_MAPS_KEY || '').trim();
    const googleUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${coords.lat},${coords.lon}&zoom=15&size=1200x600&scale=2&maptype=roadmap&markers=color:green|${coords.lat},${coords.lon}${gkey ? `&key=${gkey}` : ''}`;
    const osmUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${coords.lat},${coords.lon}&zoom=15&size=1600x800&markers=${coords.lat},${coords.lon},lightgreen-pushpin`;

    const tryUrl = async (u: string): Promise<string> => {
      const d = await fetchToDataURL(u).catch(() => '');
      return d && d.startsWith('data:') ? d : '';
    };

    let data = '';
    if (gkey) data = await tryUrl(googleUrl);
    if (!data) data = await tryUrl(osmUrl);

    const photo: PhotoData = {
      name: 'Site Map',
      data: data || osmUrl,
      caption: 'Site location map',
      description: '',
    };
    return photo;
  } catch { return undefined; }
}

function formatTime12(t?: string): string { return formatTime12Stable(t); }

const joinAddress = (form: FormData): string => {
  const parts = [
    form.streetAddress,
    [form.city, form.state].filter(Boolean).join(", "),
    [form.country, form.zipCode].filter(Boolean).join(" "),
  ].filter(Boolean).map(S).filter(Boolean);
  return parts.join(", ");
};

const headerText = (form: FormData): string => {
  const addr = joinAddress(form) || S(form.location);
  const purpose = S((form as any).purposeOfFieldVisit);
  const base = purpose || "Progress Inspection";
  return [base, addr].filter(Boolean).join(" - ");
};

const headerBar = (form: FormData) => `
  <div class="nk-header">
    <div class="nk-head-title">${headerText(form)}</div>
  </div>
`;

const footerBar = () => `
  <div class="nk-footer">
    Page <span class="nk-page-num">1</span>
  </div>
`;

function mount(html: string): () => void {
  const root = document.createElement("div");
  root.className = "nk-root";
  root.style.position = "fixed";
  root.style.left = "-10000px";
  root.style.top = "-10000px";
  root.style.opacity = "0";
  (root.style as any).pointerEvents = "none";
  (root.style as any).zIndex = "-1";
  const style = document.createElement("style");
  style.textContent = THEME_CSS;
  root.appendChild(style);
  const slot = document.createElement("div");
  slot.innerHTML = html;
  root.appendChild(slot);
  document.body.appendChild(root);
  return () => root.parentNode?.removeChild(root);
}

async function toDataURL(resp: Response): Promise<string> {
  if (!resp.ok) throw new Error(String(resp.status));
  const blob = await resp.blob();
  return await new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onloadend = () => res(String(r.result));
    r.onerror = rej;
    r.readAsDataURL(blob);
  });
}

function optimizeCloudinaryUrl(url: string): string {
  try {
    if (!url) return url;
    const m = url.match(/^https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/(.*)$/);
    if (m) {
      // inject reasonable transformations for PDF rendering
      // auto format, economical quality, and max width
      const rest = m[1];
      return url.replace(/\/image\/upload\//, "/image/upload/f_auto,q_auto:good,w_2000/");
    }
  } catch {}
  return url;
}

async function fetchToDataURL(url: string): Promise<string> {
  try {
    if (!url || url.startsWith("data:")) return url;
    url = optimizeCloudinaryUrl(url);
    if (url.startsWith("/api/image-proxy")) {
      const r0 = await fetch(url, { cache: "no-store" });
      if (r0.ok) return await toDataURL(r0);
    }
    const proxied = `/api/image-proxy?url=${encodeURIComponent(url)}`;
    const r1 = await fetch(proxied, { cache: "no-store" });
    if (r1.ok) return await toDataURL(r1);
  } catch {}
  try {
    const ws = `https://images.weserv.nl/?url=${encodeURIComponent(url.replace(/^https?:\/\//, ""))}`;
    const r2 = await fetch(ws, { mode: "cors", cache: "no-cache" });
    if (r2.ok) return await toDataURL(r2);
  } catch {}
  try {
    const cp = `https://corsproxy.io/?${encodeURIComponent(url)}`;
    const r3 = await fetch(cp, { mode: "cors", cache: "no-cache" });
    if (r3.ok) return await toDataURL(r3);
  } catch {}
  console.warn("Image fetch failed for:", url);
  return "";
}

async function waitForImages(root: HTMLElement): Promise<void> {
  const imgs = Array.from(root.querySelectorAll<HTMLImageElement>("img"));
  await Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>(async (resolve) => {
          const toData = async (u: string) => {
            const d = await fetchToDataURL(u).catch(() => "");
            if (d && d.startsWith("data:")) img.src = d;
          };
          const dataSrc = img.getAttribute("data-image-src");
          if (dataSrc) {
            await toData(dataSrc);
            img.removeAttribute("data-image-src");
          } else {
            const src = img.getAttribute("src") || "";
            if (/^https?:/i.test(src)) await toData(src);
          }
          const ensureWordFriendly = async () => {
            try {
              const srcNow = img.getAttribute("src") || "";
              if (/^data:image\/(webp|avif|heic)/i.test(srcNow)) {
                const converted = await (async () => {
                  return await new Promise<string>((res) => {
                    const im = new Image();
                    im.onload = () => {
                      try {
                        const c = document.createElement('canvas');
                        c.width = im.naturalWidth || im.width || 1;
                        c.height = im.naturalHeight || im.height || 1;
                        const ctx = c.getContext('2d');
                        if (ctx) ctx.drawImage(im, 0, 0);
                        const out = c.toDataURL('image/jpeg', 0.92);
                        res(out);
                      } catch { res(srcNow); }
                    };
                    im.onerror = () => res(srcNow);
                    im.src = srcNow;
                  });
                })();
                if (converted && converted.startsWith('data:image/')) img.src = converted;
              }
            } catch {}
          };
          await ensureWordFriendly();
          if (img.complete && img.naturalHeight > 0) {
            try {
              const maxPageWidthPx = 700;
              const nw = img.naturalWidth || 1;
              const nh = img.naturalHeight || 1;
              const scale = nw > maxPageWidthPx ? maxPageWidthPx / nw : 1;
              const w = Math.max(1, Math.round(nw * scale));
              const h = Math.max(1, Math.round(nh * scale));
              img.setAttribute("width", String(w));
              img.setAttribute("height", String(h));
              (img.style as any).width = `${w}px`;
              (img.style as any).height = `${h}px`;
            } catch {}
            return resolve();
          }
          const done = () => {
            try {
              const maxPageWidthPx = 700;
              const nw = img.naturalWidth || 1;
              const nh = img.naturalHeight || 1;
              const scale = nw > maxPageWidthPx ? maxPageWidthPx / nw : 1;
              const w = Math.max(1, Math.round(nw * scale));
              const h = Math.max(1, Math.round(nh * scale));
              img.setAttribute("width", String(w));
              img.setAttribute("height", String(h));
              (img.style as any).width = `${w}px`;
              (img.style as any).height = `${h}px`;
            } catch {}
            resolve();
          };
          const to = setTimeout(done, 10000);
          img.onload = () => { clearTimeout(to); done(); };
          img.onerror = () => { clearTimeout(to); done(); };
        })
    )
  );
}

async function renderNodeToCanvas(node: HTMLElement): Promise<HTMLCanvasElement> {
  const html2canvas = (await import("html2canvas")).default;
  const dpr = (typeof window !== 'undefined' ? window.devicePixelRatio : 1) || 1;
  const scale = Math.min(2.5, Math.max(2, dpr * 1.2));
  return await html2canvas(node, {
    scale,
    backgroundColor: "#ffffff",
    useCORS: true,
    allowTaint: false,
    imageTimeout: 15000,
    logging: false,
    windowWidth: Math.max(node.scrollWidth, node.clientWidth),
    windowHeight: Math.max(node.scrollHeight, node.clientHeight),
  } as any);
}

function canvasToImg(canvas: HTMLCanvasElement): { data: string; type: "PNG" | "JPEG" } {
  try {
    const png = canvas.toDataURL("image/png", 1.0);
    if (png.startsWith("data:image/png")) return { data: png, type: "PNG" };
  } catch {}
  try {
    const jpg = canvas.toDataURL("image/jpeg", 0.95);
    if (jpg.startsWith("data:image/jpeg")) return { data: jpg, type: "JPEG" };
  } catch {}
  return { data: canvas.toDataURL(), type: "PNG" };
}

const todayStr = (d?: string) =>
  (d ? new Date(d) : new Date()).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

/* --------------------------------- Pages --------------------------------- */
function coverPage(form: FormData): string {
  let comp = S(form.companyName) || "INSPECTION COMPANY";
  let addressLine = "";
  if (form.nameandAddressOfCompany) {
    const full = S(form.nameandAddressOfCompany);
    const parts = full.split(",").map((p) => p.trim());
    comp = parts[0] || comp;
    addressLine = parts.slice(1).join(", ");
  }

  const companyBlock = `
    <div>
      <div style="font-weight:700; font-size:13pt; color:#000 !important; margin-bottom:2mm;">${comp}</div>
      ${addressLine ? `<div class="nk-muted" style="margin:1mm 0;">${addressLine}</div>` : ""}
      ${S(form.contactPhone) ? `<div class="nk-muted">TEL. ${S(form.contactPhone)}</div>` : ""}
      ${S(form.contactEmail) ? `<div class="nk-muted">${S(form.contactEmail)}</div>` : ""}
    </div>`;

  const locationLine = (joinAddress(form) || S(form.location) || "PROJECT LOCATION").toUpperCase();
  const purpose = S((form as any).purposeOfFieldVisit);
  const coverTitle = purpose || "CONSTRUCTION PROGRESS REPORT";

  return `
  <div class="nk-page">
    ${headerBar(form)}
    <div style="margin-top:8mm; font-size:11pt; line-height:1.6;">${companyBlock}</div>

    <div class="nk-block-title" style="margin-top:18mm;">${coverTitle}</div>
    <div class="nk-p" style="text-align:center; margin-top:3mm; font-weight:700; font-size:12pt; color:#000 !important;">${locationLine}</div>

    <div style="margin-top:10mm; font-size:11pt; text-align:right;"><b>REPORT DATE:</b> ${todayStr(form.inspectionDate)}</div>
    <div style="margin-top:10mm; font-size:11pt; text-align:right; line-height:1.8;">
      <div><b>Prepared for:</b> Owner</div>
      <div style="margin-top:3mm;"><b>Prepared by:</b> ${S(form.inspectorName) || "Inspector"}</div>
    </div>

    ${footerBar()}
  </div>`;
}

function disclaimerPage(form: FormData): string {
  const comp = S(form.companyName) || "INSPECTION COMPANY";
  return `
  <div class="nk-page">
    ${headerBar(form)}
    <div class="nk-block-title">Disclaimer</div>
    <p class="nk-p">
      This Report is intended solely for use by the Client in accordance with <b>${comp}</b>'s contract with the
      Client. While the Report may be provided to applicable authorities having jurisdiction and others for whom
      the Client is responsible, <b>${comp}</b> does not warrant the services to any third party. The report may not
      be relied upon by any other party without the express written consent of <b>${comp}</b>.
    </p>
    ${footerBar()}
  </div>`;
}

function tocPage(form: FormData, items: string[]): string {
  const rows = items.map((t, i) => `<tr><td class="nk-toc-num">${i + 1}.</td><td>${t}</td></tr>`).join("");
  return `
  <div class="nk-page">
    ${headerBar(form)}
    <div class="nk-block-title">Table of Contents</div>
    <table class="nk-toc"><tbody>${rows}</tbody></table>
    ${footerBar()}
  </div>`;
}

/* --------------------------- Content Generators --------------------------- */
function autoBackground(form: FormData, photos: PhotoData[]): string {
  const sentences: string[] = [];
  const addr = joinAddress(form) || S(form.location);
  if (addr) sentences.push(`The property located at <b>${addr}</b> was reviewed for current construction progress and site safety conditions.`);
  if (S(form.scheduleCompliance)) sentences.push(`Schedule position: ${S(form.scheduleCompliance)}.`);
  if (S(form.materialAvailability)) sentences.push(`Materials: ${S(form.materialAvailability)}.`);
  if (S(form.safetyCompliance)) sentences.push(`Safety compliance: ${S(form.safetyCompliance)}.`);
  if (!sentences.length) sentences.push("This section summarizes project background based on inspector inputs and photographic evidence collected during the visit.");
  if (photos.length) {
    const first = photos[0];
    const example = S(first.caption) ? `"${S(first.caption)}"` : "an image";
    sentences.push(`Photographic evidence documents on-site conditions; for example, ${example} was recorded.`);
  }
  return `<p class="nk-p">${sentences.join(" ")}</p>`;
}

/* BACKGROUND HIGHLIGHTS REMOVED */
function backgroundHighlights(_form: FormData): string {
  return "";
}

// Improved auto background generator (used for PDF + DOCX)
function autoBackgroundImproved(form: FormData, photos: PhotoData[]): string {
  const out: string[] = [];
  const Sx = (v?: string | number) => (v == null ? "" : String(v).trim());

  const purpose = Sx((form as any).purposeOfFieldVisit);
  const date = Sx(form.inspectionDate);
  const inspector = Sx(form.inspectorName);
  const company = Sx(form.companyName) || Sx((form as any).nameandAddressOfCompany);
  const addr = joinAddress(form) || S(form.location);

  const introParts: string[] = [];
  if (purpose) introParts.push(`${purpose} inspection`);
  if (addr) introParts.push(`at <b>${addr}</b>`);
  if (date) introParts.push(`on ${date}`);
  const intro = introParts.length ? `This report documents a ${introParts.join(" ")}.` : "This report documents a site inspection and the conditions observed.";
  out.push(`<p class=\"nk-p\">${intro}</p>`);

  const who: string[] = [];
  if (inspector) who.push(inspector);
  if (company) who.push(company);
  if (who.length) out.push(`<p class=\"nk-p\">Inspection performed by ${who.join(" (" )}${who.length>1?")":""}.</p>`);

  const weatherBits: string[] = [];
  if (Sx(form.temperature)) weatherBits.push(`${Sx(form.temperature)} deg C`);
  if (Sx(form.weatherDescription)) weatherBits.push(Sx(form.weatherDescription));
  if (Sx(form.humidity)) weatherBits.push(`Humidity ${Sx(form.humidity)}%`);
  if (Sx(form.windSpeed)) weatherBits.push(`Wind ${Sx(form.windSpeed)} km/h`);
  if (weatherBits.length) out.push(`<p class=\"nk-p\">Weather during inspection: ${weatherBits.join(" | ") }.</p>`);

  const statusBits: string[] = [];
  if (Sx(form.scheduleCompliance)) statusBits.push(`Schedule: ${Sx(form.scheduleCompliance)}`);
  if (Sx(form.materialAvailability)) statusBits.push(`Materials: ${Sx(form.materialAvailability)}`);
  if (Sx(form.safetyCompliance)) statusBits.push(`Safety: ${Sx(form.safetyCompliance)}`);
  if (statusBits.length) out.push(`<p class=\"nk-p\">${statusBits.join(". ") }.</p>`);

  if (photos && photos.length) {
    const first = photos[0];
    const example = S(first.caption) ? `\"${S(first.caption)}\"` : "an image";
    out.push(`<p class=\"nk-p\">Photographs documenting on-site conditions were captured; for example, ${example} was recorded.</p>`);
  }

  return out.join("");
}
function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

/* ---------- Image-2 style single KV table for Page 1 ---------- */
function obsTableImage2(form: FormData, buckets: Record<string, PhotoData[]>): string {
  const Sx = (v?: string) => (v ? String(v).trim() : "");
  const addr =
    [form.streetAddress, [form.city, form.state].filter(Boolean).join(", "),
     [form.country, form.zipCode].filter(Boolean).join(" ")]
      .filter(Boolean).map(S).filter(Boolean).join(", ") || S(form.location);

  const weatherBits: string[] = [];
  if (S(form.temperature))        weatherBits.push(`${S(form.temperature)} deg C`);
  if (S(form.weatherDescription)) weatherBits.push(S(form.weatherDescription));
  if (S(form.humidity))           weatherBits.push(`Humidity ${S(form.humidity)}%`);
  if (S(form.windSpeed))          weatherBits.push(`Wind ${S(form.windSpeed)} km/h`);
  const weather = weatherBits.join(" | ");

  const rows: Array<[string, string]> = [
    ["PURPOSE OF FIELD VISIT", Sx((form as any).purposeOfFieldVisit)],
    ["Report ID (If any)", Sx(form.reportId)],
    ["Name of Inspector", Sx(form.inspectorName)],
    ["Address of Inspection Company", Sx(form.nameandAddressOfCompany)],
    ["Client / Owner Name", Sx(form.clientName)],
    ["Inspection Company Name", Sx(form.companyName)],
    ["Phone Number of Inspection Company", Sx(form.contactPhone)],
    ["Email of Inspection Company", Sx(form.contactEmail)],
    ["Date of Inspection", todayStr(form.inspectionDate)],
    ["Start Time of Inspection", formatTime12(form.startInspectionTime)],
    ["Address of Inspection Property", addr],
    ["Weather Conditions", weather],
    // Removed workerAttendance/scheduleCompliance/materialAvailability to match UI removal
    ["Current work progress", Sx(form.workProgress)],
    ["Equipment Photos Attached", (buckets?.equipment?.length ?? 0) > 0 ? String(buckets.equipment.length) : ""],
    ["All safety protocols & PPE followed?", Sx(form.safetyCompliance)],
    ["Safety signage & access control in place?", Sx(form.safetySignage)],
  ];

  const body = rows
    .filter(([, v]) => S(v))
    .map(([k, v]) => `<tr><td>${k}</td><td class="nk-meta">${v}</td></tr>`)
    .join("");

  return `
    <table class="nk-table kv">
      <thead><tr><th>Field</th><th>Details</th></tr></thead>
      <tbody>${body}</tbody>
    </table>`;
}

function photoCard(p: PhotoData, num: number): string {
  const isRemote = p.data && p.data.startsWith("http");
  const srcAttr = isRemote ? `data-image-src="${p.data}" src=""` : `src="${p.data}"`;
  const userCaption = S(p.caption);
  const desc = S(p.description);

  return `
  <div class="nk-photo-card">
    <div class="nk-photo-img-wrap">
      <img class="nk-photo-img" ${srcAttr} alt="Photo ${num}" loading="eager" />
    </div>
    <div class="nk-caption">Photo ${num}${userCaption ? `: ${userCaption}` : ""}</div>
    ${desc ? `<div class="nk-desc">${desc}</div>` : ""}
  </div>`;
}

function photoPages(
  form: FormData,
  baseTitle: string,
  photos: PhotoData[],
  startNum = 1,
  introHTML = "",
  singleColumn = false
): string {
  const showTitle = !!baseTitle && !/Site Location and Field Condition Summary/i.test(baseTitle);
  if (!photos?.length) {
    if (S(introHTML)) {
      return `
        <div class="nk-page">
          ${headerBar(form)}
          ${showTitle ? `<div class="nk-block-title">${baseTitle}</div>` : ""}
          <div class="nk-callout">${introHTML}</div>
          ${footerBar()}
        </div>`;
    }
    return "";
  }

  const groups = chunk(photos, singleColumn ? 1 : 2);
  return groups
    .map((group, gi) => {
      const titleHTML = showTitle ? `<div class="nk-block-title">${gi === 0 ? baseTitle : `${baseTitle} (cont.)`}</div>` : "";
      const numOffset = gi * (singleColumn ? 1 : 2);
      return `
        <div class="nk-page">
          ${headerBar(form)}
          ${titleHTML}
          ${gi === 0 ? `<div class="nk-callout">${S(introHTML)}</div>` : ""}
          <div class="nk-photo-grid ${singleColumn ? "single" : ""}">
            ${group.map((p, i) => photoCard(p, startNum + numOffset + i)).join("")}
          </div>
          ${footerBar()}
        </div>`;
    })
    .join("");
}

// Return HTML and next photo number to keep numbering continuous across sections
function photoPagesSeq(
  form: FormData,
  baseTitle: string,
  photos: PhotoData[],
  startNum = 1,
  introHTML = "",
  singleColumn = false
): { html: string; next: number } {
  const showTitle = !!baseTitle && !/Site Location and Field Condition Summary/i.test(baseTitle);
  let n = startNum;
  if (!photos?.length) {
    if (S(introHTML)) {
      const html = `
        <div class="nk-page">
          ${headerBar(form)}
          ${showTitle ? `<div class=\"nk-block-title\">${baseTitle}</div>` : ""}
          <div class="nk-callout">${introHTML}</div>
          ${footerBar()}
        </div>`;
      return { html, next: n };
    }
    return { html: "", next: n };
  }
  const groups = chunk(photos, singleColumn ? 1 : 2);
  const html = groups
    .map((group, gi) => {
      const titleHTML = showTitle ? `<div class=\"nk-block-title\">${gi === 0 ? baseTitle : `${baseTitle} (cont.)`}</div>` : "";
      const items = group.map((p) => photoCard(p, n++)).join("");
      return `
        <div class="nk-page">
          ${headerBar(form)}
          ${titleHTML}
          ${gi === 0 ? `<div class="nk-callout">${S(introHTML)}</div>` : ""}
          <div class="nk-photo-grid ${singleColumn ? "single" : ""}">
            ${items}
          </div>
          ${footerBar()}
        </div>`;
    })
    .join("");
  return { html, next: n };
}

/* -------------------------- BODY: structure & order -------------------------- */
function buildBodyHTML(
  form: FormData,
  backgroundHTML: string,
  buckets: Record<string, PhotoData[]>,
  fieldText?: string,
  siteMap?: PhotoData,
  mapPhotos: PhotoData[] = []
): string {
  const h = (f: FormData) => headerBar(f);
  const ftr = () => footerBar();
  let photoNum = 1;
  const mapList = mapPhotos && mapPhotos.length ? mapPhotos : (buckets as any).map || [];

  /* PAGE 1 — Image-2 style: one KV table with Field/Details, no images */
  const page1 = `
  <div class="nk-page">
    ${h(form)}
    <div class="nk-block-title">1. SITE LOCATION AND FIELD CONDITION SUMMARY</div>
    ${obsTableImage2(form, buckets)}
    ${ftr()}
  </div>`;

  /* Optional Site Map page */
  const primarySiteMap = siteMap || (mapList.length ? mapList[0] : undefined);
  const siteMapHTML = (() => {
    if (!primarySiteMap || !primarySiteMap.data) return "";
    const isRemote = primarySiteMap.data.startsWith("http");
    const srcAttr = isRemote ? `data-image-src="${primarySiteMap.data}" src=""` : `src="${primarySiteMap.data}"`;
    const caption = S(primarySiteMap.caption);
    const desc = S(primarySiteMap.description);
    return `
      <div class="nk-page">
        ${h(form)}
        <div class="nk-block-title">Site Location Map</div>
        <div class="nk-photo-card" style="max-width:100%;">
          <div class="nk-photo-img-wrap" style="max-height: 150mm;">
            <img class="nk-photo-img" ${srcAttr} alt="Site Map" loading="eager" />
          </div>
          ${caption ? `<div class="nk-caption">${caption}</div>` : ""}
          ${desc ? `<div class="nk-desc">${desc}</div>` : ""}
        </div>
        ${ftr()}
      </div>`;
  })();

  const extraMapPhotos = mapList.length && primarySiteMap === mapList[0] ? mapList.slice(1) : mapList;
  const mapPhotosSection =
    (extraMapPhotos?.length ?? 0) > 0
      ? (() => {
          const cards = extraMapPhotos
            .map((p: PhotoData) => {
              const isRemote = p.data && p.data.startsWith("http");
              const srcAttr = isRemote ? `data-image-src="${p.data}" src=""` : `src="${p.data}"`;
              const caption = S(p.caption);
              const desc = S(p.description);
              return `
                <div class="nk-photo-card">
                  <div class="nk-photo-img-wrap">
                    <img class="nk-photo-img" ${srcAttr} alt="Map photo" loading="eager" />
                  </div>
                  ${caption ? `<div class="nk-caption">${caption}</div>` : ""}
                  ${desc ? `<div class="nk-desc">${desc}</div>` : ""}
                </div>`;
            })
            .join("");
          return `
            <div class="nk-page">
              ${h(form)}
              <div class="nk-block-title">Site Map Photos</div>
              <div class="nk-photo-grid single">
                ${cards}
              </div>
              ${ftr()}
            </div>`;
        })()
      : "";

  /* BACKGROUND (narrative only) */
  const highlightsHTML = backgroundHighlights(form); // empty
  const calloutHTML = S(backgroundHTML) ? `<div class="nk-callout">${backgroundHTML}</div>` : "";
  const backgroundSection =
    (buckets.background?.length ?? 0) > 0
      ? photoPages(form, "2. Background", buckets.background, 1, calloutHTML + highlightsHTML, true)
      : `
        <div class="nk-page">
          ${h(form)}
          <div class="nk-block-title">2. Background</div>
          ${calloutHTML || `<p class="nk-p nk-muted">No background notes provided.</p>`}
          ${ftr()}
        </div>`;

  /* Field Observation (large single column) */
  const fieldIntro = S(fieldText) ? `<p class="nk-p">${S(fieldText)}</p>` : "";
  const fieldObsSection =
    (buckets.fieldObservation?.length ?? 0) > 0
      ? photoPages(form, "3. Field Observation", buckets.fieldObservation, 1, fieldIntro, true)
      : `
        <div class="nk-page">
          ${h(form)}
          <div class="nk-block-title">3. Field Observation</div>
          <div class="nk-callout">${fieldIntro || `<p class="nk-p">No photos were attached.</p>`}</div>
          ${ftr()}
        </div>`;

  /* Additional (large) + Equipment (large) — appear before the moved Section 1 images */
  const additionalSection =
    (buckets.additional?.length ?? 0) > 0
      ? photoPages(form, "Additional Images", buckets.additional, 1, "", true)
      : "";

  const equipmentSection =
    (buckets.equipment?.length ?? 0) > 0
      ? (() => { const r = photoPagesSeq(form, "Inspection Support Equipment (if any)", buckets.equipment, photoNum, "", true); photoNum = r.next; return r.html; })()
      : "";

  /* NEW: All photos tied to Section 1 (work + safety) moved to end, large single-column, just BEFORE Conclusion */
  const section1Photos: PhotoData[] = [
    ...(buckets.work || []),
    ...(buckets.safety || []),
  ];
  const section1ImagesSection =
    section1Photos.length
      ? photoPages(form, "Images — Site Location and Field Condition Summary", section1Photos, 1, "", true)
      : "";

  /* Conclusion */
  const parts: string[] = [];
  if (S(form.status)) parts.push(`Overall status: <b>${S(form.status)}</b>.`);
  if (S(form.scheduleCompliance)) parts.push(`Schedule: <b>${S(form.scheduleCompliance)}</b>.`);
  if (S(form.materialAvailability)) parts.push(`Materials: <b>${S(form.materialAvailability)}</b>.`);
  if (S(form.safetyCompliance)) parts.push(`Safety: <b>${S(form.safetyCompliance)}</b>.`);
  const base =
    parts.length
      ? `<p class="nk-p">${parts.join(" ")}</p>`
      : `<p class="nk-p">No critical blockers observed at the time of inspection. Continue to monitor schedule, safety, and materials.</p>`;
  const extras = [
    S(form.additionalComments) && `<p class="nk-p"><b>Notes & Recommendations:</b> ${S(form.additionalComments)}</p>`,
    S(form.inspectorSummary) && `<p class="nk-p"><b>Inspector Summary:</b> ${S(form.inspectorSummary)}</p>`,
    S(form.recommendations) && `<p class="nk-p"><b>Recommended Actions:</b> ${S(form.recommendations)}</p>`,
  ].filter(Boolean).join("");
  const sign = form.signatureData
    ? `<div class="nk-sign">
        <img src="${form.signatureData}" alt="Signature" />
        <div>
          <div style="margin-bottom:3mm;"><b>Inspector:</b> ${S(form.inspectorName) || "Inspector"}</div>
          <div class="nk-muted" style="font-size:10pt;">Date: ${todayStr(form.inspectionDate)}</div>
        </div>
      </div>`
    : "";

  const pageLast = `
  <div class="nk-page">
    ${h(form)}
    <div class="nk-block-title">4. Conclusion</div>
    ${base}${extras}
    ${sign}
    ${ftr()}
  </div>`;

  /* Final order */
  return page1
    + siteMapHTML
    + mapPhotosSection
    + backgroundSection
    + fieldObsSection
    + additionalSection
    + equipmentSection
    + section1ImagesSection
    + pageLast;
}

/* ---------------------------- Rendering to PDF ---------------------------- */
async function renderRootToPDF(root: HTMLElement, filename: string, mode: 'save' | 'open' = 'save'): Promise<void> {
  const pdf: JsPDFType = new JsPDFClass({ orientation: "p", unit: "mm", format: "a4", putOnlyUsedFonts: true, precision: 16 } as any);

  const allPages = Array.from(root.querySelectorAll<HTMLElement>(".nk-page"));
  allPages.forEach((p, idx) => {
    const span = p.querySelector(".nk-footer .nk-page-num");
    if (span) span.textContent = String(idx + 1);
  });

  await waitForImages(root);

  const pages = Array.from(root.querySelectorAll<HTMLElement>(".nk-page"));
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  for (let i = 0; i < pages.length; i++) {
    const canvas = await renderNodeToCanvas(pages[i]);
    const scale = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
    const imgW = canvas.width * scale;
    const imgH = canvas.height * scale;
    const x = (pageWidth - imgW) / 2;
    const y = 0;

    if (i > 0) pdf.addPage();
    const { data, type } = canvasToImg(canvas);
    pdf.addImage(data, type, x, y, imgW, imgH, undefined, "SLOW");
  }

  if (mode === 'open') {
    try {
      const url = (pdf as any).output('bloburl');
      if (url && typeof window !== 'undefined') window.open(url, '_blank');
    } catch {
      pdf.save(filename);
    }
  } else {
    pdf.save(filename);
  }
}

/* ----------------------------- Public Builders ---------------------------- */
export async function generateFullReportPDF(
  form: FormData,
  sectionPhotos: Record<string, PhotoData[]>,
  signatureData: string | null,
  siteMap?: PhotoData,
  options?: { mode?: 'save' | 'open'; includeSiteMap?: boolean }
): Promise<void> {
  if (typeof window === "undefined") return;

  const toc = [
    "Site Location and Field Condition Summary",
    "Background",
    "Field Observation",
    "Conclusion",
  ];

  const buckets: Record<string, PhotoData[]> = {
    map: sectionPhotos?.map || [],
    background: sectionPhotos?.background || [],
    fieldObservation: sectionPhotos?.fieldObservation || [],
    work: sectionPhotos?.work || [],
    safety: sectionPhotos?.safety || [],
    equipment: sectionPhotos?.equipment || [],
    additional: sectionPhotos?.additional || [],
  };

  const bgAuto =
    S(form.backgroundAuto) ||
    autoBackgroundImproved(form, buckets.background.length ? buckets.background : buckets.fieldObservation);

  const backgroundHTML = [
    S(form.backgroundManual) && `<p class="nk-p">${S(form.backgroundManual)}</p>`,
    bgAuto,
  ].filter(Boolean).join("");

  const formPlus = signatureData ? { ...form, signatureData } : form;
  const manualSiteMap = (buckets.map && buckets.map.length) ? buckets.map[0] : undefined;
  const siteMapFinal = options?.includeSiteMap === false ? undefined : (siteMap || manualSiteMap || await buildSiteMapFromForm(formPlus));

  const html =
    coverPage(formPlus) +
    disclaimerPage(formPlus) +
    tocPage(formPlus, toc) +
    buildBodyHTML(formPlus, backgroundHTML, buckets, formPlus.fieldObservationText, siteMapFinal, buckets.map || []);

  const cleanup = mount(html);
  try {
    const root = document.body.lastElementChild as HTMLElement;
    const dateStr = new Date().toISOString().split("T")[0];
    const nameBase =
      (S(formPlus.reportId) || S(formPlus.clientName) || S(formPlus.location) || "report")
        .replace(/[^\w.-]+/g, "_") || "report";
    await renderRootToPDF(root, `ninekiwi_report_${nameBase}_${dateStr}.pdf`, options?.mode || 'save');
  } finally {
    cleanup();
  }
}

export async function generateSummaryPDF(
  form: FormData,
  summaryPhotos: PhotoData[],
  additionalPhotos: PhotoData[] = [],
  signatureData?: string | null,
  options?: { mode?: 'save' | 'open' }
): Promise<void> {
  if (typeof window === "undefined") return;

  const toc = [
    "Site Location and Field Condition Summary",
    "Background",
    "Field Observation",
    "Conclusion",
  ];

  const buckets: Record<string, PhotoData[]> = {
    background: [],
    fieldObservation: [...summaryPhotos, ...additionalPhotos],
    work: [],
    safety: [],
    equipment: [],
    additional: [],
  };

  const formPlus = signatureData ? { ...form, signatureData } : form;
  const bgAuto = S(formPlus.backgroundAuto) || autoBackgroundImproved(formPlus, buckets.fieldObservation);
  const backgroundHTML = [
    S(formPlus.backgroundManual) && `<p class="nk-p">${S(formPlus.backgroundManual)}</p>`,
    bgAuto,
  ].filter(Boolean).join("");

  const html =
    coverPage(formPlus) +
    disclaimerPage(formPlus) +
    tocPage(formPlus, toc) +
    buildBodyHTML(formPlus, backgroundHTML, buckets, formPlus.fieldObservationText);

  const cleanup = mount(html);
  try {
    const root = document.body.lastElementChild as HTMLElement;
    const dateStr = new Date().toISOString().split("T")[0];
    const nameBase =
      (S(formPlus.reportId) || S(formPlus.clientName) || S(formPlus.location) || "summary")
        .replace(/[^\w.-]+/g, "_") || "summary";
    await renderRootToPDF(root, `ninekiwi_summary_${nameBase}_${dateStr}.pdf`, options?.mode || 'save');
  } finally {
    cleanup();
  }
}

/* ----------------------------- DOCX functions ----------------------------- */
export async function generateSummaryWord(form: FormData, summaryPhotos: PhotoData[]): Promise<void> {
  const { Document, Packer, Paragraph, HeadingLevel, TextRun, ImageRun } = await import("docx");
  //@ts-ignore
  const fs_mod = await import("file-saver");
  const saveAs = (fs_mod as any).saveAs || (fs_mod as any).default;

  function S2(v: unknown) { return v == null ? "" : String(v).trim(); }
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

  // Build the same content shown in AutoSummary UI
  const children: any[] = [];
  children.push(new Paragraph({ text: "Auto Summary", heading: HeadingLevel.TITLE }));

  // Summary sentences
  const sentences: string[] = [];
  const purpose = (form as any)?.purposeOfFieldVisit || (form as any)?.status;
  const location = (form as any)?.location;
  const date = (form as any)?.inspectionDate;
  if (purpose || location || date) {
    const inspect = purpose ? `${purpose} inspection` : "Site inspection";
    const place = location ? ` at ${location}` : "";
    const when = date ? ` on ${date}` : "";
    sentences.push(`${inspect}${place}${when}.`);
  }
  if (S((form as any)?.inspectorName) || S((form as any)?.companyName)) {
    const inspector = S((form as any)?.inspectorName) || "The assigned inspector";
    const company = S((form as any)?.companyName) ? ` for ${(form as any).companyName}` : "";
    sentences.push(`${inspector}${company} documented the site conditions and progress.`);
  }
  if (S((form as any)?.scheduleCompliance)) sentences.push(`Schedule status: ${(form as any).scheduleCompliance}.`);
  if (S((form as any)?.safetyCompliance)) sentences.push(`Safety compliance: ${(form as any).safetyCompliance}.`);
  if (S((form as any)?.materialAvailability)) sentences.push(`Material availability: ${(form as any).materialAvailability}.`);
  if (S((form as any)?.inspectorSummary)) sentences.push(`Inspector notes: ${(form as any).inspectorSummary}.`);
  if (sentences.length) {
    children.push(new Paragraph({ text: "Summary", heading: HeadingLevel.HEADING_2 }));
    sentences.forEach((t) => children.push(new Paragraph({ children: [ new TextRun({ text: t }) ] })));
  }

  // Operations status
  const opsRaw = [
    { label: "Worker Attendance", value: (form as any)?.workerAttendance },
    { label: "Schedule Compliance", value: (form as any)?.scheduleCompliance },
    { label: "Material Availability", value: (form as any)?.materialAvailability },
    { label: "Safety Protocols", value: (form as any)?.safetyCompliance },
    { label: "Safety Signage", value: (form as any)?.safetySignage },
    { label: "Equipment Condition", value: (form as any)?.equipmentCondition },
  ].filter((x) => S2(x.value));
  if (opsRaw.length) {
    children.push(new Paragraph({ text: "Operations Status", heading: HeadingLevel.HEADING_2 }));
    opsRaw.forEach((r) => children.push(new Paragraph({ children: [ new TextRun({ text: `${r.label}: ${S2(r.value)}` }) ] })));
  }

  // Highlights & actions
  const highlights: string[] = [];
  if (S((form as any)?.recommendations)) highlights.push(`Recommended actions: ${(form as any).recommendations}.`);
  if (S((form as any)?.additionalComments)) highlights.push(`Additional comments: ${(form as any).additionalComments}.`);
  if (S((form as any)?.workerAttendance)) highlights.push(`Worker attendance: ${(form as any).workerAttendance}.`);
  if (highlights.length) {
    children.push(new Paragraph({ text: "Highlights & Actions", heading: HeadingLevel.HEADING_2 }));
    highlights.forEach((t) => children.push(new Paragraph({ children: [ new TextRun({ text: `• ${t}` }) ] })));
  }

  // Info blocks
  const info: Array<{ label: string; value: string }> = [];
  if (S((form as any)?.status)) info.push({ label: "Status", value: S((form as any).status) });
  if (S((form as any)?.reportId)) info.push({ label: "Report ID", value: S((form as any).reportId) });
  if (S((form as any)?.inspectorName)) info.push({ label: "Inspector", value: S((form as any).inspectorName) });
  if (S((form as any)?.clientName)) info.push({ label: "Client", value: S((form as any).clientName) });
  if (S((form as any)?.inspectionDate)) info.push({ label: "Date", value: S((form as any).inspectionDate) });
  if (S((form as any)?.location)) info.push({ label: "Location", value: S((form as any).location) });
  if (info.length) {
    children.push(new Paragraph({ text: "Report Information", heading: HeadingLevel.HEADING_2 }));
    info.forEach((r) => children.push(new Paragraph({ children: [ new TextRun({ text: `${r.label}: ${r.value}` }) ] })));
  }

  // Photos
  const photos = summaryPhotos || [];
  if (photos.length) {
    children.push(new Paragraph({ text: "Summary Photos", heading: HeadingLevel.HEADING_2 }));
    for (let i = 0; i < photos.length; i++) {
      const p = photos[i];
      children.push(new Paragraph({ children: [new TextRun({ text: `${i + 1}. ${S(p.caption) || S(p.name) || "Photo"}`, bold: true })] }));
      let dataUrl = p.data;
      if (dataUrl && dataUrl.startsWith("http")) {
        try { const d = await fetchToDataURL(dataUrl); if (d) dataUrl = d; } catch {}
      }
      if (dataUrl && dataUrl.startsWith("data:")) {
        const buf = dataUrlToUint8Array(dataUrl);
        //@ts-ignore
        if (buf.length) children.push(new Paragraph({ children: [ new ImageRun({ data: buf, transformation: { width: 520, height: 320 } }) ] }));
      }
      if (S(p.description)) children.push(new Paragraph({ children: [ new TextRun({ text: S(p.description) }) ] }));
    }
  }

  const doc = new Document({ sections: [{ children }] });
  const base = S((form as any)?.reportId) || "report";
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `ninekiwi_summary_${base}.docx`);
}

export async function generateAutoSummaryPDF(form: any, photos: any[]): Promise<void> {
  // Build a dedicated Auto Summary page mirroring UI
  const mapped: PhotoData[] = (photos || []).map((p) => ({
    name: p.name || "Photo",
    data: p.data,
    includeInSummary: true,
    caption: p.caption,
    description: p.description
  }));
  const buildSummaryHTML = (f: any, ph: PhotoData[]) => {
    const Sx = (v: unknown) => (v == null ? "" : String(v).trim());
    const sentences: string[] = [];
    const purpose = f?.purposeOfFieldVisit || f?.status;
    const location = f?.location;
    const date = f?.inspectionDate;
    if (purpose || location || date) {
      const inspect = purpose ? `${purpose} inspection` : "Site inspection";
      const place = location ? ` at ${location}` : "";
      const when = date ? ` on ${date}` : "";
      sentences.push(`${inspect}${place}${when}.`);
    }
    if (Sx(f?.inspectorName) || Sx(f?.companyName)) {
      const inspector = Sx(f?.inspectorName) || "The assigned inspector";
      const company = Sx(f?.companyName) ? ` for ${f.companyName}` : "";
      sentences.push(`${inspector}${company} documented the site conditions and progress.`);
    }
    if (Sx(f?.scheduleCompliance)) sentences.push(`Schedule status: ${f.scheduleCompliance}.`);
    if (Sx(f?.safetyCompliance)) sentences.push(`Safety compliance: ${f.safetyCompliance}.`);
    if (Sx(f?.materialAvailability)) sentences.push(`Material availability: ${f.materialAvailability}.`);
    if (Sx(f?.inspectorSummary)) sentences.push(`Inspector notes: ${f.inspectorSummary}.`);

    const ops = [
      { label: "Worker Attendance", value: f?.workerAttendance },
      { label: "Schedule Compliance", value: f?.scheduleCompliance },
      { label: "Material Availability", value: f?.materialAvailability },
      { label: "Safety Protocols", value: f?.safetyCompliance },
      { label: "Safety Signage", value: f?.safetySignage },
      { label: "Equipment Condition", value: f?.equipmentCondition },
    ].filter((x) => Sx(x.value));

    const highlights: string[] = [];
    if (Sx(f?.recommendations)) highlights.push(`Recommended actions: ${f.recommendations}.`);
    if (Sx(f?.additionalComments)) highlights.push(`Additional comments: ${f.additionalComments}.`);
    if (Sx(f?.workerAttendance)) highlights.push(`Worker attendance: ${f.workerAttendance}.`);

    const info: Array<[string,string]> = [];
    if (Sx(f?.status)) info.push(["Status", Sx(f.status)]);
    if (Sx(f?.reportId)) info.push(["Report ID", Sx(f.reportId)]);
    if (Sx(f?.inspectorName)) info.push(["Inspector", Sx(f.inspectorName)]);
    if (Sx(f?.clientName)) info.push(["Client", Sx(f.clientName)]);
    if (Sx(f?.inspectionDate)) info.push(["Date", Sx(f.inspectionDate)]);
    if (Sx(f?.location)) info.push(["Location", Sx(f.location)]);

    const photoHTML = ph.length ? `
      <div class="nk-photo-grid single">
        ${ph.map((p, i) => photoCard(p, i + 1)).join("")}
      </div>` : "";

    return `
      <div class="nk-page">
        ${headerBar(f)}
        <div class="nk-block-title">Auto Summary</div>
        ${sentences.length ? `<div class="nk-callout">${sentences.map((s)=>`<p class=\"nk-p\">${s}</p>`).join("")}</div>` : ""}
        ${ops.length ? `<div class=\"nk-callout\"><div class=\"nk-subtitle\">Operations Status</div><table class=\"nk-table\"><tbody>${ops.map((r)=>`<tr><td>${r.label}</td><td class=\"nk-meta\">${Sx(r.value)}</td></tr>`).join("")}</tbody></table></div>` : ""}
        ${highlights.length ? `<div class=\"nk-callout\"><div class=\"nk-subtitle\">Highlights & Actions</div>${highlights.map((t)=>`<p class=\"nk-p\">• ${t}</p>`).join("")}</div>` : ""}
        ${info.length ? `<div class=\"nk-callout\"><div class=\"nk-subtitle\">Report Information</div><table class=\"nk-table\"><tbody>${info.map(([k,v])=>`<tr><td>${k}</td><td class=\"nk-meta\">${v}</td></tr>`).join("")}</tbody></table></div>` : ""}
        ${photoHTML}
        ${footerBar()}
      </div>`;
  };

  const html = buildSummaryHTML(form, mapped);
  const cleanup = mount(html);
  try {
    const root = document.body.lastElementChild as HTMLElement;
    const base = S((form as any)?.reportId) || "summary";
    await renderRootToPDF(root, `ninekiwi_autosummary_${base}.pdf`);
  } finally { cleanup(); }
}

export async function generateAutoSummaryWord(form: any, photos: any[]): Promise<void> {
  const mapped: PhotoData[] = (photos || []).map((p) => ({
    name: p.name || "Photo",
    data: p.data,
    includeInSummary: true,
    caption: p.caption,
    description: p.description
  }));
  await generateSummaryWord(form, mapped);
}

export async function generateFullReportDOCX(
  form: FormData,
  sectionPhotos: Record<string, PhotoData[]>,
  signatureData: string | null,
  siteMap?: PhotoData,
  options?: { includeSiteMap?: boolean }
): Promise<void> {
  if (typeof window === "undefined") return;
  // Prefer PDF-layout DOCX to match visual format
  // Use same HTML and CSS as PDF, then convert HTML -> DOCX for visual parity
  // Load html-docx-js from local API (installed package), multi-CDN fallback.
  async function loadHtmlDocx(): Promise<any> {
    if (typeof window === 'undefined') return null;
    const g: any = window as any;
    if (g.htmlDocx && typeof g.htmlDocx.asBlob === 'function') return g.htmlDocx;
    // Try local route (never reject; move to next source on error)
    await new Promise<void>((resolve) => {
      const s = document.createElement('script');
      s.src = '/api/vendor/html-docx';
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => resolve();
      document.head.appendChild(s);
    });
    if (g.htmlDocx && typeof g.htmlDocx.asBlob === 'function') return g.htmlDocx;
    // Try unpkg (no version pin)
    await new Promise<void>((resolve) => {
      const s = document.createElement('script');
      s.src = 'https://unpkg.com/html-docx-js/dist/html-docx.js';
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => resolve();
      document.head.appendChild(s);
    });
    if (g.htmlDocx && typeof g.htmlDocx.asBlob === 'function') return g.htmlDocx;
    // Try known version 0.3.1
    await new Promise<void>((resolve) => {
      const s = document.createElement('script');
      s.src = 'https://unpkg.com/html-docx-js@0.3.1/dist/html-docx.js';
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => resolve();
      document.head.appendChild(s);
    });
    if (g.htmlDocx && typeof g.htmlDocx.asBlob === 'function') return g.htmlDocx;
    // Try jsDelivr
    await new Promise<void>((resolve) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/html-docx-js@0.3.1/dist/html-docx.js';
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => resolve();
      document.head.appendChild(s);
    });
    return g.htmlDocx && typeof g.htmlDocx.asBlob === 'function' ? g.htmlDocx : null;
  }
  //@ts-ignore
  const fs_mod = await import("file-saver");
  const saveAs = (fs_mod as any).saveAs || (fs_mod as any).default;

  const toc = [
    "Site Location and Field Condition Summary",
    "Background",
    "Field Observation",
    "Conclusion",
  ];

  const buckets: Record<string, PhotoData[]> = {
    map: sectionPhotos?.map || [],
    background: sectionPhotos?.background || [],
    fieldObservation: sectionPhotos?.fieldObservation || [],
    work: sectionPhotos?.work || [],
    safety: sectionPhotos?.safety || [],
    equipment: sectionPhotos?.equipment || [],
    additional: sectionPhotos?.additional || [],
  };

  const formPlus = signatureData ? { ...form, signatureData } : form;
  const bgAuto = S(formPlus.backgroundAuto) || autoBackgroundImproved(formPlus, buckets.background.length ? buckets.background : buckets.fieldObservation);
  const backgroundHTML = [
    S(formPlus.backgroundManual) && `<p class="nk-p">${S(formPlus.backgroundManual)}</p>`,
    bgAuto,
  ].filter(Boolean).join("");

  const manualSiteMap = (buckets.map && buckets.map.length) ? buckets.map[0] : undefined;
  const siteMapFinal = options?.includeSiteMap === false ? undefined : (siteMap || manualSiteMap || await buildSiteMapFromForm(formPlus));

  const html =
    coverPage(formPlus) +
    disclaimerPage(formPlus) +
    tocPage(formPlus, toc) +
    buildBodyHTML(formPlus, backgroundHTML, buckets, formPlus.fieldObservationText, siteMapFinal, buckets.map || []);

  const cleanup = mount(html);
  try {
    // Resolve remote images to data URLs for embedding
    const root = document.body.lastElementChild as HTMLElement; // nk-root
    await waitForImages(root);
    // Number pages in footer like the PDF path
    try {
      const allPages = Array.from(root.querySelectorAll<HTMLElement>(".nk-page"));
      allPages.forEach((p, idx) => {
        const span = p.querySelector(".nk-footer .nk-page-num");
        if (span) (span as HTMLElement).textContent = String(idx + 1);
      });
    } catch {}
    const dateStr = new Date().toISOString().split("T")[0];
    const nameBase =
      (S(formPlus.reportId) || S(formPlus.clientName) || S(formPlus.location) || "report")
        .replace(/[^\w.-]+/g, "_") || "report";
    // Compose full HTML document with our CSS
    const docHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${THEME_CSS}</style></head><body>${(root as any).innerHTML}</body></html>`;
    const htmlDocx = await loadHtmlDocx();
    if (htmlDocx && typeof htmlDocx.asBlob === 'function') {
      const blob = htmlDocx.asBlob(docHtml, { orientation: 'portrait' });
      saveAs(blob, `ninekiwi_report_${nameBase}_${dateStr}.docx`);
    } else {
      // Fallback to editable docx builder to avoid runtime errors
      try {
        const mod = await import("@/lib/export-docx");
        await mod.generateFullReportDOCXEditable(formPlus as any, buckets as any, signatureData, siteMapFinal, options);
      } catch (e) {
        throw new Error('Word export unavailable: html-docx-js not loaded');
      }
    }
  } finally {
    cleanup();
  }
}

/* --------------------------------- Save API -------------------------------- */
export async function saveReportToDatabase(
  form: FormData,
  photos: Record<string, PhotoData[]>
): Promise<string> {
  try {
    const allPhotos = [
      ...(photos.map || []),
      ...(photos.background || []),
      ...(photos.fieldObservation || []),
      ...(photos.work || []),
      ...(photos.safety || []),
      ...(photos.equipment || []),
      ...(photos.additional || []),
    ].map((photo) => ({
      ...photo,
      section: Object.keys(photos).find(key => photos[key].includes(photo)) || 'fieldObservation',
    }));

    const response = await fetch('/api/reports/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ formData: form, photos: allPhotos }),
    });

    const data = await response.json();
    if (!data.success) throw new Error('Failed to save report');
    return data.reportId;
  } catch (error) {
    console.error('Error saving report:', error);
    throw error;
  }
}
 
