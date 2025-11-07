// lib/auth.ts
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { dbConnect } from "@/lib/mongodb";
import { User } from "@/models/User";
import { Payment } from "@/models/Payment";
import { sendEmail } from "@/lib/email";
import { headers } from "next/headers";
import path from "path";
import crypto from "crypto";
import { getEnv } from "@/lib/env";

/* ----------------- Minimal UA parsing ----------------- */
function parseUserAgent(
  ua: string | null | undefined
): { browser: string; device: string } {
  const s = (ua || "").toLowerCase();
  let browser = "Unknown";
  if (s.includes("edg")) browser = "Microsoft Edge";
  else if (s.includes("opr") || s.includes("opera")) browser = "Opera";
  else if (s.includes("chrome")) browser = "Google Chrome";
  else if (s.includes("safari")) browser = "Safari";
  else if (s.includes("firefox")) browser = "Firefox";

  let device = "Desktop";
  if (s.includes("iphone")) device = "iPhone";
  else if (s.includes("ipad")) device = "iPad";
  else if (s.includes("android")) device = "Android";
  else if (s.includes("mac os x") || s.includes("macintosh")) device = "macOS";
  else if (s.includes("windows")) device = "Windows";
  else if (s.includes("linux")) device = "Linux";
  return { browser, device };
}

/* ----------------- Public IP helpers ----------------- */
function isPublicIP(ip: string): boolean {
  const s = ip.trim().toLowerCase();
  if (!s) return false;
  if (s === "::1") return false;
  if (s.startsWith("fe80:")) return false; // link-local v6
  if (s.startsWith("fc") || s.startsWith("fd")) return false; // unique local v6
  if (s.startsWith("::ffff:")) {
    const v4 = s.split("::ffff:")[1] || "";
    return isPublicIP(v4);
  }
  if (s.includes(":")) return true; // other IPv6 (assume public)
  if (s.startsWith("127.")) return false;
  if (s.startsWith("10.")) return false;
  if (s.startsWith("192.168.")) return false;
  if (s.startsWith("169.254.")) return false;
  if (s.startsWith("172.")) {
    const parts = s.split(".");
    const o2 = parseInt(parts[1] || "0", 10);
    if (o2 >= 16 && o2 <= 31) return false;
  }
  return true;
}

function extractPublicIP(raw: string | null | undefined, fallback?: string | null): string | null {
  const list = (raw || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  for (const cand of list) {
    if (isPublicIP(cand)) return cand;
  }
  if (fallback && isPublicIP(fallback)) return fallback;
  return null;
}

/* ----------------- Best-effort IP geolocation ----------------- */
async function geoFromIP(
  ip: string | null | undefined
): Promise<{ city?: string; country?: string }> {
  const out: { city?: string; country?: string } = {};
  const ipClean = (ip || "").split(",")[0].trim();
  if (!ipClean) return out;

  try {
    const r = await fetch(`https://ipapi.co/${encodeURIComponent(ipClean)}/json/`, {
      cache: "no-store",
    });
    if (r.ok) {
      const j: any = await r.json();
      if (j?.city) out.city = j.city;
      if (j?.country_name) out.country = j.country_name;
      if (out.city || out.country) return out;
    }
  } catch (e) {
    console.error("ipapi geo lookup failed", e);
  }
  try {
    const r2 = await fetch(`https://ipwho.is/${encodeURIComponent(ipClean)}`, {
      cache: "no-store",
    });
    if (r2.ok) {
      const j2: any = await r2.json();
      if (j2?.city) out.city = j2.city;
      if (j2?.country) out.country = j2.country;
    }
  } catch (e) {
    console.error("ipwho.is geo lookup failed", e);
  }
  return out;
}

/* ----------------- Email HTML builder with logo fallback ----------------- */
function buildLoginEmailHTML(opts: {
  userName?: string | null;
  loginTime: string;
  device: string;
  browser: string;
  locationText: string;
  baseUrl: string;
  supportEmail?: string;
  resetToken?: string | null;
}) {
  const subject = "🥝 Recent Login Notification";

  const supportEmail = opts.supportEmail || "contact@ninekiwi.com";
  const resetBase = `${opts.baseUrl.replace(/\/$/, "")}/reset-password`; const resetUrl = opts.resetToken ? `${resetBase}?token=${encodeURIComponent(opts.resetToken)}` : resetBase;
  const adminSignature = getEnv("ADMIN_SIGNATURE") || "The NineKiwi Team";

  // Prefer explicit PUBLIC_LOGO_URL; else derive from PUBLIC_BASE_URL/VERCEL_URL; else use CID.
  const publicBase =
    getEnv("PUBLIC_BASE_URL") ||
    (getEnv("VERCEL_URL") ? `https://${getEnv("VERCEL_URL")}` : "");
  const derivedLogo = publicBase ? `${publicBase.replace(/\/$/, "")}/logo.png` : "";
  const publicLogoUrl =
    getEnv("PUBLIC_LOGO_URL") && getEnv("PUBLIC_LOGO_URL")!.startsWith("http")
      ? getEnv("PUBLIC_LOGO_URL")!
      : derivedLogo.startsWith("http")
      ? derivedLogo
      : "";

  const cidName = "ninekiwi-logo";
  const logoSrc = `cid:${cidName}`;

  const text = `Hi ${opts.userName || "User"},

We noticed a new login to your NineKiwi account:

Date & Time: ${opts.loginTime}
Device: ${opts.device}
Location: ${opts.locationText}
Browser: ${opts.browser}

If this was you, no further action is needed.

If you did not recognize this login, please secure your account immediately by changing your password.

To reset your password, go to: ${resetUrl}
${opts.resetToken ? `Your reset token: ${opts.resetToken}\nIf it doesn't prefill, paste this token on the reset page.` : ""}

Thank you,
${adminSignature}

You are receiving this email because a login to your account was detected. If you have any questions or need support, please contact us at ${supportEmail}.`;

  const html = `
  <div style="font-family:Inter,Arial,Helvetica,sans-serif;line-height:1.6;color:#111;background:#f7f7f9;padding:24px;">
    <table role="presentation" cellspacing="0" cellpadding="0" width="100%" style="max-width:620px;margin:0 auto;background:#fff;border:1px solid #eee;border-radius:12px;overflow:hidden;">
      <tr>
        <td style="padding:16px 20px;border-bottom:1px solid #e5e7eb;" align="left">
          <img src="${logoSrc}" alt="NineKiwi" width="36" height="36"
               style="display:block;border-radius:8px;outline:none;border:0;text-decoration:none" />
          <div style="font-size:16px;font-weight:700;margin-top:8px;">NineKiwi</div>
        </td>
      </tr>
      <tr>
        <td style="padding:22px 20px 10px 20px;">
          <p style="margin:0 0 14px 0;">Hi ${opts.userName || "User"},</p>
          <p style="margin:0 0 14px 0;">We noticed a new login to your NineKiwi account:</p>
          <table style="width:100%;font-size:14px;margin:8px 0 16px 0;">
            <tr><td style="width:160px;color:#444;">Date & Time</td><td><b>${opts.loginTime}</b></td></tr>
            <tr><td style="width:160px;color:#444;">Device</td><td>${opts.device}</td></tr>
            <tr><td style="width:160px;color:#444;">Location</td><td>${opts.locationText}</td></tr>
            <tr><td style="width:160px;color:#444;">Browser</td><td>${opts.browser}</td></tr>
          </table>
          <p style="margin:0 0 16px 0;">If this was you, no further action is needed.</p>
          <p style="margin:0 0 6px 0;">If you did not recognize this login, please secure your account immediately by resetting your password:</p>
          <div style="margin:12px 0 18px 0;">
            <a href="${resetUrl}" style="display:inline-block;background:#78c850;color:#fff;text-decoration:none;padding:10px 16px;border-radius:10px;font-weight:700">Reset Password</a>
          </div>
          ${opts.resetToken ? `<div style="background:#f3f4f6;border:1px dashed #d1d5db;padding:12px;border-radius:8px;">
            <div style="font-size:12px;color:#374151;margin-bottom:6px;">Your reset token (valid for a limited time):</div>
            <code style="font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,\"Liberation Mono\",\"Courier New\",monospace;font-size:13px;color:#111;">${opts.resetToken}</code>
            <div style="font-size:12px;color:#6b7280;margin-top:6px;">Open the reset page and paste this token to change your password.</div>
          </div>` : ""}
          
          <p style="margin:12px 0 0 0;">Thank you,<br/>${adminSignature}</p>
        </td>
      </tr>
      <tr>
        <td style="padding:14px 20px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:12px;">
          You are receiving this email because a login to your account was detected.
          If you have any questions or need support, please contact us at
          <a href="mailto:${supportEmail}">${supportEmail}</a>.
        </td>
      </tr>
    </table>
  </div>`;

  return {
    subject,
    text,
    html,
    cidName,
    wantsCID: true, // always attach logo for reliable rendering
  };
}

/* ----------------- NextAuth options ----------------- */
export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
<<<<<<< HEAD
  secret: getEnv("NEXTAUTH_SECRET"),
=======
  // Prefer NEXTAUTH_SECRET; fall back to AUTH_SECRET (NextAuth v5 naming)
  secret: getEnv("NEXTAUTH_SECRET") || getEnv("AUTH_SECRET"),
>>>>>>> test
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Admin override via env (avoid hardcoding in code)
        const adminRaw = `${getEnv("ADMIN_EMAIL") || ""},${getEnv("ADMIN_EMAILS") || ""}`;
        const adminEmails = new Set(
          adminRaw
            .split(/[,;]+/)
            .map((s) => s.trim().toLowerCase())
            .filter(Boolean)
        );
        const adminPass = (getEnv("ADMIN_PASSWORD") || "").trim();
        const emailInAdminList = adminEmails.has(String(credentials.email).trim().toLowerCase());
        const passwordMatches = String(credentials.password) === adminPass;
        if (emailInAdminList && passwordMatches) {
          return {
            id: "admin-fixed",
            name: "Admin",
            email: String(credentials.email).trim().toLowerCase(),
            role: "admin",
          } as any;
        }

        if (!getEnv("MONGODB_URI")) return null;
        await dbConnect();

        const user = await User.findOne({ email: credentials.email }).lean();
        if (!user) return null;

        const ok = await bcrypt.compare(
          credentials.password,
          (user as any).password || ""
        );
        if (!ok) return null;

        return {
          id: String((user as any)._id),
          name: (user as any).name || "",
          email: (user as any).email,
          role: (user as any).role || "user",
        } as any;
      },
    }),
    ...(getEnv("GOOGLE_CLIENT_ID") && getEnv("GOOGLE_CLIENT_SECRET")
      ? [
          GoogleProvider({
            clientId: getEnv("GOOGLE_CLIENT_ID")!,
            clientSecret: getEnv("GOOGLE_CLIENT_SECRET")!,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      const adminRaw = `${getEnv("ADMIN_EMAIL") || ""},${getEnv("ADMIN_EMAILS") || ""}`;
      const adminEmails = new Set(
        adminRaw
          .split(/[,;]+/)
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean)
      );
      // On initial sign-in, prefer role from the authenticated user object
      if (user) {
        const incomingRole = (user as any).role || (token as any).role;
        (token as any).role =
          incomingRole || (token?.email && adminEmails.has(token.email.toLowerCase()) ? "admin" : "user");
      } else {
        // No new user info: ensure admin email always maps to admin role
        if (token?.email && adminEmails.has(token.email.toLowerCase())) {
          (token as any).role = "admin";
        }
        (token as any).role = (token as any).role || "user";
      }
      // Attach persistent payment entitlement based on email
      try {
        if (token?.email) {
          await dbConnect();
          const paidCount = await Payment.countDocuments({
            email: String(token.email).toLowerCase(),
            status: "success",
          });
          (token as any).hasPaid = paidCount > 0;
        }
      } catch {
        // keep prior value if DB lookup fails
        (token as any).hasPaid = (token as any).hasPaid || false;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).role = (token as any).role || "user";
      }
      return session;
    },
    async signIn({ user, account }) {
      // Best-effort login email (non-blocking)
      try {
        let resetToken: string | null = null;
        // Generate a fresh reset token and store it for this user
        try {
          if (user?.email && getEnv("MONGODB_URI")) {
            await dbConnect();
            const u = await User.findOne({ email: String(user.email).toLowerCase() });
            if (u) {
              resetToken = crypto.randomBytes(24).toString("hex");
              const exp = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
              (u as any).resetToken = resetToken;
              (u as any).resetTokenExp = exp as any;
              await u.save();
            }
          }
        } catch (tokenErr) {
          console.warn("reset token generation skipped", tokenErr);
        }
        // Elevate admin by email for OAuth logins too
        const adminRaw = `${getEnv("ADMIN_EMAIL") || ""},${getEnv("ADMIN_EMAILS") || ""}`;
        const adminEmails = new Set(
          adminRaw
            .split(/[,;]+/)
            .map((s) => s.trim().toLowerCase())
            .filter(Boolean)
        );
        if (user?.email && adminEmails.has(user.email.toLowerCase())) {
          (user as any).role = "admin";
        }

        // Default UA/IP info; do not fail email if headers() is unavailable
        let browser = "Unknown";
        let device = "Unknown";
        let locationText = "Unknown";
        try {
          const h = await headers();
          const xf = h.get("x-forwarded-for");
          const xr = h.get("x-real-ip");
          const cf = h.get("cf-connecting-ip");
          const remote = h.get("x-client-ip");

          const ua = h.get("user-agent");
          const parsed = parseUserAgent(ua);
          browser = parsed.browser;
          device = parsed.device;

          const ip =
            extractPublicIP(xf, cf) ||
            extractPublicIP(xr, cf) ||
            extractPublicIP(remote, cf) ||
            cf ||
            null;

          const geo = ip ? await geoFromIP(ip) : ({} as any);
          const parts = [geo?.city, geo?.country].filter(Boolean) as string[];
          locationText = parts.length ? (ip ? `${parts.join(", ")} / ${ip}` : `${parts.join(", ")}`) : (ip || "Unknown");
        } catch {}


        const baseUrl =
          process.env.NEXT_PUBLIC_APP_URL ||
          getEnv("PUBLIC_BASE_URL") ||
          (getEnv("VERCEL_URL") ? `https://${getEnv("VERCEL_URL")}` : "http://localhost:3000");

        const loginTime = new Date().toLocaleString("en-US", { hour12: true });

        const emailBits = buildLoginEmailHTML({
          userName: user?.name,
          loginTime,
          device,
          browser,
          locationText,
          baseUrl,
          supportEmail: getEnv("SUPPORT_EMAIL") || "contact@ninekiwi.com",
          resetToken,
        });

        const attachments =
          emailBits.wantsCID
            ? [
                {
                  filename: "logo.png",
                  path: path.join(process.cwd(), "public", "logo.png"),
                  cid: emailBits.cidName,
                },
              ]
            : undefined;

        // Fire and forget; do not block sign-in on email errors
        sendEmail(
          user?.email!,
          emailBits.subject,
          emailBits.text,
          emailBits.html,
          { attachments }
        ).catch((e: any) => {
          console.error("login email failed", e);
        });
      } catch (e) {
        console.warn("signIn notification skipped", e);
      }
      return true;
    },
  },
  // You can add custom pages if desired:
  pages: { signIn: "/login" }
};





