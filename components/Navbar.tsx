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
  const [profile, setProfile] = useState<{ name?: string; email?: string; avatarUrl?: string } | null>(null);
  const pathname = usePathname();
  const hideOnReport = pathname?.startsWith("/report");

  async function handleLogout() {
    try { await fetch("/api/auth/logout", { method: "POST" }); } catch {}
    await signOut({ callbackUrl: "/" });
  }
  // Close menus on route change
  useEffect(() => {
    setOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  async function fetchProfile() {
    try {
      const res = await fetch("/api/account", { cache: "no-store", credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.user) setProfile({ name: data.user.name, email: data.user.email, avatarUrl: data.user.avatarUrl });
    } catch {}
  }

  useEffect(() => {
    if (user && !profile) {
      fetchProfile();
    }
    const onUpdated = () => fetchProfile();
    window.addEventListener("nk-profile-updated" as any, onUpdated as any);
    return () => window.removeEventListener("nk-profile-updated" as any, onUpdated as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  // When session becomes unauthenticated, clear any cached profile UI state
  useEffect(() => {
    if (status === 'unauthenticated') {
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
        className={`relative text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200 ${
          active 
            ? "bg-[#78c850]/10 text-[#78c850] shadow-sm" 
            : "text-gray-700 hover:bg-[#78c850]/5 hover:text-[#78c850]"
        }`}
      >
        {children}
        {active && (
          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#78c850] rounded-full" />
        )}
      </Link>
    );
  };

  return (
    hideOnReport ? null : (
    <>
    <header className="fixed top-0 left-0 right-0 z-50 w-full border-b border-[#78c850]/20 bg-white/90 backdrop-blur-md supports-[backdrop-filter]:bg-white/80 shadow-sm">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo - Fixed sizing for mobile */}
        <Link href="/" className="flex items-center gap-2 group shrink-0" aria-label="Ninekiwi Home">
          <div className="relative">
            <Image 
              src="/logo.png" 
              width={40} 
              height={40} 
              alt="Ninekiwi logo" 
              priority
              className="w-10 h-10 transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-[#78c850]/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          <span className="text-xl sm:text-2xl font-heading font-extrabold tracking-tight">
            <span className="text-gray-800">nine</span>
            <span className="bg-gradient-to-r from-[#78c850] to-[#78c850] bg-clip-text text-transparent">kiwi</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-2">
          <NavLink href="/">Home</NavLink>
          <NavLink href="/contact">Contact</NavLink>
          {user?.role === "admin" && <NavLink href="/admin">Admin</NavLink>}
        </div>

        {/* Desktop Profile / Auth */}
        <div className="hidden md:flex items-center gap-4">
          {!user ? (
            <div className="flex items-center gap-2">
              <Link href="/login" className="inline-flex items-center justify-center rounded-lg border-2 border-[#78c850] text-[#78c850] hover:bg-[#78c850]/5 font-medium transition-all px-3 py-2 text-sm">
                Login
              </Link>
              <Link href="/signup" className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-[#78c850] to-[#78c850] hover:from-[#78c850] hover:to-[#78c850] text-white font-medium transition-all px-3 py-2 text-sm shadow-md">
                Sign up
              </Link>
            </div>
          ) : (
            <div className="relative">
              <button
                className="flex items-center gap-3 px-4 py-2 rounded-full border-2 border-[#78c850]/30 hover:border-[#78c850] hover:bg-[#78c850]/5 transition-all duration-200 group"
                onClick={async () => {
                  if (!profile && user) {
                    try {
                      const res = await fetch("/api/account", { cache: "no-store", credentials: "include" });
                      if (res.ok) {
                        const data = await res.json();
                        setProfile({ name: data?.user?.name, email: data?.user?.email, avatarUrl: data?.user?.avatarUrl });
                      }
                    } catch {}
                  }
                  setMenuOpen((o) => !o);
                }}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                {/* Avatar */}
                <span className="inline-flex h-9 w-9 rounded-full overflow-hidden bg-gradient-to-br from-[#78c850] to-[#78c850] border-2 border-white shadow-md ring-2 ring-[#78c850]/20">
                  {profile?.avatarUrl || (user as any)?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={(profile?.avatarUrl || (user as any)?.image) as string} alt="avatar" className="h-full w-full object-cover" />
                  ) : (
                    <span className="h-full w-full grid place-items-center text-white text-sm font-semibold">
                      {(user?.name || "U").slice(0, 1).toUpperCase()}
                    </span>
                  )}
                </span>
                <span className="text-sm font-medium text-gray-700 group-hover:text-[#78c850] transition-colors">
                  {`Hi, ${(profile?.name || user.name)?.split(' ')[0]}`}
                </span>
                <svg 
                  className={`w-4 h-4 text-[#78c850] transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`} 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"/>
                </svg>
              </button>

              {/* Dropdown Menu */}
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 mt-3 w-72 bg-white border border-[#78c850]/20 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {user && (
                      <div className="px-4 py-4 bg-gradient-to-br from-[#78c850]/10 to-[#78c850]/5 border-b border-[#78c850]/20">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-12 w-12 rounded-full overflow-hidden bg-gradient-to-br from-[#78c850] to-[#78c850] border-2 border-white shadow-md">
                            {profile?.avatarUrl || (user as any)?.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={(profile?.avatarUrl || (user as any)?.image) as string} alt="avatar" className="h-full w-full object-cover" />
                            ) : (
                              <span className="h-full w-full grid place-items-center text-white text-base font-semibold">
                                {(user?.name || "U").slice(0, 1).toUpperCase()}
                              </span>
                            )}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-gray-800 truncate">{profile?.name || user.name}</div>
                            <div className="text-xs text-gray-600 truncate">{profile?.email || user.email}</div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="py-2">
                      <Link href="/account" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#78c850]/5 transition-colors">
                        <svg className="w-4 h-4 text-[#78c850]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Account Settings
                      </Link>
                      
                      <Link href="/early-access" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#78c850]/5 transition-colors">
                        <svg className="w-4 h-4 text-[#78c850]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Get Early Access
                      </Link>
                      
                      {user?.role === "admin" && (
                        <Link href="/admin" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#78c850]/5 transition-colors">
                          <svg className="w-4 h-4 text-[#78c850]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Admin Dashboard
                        </Link>
                      )}
                    </div>
                    
                    <div className="border-t border-[#78c850]/20 p-3">
                      <button 
                        onClick={handleLogout} 
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-medium transition-all text-sm"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Mobile Menu Button - Properly spaced */}
        <button
          className="md:hidden text-[#78c850] p-2 rounded-xl hover:bg-[#78c850]/5 transition-colors flex items-center justify-center shrink-0"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          {open ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile Menu */}
      <div
        id="mobile-menu"
        aria-hidden={!open}
        className={`md:hidden border-t border-[#78c850]/20 bg-white/95 backdrop-blur overflow-hidden transition-all duration-300 ease-out ${
          open
            ? "max-h-[600px] opacity-100"
            : "max-h-0 opacity-0"
        }`}
      >
        <div className={`container mx-auto px-4 py-4 space-y-3 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}>
          {/* User Info (Mobile) */}
          {user && (
            <div className="flex items-center gap-3 p-3 bg-gradient-to-br from-[#78c850]/10 to-[#78c850]/5 rounded-xl border border-[#78c850]/20">
              <span className="inline-flex h-10 w-10 rounded-full overflow-hidden bg-gradient-to-br from-[#78c850] to-[#78c850] border-2 border-white shadow-md shrink-0">
                {profile?.avatarUrl || (user as any)?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={(profile?.avatarUrl || (user as any)?.image) as string} alt="avatar" className="h-full w-full object-cover" />
                ) : (
                  <span className="h-full w-full grid place-items-center text-white text-sm font-semibold">
                    {(user?.name || "U").slice(0, 1).toUpperCase()}
                  </span>
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-gray-800 truncate">{profile?.name || user.name}</div>
                <div className="text-xs text-gray-600 truncate">{profile?.email || user.email}</div>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <div className="space-y-2">
            <Link href="/" className="block px-4 py-2.5 rounded-lg border border-[#78c850]/30 text-sm font-medium text-gray-700 hover:bg-[#78c850]/5 hover:border-[#78c850]/50 transition-colors">
              Home
            </Link>
            
            <Link href="/contact" className="block px-4 py-2.5 rounded-lg border border-[#78c850]/30 text-sm font-medium text-gray-700 hover:bg-[#78c850]/5 hover:border-[#78c850]/50 transition-colors">
              Contact
            </Link>
            
            {user && (
              <Link href="/account" className="block px-4 py-2.5 rounded-lg border border-[#78c850]/30 text-sm font-medium text-gray-700 hover:bg-[#78c850]/5 hover:border-[#78c850]/50 transition-colors">
                Account
              </Link>
            )}
            
            {user?.role === "admin" && (
              <Link href="/admin" className="block px-4 py-2.5 rounded-lg border border-[#78c850]/30 text-sm font-medium text-gray-700 hover:bg-[#78c850]/5 hover:border-[#78c850]/50 transition-colors">
                Admin
              </Link>
            )}
          </div>

          {/* Auth Buttons */}
          {!user ? (
            <div className="space-y-2 pt-2">
              <div className="grid grid-cols-1 gap-2">
                <Link href="/login" className="inline-flex items-center justify-center rounded-lg border-2 border-[#78c850] text-[#78c850] hover:bg-[#78c850]/5 font-medium transition-all px-4 py-2.5 text-sm">
                  Login
                </Link>
                <Link href="/signup" className="inline-flex items-center justify-center rounded-lg bg-[#78c850] hover:bg-[#78c850] text-white font-medium transition-all px-4 py-2.5 text-sm shadow-md">
                  Sign up
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <Link href="/admin/login" className="text-xs text-center text-gray-500 hover:text-[#78c850] underline py-1">
                  Admin Login
                </Link>
              </div>
            </div>
          ) : (
            <button 
              onClick={handleLogout} 
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-medium transition-all text-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          )}
        </div>
      </div>
    </header>
    <div className="h-16" aria-hidden="true" />
    </>
    )
  );
}