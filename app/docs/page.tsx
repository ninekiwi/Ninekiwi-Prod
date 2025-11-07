"use client";
import { useEffect, useMemo, useState } from "react";

type ReportItem = {
  _id: string;
  userId: string;
  reportId: string;
  status?: string;
  updatedAt?: string;
  data?: any;
  signatureData?: string | null;
};

export default function MyDocumentsPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/reports`, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load reports");
        setReports(data.items || []);
      } catch (e: any) {
        setError(e?.message || "Failed to load reports");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function buildBuckets(reportId: string) {
    const resp = await fetch(`/api/photos?reportId=${encodeURIComponent(reportId)}`, { cache: "no-store" });
    const j = await resp.json();
    const items: any[] = j?.items || [];
    const buckets: Record<string, any[]> = { background: [], fieldObservation: [], work: [], safety: [], equipment: [], additional: [] };
    const toPhoto = (it: any) => ({
      name: it.name || "Photo",
      data: it.src || "",
      includeInSummary: !!it.includeInSummary,
      caption: it.caption || "",
      description: it.description || "",
      figureNumber: typeof it.figureNumber === "number" ? it.figureNumber : undefined,
    });
    for (const it of items) {
      const sec = String(it.section || "additional");
      if (sec in buckets) buckets[sec].push(toPhoto(it));
      else buckets.additional.push(toPhoto(it));
    }
    return buckets as any;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">My Documents</h1>
          <p className="text-gray-600 text-sm sm:text-base">View and export your generated reports</p>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">Loading…</div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">{error}</div>
        ) : reports.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-600">No reports yet</div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Report ID</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Updated</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reports.map((r) => (
                    <tr key={String(r._id)} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-gray-900">{r.reportId}</div></td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{r.updatedAt ? new Date(r.updatedAt).toLocaleString() : ''}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex flex-wrap gap-2">
                          <button
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            disabled={busy === `view-${r._id}`}
                            onClick={async () => {
                              setBusy(`view-${r._id}`);
                              try {
                                const buckets = await buildBuckets(r.reportId);
                                const { generateFullReportPDF } = await import("@/lib/export");
                                await generateFullReportPDF(r.data || {}, buckets as any, r.signatureData || null, undefined, { mode: 'open' });
                              } finally { setBusy(null); }
                            }}
                          >View PDF</button>
                          <button
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            disabled={busy === `pdf-${r._id}`}
                            onClick={async () => {
                              setBusy(`pdf-${r._id}`);
                              try {
                                const buckets = await buildBuckets(r.reportId);
                                const { generateFullReportPDF } = await import("@/lib/export");
                                await generateFullReportPDF(r.data || {}, buckets as any, r.signatureData || null);
                              } finally { setBusy(null); }
                            }}
                          >PDF</button>
                          <button
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            disabled={busy === `docx-${r._id}`}
                            onClick={async () => {
                              setBusy(`docx-${r._id}`);
                              try {
                                const buckets = await buildBuckets(r.reportId);
                                const { generateFullReportDOCX } = await import("@/lib/export");
                                await generateFullReportDOCX(r.data || {}, buckets as any, r.signatureData || null);
                              } finally { setBusy(null); }
                            }}
                          >Word</button>
                          <button
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            disabled={busy === `spdf-${r._id}`}
                            onClick={async () => {
                              setBusy(`spdf-${r._id}`);
                              try {
                                const resp = await fetch(`/api/photos?reportId=${encodeURIComponent(r.reportId)}`, { cache: "no-store" });
                                const j = await resp.json();
                                const photos = (j?.items || []).filter((p: any) => !!p.includeInSummary).map((it: any) => ({ name: it.name, data: it.src, includeInSummary: true, caption: it.caption, description: it.description }));
                                const { generateAutoSummaryPDF } = await import("@/lib/export");
                                await generateAutoSummaryPDF(r.data || {}, photos);
                              } finally { setBusy(null); }
                            }}
                          >Summary PDF</button>
                          <button
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            disabled={busy === `sdocx-${r._id}`}
                            onClick={async () => {
                              setBusy(`sdocx-${r._id}`);
                              try {
                                const resp = await fetch(`/api/photos?reportId=${encodeURIComponent(r.reportId)}`, { cache: "no-store" });
                                const j = await resp.json();
                                const photos = (j?.items || []).filter((p: any) => !!p.includeInSummary).map((it: any) => ({ name: it.name, data: it.src, includeInSummary: true, caption: it.caption, description: it.description }));
                                const { generateAutoSummaryWord } = await import("@/lib/export");
                                await generateAutoSummaryWord(r.data || {}, photos);
                              } finally { setBusy(null); }
                            }}
                          >Summary Word</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

