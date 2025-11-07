"use client";
import { useEffect, useState } from "react";

export default function EarlyAccessPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [useCase, setUseCase] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (!name.trim() || !email.trim()) {
      setError("Please provide your name and email.");
      return;
    }
    setLoading(true);
    try {
      const subject = "Early Access Request";
      const message = [
        "A user requested early access:",
        "",
        `Name: ${name}`,
        `Email: ${email}`,
        company ? `Company: ${company}` : undefined,
        useCase ? `Use case / notes: ${useCase}` : undefined,
      ]
        .filter(Boolean)
        .join("\n");
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const data = await res.json().catch(() => ({} as any));
      if (!res.ok) throw new Error(data?.error || "Failed to submit");
      setSuccess(true);
      setToastOpen(true);
      setName("");
      setEmail("");
      setCompany("");
      setUseCase("");
    } catch (e: any) {
      setError(e?.message || "Failed to submit");
    } finally {
      setLoading(false);
    }
  }

  // Auto-hide success toast
  useEffect(() => {
    if (!toastOpen) return;
    const t = setTimeout(() => setToastOpen(false), 3000);
    return () => clearTimeout(t);
  }, [toastOpen]);

  return (
    <main className="container mx-auto px-4 sm:px-6 py-12">
      {/* Success Toast */}
      <div
        className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-200 ${
          toastOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
        }`}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-3 bg-[#78c850] text-white px-4 py-3 rounded-xl shadow-lg">
          <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium">Thanks! We’ve added you to the early access list.</span>
          <button
            type="button"
            onClick={() => setToastOpen(false)}
            aria-label="Close notification"
            className="ml-2 text-white/80 hover:text-white"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      <section className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#78c850] to-[#78c850] shadow-lg mb-4">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Get Early Access</h1>
          <p className="text-gray-600 mt-2">Join the early access list to try new features before everyone else.</p>
        </div>

        <form onSubmit={onSubmit} className="bg-white shadow-xl rounded-2xl p-6 sm:p-8 space-y-5 border border-gray-100">
          {error && (
            <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">{error}</div>
          )}
          {false && (
            <div className="p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
              Thanks! We’ve added you to the early access list.
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
              <input
                type="text"
                className="w-full border-2 border-gray-300 focus:border-[#78c850] focus:ring-4 focus:ring-[#78c850]/10 rounded-lg px-4 py-2.5 transition-all outline-none"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
              <input
                type="email"
                className="w-full border-2 border-gray-300 focus:border-[#78c850] focus:ring-4 focus:ring-[#78c850]/10 rounded-lg px-4 py-2.5 transition-all outline-none"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company (optional)</label>
            <input
              type="text"
              className="w-full border-2 border-gray-300 focus:border-[#78c850] focus:ring-4 focus:ring-[#78c850]/10 rounded-lg px-4 py-2.5 transition-all outline-none"
              placeholder="Company name"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">What will you use it for? (optional)</label>
            <textarea
              rows={4}
              className="w-full border-2 border-gray-300 focus:border-[#78c850] focus:ring-4 focus:ring-[#78c850]/10 rounded-lg px-4 py-2.5 transition-all outline-none resize-none"
              placeholder="Tell us briefly about your use case"
              value={useCase}
              onChange={(e) => setUseCase(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto bg-gradient-to-r from-[#78c850] to-[#78c850] hover:from-[#78c850] hover:to-[#78c850] text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Submitting..." : "Request Early Access"}
          </button>
        </form>
      </section>
    </main>
  );
}
