import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toNoScheme(u: string) {
  return u.replace(/^https?:\/\//i, "");
}

function guessReferer(target: URL): string {
  const h = target.hostname;
  if (h.endsWith("staticmap.openstreetmap.de")) return "https://staticmap.openstreetmap.de/";
  if (h.endsWith("maps.googleapis.com")) return "https://maps.googleapis.com/";
  return "https://ninekiwi.com/";
}

export async function GET(req: NextRequest) {
  const urlStr = req.nextUrl.searchParams.get("url");
  if (!urlStr || !/^https?:\/\//i.test(urlStr)) {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  let target: URL;
  try { target = new URL(urlStr); } catch {
    return NextResponse.json({ error: "Bad url" }, { status: 400 });
  }

  // Try primary fetch with short timeout
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);
  const commonHeaders: Record<string, string> = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
    Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.8",
    Referer: guessReferer(target),
  };

  async function tryFetch(u: string) {
    const r = await fetch(u, { headers: commonHeaders, cache: "no-store", signal: controller.signal });
    return r;
  }

  try {
    let r = await tryFetch(target.toString());
    if (!r.ok) {
      // fallback 1: images.weserv.nl proxy
      try {
        const ws = `https://images.weserv.nl/?url=${encodeURIComponent(toNoScheme(target.toString()))}`;
        r = await tryFetch(ws);
      } catch {}
    }
    if (!r.ok) {
      // fallback 2: corsproxy.io
      try {
        const cp = `https://corsproxy.io/?${encodeURIComponent(target.toString())}`;
        r = await tryFetch(cp);
      } catch {}
    }

    if (!r.ok) {
      // last resort: 302 redirect to original URL to avoid 500s in logs
      return NextResponse.redirect(target.toString(), 302);
    }

    const contentType = r.headers.get("content-type") || "application/octet-stream";
    const arrBuf = await r.arrayBuffer();
    return new NextResponse(arrBuf, { headers: { "content-type": contentType, "cache-control": "no-store" }, status: 200 });
  } catch (e: any) {
    // Return a tiny transparent PNG to avoid breaking UI
    const blankPng = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAuwB9U8T9zwAAAAASUVORK5CYII=",
      "base64"
    );
    return new NextResponse(blankPng, { headers: { "content-type": "image/png", "cache-control": "no-store" }, status: 200 });
  } finally {
    clearTimeout(timeout);
  }
}
