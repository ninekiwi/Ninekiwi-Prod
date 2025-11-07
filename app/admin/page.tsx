"use client";
import { useEffect, useState } from "react";

type Stats = {
  usersCount: number;
  reportsCount: number;
  recentUsers: any[];
  recentReports: any[];
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [payments, setPayments] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/stats", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load stats");
        setStats(data);
        // fetch recent payments (admin only)
        try {
          const pr = await fetch("/api/admin/payments", { cache: "no-store" });
          const pj = await pr.json();
          if (pr.ok) setPayments(pj?.payments || []);
        } catch {}
      } catch (e: any) {
        setError(e?.message || "Failed to load stats");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 sm:p-8 max-w-md w-full">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-base sm:text-lg font-semibold text-red-900 mb-1">Error Loading Dashboard</h3>
              <p className="text-sm text-red-700 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Retry
              </button>
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
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-[#78c850] to-[#5fa83d] rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
              <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-0.5">Monitor your platform's performance</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Total Users Card */}
          <div className="group bg-white hover:bg-gradient-to-br hover:from-white hover:to-[#78c850]/5 rounded-xl sm:rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-lg border border-gray-100 hover:border-[#78c850]/30 transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 sm:w-12 sm:h-12 bg-[#78c850]/10 group-hover:bg-[#78c850] rounded-xl flex items-center justify-center transition-colors duration-300 flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#78c850] group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-600">Total Users</div>
                  <div className="text-xs text-gray-500 mt-0.5">Registered accounts</div>
                </div>
              </div>
              <div className="px-2.5 py-1 bg-[#78c850]/10 text-[#78c850] text-xs font-semibold rounded-full flex-shrink-0">
                Active
              </div>
            </div>
            {loading ? (
              <div className="h-9 sm:h-10 bg-gray-200 rounded-lg animate-pulse" />
            ) : (
              <div className="text-3xl sm:text-4xl font-bold text-gray-900">{stats?.usersCount?.toLocaleString() ?? "0"}</div>
            )}
          </div>

          {/* Total Reports Card */}
          <div className="group bg-white hover:bg-gradient-to-br hover:from-white hover:to-[#78c850]/5 rounded-xl sm:rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-lg border border-gray-100 hover:border-[#78c850]/30 transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 sm:w-12 sm:h-12 bg-[#78c850]/10 group-hover:bg-[#78c850] rounded-xl flex items-center justify-center transition-colors duration-300 flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#78c850] group-hover:text-white transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-600">Total Reports</div>
                  <div className="text-xs text-gray-500 mt-0.5">Generated PDFs</div>
                </div>
              </div>
              <div className="px-2.5 py-1 bg-blue-100 text-blue-600 text-xs font-semibold rounded-full flex-shrink-0">
                All Time
              </div>
            </div>
            {loading ? (
              <div className="h-9 sm:h-10 bg-gray-200 rounded-lg animate-pulse" />
            ) : (
              <div className="text-3xl sm:text-4xl font-bold text-gray-900">{stats?.reportsCount?.toLocaleString() ?? "0"}</div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Recent Users */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#78c850]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-[#78c850]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 truncate">Recent Users</h2>
                    <p className="text-xs text-gray-500 hidden sm:block">Latest registrations</p>
                  </div>
                </div>
                <a 
                  href="/admin/users" 
                  className="flex items-center gap-1 text-xs sm:text-sm font-medium text-[#78c850] hover:text-[#5fa83d] transition-colors group flex-shrink-0"
                >
                  <span className="hidden sm:inline">View all</span>
                  <span className="sm:hidden">All</span>
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>
            
            <div className="divide-y divide-gray-100 max-h-[400px] sm:max-h-[450px] overflow-y-auto">
              {loading ? (
                <>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="p-3.5 sm:p-4 space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
                    </div>
                  ))}
                </>
              ) : stats?.recentUsers && stats.recentUsers.length > 0 ? (
                stats.recentUsers.map((u: any) => (
                  <div key={String(u._id)} className="p-3.5 sm:p-4 hover:bg-gray-50 transition-colors group cursor-pointer">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <div className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-[#78c850] to-[#5fa83d] rounded-full flex items-center justify-center text-white font-semibold text-xs sm:text-sm">
                        {u.name?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm sm:text-base text-gray-900 truncate group-hover:text-[#78c850] transition-colors">
                          {u.name}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500 flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <span className="truncate max-w-[180px] sm:max-w-none">{u.email}</span>
                          <span className="text-gray-300 hidden sm:inline">•</span>
                          <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-medium ${
                            u.role === 'admin' 
                              ? 'bg-purple-100 text-purple-700' 
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {u.role}
                          </span>
                        </div>
                      </div>
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 sm:p-8 text-center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-7 h-7 sm:w-8 sm:h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <p className="text-sm sm:text-base text-gray-500 font-medium">No users yet</p>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">New registrations will appear here</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Reports */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 truncate">Recent Reports</h2>
                    <p className="text-xs text-gray-500 hidden sm:block">Latest generated PDFs</p>
                  </div>
                </div>
                <a 
                  href="/admin/reports" 
                  className="flex items-center gap-1 text-xs sm:text-sm font-medium text-[#78c850] hover:text-[#5fa83d] transition-colors group flex-shrink-0"
                >
                  <span className="hidden sm:inline">View all</span>
                  <span className="sm:hidden">All</span>
                  <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>
            
            <div className="divide-y divide-gray-100 max-h-[400px] sm:max-h-[450px] overflow-y-auto">
              {loading ? (
                <>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="p-3.5 sm:p-4 space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-full" />
                    </div>
                  ))}
                </>
              ) : stats?.recentReports && stats.recentReports.length > 0 ? (
                stats.recentReports.map((r: any) => (
                  <div key={String(r._id)} className="p-3.5 sm:p-4 hover:bg-gray-50 transition-colors group">
                    <div className="flex items-start sm:items-center gap-2.5 sm:gap-3">
                      <div className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm sm:text-base text-gray-900 truncate group-hover:text-[#78c850] transition-colors flex items-center gap-2 flex-wrap">
                          <span className="truncate">{r.reportId}</span>
                          <span className="px-1.5 sm:px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full flex-shrink-0">
                            PDF
                          </span>
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500 flex items-center gap-1.5 sm:gap-2 flex-wrap mt-1">
                          <span className="flex items-center gap-1 truncate max-w-[150px] sm:max-w-none">
                            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="truncate">{r.userId}</span>
                          </span>
                          <span className="text-gray-300 hidden sm:inline">•</span>
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {new Date(r.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <button
                        className="ml-2 text-xs sm:text-sm px-2 py-1 rounded-lg border border-red-200 text-red-700 bg-white hover:bg-red-50 flex-shrink-0"
                        disabled={deletingId === String(r._id)}
                        onClick={async () => {
                          if (!confirm(`Delete report ${r.reportId}? This will also delete its photos.`)) return;
                          setDeletingId(String(r._id));
                          try {
                            const resp = await fetch('/api/admin/reports', {
                              method: 'DELETE',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ id: r._id }),
                            });
                            const j = await resp.json().catch(() => ({} as any));
                            if (!resp.ok) throw new Error(j?.error || 'Failed to delete');
                            setStats((prev) => prev ? { ...prev, recentReports: (prev.recentReports || []).filter((it: any) => String(it._id) !== String(r._id)), reportsCount: Math.max(0, (prev.reportsCount || 1) - 1) } : prev);
                          } catch (e: any) {
                            alert(e?.message || 'Delete failed');
                          } finally {
                            setDeletingId(null);
                          }
                        }}
                      >
                        {deletingId === String(r._id) ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 sm:p-8 text-center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-7 h-7 sm:w-8 sm:h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-sm sm:text-base text-gray-500 font-medium">No reports yet</p>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">Generated reports will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Payments */}
        <div className="mt-6 sm:mt-8">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-[#78c850]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-[#78c850]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-2.21 0-4 1.343-4 3s1.79 3 4 3 4-1.343 4-3-1.79-3-4-3zm0 9c-3.866 0-7-2.015-7-4.5V18a1 1 0 001 1h12a1 1 0 001-1v-5.5c0 2.485-3.134 4.5-7 4.5z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-bold text-gray-900 truncate">Recent Payments</h2>
                    <p className="text-xs text-gray-500 hidden sm:block">Last 100 payments</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-4 py-2">Date</th>
                    <th className="text-left px-4 py-2">User</th>
                    <th className="text-left px-4 py-2">Amount</th>
                    <th className="text-left px-4 py-2">Currency</th>
                    <th className="text-left px-4 py-2 hidden md:table-cell">Order</th>
                    <th className="text-left px-4 py-2 hidden md:table-cell">Payment</th>
                    <th className="text-left px-4 py-2">Desc</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr><td className="px-4 py-4 text-gray-500" colSpan={7}>Loading...</td></tr>
                  ) : (payments || []).length ? (
                    (payments || []).map((p: any) => (
                      <tr key={String(p._id)} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-700">{new Date(p.createdAt).toLocaleString()}</td>
                        <td className="px-4 py-2">
                          <div className="text-gray-900 font-medium truncate max-w-[180px]">{p.email || p.name || "-"}</div>
                          {p.name && <div className="text-gray-500 text-xs truncate max-w-[180px]">{p.name}{p.phone ? ` · ${p.phone}` : ""}</div>}
                        </td>
                        <td className="px-4 py-2 font-semibold text-gray-900">{p.amount}</td>
                        <td className="px-4 py-2 text-gray-700">{p.currency}</td>
                        <td className="px-4 py-2 hidden md:table-cell text-gray-500 truncate max-w-[200px]">{p.orderId}</td>
                        <td className="px-4 py-2 hidden md:table-cell text-gray-500 truncate max-w-[200px]">{p.paymentId}</td>
                        <td className="px-4 py-2 text-gray-700 truncate max-w-[240px]">{p.description || '-'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td className="px-4 py-4 text-gray-500" colSpan={7}>No payments found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
