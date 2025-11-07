"use client";
import Link from "next/link";
import { useEffect } from "react";

export default function PrivacyPage() {
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
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold text-kiwi-dark mb-4">Privacy Policy</h1>
              <p className="text-base sm:text-lg md:text-xl text-kiwi-gray max-w-3xl mx-auto">
                Your privacy and data security are our top priorities. Learn how we protect your information.
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

            <div className="bg-gradient-to-r from-kiwi-green/10 to-kiwi-dark/10 border border-kiwi-green/20 rounded-xl p-6 mb-8 animated-element">
              <div className="flex items-center mb-4">
                <span className="w-6 h-6 text-kiwi-green mr-3">✔</span>
                <h2 className="text-xl font-heading font-bold text-kiwi-dark">Security First Approach</h2>
              </div>
              <p className="text-kiwi-gray">We implement enterprise-grade security measures to protect your data from unauthorized access, fraud, and cyber threats.</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
              <div className="lg:w-1/4 animated-element">
                <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 sticky top-24">
                  <h3 className="font-heading font-bold text-kiwi-dark mb-4 text-lg">Contents</h3>
                  <nav className="space-y-1 text-sm font-medium">
                    <a href="#introduction">1. Introduction</a>
                    <a href="#information-collection">2. Information Collection</a>
                    <a href="#information-use">3. How We Use Information</a>
                    <a href="#data-protection">4. Data Protection</a>
                    <a href="#fraud-prevention">5. Fraud Prevention</a>
                    <a href="#data-sharing">6. Data Sharing</a>
                    <a href="#cookies">7. Cookies & Tracking</a>
                    <a href="#user-rights">8. Your Rights</a>
                    <a href="#data-retention">9. Data Retention</a>
                    <a href="#international-transfers">10. International Transfers</a>
                    <a href="#children-privacy">11. Children's Privacy</a>
                    <a href="#changes">12. Policy Changes</a>
                    <a href="#contact">13. Contact Us</a>
                  </nav>
                </div>
              </div>

              <div className="lg:w-3/4">
                <div className="bg-white rounded-xl p-6 md:p-8 shadow-lg border border-gray-200 animated-element">
                  <section id="introduction" className="mb-8 scroll-mt-28">
                    <h2 className="text-2xl font-heading font-bold text-kiwi-dark mb-4">1. Introduction</h2>
                    <p className="mb-4">
                      At <strong className="text-kiwi-dark">NineKiwi</strong>, we are committed to protecting your privacy and securing your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform and services.
                    </p>
                    <p>By accessing or using NineKiwi, you agree to the collection and use of information in accordance with this policy.</p>
                  </section>

                  <section id="information-collection" className="mb-8 scroll-mt-28">
                    <h2 className="text-2xl font-heading font-bold text-kiwi-dark mb-4">2. Information We Collect</h2>
                    <h3 className="text-lg font-semibold text-kiwi-dark mb-3">Personal Information</h3>
                    <ul className="list-disc list-inside space-y-2 mb-6">
                      <li>Account information: name, email, phone, company details</li>
                      <li>Payment information: processed securely by Razorpay</li>
                      <li>Professional information: job title, role, project details</li>
                      <li>Communication data: support messages and feedback</li>
                    </ul>
                    <h3 className="text-lg font-semibold text-kiwi-dark mb-3">Technical Information</h3>
                    <ul className="list-disc list-inside space-y-2 mb-6">
                      <li>Device info: IP address, browser, OS</li>
                      <li>Usage data: pages visited, features used</li>
                      <li>Location info: approximate, for security</li>
                    </ul>
                  </section>

                  <section id="information-use" className="mb-8 scroll-mt-28">
                    <h2 className="text-2xl font-heading font-bold text-kiwi-dark mb-4">3. How We Use Your Information</h2>
                    <ul className="list-disc list-inside space-y-3">
                      <li>Provide, maintain, and improve services</li>
                      <li>Process transactions and notify you</li>
                      <li>Detect and prevent fraud and abuse</li>
                      <li>Personalize experience and support</li>
                      <li>Comply with legal obligations</li>
                    </ul>
                  </section>

                  <section id="data-protection" className="mb-8 scroll-mt-28">
                    <h2 className="text-2xl font-heading font-bold text-kiwi-dark mb-4">4. Data Protection & Security</h2>
                    <ul className="list-disc list-inside space-y-2">
                      <li>Encryption in transit and at rest</li>
                      <li>Role-based access controls</li>
                      <li>Secure infrastructure and monitoring</li>
                    </ul>
                  </section>

                  <section id="fraud-prevention" className="mb-8 scroll-mt-28">
                    <h2 className="text-2xl font-heading font-bold text-kiwi-dark mb-4">5. Fraud Prevention & Detection</h2>
                    <p>We leverage real-time monitoring, behavioral analytics, device fingerprinting, and Razorpay's fraud prevention features.</p>
                  </section>

                  <section id="data-sharing" className="mb-8 scroll-mt-28">
                    <h2 className="text-2xl font-heading font-bold text-kiwi-dark mb-4">6. Data Sharing & Third Parties</h2>
                    <p>We do not sell your data. We share data only with trusted providers like Razorpay for payments and infrastructure partners, or when required by law.</p>
                  </section>

                  <section id="cookies" className="mb-8 scroll-mt-28">
                    <h2 className="text-2xl font-heading font-bold text-kiwi-dark mb-4">7. Cookies & Tracking</h2>
                    <p className="mb-2">We use essential, functional, and analytics cookies. You can control cookies via your browser.</p>
                  </section>

                  <section id="user-rights" className="mb-8 scroll-mt-28">
                    <h2 className="text-2xl font-heading font-bold text-kiwi-dark mb-4">8. Your Rights</h2>
                    <p>Depending on your location, you may request access, correction, deletion, or restriction of your personal data.</p>
                  </section>

                  <section id="data-retention" className="mb-8 scroll-mt-28">
                    <h2 className="text-2xl font-heading font-bold text-kiwi-dark mb-4">9. Data Retention</h2>
                    <p>We retain data only as long as needed for the purposes described, or as required by law.</p>
                  </section>

                  <section id="international-transfers" className="mb-8 scroll-mt-28">
                    <h2 className="text-2xl font-heading font-bold text-kiwi-dark mb-4">10. International Data Transfers</h2>
                    <p>We implement appropriate safeguards for international data transfers.</p>
                  </section>

                  <section id="children-privacy" className="mb-8 scroll-mt-28">
                    <h2 className="text-2xl font-heading font-bold text-kiwi-dark mb-4">11. Children's Privacy</h2>
                    <p>Our services are not directed to individuals under 18.</p>
                  </section>

                  <section id="changes" className="mb-8 scroll-mt-28">
                    <h2 className="text-2xl font-heading font-bold text-kiwi-dark mb-4">12. Changes to This Policy</h2>
                    <p>We may update this policy; continued use indicates acceptance.</p>
                  </section>

                  <section id="contact" className="scroll-mt-28">
                    <h2 className="text-2xl font-heading font-bold text-kiwi-dark mb-4">13. Contact Us</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-kiwi-light p-4 rounded-lg">
                        <h4 className="font-semibold text-kiwi-dark mb-2">General Privacy Inquiries</h4>
                        <p className="flex items-center mb-2">
                          <span className="w-5 h-5 text-kiwi-green mr-3">@</span>
                          <span className="font-medium">hello@ninekiwi.com</span>
                        </p>
                        <p className="text-sm">Questions about data protection and privacy rights</p>
                      </div>
                      <div className="bg-kiwi-light p-4 rounded-lg">
                        <h4 className="font-semibold text-kiwi-dark mb-2">Security & Fraud Reports</h4>
                        <p className="flex items-center mb-2">
                          <span className="w-5 h-5 text-kiwi-green mr-3">@</span>
                          <span className="font-medium">hello@ninekiwi.com</span>
                        </p>
                        <p className="text-sm">Report security issues or suspected fraud</p>
                      </div>
                    </div>
                    <div className="bg-kiwi-light p-4 rounded-lg mt-4">
                      <p className="flex items-center mb-2">
                        <span className="w-5 h-5 text-kiwi-green mr-3">📍</span>
                        <span className="font-medium">NineKiwi.com</span>
                      </p>
                      <p className="text-sm ml-8">India</p>
                    </div>
                    <div className="mt-12 pt-8 border-t border-gray-200 text-center">
                      <p className="text-kiwi-gray mb-6">
                        By using our services, you acknowledge that you have read, understood, and agree to the practices described in this Privacy Policy.
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
                  </section>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

