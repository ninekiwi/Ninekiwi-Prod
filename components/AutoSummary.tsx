"use client";

import React, { useMemo, useState } from "react";
import { UPhoto } from "@/lib/types";

type Props = { form: any; photos?: UPhoto[] };

const FALLBACK = "Not provided";

type Tone = "positive" | "caution" | "critical" | "neutral";

const POSITIVE_RE = /(on track|compliant|available|complete|good|clear|safe|yes|ok|met|satisfactory|no issues|adequate)/i;
const CAUTION_RE = /(monitor|pending|partial|limited|follow up|minor|in progress|ongoing|watch)/i;
const CRITICAL_RE = /(delay|behind|blocked|risk|hazard|unsafe|critical|stop|halt|fail|shortage|defect|non-?compliant|incident|accident|escalate|breach)/i;

function nonEmpty(value: unknown): boolean {
  if (value == null) return false;
  const str = String(value).trim();
  return str.length > 0;
}

function classifyTone(value?: string): Tone {
  const text = String(value ?? "").trim();
  if (!text) return "neutral";
  if (CRITICAL_RE.test(text)) return "critical";
  if (CAUTION_RE.test(text)) return "caution";
  if (POSITIVE_RE.test(text)) return "positive";
  return "neutral";
}

const toneBadge: Record<Tone, string> = {
  positive: "bg-green-50 text-green-700 border-green-200",
  caution: "bg-amber-50 text-amber-700 border-amber-200",
  critical: "bg-red-50 text-red-700 border-red-200",
  neutral: "bg-gray-50 text-gray-700 border-gray-200",
};

const SummaryCard: React.FC<{
  label: string;
  value: string;
  tone?: Tone;
}> = ({ label, value, tone = "neutral" }) => {
  const badgeClass = toneBadge[tone] ?? toneBadge.neutral;
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
        {label}
      </div>
      <div className={`inline-flex rounded-md px-3 py-1.5 text-sm font-medium border ${badgeClass}`}>
        {value || FALLBACK}
      </div>
    </div>
  );
};

export default function AutoSummary({ form, photos }: Props) {
  const [downloading, setDownloading] = useState<null | "pdf" | "word">(null);
  const [elapsed, setElapsed] = useState(0);
  const availablePhotos = useMemo(() => (Array.isArray(photos) ? photos : []), [photos]);
  const [selectedSet, setSelectedSet] = useState<Set<number>>(new Set());

  React.useEffect(() => {
    const next = new Set<number>();
    let anyFlagged = false;
    availablePhotos.forEach((p, idx) => {
      if (p?.includeInSummary) {
        next.add(idx);
        anyFlagged = true;
      }
    });
    // If none explicitly flagged, auto-select all available photos
    if (!anyFlagged) {
      availablePhotos.forEach((_, idx) => next.add(idx));
    }
    setSelectedSet(next);
  }, [availablePhotos]);

  const selectedPhotos = useMemo(
    () => availablePhotos.filter((_, idx) => selectedSet.has(idx)),
    [availablePhotos, selectedSet]
  );

  const summarySentences = useMemo(() => {
    if (!form) return [];
    const sentences: string[] = [];
    const purpose = form?.purposeOfFieldVisit || form?.status;
    const location = form?.location;
    const date = form?.inspectionDate;

    if (purpose || location || date) {
      const inspect = purpose ? `${purpose} inspection` : "Site inspection";
      const place = location ? ` at ${location}` : "";
      const when = date ? ` on ${date}` : "";
      sentences.push(`${inspect}${place}${when}.`);
    }
    if (nonEmpty(form?.inspectorName) || nonEmpty(form?.companyName)) {
      const inspector = form?.inspectorName ? String(form.inspectorName) : "The assigned inspector";
      const company = form?.companyName ? ` for ${form.companyName}` : "";
      sentences.push(`${inspector}${company} documented the site conditions and progress.`);
    }
    if (nonEmpty(form?.scheduleCompliance)) {
      sentences.push(`Schedule status: ${form.scheduleCompliance}.`);
    }
    if (nonEmpty(form?.safetyCompliance)) {
      sentences.push(`Safety compliance: ${form.safetyCompliance}.`);
    }
    if (nonEmpty(form?.materialAvailability)) {
      sentences.push(`Material availability: ${form.materialAvailability}.`);
    }
    if (nonEmpty(form?.inspectorSummary)) {
      sentences.push(`Inspector notes: ${form.inspectorSummary}.`);
    }
    return sentences;
  }, [form]);

  const actionHighlights = useMemo(() => {
    const actions: string[] = [];
    if (nonEmpty(form?.recommendations)) actions.push(`Recommended actions: ${form.recommendations}.`);
    if (nonEmpty(form?.additionalComments)) actions.push(`Additional comments: ${form.additionalComments}.`);
    if (nonEmpty(form?.workerAttendance)) actions.push(`Worker attendance: ${form.workerAttendance}.`);
    return actions;
  }, [form]);

  const weatherMetrics = useMemo(() => {
    const rows: { label: string; value: string }[] = [];
    if (nonEmpty(form?.temperature)) rows.push({ label: "Temperature", value: `${form.temperature} deg C` });
    if (nonEmpty(form?.humidity)) rows.push({ label: "Humidity", value: `${form.humidity}%` });
    if (nonEmpty(form?.windSpeed)) rows.push({ label: "Wind", value: `${form.windSpeed} km/h` });
    if (nonEmpty(form?.weatherDescription)) rows.push({ label: "Conditions", value: String(form.weatherDescription) });
    return rows;
  }, [form]);

  const operationsMetrics = useMemo(() => {
    const raw = [
      { label: "Worker Attendance", value: form?.workerAttendance },
      { label: "Schedule Compliance", value: form?.scheduleCompliance },
      { label: "Material Availability", value: form?.materialAvailability },
      { label: "Safety Protocols", value: form?.safetyCompliance },
      { label: "Safety Signage", value: form?.safetySignage },
      { label: "Equipment Condition", value: form?.equipmentCondition },
    ];
    return raw
      .filter((item) => nonEmpty(item.value))
      .map((item) => ({
        label: item.label,
        value: String(item.value),
        tone: classifyTone(String(item.value)),
      }));
  }, [
    form?.workerAttendance,
    form?.scheduleCompliance,
    form?.materialAvailability,
    form?.safetyCompliance,
    form?.safetySignage,
    form?.equipmentCondition,
  ]);

  const attentionPoints = useMemo(
    () => operationsMetrics.filter((metric) => metric.tone === "caution" || metric.tone === "critical"),
    [operationsMetrics]
  );

  const infoBlocks = useMemo(() => {
    const out: { title: string; rows: { label: string; value: string }[] }[] = [];
    if (!form) return out;

    const info: { label: string; value: string }[] = [];
    if (nonEmpty(form?.status)) info.push({ label: "Status", value: String(form.status) });
    if (nonEmpty(form?.reportId)) info.push({ label: "Report ID", value: String(form.reportId) });
    if (nonEmpty(form?.inspectorName)) info.push({ label: "Inspector", value: String(form.inspectorName) });
    if (nonEmpty(form?.clientName)) info.push({ label: "Client", value: String(form.clientName) });
    if (nonEmpty(form?.inspectionDate)) info.push({ label: "Date", value: String(form.inspectionDate) });
    if (nonEmpty(form?.location)) info.push({ label: "Location", value: String(form.location) });
    if (info.length) out.push({ title: "Report Information", rows: info });

    if (weatherMetrics.length) out.push({ title: "Weather Snapshot", rows: weatherMetrics });

    if (attentionPoints.length) {
      out.push({
        title: "Attention Points",
        rows: attentionPoints.map((metric) => ({
          label: metric.label,
          value: metric.value,
        })),
      });
    }

    if (nonEmpty(form?.inspectorSummary) || nonEmpty(form?.recommendations) || nonEmpty(form?.additionalComments)) {
      const notes: { label: string; value: string }[] = [];
      if (nonEmpty(form?.inspectorSummary)) notes.push({ label: "Inspector Summary", value: String(form.inspectorSummary) });
      if (nonEmpty(form?.recommendations)) notes.push({ label: "Recommendations", value: String(form.recommendations) });
      if (nonEmpty(form?.additionalComments)) notes.push({ label: "Additional Comments", value: String(form.additionalComments) });
      out.push({ title: "Inspector Notes", rows: notes });
    }
    return out;
  }, [form, weatherMetrics, attentionPoints]);

  const hasContent = infoBlocks.length > 0 || selectedPhotos.length > 0 || summarySentences.length > 0;

  async function download(type: "pdf" | "word") {
    setDownloading(type);
    setElapsed(0);
    const timer = setInterval(() => setElapsed((s) => s + 1), 1000);
    try {
      if (type === "pdf") {
        const { generateAutoSummaryPDF } = await import("@/lib/export");
        await generateAutoSummaryPDF(form, selectedPhotos);
      } else {
        const { generateAutoSummaryWord } = await import("@/lib/export");
        await generateAutoSummaryWord(form, selectedPhotos);
      }
    } finally {
      clearInterval(timer);
      setDownloading(null);
      setElapsed(0);
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden relative">
      {/* Header Section */}
      <div className="border-b-2 border-kiwi-dark bg-gradient-to-r from-kiwi-dark/5 to-transparent px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-kiwi-dark tracking-tight">
            Auto Summary
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => download("pdf")}
              disabled={!hasContent || !!downloading}
              className="inline-flex items-center gap-2 rounded-md bg-kiwi-dark px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-kiwi-dark/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
              </svg>
              {downloading === "pdf" ? `Generating... ${elapsed}s` : "Export PDF"}
            </button>
            <button
              onClick={() => download("word")}
              disabled={!hasContent || !!downloading}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
              </svg>
              {downloading === "word" ? `Preparing... ${elapsed}s` : "Export Word"}
            </button>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6 space-y-6">
        {/* Summary Text */}
        {summarySentences.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500 italic">
              No summary data available yet. Fill out the inspection form to generate an overview.
            </p>
          </div>
        ) : (
          <div className="prose max-w-none">
            <div className="bg-kiwi-dark/5 rounded-lg p-4 border-l-4 border-kiwi-dark">
              <div className="space-y-2 text-sm leading-relaxed text-gray-700">
                {summarySentences.map((sentence, idx) => (
                  <p key={`${sentence}-${idx}`}>{sentence}</p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Operations Metrics */}
        {operationsMetrics.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
              Operations Status
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {operationsMetrics.map((metric) => (
                <SummaryCard key={metric.label} label={metric.label} value={metric.value} tone={metric.tone} />
              ))}
            </div>
          </div>
        )}

        {/* Action Highlights */}
        {actionHighlights.length > 0 && (
          <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
            <h3 className="text-sm font-semibold text-amber-900 mb-3 uppercase tracking-wide">
              Highlights & Actions
            </h3>
            <ul className="space-y-2 text-sm text-amber-900">
              {actionHighlights.map((item, idx) => (
                <li key={`${item}-${idx}`} className="flex gap-2">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Info Blocks */}
        {infoBlocks.length > 0 && (
          <div className="space-y-4">
            {infoBlocks.map((block) => (
              <div key={block.title} className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                <h3 className="text-sm font-semibold text-kiwi-dark mb-4 uppercase tracking-wide border-b border-kiwi-dark/20 pb-2">
                  {block.title}
                </h3>
                <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                  {block.rows.map((row, idx) => (
                    <div key={row.label + idx} className="flex flex-col gap-1">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        {row.label}
                      </dt>
                      <dd className="text-gray-800 font-medium">{row.value || FALLBACK}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        )}

        {/* Photo Selection */}
        {availablePhotos.length > 0 && (
          <div className="border-t-2 border-kiwi-dark/20 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-kiwi-dark uppercase tracking-wide">
                Photo Selection
                <span className="ml-2 text-xs font-normal text-gray-600">
                  ({selectedPhotos.length} of {availablePhotos.length} selected)
                </span>
              </h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
                  onClick={() => setSelectedSet(new Set(availablePhotos.map((_, i) => i)))}
                >
                  Select All
                </button>
                <button
                  type="button"
                  className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
                  onClick={() => setSelectedSet(new Set())}
                >
                  Clear All
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {availablePhotos.map((p, idx) => {
                const checked = selectedSet.has(idx);
                return (
                  <label
                    key={p.name + idx}
                    className={`cursor-pointer select-none overflow-hidden rounded-lg border-2 transition-all ${
                      checked 
                        ? 'border-kiwi-dark shadow-md' 
                        : 'border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md'
                    }`}
                  >
                    <div className="relative bg-gray-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={p.data} 
                        alt={p.caption || p.name} 
                        className="h-32 w-full object-cover" 
                      />
                      {checked && (
                        <div className="absolute top-2 right-2 bg-kiwi-dark rounded-full p-1">
                          <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2 bg-white px-3 py-2 border-t border-gray-200">
                      <span className="text-xs font-medium text-gray-700 truncate flex-1">
                        {p.caption || p.name}
                      </span>
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-kiwi-dark focus:ring-kiwi-dark"
                        checked={checked}
                        onChange={(e) => {
                          setSelectedSet((prev) => {
                            const next = new Set(prev);
                            if (e.target.checked) next.add(idx);
                            else next.delete(idx);
                            return next;
                          });
                        }}
                      />
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {downloading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-sm" role="status" aria-label={downloading === 'word' ? 'Preparing Word' : 'Generating PDF'}>
          <div className="bg-white border border-gray-200 rounded-xl shadow-xl p-5 w-[90%] max-w-sm text-center">
            <div className="mx-auto h-10 w-10 mb-3 text-[#78c850]">
              <svg className="animate-spin h-10 w-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
            </div>
            <div className="text-base font-semibold text-gray-900">{downloading === 'word' ? 'Preparing Word summary' : 'Generating PDF summary'}</div>
            <div className="mt-1 text-sm text-gray-600">Elapsed: {elapsed}s</div>
          </div>
        </div>
      )}
    </div>
  );
}
