export type ReportDoc = {
  _id: string;
  userId: string;
  reportId: string;
  status?: string;
  data: Record<string, any>;
  signatureData?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export async function saveReport(input: { reportId: string; data: Record<string, any>; status?: string; signatureData?: string | null; }) {
  const res = await fetch("/api/reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || "Failed to save report");
  return json.item as ReportDoc;
}

export async function getReport(reportId: string) {
  const res = await fetch(`/api/reports/${encodeURIComponent(reportId)}`, { cache: "no-store" });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || "Failed to fetch report");
  return json.item as ReportDoc | null;
}

export async function listReports(reportId?: string) {
  const q = new URLSearchParams();
  if (reportId) q.set("reportId", reportId);
  const res = await fetch(`/api/reports${q.toString() ? `?${q.toString()}` : ""}`, { cache: "no-store" });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || "Failed to list reports");
  return json.items as ReportDoc[];
}

