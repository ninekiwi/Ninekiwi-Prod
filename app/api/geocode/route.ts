import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type GeocodeSuccess = {
  success: true;
  query: string;
  lat: number;
  lon: number;
  source: "open-meteo" | "nominatim";
  fromCache?: boolean;
};

type GeocodeFailure = {
  success: false;
  query: string;
  error: string;
  notFound?: boolean;
  hints?: string[];
};

type GeocodeResult = GeocodeSuccess | GeocodeFailure;

const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes
const cache = new Map<string, { ts: number; result: GeocodeResult }>();

async function fetchWithTimeout(url: string, init: RequestInit, ms = 3200): Promise<Response> {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(to);
  }
}

async function geocodeOpenMeteo(q: string) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=en&format=json`;
  const r = await fetchWithTimeout(url, { headers: { "Accept-Language": "en" }, cache: "no-store" }).catch(() => null as any);
  if (!r?.ok) return null;
  const j = await r.json().catch(() => null);
  const first = j?.results?.[0];
  if (!first) return null;
  const lat = Number(first?.latitude);
  const lon = Number(first?.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { lat, lon, source: "open-meteo" as const };
}

async function geocodeNominatim(q: string) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
  const r = await fetchWithTimeout(
    url,
    {
      headers: {
        "Accept-Language": "en",
        "User-Agent": "ninekiwi-report/1.0 (+https://ninekiwi.com)",
      },
      cache: "no-store",
    }
  ).catch(() => null as any);
  if (!r?.ok) return null;
  const arr = await r.json().catch(() => null);
  const first = Array.isArray(arr) ? arr[0] : null;
  if (!first) return null;
  const lat = Number(first?.lat);
  const lon = Number(first?.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { lat, lon, source: "nominatim" as const };
}

function normaliseQuery(q: string): string {
  return q.trim().replace(/\s+/g, " ").toLowerCase();
}

function respond(result: GeocodeResult) {
  const headers = { "Cache-Control": "no-store" };
  if (result.success) {
    return NextResponse.json(result, { headers });
  }
  const status = result.notFound ? 200 : 502;
  return NextResponse.json(result, { status, headers });
}

function cacheGet(q: string): GeocodeResult | null {
  const key = normaliseQuery(q);
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  if (entry.result.success) {
    return { ...entry.result, fromCache: true };
  }
  return entry.result;
}

function cacheSet(q: string, result: GeocodeResult) {
  const key = normaliseQuery(q);
  cache.set(key, { ts: Date.now(), result });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    if (!q) return respond({ success: false, query: "", error: "Missing query" });

    const qSimple = q.replace(/[^a-zA-Z0-9,\s]/g, "");
    if (qSimple.length < 3) {
      return respond({
        success: false,
        query: q,
        error: "Query too short",
        notFound: true,
      });
    }

    const cached = cacheGet(q);
    if (cached) {
      return respond(cached);
    }

    const providerMessages: string[] = [];

    // Try full query with both providers concurrently (fastest wins)
    const [omRes, nomRes] = await Promise.allSettled([geocodeOpenMeteo(q), geocodeNominatim(q)]);
    const first =
      (omRes.status === "fulfilled" ? omRes.value : null) ||
      (nomRes.status === "fulfilled" ? nomRes.value : null);
    if (first) {
      const result: GeocodeSuccess = { success: true, query: q, ...first };
      cacheSet(q, result);
      return respond(result);
    }

    if (omRes.status === "rejected") providerMessages.push("Open-Meteo lookup failed.");
    if (nomRes.status === "rejected") providerMessages.push("Nominatim lookup failed.");

    // Heuristic: try progressively coarser queries and append country
    const partsComma = q.split(/\s*,\s*/g).filter(Boolean);
    const partsSpace = q.split(/\s+/g).filter(Boolean);
    const candidates: string[] = [];
    if (partsComma.length >= 2) {
      const last2 = partsComma.slice(-2).join(", ");
      candidates.push(last2, `${last2}, India`);
    }
    if (partsSpace.length >= 2) {
      const last2s = partsSpace.slice(-2).join(" ");
      candidates.push(last2s, `${last2s}, India`);
    }
    if (/\bharidwar\b/i.test(q)) candidates.push("Haridwar, India");
    if (/\bjwalapur\b/i.test(q)) candidates.push("Jwalapur, Haridwar, India");

    const tried: string[] = [];
    const start = Date.now();
    for (const cand of candidates) {
      if (!cand) continue;
      if (Date.now() - start > 5000) break;
      tried.push(cand);
      const [c1, c2] = await Promise.allSettled([geocodeOpenMeteo(cand), geocodeNominatim(cand)]);
      const ok =
        (c1.status === "fulfilled" ? c1.value : null) ||
        (c2.status === "fulfilled" ? c2.value : null);
      if (ok) {
        const result: GeocodeSuccess = { success: true, query: q, ...ok };
        cacheSet(q, result);
        return respond(result);
      }
    }

    const failure: GeocodeFailure = {
      success: false,
      query: q,
      error: "No matching location found for this query.",
      notFound: true,
      hints: tried.length ? tried : providerMessages.length ? providerMessages : undefined,
    };
    cacheSet(q, failure);
    return respond(failure);
  } catch (e: any) {
    return respond({
      success: false,
      query: "",
      error: String(e?.message || e || "Unknown error"),
    });
  }
}
 
