"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div />}> 
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const params = useSearchParams();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = params?.get("token") || "";
    if (t) setToken(t);
  }, [params]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/auth/reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }) });
    const j = await res.json();
    if (!res.ok) { setError(j?.error || "Failed to reset"); return; }
    setDone(true);
  }

  return (
    <div className="min-h-[70vh] grid place-items-center p-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-white shadow p-6 rounded-xl space-y-4">
        <h1 className="text-xl font-semibold">Reset password</h1>
        {done ? (
          <p className="text-sm">Password updated. You can now <a href="/login" className="underline">login</a>.</p>
        ) : (
          <>
            {error && <p className="text-sm text-red-600">{error}</p>}
            {!token && (
              <div className="space-y-1">
                <label className="text-sm">Reset Token</label>
                <input className="w-full border rounded px-3 py-2" value={token} onChange={(e) => setToken(e.target.value)} required />
              </div>
            )}
            <div className="space-y-1">
              <label className="text-sm">New Password</label>
              <input type="password" className="w-full border rounded px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="w-full bg-kiwi-green text-white px-4 py-2 rounded">Reset Password</button>
          </>
        )}
      </form>
    </div>
  );
}
