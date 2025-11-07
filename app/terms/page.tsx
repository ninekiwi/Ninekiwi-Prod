"use client";
import Link from "next/link";
import { useEffect } from "react";

export default function TermsPage() {
  useEffect(() => {
    try {
      document
        .querySelectorAll<HTMLElement>(".animated-element")
        .forEach((el) => el.classList.add("animate-fade-in-up"));
    } catch {}
  }, []);

  return (
    <div className="bg-kiwi-light font-body text-kiwi-gray relative overflow-x-hidden">
      <div className="kiwi-shape -top-20 -left-20" />
      <div className="kiwi-shape bottom-10 right-10 rotate-45 w-40 h-40" />

      <main className="py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 md:mb-16 animated-element">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-kiwi-dark mb-4">Terms & Conditions</h1>
              <p className="text-base sm:text-lg md:text-xl text-kiwi-gray max-w-3xl mx-auto">
                Please read these terms and conditions carefully before using our services.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4">
                <p className="text-sm text-kiwi-gray">Last updated: September 30, 2025</p>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center bg-kiwi-green hover:bg-kiwi-dark text-white font-bold py-2 px-6 rounded-full transition duration-300 transform hover:scale-105 text-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to NineKiwi
                </Link>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
              <div className="lg:w-1/4 animated-element">
                <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 sticky top-24">
                  <h3 className="font-heading font-bold text-kiwi-dark mb-4 text-lg">Contents</h3>
                  <nav className="space-y-1 text-sm font-medium">
                    <a href="#introduction">1. Introduction</a>
                    <a href="#eligibility">2. Eligibility</a>
                    <a href="#payments">3. Payments</a>
                    <a href="#services">4. Use of Services</a>
                    <a href="#intellectual-property">5. Intellectual Property</a>
                    <a href="#liability">6. Limitation of Liability</a>
                    <a href="#privacy">7. Privacy</a>
                    <a href="#termination">8. Termination</a>
                    <a href="#governing-law">9. Governing Law</a>
                    <a href="#changes">10. Changes to Terms</a>
                    <a href="#contact">11. Contact Us</a>
                  </nav>
                </div>
              </div>

              <div className="lg:w-3/4">
                <div className="bg-white rounded-xl p-6 md:p-8 shadow-lg border border-gray-200 animated-element">
                  <section id="introduction" className="mb-8 scroll-mt-28">
                    <h2 className="text-2xl font-heading font-bold text-kiwi-dark mb-4">1. Introduction</h2>
                    <p className="mb-4">
                      Welcome to <strong className="text-kiwi-dark">NineKiwi</strong>, a modern, multilingual, mobile-first project management platform designed specifically for the global construction industry.
                    </p>
                    <p>
                      By accessing or using our website, platform, and services, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, please discontinue use of our services immediately.
                    </p>
                  </section>

                  <section id="eligibility" className="mb-8 scroll-mt-28">
                    <h2 className="text-2xl font-heading font-bold text-kiwi-dark mb-4">2. Eligibility</h2>
                    <p>
                      You must be at least 18 years old and legally capable of entering into binding contracts to use our services. By registering for an account, you confirm that all information you provide is accurate, current, and complete.
                    </p>
                  </section>

                  <section id="payments" className="mb-8 scroll-mt-28">
                    <h2 className="text-2xl font-heading font-bold text-kiwi-dark mb-4">3. Payments</h2>
                    <p className="mb-4">
                      We use <strong className="text-kiwi-dark">Razorpay</strong> as our trusted third-party payment gateway. By making a payment on NineKiwi, you agree to Razorpay's terms and privacy policies in addition to ours.
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-2 mb-4">
                      <li>Payments can be made in multiple currencies including INR, USD, EUR, and GBP.</li>
                      <li>We do not store your card or net banking details. All transactions are securely processed by Razorpay.</li>
                      <li>Subscriptions and refunds (if applicable) follow our refund policy and Razorpay's processes.</li>
                      <li>
                        For more information, visit {" "}
                        <a href="https://razorpay.com" target="_blank" className="text-kiwi-green hover:text-kiwi-dark font-medium" rel="noreferrer">
                          razorpay.com
                        </a>
                        .
                      </li>
                    </ul>
                    <div className="bg-kiwi-light p-4 rounded-lg mt-4 text-sm text-kiwi-dark font-medium">
                      Currency Support: We currently support payments in INR, USD, EUR, and GBP. Additional currencies may be added in the future.
                    </div>
                  </section>

                  <section id="services" className="mb-8 scroll-mt-28">
                    <h2 className="text-2xl font-heading font-bold text-kiwi-dark mb-4">4. Use of Services</h2>
                    <p>
                      You agree not to misuse the NineKiwi platform, attempt unauthorized access to our systems, or engage in any activity that may disrupt or impair the functionality of our services. Accounts found violating these terms may be suspended or terminated at our discretion.
                    </p>
                  </section>

                  <section id="intellectual-property" className="mb-8 scroll-mt-28">
                    <h2 className="text-2xl font-heading font-bold text-kiwi-dark mb-4">5. Intellectual Property</h2>
                    <p>
                      All content, trademarks, logos, designs, and proprietary technology on the NineKiwi platform are the property of NineKiwi or our licensors. Unauthorized use, reproduction, or distribution of our materials is strictly prohibited.
                    </p>
                  </section>

                  <section id="liability" className="mb-8 scroll-mt-28">
                    <h2 className="text-2xl font-heading font-bold text-kiwi-dark mb-4">6. Limitation of Liability</h2>
                    <p>
                      NineKiwi is provided on an "as-is" and "as-available" basis. To the fullest extent permitted by law, we are not liable for any direct, indirect, incidental, special, or consequential damages.
                    </p>
                  </section>

                  <section id="privacy" className="mb-8 scroll-mt-28">
                    <h2 className="text-2xl font-heading font-bold text-kiwi-dark mb-4">7. Privacy</h2>
                    <p>
                      Your personal data is handled in accordance with our {" "}
                      <Link href="/privacy" className="text-kiwi-green hover:text-kiwi-dark font-medium">
                        Privacy Policy
                      </Link>
                      .
                    </p>
                  </section>

                  <section id="termination" className="mb-8 scroll-mt-28">
                    <h2 className="text-2xl font-heading font-bold text-kiwi-dark mb-4">8. Termination</h2>
                    <p>
                      We reserve the right to suspend or terminate accounts that violate these terms, engage in fraudulent activities, or misuse our services. Upon termination, your right to use our services will immediately cease.
                    </p>
                  </section>

                  <section id="governing-law" className="mb-8 scroll-mt-28">
                    <h2 className="text-2xl font-heading font-bold text-kiwi-dark mb-4">9. Governing Law</h2>
                    <p>
                      These Terms and Conditions shall be governed by and construed in accordance with the laws of India.
                    </p>
                  </section>

                  <section id="changes" className="mb-8 scroll-mt-28">
                    <h2 className="text-2xl font-heading font-bold text-kiwi-dark mb-4">10. Changes to Terms</h2>
                    <p>
                      We may modify these Terms and Conditions at any time. Continued use of our services after such changes constitutes acceptance of the updated terms.
                    </p>
                  </section>

                  <section id="contact" className="scroll-mt-28">
                    <h2 className="text-2xl font-heading font-bold text-kiwi-dark mb-4">11. Contact Us</h2>
                    <div className="bg-kiwi-light p-4 rounded-lg">
                      <p className="flex items-center mb-2">
                        <span className="w-5 h-5 text-kiwi-green mr-3">@</span>
                        <span className="font-medium">hello@ninekiwi.com</span>
                      </p>
                      <p className="flex items-center">
                        <span className="w-5 h-5 text-kiwi-green mr-3">📍</span>
                        <span className="font-medium">NineKiwi.com, India</span>
                      </p>
                    </div>
                  </section>

                  <div className="mt-12 pt-8 border-t border-gray-200 text-center">
                    <p className="text-kiwi-gray mb-6">
                      By using our services, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
                    </p>
                    <Link
                      href="/"
                      className="inline-flex items-center justify-center bg-kiwi-green hover:bg-kiwi-dark text-white font-bold py-3 px-8 rounded-full transition duration-300 transform hover:scale-105"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      Return to NineKiwi
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

