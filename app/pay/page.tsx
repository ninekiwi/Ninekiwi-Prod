"use client";
import { useEffect, useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import Link from "next/link";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PayPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState<number>(499);
  const [currency, setCurrency] = useState("INR");
  const [description, setDescription] = useState("NineKiwi Tool Access");
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(true);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [disclaimerDismissed, setDisclaimerDismissed] = useState(false);

  useEffect(() => {
    // ensure animated sections become visible
    try {
      document
        .querySelectorAll<HTMLElement>(".animated-element")
        .forEach((el) => el.classList.add("animate-fade-in-up"));
    } catch {}
    // Check disclaimer acceptance
    try {
      const v = localStorage.getItem("nk_disclaimer_accepted");
      setDisclaimerAccepted(!!v);
    } catch {}
    // Prefill user details if logged in
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await res.json();
        const u = data?.user;
        if (u) {
          setName(u.name || "");
          setEmail(u.email || "");
        }
      } catch {}
    })();
  }, []);

  // Show payment UI regardless of prior status; access is controlled by middleware

  async function createOrder() {
    const res = await fetch("/api/payment/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, currency, description }),
    });
    if (!res.ok) throw new Error((await res.json())?.error || "Order failed");
    return res.json() as Promise<{
      orderId: string;
      amount: number;
      currency: string;
      key: string;
    }>;
  }

  async function verifyPayment(orderId: string, paymentId: string, signature: string) {
    const res = await fetch("/api/payment/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ orderId, paymentId, signature, amount, currency, description, name, email, phone }),
    });
    if (!res.ok) throw new Error((await res.json())?.error || "Verification failed");
    return res.json();
  }

  async function onPay(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !phone || !amount || amount <= 0) {
      alert("Please fill in all required fields with valid information.");
      return;
    }
    if (!terms) {
      alert("Please accept Terms and Conditions.");
      return;
    }
    setLoading(true);
    try {
      const order = await createOrder();
      const options = {
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        name: "NineKiwi Payments",
        description: description || "Payment for NineKiwi Services",
        order_id: order.orderId,
        prefill: { name, email, contact: phone },
        theme: { color: "#78C850" },
        handler: async (response: any) => {
          try {
            await verifyPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );
            // server sets httpOnly cookie after verification
// server sets httpOnly cookie after verification
            alert("Payment successful! Redirecting to the report tool.");
            window.location.replace("/report");
          } catch (err: any) {
            alert(err?.message || "Payment verification failed");
          }
        },
      };
      const rzp = new window.Razorpay(options);
      if (rzp?.on) {
        rzp.on("payment.failed", function (resp: any) {
          alert(resp?.error?.description || "Payment failed");
        });
      }
      rzp.open();
    } catch (err: any) {
      alert(err?.message || "Unable to start payment");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-kiwi-light font-body text-kiwi-gray min-h-[100vh] relative overflow-x-hidden">
      {!disclaimerAccepted && !disclaimerDismissed && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
          <div className="relative bg-white max-w-3xl w-[92vw] md:w-[780px] rounded-xl shadow-xl p-6 overflow-auto max-h-[85vh]">
            <button
              type="button"
              aria-label="Close disclaimer"
              className="absolute top-3 right-3 p-2 rounded-md hover:bg-gray-100 text-gray-500"
              onClick={() => setDisclaimerDismissed(true)}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Disclaimer</h3>
            <div className="text-sm text-gray-800 space-y-3 leading-6">
              <p>Disclaimer regarding using NINEKIWI.COM report generating tool:</p>
              <p>
                NINEKIWI.COM provides tools for generating field inspection and construction progress reports. All
                information, data entries, and photographs included in the reports are provided solely by the user,
                field inspector, or the company using the application. NINEKIWI.COM is not responsible for the accuracy,
                completeness, or appropriateness of any content or images entered or generated through the platform. It
                is the sole responsibility of the user, inspector, or company to verify and confirm the accuracy of all
                information contained in the generated reports before using, distributing, or relying on them for any
                purpose.
              </p>
            </div>
            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => setDisclaimerDismissed(true)}
              >
                Close
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  try { localStorage.setItem("nk_disclaimer_accepted", "1"); } catch {}
                  setDisclaimerAccepted(true);
                }}
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />

      <div className="kiwi-shape -top-20 -left-20" />
      <div className="kiwi-shape bottom-10 right-10 rotate-45 w-40 h-40" />

      {showModal && (
        <div className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 text-center space-y-4 animate-fade-in-up">
            <h2 className="text-2xl font-heading font-bold text-kiwi-dark">Payment Required</h2>
            <p className="text-kiwi-gray">
              To use the NineKiwi report generator, please complete a quick payment.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                className="bg-kiwi-green text-white font-bold py-2 px-5 rounded-lg"
                onClick={() => setShowModal(false)}
              >
                Proceed
              </button>
              <button
                className="border border-kiwi-green text-kiwi-green font-bold py-2 px-5 rounded-lg"
                onClick={() => router.push("/")}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="py-12 md:py-20 relative z-10">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12 md:mb-16 animated-element">
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-kiwi-dark mb-4">Secure Payment Processing</h1>
              <p className="text-base md:text-lg text-kiwi-gray max-w-2xl mx-auto">Complete your transaction securely with our trusted payment gateway.</p>
            </div>

            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg border border-gray-200 animated-element">
              <form onSubmit={onPay} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-kiwi-dark mb-1">Personal Details</h3>
                    <div>
                      <label className="block text-sm font-medium text-kiwi-gray mb-1">Full Name</label>
                      <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Enter your full name" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-kiwi-gray mb-1">Email Address</label>
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="your.email@example.com" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-kiwi-gray mb-1">Phone Number</label>
                      <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="+91 98765 43210" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-kiwi-dark mb-1">Payment Details</h3>
                    <div>
                      <label className="block text-sm font-medium text-kiwi-gray mb-1">Payment Amount</label>
                      <input type="number" min={1} value={amount} onChange={(e) => setAmount(parseInt(e.target.value || "0", 10))} required placeholder="Enter amount" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-kiwi-gray mb-1">Currency</label>
                      <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                        <option value="INR">Indian Rupee (₹)</option>
                        <option value="USD">US Dollar ($)</option>
                        <option value="EUR">Euro (€)</option>
                        <option value="GBP">British Pound (£)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-kiwi-gray mb-1">Payment Description</label>
                      <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this payment for?" />
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <input id="terms" type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="mt-1" />
                  <label htmlFor="terms" className="text-sm text-kiwi-gray">
                    I agree to the {" "}
                    <Link href="/terms" className="text-kiwi-green hover:text-kiwi-dark font-medium" target="_blank">Terms and Conditions</Link>
                    {" "}and authorize NineKiwi to process this payment. Read our {" "}
                    <Link href="/privacy" className="text-kiwi-green hover:text-kiwi-dark font-medium" target="_blank">Privacy Policy</Link>.
                  </label>
                </div>

                <button type="submit" disabled={loading} className="w-full bg-kiwi-green hover:bg-kiwi-dark text-white font-bold py-4 px-6 rounded-lg transition duration-300">
                  {loading ? "Processing..." : "Proceed to Payment"}
                </button>
              </form>
            </div>

            <div className="mt-8 text-center animated-element" style={{ animationDelay: "0.2s" }}>
              <div className="flex flex-wrap justify-center gap-6 text-sm text-kiwi-gray">
                <div className="flex items-center gap-2"><span className="h-5 w-5 text-kiwi-green">✔</span><span>Secure Payment Processing</span></div>
                <div className="flex items-center gap-2"><span className="h-5 w-5 text-kiwi-green">🔒</span><span>Your Data is Protected</span></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

