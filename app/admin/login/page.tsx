"use client";
import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // If already authenticated as admin, go to home
  useEffect(() => {
    const role = (session?.user as any)?.role;
    if (role === "admin") {
      router.replace("/");
    }
  }, [session, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", { redirect: false, email, password });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password");
      return;
    }
    // Verify role via session endpoint
    const me = await fetch("/api/auth/me", { cache: "no-store" }).then((r) => r.json()).catch(() => ({} as any));
    if (!me?.user || me.user.role !== "admin") {
      setError("Not an admin account");
      return;
    }
    router.push("/");
  }

  return (
    <div className="min-h-[70vh] grid place-items-center p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-white shadow p-6 rounded-xl space-y-4">
        <h1 className="text-xl font-semibold">Admin Login</h1>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {/* Credentials only for admin login */}
        <div className="space-y-1">
          <label className="text-sm">Admin Email</label>
          <input type="email" className="w-full border rounded px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-1">
          <label className="text-sm">Password</label>
          <input type="password" className="w-full border rounded px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button type="submit" disabled={loading} className="w-full bg-kiwi-dark text-white px-4 py-2 rounded hover:opacity-95 disabled:opacity-60">
          {loading ? "Signing in..." : "Sign In"}
        </button>
        <div className="text-sm text-center space-y-1">
          <p><a href="/forgot" className="underline">Forgot your password?</a></p>
        </div>
      </form>
    </div>
  );
}
