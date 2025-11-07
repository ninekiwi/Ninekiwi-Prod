// lib/email.ts
import nodemailer from "nodemailer";
import { getEnv, getEnvOr } from "@/lib/env";

type InlineOpts = {
  cidLogoPath?: string;      // e.g., path.join(process.cwd(), "public", "logo.png")
  cidLogoName?: string;      // default: "logo.png"
  cidName?: string;          // default: "ninekiwi-logo"
  attachments?: Array<{
    filename?: string;
    path?: string;
    content?: Buffer | string;
    contentType?: string;
    cid?: string;
  }>;
};

export async function sendEmail(
  to: string,
  subject: string,
  text: string,
  html?: string,
  inline?: InlineOpts
) {
  // Prefer SMTP_* (GoDaddy), else EMAIL_*; last resort: Gmail service
  const host =
    getEnv("SMTP_HOST") ||
    getEnv("EMAIL_HOST") ||
    "smtpout.secureserver.net";
  const portStr =
    getEnv("SMTP_PORT") ||
    getEnv("EMAIL_PORT") ||
    "465";
  const port = Number(portStr);
  const user =
    getEnv("SMTP_USER") ||
    getEnv("EMAIL_USER");
  const pass =
    getEnv("SMTP_PASS") ||
    getEnv("EMAIL_PASS");

  try {
    const useSmtp = !!user && !!pass;
    const transporter = useSmtp
      ? nodemailer.createTransport({
          host,
          port,
          secure: port === 465, // SSL on 465 for GoDaddy
          auth: { user, pass },
          // Some hosts behind proxies can need this; harmless otherwise:
          tls: { rejectUnauthorized: false },
        })
      : nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: getEnv("EMAIL_USER") || "",
            pass: getEnv("EMAIL_PASS") || "",
          },
        });

    const fromHeader =
      getEnv("EMAIL_FROM") ||
      (user ? `"Nine Kiwi" <${user}>` : "no-reply@ninekiwi.app");

    const attachments: NonNullable<InlineOpts["attachments"]> = [];
    if (inline?.cidLogoPath) {
      attachments.push({
        filename: inline.cidLogoName || "logo.png",
        path: inline.cidLogoPath,
        cid: inline.cidName || "ninekiwi-logo",
      });
    }
    if (inline?.attachments?.length) attachments.push(...inline.attachments);

    // Optional but very useful while debugging SMTP creds/port:
    try {
      await transporter.verify();
      console.log("[email] SMTP verified:", host, port);
    } catch (vErr) {
      console.warn("[email] SMTP verify warning:", vErr);
    }

    const info = await transporter.sendMail({
      from: fromHeader,
      to,
      subject,
      text,
      html,
      attachments: attachments.length ? attachments : undefined,
    });

    console.log("[email] sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("[email] send error:", error);
    throw error;
  }
}
