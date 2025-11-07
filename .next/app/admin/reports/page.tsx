"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { generateFullReportPDF } from "@/lib/export";

const warmupExportLibs = () => {
  // dynamically import the module to warm up server/client bundles without relying on a named export
  void import("@/lib/export");
};

type ReportItem = {
  _id: string;
  userId: string;
  reportId: string;
  status?: string;
  updatedAt?: string;
  user?: { _id: string; name: string; email: string; role: string } | null;
  data?: any;
  signatureData?: string | null;
};

export default function AdminReportsPage() {
  return (
    <Suspense fallback={<div />}> 
      <AdminReportsContent />
    </Suspense>
  );
}

function AdminReportsContent() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [q, setQ] = useState("");
  const [groupByUser, setGroupByUser] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [photosOpen, setPhotosOpen] = useState<null | { reportId: string; items: any[] }>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = (searchParams?.get("userId") || "").trim();

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const query = userId ? `?userId=${encodeURIComponent(userId)}` : "";
        const res = await fetch(`/api/admin/reports${query}`, { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load reports");
        setReports(data.items || []);
      } catch (e: any) {
        setError(e?.message || "Failed to load reports");
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const filtered = useMemo(() => {
    if (!q) return reports;
    const s = q.toLowerCase();
    return reports.filter((r) =>
      r.reportId?.toLowerCase().includes(s) ||
      r.user?.email?.toLowerCase().includes(s) ||
      r.user?.name?.toLowerCase().includes(s)
    );
  }, [q, reports]);

  const grouped = useMemo(() => {
    if (!groupByUser) return null;
    const map = new Map<string, { user: any; items: ReportItem[] }>();
    for (const r of filtered) {
      const uid = String(r.userId || "unknown");
      const cur = map.get(uid) || { user: r.user, items: [] };
      cur.items.push(r);
      map.set(uid, cur);
    }
    return Array.from(map.entries()).map(([uid, v]) => ({ userId: uid, user: v.user, items: v.items }));
  }, [filtered, groupByUser]);

  const getStatusColor = (status?: string) => {
    if (!status) return "bg-gray-100 text-gray-700";
    const lower = status.toLowerCase();
    if (lower.includes("complete") || lower.includes("approved")) return "bg-green-100 text-green-700";
    if (lower.includes("pending")) return "bg-yellow-100 text-yellow-700";
    if (lower.includes("draft")) return "bg-blue-100 text-blue-700";
    if (lower.includes("rejected")) return "bg-red-100 text-red-700";
    return "bg-gray-100 text-gray-700";
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-red-600 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-red-800 font-semibold mb-1">Error Loading Reports</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Reports Management</h1>
          <p className="text-gray-600 text-sm sm:text-base">{userId ? "Viewing reports for selected user" : "View and manage all submitted reports"}</p>
          {userId && (
            <div className="mt-3 inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-800 px-3 py-1.5 rounded-lg text-sm">
              <span className="font-medium">Filter:</span>
              <span className="font-mono">userId={userId}</span>
              <button
                className="ml-2 text-blue-600 hover:text-blue-800 underline"
                onClick={() => router.push("/admin/reports")}
              >Clear</button>
            </div>
          )}
        </div>

        {/* Search and Stats */}
        <div className="mb-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                placeholder="Search by report ID, user name, or email..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Reports</p>
              <p className="text-2xl font-bold text-gray-900">{filtered.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading reports...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filtered.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No reports found</h3>
            <p className="text-gray-600">{q ? "Try adjusting your search terms" : "No reports have been submitted yet"}</p>
          </div>
        )}

        {/* Desktop Table View */}
        {!loading && filtered.length > 0 && (
          <div className="hidden lg:block bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Report ID</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Updated</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filtered.map((r) => (
                    <tr key={String(r._id)} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{r.reportId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{r.user?.name || r.userId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{r.user?.email || "—"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(r.status)}`}>
                          {r.status || "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {r.updatedAt ? new Date(r.updatedAt).toLocaleDateString("en-US", { 
                          month: "short", 
                          day: "numeric", 
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        }) : "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                       <div className="flex items-center gap-2">
                          <button
                            onMouseEnter={() => warmupExportLibs()}
                            onFocus={() => warmupExportLibs()}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            disabled={downloading === r.reportId}
                            onClick={async () => {
                              setDownloading(r.reportId);
                              try {
                                const form = r.data || {};
                                const signatureData = r.signatureData || null;
                                const resp = await fetch(`/api/photos?reportId=${encodeURIComponent(r.reportId)}`, { cache: "no-store" });
                                const j = await resp.json();
                                const items: any[] = j?.items || [];
                                const buckets: Record<string, any[]> = {
                                  background: [],
                                  fieldObservation: [],
                                  work: [],
                                  safety: [],
                                  equipment: [],
                                  additional: [],
                                };
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
                                await generateFullReportPDF(form, buckets as any, signatureData);
                              } catch (e) {
                                alert("Failed to generate PDF. See console.");
                                console.error(e);
                              } finally {
                                setDownloading(null);
                              }
                            }}
                          >
                            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            {downloading === r.reportId ? "Generating..." : "PDF"}
                          </button>
                          <button
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-colors"
                            onClick={async () => {
                              try {
                                const resp = await fetch(`/api/photos?reportId=${encodeURIComponent(r.reportId)}`, { cache: "no-store" });
                                const j = await resp.json();
                                setPhotosOpen({ reportId: r.reportId, items: j?.items || [] });
                              } catch (e) {
                                alert("Failed to load photos");
                              }
                            }}
                          >
                            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Photos
                          </button>
                          <button
                            className="inline-flex items-center px-3 py-1.5 border border-red-200 text-red-700 rounded-lg text-sm font-medium bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            disabled={deleting === r._id}
                            onClick={async () => {
                              if (!confirm(`Delete report ${r.reportId}? This will also delete its photos.`)) return;
                              setDeleting(r._id);
                              try {
                                const resp = await fetch('/api/admin/reports', {
                                  method: 'DELETE',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ id: r._id }),
                                });
                                const j = await resp.json().catch(() => ({} as any));
                                if (!resp.ok) throw new Error(j?.error || 'Failed to delete');
                                setReports((prev) => prev.filter((it) => it._id !== r._id));
                              } catch (e: any) {
                                alert(e?.message || 'Delete failed');
                              } finally {
                                setDeleting(null);
                              }
                            }}
                          >
                            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0V5a2 2 0 012-2h2a2 2 0 012 2v2m-7 0h8" />
                            </svg>
                            {deleting === r._id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Mobile/Tablet Card View */}
        {!loading && filtered.length > 0 && (
          <div className="lg:hidden space-y-4">
            {filtered.map((r) => (
              <div key={String(r._id)} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 mb-1 truncate">{r.reportId}</h3>
                      <p className="text-sm text-gray-600 truncate">{r.user?.name || r.userId}</p>
                    </div>
                    <span className={`ml-3 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(r.status)}`}>
                      {r.status || "—"}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-start text-sm">
                      <svg className="w-4 h-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="text-gray-600 break-all">{r.user?.email || "—"}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <svg className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-gray-600">
                        {r.updatedAt ? new Date(r.updatedAt).toLocaleDateString("en-US", { 
                          month: "short", 
                          day: "numeric", 
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        }) : "—"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onMouseEnter={() => warmupExportLibs()}
                      onFocus={() => warmupExportLibs()}
                      className="flex-1 inline-flex items-center justify-center px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      disabled={downloading === r.reportId}
                      onClick={async () => {
                        setDownloading(r.reportId);
                        try {
                          const form = r.data || {};
                          const signatureData = r.signatureData || null;
                          const resp = await fetch(`/api/photos?reportId=${encodeURIComponent(r.reportId)}`, { cache: "no-store" });
                          const j = await resp.json();
                          const items: any[] = j?.items || [];
                          const buckets: Record<string, any[]> = {
                            background: [],
                            fieldObservation: [],
                            work: [],
                            safety: [],
                            equipment: [],
                            additional: [],
                          };
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
                          await generateFullReportPDF(form, buckets as any, signatureData);
                        } catch (e) {
                          alert("Failed to generate PDF. See console.");
                          console.error(e);
                        } finally {
                          setDownloading(null);
                        }
                      }}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {downloading === r.reportId ? "Generating..." : "Download PDF"}
                    </button>
                    <button
                      className="flex-1 inline-flex items-center justify-center px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-colors"
                      onClick={async () => {
                        try {
                          const resp = await fetch(`/api/photos?reportId=${encodeURIComponent(r.reportId)}`, { cache: "no-store" });
                          const j = await resp.json();
                          setPhotosOpen({ reportId: r.reportId, items: j?.items || [] });
                        } catch (e) {
                          alert("Failed to load photos");
                        }
                      }}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      View Photos
                    </button>
                    <button
                      className="flex-1 inline-flex items-center justify-center px-4 py-2.5 border border-red-200 text-red-700 rounded-lg text-sm font-medium bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      disabled={deleting === r._id}
                      onClick={async () => {
                        if (!confirm(`Delete report ${r.reportId}? This will also delete its photos.`)) return;
                        setDeleting(r._id);
                        try {
                          const resp = await fetch('/api/admin/reports', {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id: r._id }),
                          });
                          const j = await resp.json().catch(() => ({} as any));
                          if (!resp.ok) throw new Error(j?.error || 'Failed to delete');
                          setReports((prev) => prev.filter((it) => it._id !== r._id));
                        } catch (e: any) {
                          alert(e?.message || 'Delete failed');
                        } finally {
                          setDeleting(null);
                        }
                      }}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0V5a2 2 0 012-2h2a2 2 0 012 2v2m-7 0h8" />
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Photo Modal */}
      {photosOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setPhotosOpen(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Photos</h2>
                <p className="text-sm text-gray-600 mt-0.5">{photosOpen.reportId}</p>
              </div>
              <button 
                className="ml-4 p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0" 
                onClick={() => setPhotosOpen(null)}
                aria-label="Close"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-auto flex-1">
              {photosOpen.items.length === 0 ? (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-600">No photos available for this report</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {photosOpen.items.map((p: any) => (
                    <div key={String(p._id)} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow group">
                      <div className="aspect-video bg-gray-100 overflow-hidden">
                        <img 
                          src={p.src} 
                          alt={p.name || "Photo"} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" 
                        />
                      </div>
                      <div className="p-3">
                        <h3 className="font-medium text-sm text-gray-900 truncate mb-1">
                          {p.caption || p.name || "Photo"}
                        </h3>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 capitalize">{p.section}</span>
                          {p.includeInSummary && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Summary</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
