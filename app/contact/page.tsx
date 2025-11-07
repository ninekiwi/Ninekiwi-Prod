"use client";
import { useEffect, useMemo, useRef, useState } from "react";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState<null | "ok" | "err">(null);
  const [err, setErr] = useState<string>("");
  const [honeypot, setHoneypot] = useState(""); // spam trap (should stay empty)
  const [toastOpen, setToastOpen] = useState(false);

  const supportEmail =
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "support@ninekiwi.com";

  const emailValid = useMemo(() => {
    if (!email) return false;
    // Simple, forgiving email check
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }, [email]);

  const subjectValid = subject.trim().length > 2;
  const nameValid = name.trim().length > 1;
  const messageValid = message.trim().length > 4;

  const formValid = nameValid && emailValid && subjectValid && messageValid && !honeypot;

  // helps screen readers announce status
  const statusRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (statusRef.current) statusRef.current.focus();
  }, [sent]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formValid) {
      setSent("err");
      setErr("Please fill all fields correctly.");
      return;
    }
    if (honeypot) return; // likely bot

    setLoading(true);
    setSent(null);
    setErr("");

    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 15000); // 15s timeout

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ name, email, subject, message }),
      });
      clearTimeout(t);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Failed to send message");
      setSent("ok");
      setToastOpen(true);
      setName(""); setEmail(""); setSubject(""); setMessage("");
    } catch (e: any) {
      setSent("err");
      setErr(e?.name === "AbortError" ? "Request timed out. Please try again." : (e?.message || "Failed to send message"));
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
    <div className="min-h-[70vh] bg-gradient-to-br from-gray-50 to-[#78c850]/5">
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
          <span className="text-sm font-medium">Thanks! Your message has been sent.</span>
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
      <div className="container mx-auto px-4 sm:px-6 py-10">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <div className="text-center mb-6">
            <div className="mx-auto mb-3 h-10 w-10 rounded-xl bg-[#78c850]/15 grid place-items-center">
              {/* small kiwi dot */}
              <span className="h-2 w-2 rounded-full bg-[#78c850]" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-kiwi-dark">Contact Us</h1>
            <p className="text-gray-600 mt-1">We usually reply within 24 hours.</p>
          </div>

          {/* Status region (SR-friendly) */}
          <div
            ref={statusRef}
            tabIndex={-1}
            aria-live="polite"
            className="sr-only"
          >
            {sent === "ok" ? "Your message has been sent." : sent === "err" ? `Error: ${err}` : ""}
          </div>

          {/* Inline success removed in favor of toast */}
          {sent === "err" && (
            <div className="mb-4 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-700">
              {err}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-5" noValidate>
            {/* Honeypot (hidden): real users should not fill this */}
            <div className="hidden">
              <label htmlFor="company">Company</label>
              <input
                id="company"
                name="company"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                autoComplete="organization"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1" htmlFor="name">Your name</label>
                <input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                  aria-invalid={!nameValid && name.length > 0}
                  className={`w-full border-2 rounded-lg px-3 py-2 outline-none focus:ring-4
                    ${nameValid || name.length === 0 ? "border-gray-200 focus:border-[#78c850] focus:ring-[#78c850]/10" : "border-red-300 focus:border-red-400 focus:ring-red-100"}`}
                />
              </div>
              <div>
                <label className="block text-sm mb-1" htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  aria-invalid={!emailValid && email.length > 0}
                  className={`w-full border-2 rounded-lg px-3 py-2 outline-none focus:ring-4
                    ${emailValid || email.length === 0 ? "border-gray-2 00 focus:border-[#78c850] focus:ring-[#78c850]/10" : "border-red-300 focus:border-red-400 focus:ring-red-100"}`}
                />
                {!emailValid && email.length > 0 && (
                  <p className="mt-1 text-xs text-red-600">Enter a valid email address.</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1" htmlFor="subject">Subject</label>
              <input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                aria-invalid={!subjectValid && subject.length > 0}
                className={`w-full border-2 rounded-lg px-3 py-2 outline-none focus:ring-4
                  ${subjectValid || subject.length === 0 ? "border-gray-200 focus:border-[#78c850] focus:ring-[#78c850]/10" : "border-red-300 focus:border-red-400 focus:ring-red-100"}`}
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm mb-1" htmlFor="message">Message</label>
                <span className="text-xs text-gray-500">{message.length}/2000</span>
              </div>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 2000))}
                required
                rows={5}
                aria-invalid={!messageValid && message.length > 0}
                className={`w-full border-2 rounded-lg px-3 py-2 outline-none focus:ring-4 resize-y
                  ${messageValid || message.length === 0 ? "border-gray-200 focus:border-[#78c850] focus:ring-[#78c850]/10" : "border-red-300 focus:border-red-400 focus:ring-red-100"}`}
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <a
                href={`mailto:${supportEmail}`}
                className="text-sm text-gray-600 hover:text-kiwi-dark underline underline-offset-4"
              >
                Email directly
              </a>

              <button
                type="submit"
                disabled={loading || !formValid}
                className="inline-flex items-center justify-center rounded-lg bg-[#78c850] hover:bg-[#6ac243] text-white font-semibold px-5 py-2.5 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg
                      aria-hidden="true"
                      role="status"
                      className="mr-2 inline h-4 w-4 animate-spin"
                      viewBox="0 0 100 101"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591..." fill="currentColor" opacity="0.2"/>
                      <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539..." fill="currentColor"/>
                    </svg>
                    Sending…
                  </>
                ) : (
                  "Send message"
                )}
              </button>
            </div>
          </form>

          {/* small footer help */}
          <p className="mt-6 text-center text-xs text-gray-500">
            Having trouble? Write to us at{" "}
            <a className="underline" href={`mailto:${supportEmail}`}>{supportEmail}</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
