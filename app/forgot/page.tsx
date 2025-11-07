"use client";
import { useState } from "react";

export default function ForgotPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/auth/forgot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    if (!res.ok) {
      const j = await res.json();
      setError(j?.error || "Failed to send reset link");
      return;
    }
    setSent(true);
  }

  return (
    <div className="min-h-[70vh] grid place-items-center p-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-white shadow p-6 rounded-xl space-y-4">
        <h1 className="text-xl font-semibold">Forgot password</h1>
        {sent ? (
          <p className="text-sm">If the email exists, a reset token has been generated. Ask the admin to check server logs for the token in development, or configure email sending.</p>
        ) : (
          <>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="space-y-1">
              <label className="text-sm">Email</label>
              <input type="email" className="w-full border rounded px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <button type="submit" className="w-full bg-kiwi-green text-white px-4 py-2 rounded">Send reset link</button>
          </>
        )}
      </form>
    </div>
  );
}

