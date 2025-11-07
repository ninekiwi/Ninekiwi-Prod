"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";
import { WifiOff, Globe, Mic, MapPin, DollarSign, Users } from "lucide-react";
export default function LandingPage() {
  const { data } = useSession();
  const isAuthed = !!data?.user;
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fade-in-up");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    document
      .querySelectorAll<HTMLElement>(".animated-element")
      .forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="relative bg-kiwi-light font-body text-kiwi-gray overflow-x-hidden">
      <div className="kiwi-shape -top-20 -left-20" />
      <div className="kiwi-shape bottom-10 right-10 rotate-45 w-40 h-40" />

      <main>
        <section className="relative py-20 md:py-28">
          <div className="hero-pattern absolute inset-0 z-0 opacity-50" />
          <div className="container mx-auto px-6 relative z-10 text-center">
            <div className="max-w-4xl mx-auto animated-element">
              <h1 className="text-4xl md:text-6xl font-heading font-extrabold text-kiwi-dark mb-6 leading-tight">
                Project Management for the{" "}
                <span className="text-kiwi-green">Real World</span>
              </h1>
              <p className="text-lg md:text-xl text-kiwi-gray max-w-2xl mx-auto mb-10">
                Modern, multilingual, mobile-first project management built for
                the world's diverse construction ecosystem.
              </p>
              <a
                href="/early-access"
                className="inline-block bg-kiwi-green hover:bg-kiwi-dark text-white font-bold py-4 px-10 rounded-full text-lg transition duration-300 transform hover:scale-105 shadow-lg"
              >
                Join Waitlist
              </a>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-6">
            <div className="report-card-gradient rounded-3xl shadow-2xl overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-8 md:gap-12 p-8 md:p-16">
                <div className="text-white z-10 animated-element">
                  <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
                    Report Generator Tool
                  </h2>
                  <p className="text-lg text-kiwi-light mb-6">
                    Instantly generate professional PDF reports for your
                    construction projects.
                  </p>
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-center gap-3">
                      <span className="h-6 w-6 text-kiwi-light">✔</span> Create
                      professional inspection reports
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="h-6 w-6 text-kiwi-light">✔</span> Add
                      photos and notes directly from site
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="h-6 w-6 text-kiwi-light">✔</span> Free
                      with unlimited usage
                    </li>
                  </ul>
                  <Link
                    href={isAuthed ? "/pay" : "/login?callbackUrl=/pay"}
                    className="bg-white text-kiwi-dark hover:bg-kiwi-light font-bold py-3 px-8 rounded-full text-lg transition duration-300 transform hover:scale-105 w-fit inline-block"
                  >
                    Report Generator Tool
                  </Link>
                </div>

                <div className="relative h-full flex items-center justify-center animated-element">
                  <div className="w-full max-w-xs p-3 bg-kiwi-black rounded-3xl shadow-2xl">
                    <div className="bg-white rounded-2xl p-4 space-y-3 h-96 overflow-y-auto">
                      <p className="font-bold text-kiwi-dark">
                        NineKiwi Report Generator
                      </p>
                      <div className="h-12 bg-kiwi-light rounded-lg" />
                      <div className="h-16 bg-kiwi-light rounded-lg" />
                      <div className="bg-kiwi-light h-20 rounded-lg flex items-center justify-center text-sm text-kiwi-gray">
                        Photo Upload
                      </div>
                      <div className="space-y-1">
                        <div className="h-3 bg-kiwi-light rounded-full w-full" />
                        <div className="h-3 bg-kiwi-light rounded-full w-5/6" />
                      </div>
                      <div className="bg-kiwi-green text-white text-center py-2 rounded-lg font-semibold">
                        Generate PDF
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-kiwi-light">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-16 animated-element">
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-kiwi-dark mb-4">
                Built for the Realities of Global Work Sites
              </h2>
              <p className="text-lg md:text-xl text-kiwi-gray">
                Combining cutting-edge technology with practical solutions for
                construction teams worldwide.
              </p>
            </div>

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
  {(() => {
    const features: Array<[string, string, ComponentType<LucideProps>]> = [
      ["Works Offline", "Network issues on site won't stop productivity. Sync when you're back online.", WifiOff],
      ["Multilingual Support", "Break language barriers with real-time translation for diverse workforces.", Globe],
      ["Voice-to-Text Reports", "Dictate reports on site with powerful voice recognition.", Mic],
      ["Photo Evidence with GPS", "Geotagged photos provide trust and transparency for clients and teams.", MapPin],
      ["Cost-efficient SaaS", "Easy for small contractors to adopt with flexible pricing plans.", DollarSign],
      ["Real-time Collaboration", "Project managers get instant updates from site teams as work progresses.", Users],
    ];
    return features.map(([title, desc, Icon], idx) => (
      <div
        key={String(title)}
        className="group feature-card bg-white rounded-2xl p-8 shadow-lg border border-gray-200 animated-element"
        style={{ animationDelay: `${idx * 0.1}s` as any }}
      >
        <div className="text-kiwi-green mb-4">
          <Icon className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-kiwi-dark mb-2">
          {title}
        </h3>
        <p className="text-kiwi-gray">{desc}</p>
      </div>
    ));
  })()}
</div>
          </div>
        </section>

        <section className="py-20 md:py-24 bg-kiwi-dark text-white text-center relative overflow-hidden">
          <div
            className="hero-pattern absolute inset-0 z-0 opacity-20"
            style={{ filter: "invert(1)" }}
          />
          <div className="container mx-auto px-6 relative z-10 animated-element">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-6">
              Be the First to Build with NineKiwi
            </h2>
            <p className="text-lg md:text-xl text-kiwi-light mb-10 max-w-2xl mx-auto">
              Join our early access list and help shape the future of
              construction technology for the global workforce.
            </p>
            <Link
              href="/get-early-access"
              className="bg-kiwi-green hover:bg-white hover:text-kiwi-dark font-bold py-4 px-10 rounded-full text-lg transition duration-300 transform hover:scale-105 shadow-lg"
            >
              Request Early Access
            </Link>
          </div>
        </section>
      </main>

      {/* Enhanced Footer - Simple UI Improvement */}
      <footer className="bg-kiwi-black text-kiwi-light py-12 sm:py-16 relative overflow-hidden">
        {/* Subtle decorative elements */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-24 h-24 border border-kiwi-green rounded-full" />
          <div className="absolute bottom-10 right-10 w-32 h-32 border border-kiwi-green rounded-full" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="flex flex-col items-center gap-6 sm:gap-8">
            {/* Logo Section */}
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center space-x-3">
                <Image
                  src="/logo.png"
                  alt="NineKiwi Logo"
                  width={44}
                  height={44}
                  className="drop-shadow-lg"
                />
                <span className="text-2xl sm:text-3xl font-heading font-bold text-white">
                  nine<span className="text-kiwi-green">kiwi</span>
                </span>
              </div>
              <p className="text-sm sm:text-base text-kiwi-gray text-center max-w-md px-4">
                Building the future of construction project management
              </p>
            </div>

            {/* Contact Link */}
            <div className="flex justify-center">
              <a
                href="/contact"
                className="inline-flex items-center gap-2 text-sm sm:text-base hover:text-kiwi-green transition-colors duration-300 px-6 py-2.5 rounded-full border border-kiwi-dark hover:border-kiwi-green"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Contact Us
              </a>
            </div>

            {/* Divider */}
            <div className="w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-kiwi-dark to-transparent" />

            {/* Bottom Text */}
            <div className="text-center space-y-2 px-4">
              <p className="text-sm text-kiwi-tan">
                © 2025 NineKiwi. All rights reserved.
              </p>
              {/* <p className="text-xs sm:text-sm text-kiwi-gray max-w-xl mx-auto">
                Currently in development - our team is busy learning Flutter and
                improving our social skills!
              </p> */}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
