"use client";
import Link from "next/link";
import type React from "react";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const { data, status } = useSession();
  const user = data?.user as any | undefined;
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profile, setProfile] =
    useState<{ name?: string; email?: string; avatarUrl?: string } | null>(
      null
    );
  const pathname = usePathname();
  const hideOnReport = pathname?.startsWith("/report");

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    await signOut({ callbackUrl: "/" });
  }

  // Close menus on route change
  useEffect(() => {
    setOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  async function fetchProfile() {
    try {
      const res = await fetch("/api/account", {
        cache: "no-store",
        credentials: "include",
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.user)
        setProfile({
          name: data.user.name,
          email: data.user.email,
          avatarUrl: data.user.avatarUrl,
        });
    } catch {}
  }

  useEffect(() => {
    if (user && !profile) fetchProfile();
    const onUpdated = () => fetchProfile();
    window.addEventListener("nk-profile-updated" as any, onUpdated as any);
    return () =>
      window.removeEventListener("nk-profile-updated" as any, onUpdated as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  // Clear profile on logout
  useEffect(() => {
    if (status === "unauthenticated") {
      setProfile(null);
      setOpen(false);
      setMenuOpen(false);
    }
  }, [status]);

  const NavLink = ({
    href,
    children,
  }: {
    href: string;
    children: React.ReactNode;
  }) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        className={`relative text-[15px] font-medium px-3 py-2 rounded-lg transition-all duration-200
        ${
          active
            ? "bg-[#78c850]/10 text-[#78c850] shadow-sm"
            : "text-gray-700 hover:bg-[#78c850]/5 hover:text-[#78c850]"
        }`}
      >
        {children}
        {active && (
          <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-[#78c850] rounded-full" />
        )}
      </Link>
    );
  };

  if (hideOnReport) return null;

  return (
    <>
      {/* Fixed header */}
      <header className="fixed top-0 left-0 right-0 z-50 w-full overflow-x-clip border-b border-[#78c850]/20 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 pt-[env(safe-area-inset-top)]">
        <nav className="w-full mx-auto max-w-screen-xl px-3 sm:px-5 lg:px-8 h-16 flex items-center justify-between gap-3">
          {/* LEFT: logo */}
          <Link
            href="/"
            className="flex items-center gap-2 min-w-0 shrink-0"
            aria-label="Ninekiwi Home"
          >
            <div className="relative">
              <Image
                src="/logo.png"
                width={36}
                height={36}
                alt="Ninekiwi logo"
                priority
                className="w-9 h-9 sm:w-10 sm:h-10"
              />
            </div>
            <span className="hidden sm:block text-lg md:text-2xl font-extrabold tracking-tight truncate max-w-[42vw]">
              <span className="text-gray-800">nine</span>
              <span className="bg-gradient-to-r from-[#78c850] to-[#78c850] bg-clip-text text-transparent">
                kiwi
              </span>
            </span>
          </Link>

          {/* RIGHT: desktop nav + profile + mobile hamburger */}
          <div className="flex items-center gap-3">
            {/* Center desktop nav */}
            <div className="hidden md:flex items-center gap-1 sm:gap-2">
              <NavLink href="/">Home</NavLink>
              <NavLink href="/contact">Contact</NavLink>
              {user?.role === "admin" && <NavLink href="/admin">Admin</NavLink>}
            </div>

            {/* Desktop profile / auth */}
            <div className="hidden md:flex items-center gap-3">
              {!user ? (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center rounded-lg border-2 border-[#78c850] text-[#78c850] hover:bg-[#78c850]/5 font-medium transition-all px-3 py-2 text-sm"
                  >
                    Login
                  </Link>
                  <Link
                    href="/signup"
                    className="inline-flex items-center justify-center rounded-lg bg-[#78c850] hover:bg-[#66b343] text-white font-medium transition-all px-3 py-2 text-sm shadow-sm"
                  >
                    Sign up
                  </Link>
                </div>
              ) : (
                <div className="relative">
                  <button
                    className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full border border-[#78c850]/30 hover:border-[#78c850] hover:bg-[#78c850]/5 transition-all"
                    onClick={async () => {
                      if (!profile && user) {
                        try {
                          const res = await fetch("/api/account", {
                            cache: "no-store",
                            credentials: "include",
                          });
                          if (res.ok) {
                            const data = await res.json();
                            setProfile({
                              name: data?.user?.name,
                              email: data?.user?.email,
                              avatarUrl: data?.user?.avatarUrl,
                            });
                          }
                        } catch {}
                      }
                      setMenuOpen((o) => !o);
                    }}
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                  >
                    <span className="inline-flex h-9 w-9 rounded-full overflow-hidden bg-[#78c850] text-white ring-1 ring-[#78c850]/20">
                      {profile?.avatarUrl || (user as any)?.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={
                            (profile?.avatarUrl ||
                              (user as any)?.image) as string
                          }
                          alt="avatar"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="grid place-items-center w-full h-full font-semibold">
                          {(user?.name || "U").slice(0, 1).toUpperCase()}
                        </span>
                      )}
                    </span>
                    <span className="text-sm font-medium text-gray-700">
                      {`Hi, ${
                        (profile?.name || user.name)?.split(" ")[0] ?? "User"
                      }`}
                    </span>
                    <svg
                      className={`w-4 h-4 text-[#78c850] transition-transform ${
                        menuOpen ? "rotate-180" : ""
                      }`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" />
                    </svg>
                  </button>

                  {/* Desktop dropdown */}
                  {menuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setMenuOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-72 bg-white border border-[#78c850]/20 rounded-2xl shadow-2xl z-50 overflow-hidden">
                        {user && (
                          <div className="px-4 py-4 bg-gradient-to-br from-[#78c850]/10 to-[#78c850]/5 border-b border-[#78c850]/20">
                            <div className="flex items-center gap-3">
                              <span className="inline-flex h-12 w-12 rounded-full overflow-hidden bg-[#78c850] text-white">
                                {profile?.avatarUrl ||
                                (user as any)?.image ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={
                                      (profile?.avatarUrl ||
                                        (user as any)?.image) as string
                                    }
                                    alt="avatar"
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <span className="grid place-items-center w-full h-full font-semibold">
                                    {(user?.name || "U")
                                      .slice(0, 1)
                                      .toUpperCase()}
                                  </span>
                                )}
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-semibold text-gray-800 truncate">
                                  {profile?.name || user.name}
                                </div>
                                <div className="text-xs text-gray-600 truncate">
                                  {profile?.email || user.email}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="py-1">
                          <Link
                            href="/account"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#78c850]/5"
                          >
                            Account Settings
                          </Link>
                          <Link
                            href="/early-access"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#78c850]/5"
                          >
                            Get Early Access
                          </Link>
                          {user?.role === "admin" && (
                            <Link
                              href="/admin"
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#78c850]/5"
                            >
                              Admin Dashboard
                            </Link>
                          )}
                        </div>

                        <div className="border-t border-[#78c850]/20 p-3">
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-medium text-sm"
                          >
                            Logout
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* MOBILE: hamburger (always at far right) */}
            <button
              className="md:hidden text-[#78c850] p-2 rounded-xl hover:bg-[#78c850]/10 transition-colors shrink-0 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#78c850]/40"
              onClick={() => setOpen((o) => !o)}
              aria-label="Toggle menu"
              aria-expanded={open}
              aria-controls="mobile-menu"
            >
              {open ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </nav>

        {/* Mobile sheet menu (full width under navbar) */}
        <div
          id="mobile-menu"
          aria-hidden={!open}
          className={`md:hidden fixed left-0 right-0 z-40 border-t border-[#78c850]/20 bg-white/95 backdrop-blur transition-transform duration-300 ease-out ${
            open ? "translate-y-0" : "-translate-y-[120%]"
          } top-[calc(64px+env(safe-area-inset-top,0px))]`}
        >
          <div className="mx-auto max-w-screen-xl px-3 sm:px-5 py-4 space-y-3">
            {user && (
              <div className="flex items-center gap-3 p-3 bg-[#78c850]/10 rounded-xl border border-[#78c850]/20">
                <span className="inline-flex h-10 w-10 rounded-full overflow-hidden bg-[#78c850] text-white">
                  {profile?.avatarUrl || (user as any)?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={(profile?.avatarUrl || (user as any)?.image) as string}
                      alt="avatar"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="grid place-items-center w-full h-full text-sm font-semibold">
                      {(user?.name || "U").slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-gray-800 truncate">
                    {profile?.name || user.name}
                  </div>
                  <div className="text-xs text-gray-600 truncate">
                    {profile?.email || user.email}
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Link
                href="/"
                className="block px-4 py-3 rounded-lg border border-[#78c850]/30 text-sm font-medium text-gray-700 hover:bg-[#78c850]/5"
              >
                Home
              </Link>
              <Link
                href="/contact"
                className="block px-4 py-3 rounded-lg border border-[#78c850]/30 text-sm font-medium text-gray-700 hover:bg-[#78c850]/5"
              >
                Contact
              </Link>
              {user && (
                <Link
                  href="/account"
                  className="block px-4 py-3 rounded-lg border border-[#78c850]/30 text-sm font-medium text-gray-700 hover:bg-[#78c850]/5"
                >
                  Account
                </Link>
              )}
              {user?.role === "admin" && (
                <Link
                  href="/admin"
                  className="block px-4 py-3 rounded-lg border border-[#78c850]/30 text-sm font-medium text-gray-700 hover:bg-[#78c850]/5"
                >
                  Admin
                </Link>
              )}
            </div>

            {!user ? (
              <div className="grid gap-2 pt-1">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-lg border-2 border-[#78c850] text-[#78c850] hover:bg-[#78c850]/5 font-medium transition-all px-4 py-2.5 text-sm"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-lg bg-[#78c850] hover:bg-[#66b343] text-white font-medium transition-all px-4 py-2.5 text-sm"
                >
                  Sign up
                </Link>
                <Link
                  href="/admin/login"
                  className="text-xs text-center text-gray-500 hover:text-[#78c850] underline py-1"
                >
                  Admin Login
                </Link>
              </div>
            ) : (
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-medium text-sm"
              >
                Logout
              </button>
            )}
            <div className="pb-[env(safe-area-inset-bottom)]" />
          </div>
        </div>
      </header>

      {/* Spacer so content isn’t hidden behind fixed header */}
      <div className="h-16" aria-hidden="true" />
    </>
  );
}
