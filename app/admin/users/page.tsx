"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/users", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load users");
        setUsers(data.users || []);
      } catch (e: any) {
        setError(e?.message || "Failed to load users");
      }
    })();
  }, []);

  if (error) return <div className="p-6">Error: {error}</div>;

  return (
    <div className="container mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-bold mb-6">Users</h1>
      <div className="bg-white rounded-xl p-4 shadow-sm overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600">
              <th className="p-2">Name</th>
              <th className="p-2">Email</th>
              <th className="p-2">Role</th>
              <th className="p-2">Created</th>
              <th className="p-2">Reports</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={String(u._id)} className="border-t">
                <td className="p-2">{u.name}</td>
                <td className="p-2">{u.email}</td>
                <td className="p-2">{u.role}</td>
                <td className="p-2">{u.createdAt ? new Date(u.createdAt).toLocaleString() : ""}</td>
                <td className="p-2">{typeof u.reportsCount === 'number' ? u.reportsCount : '-'}</td>
                <td className="p-2">
                  <Link
                    href={`/admin/reports?userId=${encodeURIComponent(String(u._id))}`}
                    className="text-[#78c850] hover:text-[#5fa83d] underline"
                    title="View user's reports"
                  >
                    View reports
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
