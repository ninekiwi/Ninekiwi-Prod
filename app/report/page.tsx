/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { signOut } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";

import ProgressBar from "@/components/ProgressBar";
import WeatherPanel from "@/components/WeatherPanel";
import FlexibleAnswer from "@/components/FlexibleAnswer";
import SectionPhotos from "@/components/SectionPhotos";
const ReportPreview = dynamic(() => import("@/components/ReportPreview"), { ssr: false, loading: () => <div className="text-sm text-gray-500">Loading preview…</div> });
const AutoSummary = dynamic(() => import("@/components/AutoSummary"), { ssr: false, loading: () => <div className="text-sm text-gray-500">Loading summary…</div> });
const SignaturePadBox = dynamic(() => import("@/components/SignaturePad"), { ssr: false, loading: () => <div className="text-sm text-gray-500">Loading signature…</div> });
const VoiceCapture = dynamic(() => import("@/components/VoiceCapture"), { ssr: false });
const MapCard = dynamic(() => import("@/components/MapCard"), { ssr: false, loading: () => <div className="text-sm text-gray-500">Loading map…</div> });

import { generateFullReportPDF, generateFullReportDOCX } from "@/lib/export";
import { formatTime12, formatDateShort } from "@/lib/time";
import { saveReport } from "@/lib/reportsClient";
import { saveDraft as saveOfflineDraft, loadDraft as loadOfflineDraft, draftKeyForReport } from "@/lib/offlineStore";

// dynamic warmup helper — imports exporter code at idle to warm caches
const warmupExportLibs = () => {
  try {
    if (typeof window === "undefined") return;
    if ((window as any).__nk_export_warmed) return;
    (window as any).__nk_export_warmed = true;
    // dynamic import to warm up any heavy client-side export libraries
    void import("@/lib/export").catch(() => {});
  } catch {}
};
 
import { UPhoto } from "@/lib/types";
import {
  listPhotos,
  createPhoto,
  updatePhoto,
  deletePhoto,
} from "@/lib/photosClient";

/* ------------ Types that match the exporter (do not change names) ------------ */
type FlexMode = "yesno" | "text";
type FlexFieldId =
  | "weatherConditions"
  | "safetyCompliance"
  | "safetySignage"
  | "equipmentCondition"
  | "workmanshipQuality"
  | "siteHousekeeping"
  | "communicationRating";

export type PhotoData = {
  name: string;
  data: string; // dataURL or http(s)
  includeInSummary?: boolean;
  caption?: string;
  figureNumber?: number;
  description?: string;
};

// keep Mongo id + Cloudinary url next to your UPhoto
type DBUPhoto = UPhoto & { _id?: string; src?: string };

type FormData = {
  reportId: string;

  /** Company info */
  nameandAddressOfCompany: string;
  companyName: string;

  /** Meta */
  observationTime?: string;
  reportDate?: string;
  preparedFor?: string;
  preparedBy?: string;

  purposeOfFieldVisit:
    | "General Field Inspection"
    | "Construction Progress"
    | "Structural Condition Survey"
    | "Building Inspection"
    | "Car Garage Inspection"
    | "";
  clientName: string;
  inspectorName: string;
  contactPhone: string;
  contactEmail: string;

  /** Location details */
  location: string;
  streetAddress: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;

  /** Coordinates for map rendering */
  lat: string;
  lon: string;

  inspectionDate: string;
  startInspectionTime: string;

  /** Weather snapshot */
  temperature: string;
  humidity: string;
  windSpeed: string;
  weatherDescription: string;

  /** flexible answers (yes/no or text) */
  weatherConditions: string;
  safetyCompliance: string;
  safetySignage: string;
  equipmentCondition: string;
  workmanshipQuality: string;
  siteHousekeeping: string;
  communicationRating: string;

  /** other radios/texts */
  numWorkers: string;
  workerAttendance: string;
  workProgress: string;
  scheduleCompliance: string;
  materialAvailability: string;
  maintenanceStatus: string;
  specificationCompliance: string;
  incidentsHazards: string;
  stakeholderVisits: string;

  /** notes */
  additionalComments: string;
  inspectorSummary: string;
  recommendations: string;
  recommendationRating: string;
  improvementAreas: string;
  signatureDateTime: string;

  /** detail notes shown when a related yes/no is "No" */
  weatherConditionsNote?: string;
  safetyComplianceNote?: string;
  safetySignageNote?: string;
  equipmentConditionNote?: string;
  workmanshipQualityNote?: string;
  siteHousekeepingNote?: string;
  communicationRatingNote?: string;

  /** per-field mode */
  flexibleModes: Record<FlexFieldId, FlexMode>;

  /** NEW: Background + Field Observation text */
  backgroundManual: string; // user's own background text
  backgroundAuto: string; // auto generated from inputs
  fieldObservationText: string; // user's own field observation text
};

const S = (v: unknown) => (v == null ? "" : String(v).trim());

export default function Page() {
  /* ---------------- Auth (optional but useful) ---------------- */
  const [user, setUser] = useState<{
    _id: string;
    name: string;
    email: string;
    role: string;
  } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const { user } = await res.json();
        setUser(user || null);
      } catch {
        setUser(null);
      }
    })();
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    (async () => {
      try {
        const res = await fetch("/api/account", { cache: "no-store", credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setAvatarUrl(data?.user?.avatarUrl || "");
        }
      } catch {}
    })();
  }, [menuOpen]);

  // Require successful payment to access the tool (admins bypass)
  useEffect(() => {
    (async () => {
      try {
        const me = await fetch("/api/auth/me", { cache: "no-store" }).then((r) => r.json()).catch(() => null as any);
        if (me?.user?.role === "admin") return; // admins can use report free
        const s = await fetch("/api/payment/status", { cache: "no-store", credentials: "include" as RequestCredentials }).then((r) => r.json());
        if (!s?.paid) window.location.href = "/pay";
      } catch {
        window.location.href = "/pay";
      }
    })();
  }, []);

  async function logout() {
    try {
      try { await fetch("/api/auth/logout", { method: "POST" }); } catch {}
      await signOut({ callbackUrl: "/login" });
    } catch {
      window.location.href = "/login";
    }
  }

  /* ---------------- State ---------------- */
  const [form, setForm] = useState<FormData>(() => {
    const now = new Date();
    const base: any = {
      purposeOfFieldVisit: "",
      reportId: "",

      clientName: "",
      companyName: "",
      inspectorName: "",
      nameandAddressOfCompany: "",
      contactPhone: "",
      contactEmail: "",

      location: "",
      streetAddress: "",
      city: "",
      state: "",
      country: "",
      zipCode: "",

      lat: "",
      lon: "",

      inspectionDate: now.toISOString().split("T")[0],
      startInspectionTime: "12:00",

      temperature: "",
      humidity: "",
      windSpeed: "",
      weatherDescription: "",

      weatherConditions: "",
      safetyCompliance: "",
      safetySignage: "",
      equipmentCondition: "",
      workmanshipQuality: "",
      siteHousekeeping: "",
      communicationRating: "",

      numWorkers: "",
      workerAttendance: "",
      workProgress: "",
      scheduleCompliance: "",
      materialAvailability: "",
      maintenanceStatus: "",
      specificationCompliance: "",
      incidentsHazards: "",
      stakeholderVisits: "",

      additionalComments: "",
      inspectorSummary: "",
      recommendations: "",
      recommendationRating: "",
      improvementAreas: "",
      signatureDateTime: now.toISOString().slice(0, 16),

      weatherConditionsNote: "",
      safetyComplianceNote: "",
      safetySignageNote: "",
      equipmentConditionNote: "",
      workmanshipQualityNote: "",
      siteHousekeepingNote: "",
      communicationRatingNote: "",

      flexibleModes: {
        weatherConditions: "yesno",
        safetyCompliance: "yesno",
        safetySignage: "yesno",
        equipmentCondition: "yesno",
        workmanshipQuality: "yesno",
        siteHousekeeping: "yesno",
        communicationRating: "yesno",
      },

      // NEW fields
      backgroundManual: "",
      backgroundAuto: "",
      fieldObservationText: "",
    };
    // Merge saved form from localStorage (if any) for immediate accurate progress
    try {
      if (typeof window !== 'undefined') {
        const raw = localStorage.getItem("nk_report_form");
        if (raw) {
          const saved = JSON.parse(raw);
          if (saved && typeof saved === 'object') {
            Object.assign(base, saved);
            // ensure defaults for missing date/time fields
            base.inspectionDate = base.inspectionDate || now.toISOString().split("T")[0];
            base.startInspectionTime = base.startInspectionTime || "12:00";
            base.signatureDateTime = base.signatureDateTime || now.toISOString().slice(0, 16);
          }
        }
      }
    } catch {}
    return base as FormData;
  });

  // per-section photos (DB-aware)
  const [sectionPhotos, setSectionPhotos] = useState<Record<string, DBUPhoto[]>>({
    weather: [],
    safety: [],
    work: [],
    equipment: [],
    incidents: [],
    quality: [],
    notes: [],
    evidence: [],
    additional: [],
    // NEW buckets
    background: [],
    fieldObservation: [],
  });

  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [purposeTouched, setPurposeTouched] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Map snapshot feature removed
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfElapsed, setPdfElapsed] = useState(0);
  const [exportMode, setExportMode] = useState<null | 'pdf' | 'docx'>(null);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState<boolean>(false);
  const [disclaimerDismissed, setDisclaimerDismissed] = useState<boolean>(false);
  
  // captureStaticMapDataUrl removed with map snapshot feature

  // Autosave and restore form progress
  useEffect(() => {
    try {
      const raw = localStorage.getItem("nk_report_form");
      let saved: any = null;
      if (raw) {
        saved = JSON.parse(raw);
        if (saved && typeof saved === "object") {
          setForm((f) => ({ ...f, ...saved }));
        }
      }
      // map state load removed
      (async () => {
        try {
          const key = draftKeyForReport((saved && saved.reportId) || form.reportId);
          const draft = await loadOfflineDraft<any>(key);
          if (draft) {
            if (draft.sectionPhotos && typeof draft.sectionPhotos === 'object') {
              setSectionPhotos((prev) => ({ ...prev, ...draft.sectionPhotos }));
            }
            if (typeof draft.signatureData !== 'undefined') setSignatureData(draft.signatureData);
            if (typeof draft.scrollY === 'number') {
              setTimeout(() => { try { window.scrollTo({ top: draft.scrollY }); } catch {} }, 300);
            }
          }
        } catch {}
      })();
    } catch {}
  }, []);

  useEffect(() => {
    try {
      const toSave: any = { ...form };
      localStorage.setItem("nk_report_form", JSON.stringify(toSave));
    } catch {}
  }, [form]);

  // Persist report to database when online and reportId is present (debounced)
  useEffect(() => {
    let to: any;
    const persist = async () => {
      try {
        const id = String(form.reportId || "").trim();
        if (!id) return;
        if (typeof navigator !== "undefined" && !navigator.onLine) return;
        await saveReport({ reportId: id, data: form as any, signatureData: signatureData ?? null });
      } catch {
        // no-op: keep UI responsive; admin lists may simply miss this save if unauthorized/offline
      }
    };
    to = setTimeout(persist, 1200);
    return () => { if (to) clearTimeout(to); };
  }, [form, signatureData]);

  // Disclaimer: show once until accepted
  useEffect(() => {
    try {
      const v = localStorage.getItem("nk_disclaimer_accepted");
      setDisclaimerAccepted(!!v);
    } catch {}
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDisclaimerDismissed(true);
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', onKey as any);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('keydown', onKey as any);
      }
    };
  }, []);
  // map state save removed

  useEffect(() => {
    let to: any;
    const save = async () => {
      const keyNow = draftKeyForReport(form.reportId);
      const payload = {
        sectionPhotos,
        signatureData,
        scrollY: typeof window !== 'undefined' ? window.scrollY : 0,
      };
      await saveOfflineDraft(keyNow, payload);
      if (!String(form.reportId || '').trim()) {
        await saveOfflineDraft(draftKeyForReport(null), payload);
      }
    };
    to = setTimeout(save, 600);
    return () => { if (to) clearTimeout(to); };
  }, [sectionPhotos, signatureData, form.reportId]);

  useEffect(() => {
    const onOnline = async () => {
      setIsOnline(true);
      try {
        const hasId = String(form.reportId || '').trim().length > 0;
        if (!hasId) return;
        // Ensure report metadata exists in DB once back online
        try {
          await saveReport({ reportId: String(form.reportId).trim(), data: form as any, signatureData: signatureData ?? null });
        } catch {}
        const keys = Object.keys(sectionPhotos || {});
        for (const k of keys) {
          try {
            const arr = (sectionPhotos as any)[k] || [];
            // @ts-ignore
            await (makePersistingSetter as any)(k)(arr);
          } catch {}
        }
      } catch {}
    };
    const onOffline = () => setIsOnline(false);
    const onBeforeUnload = () => {
      try {
        const keyNow = draftKeyForReport(form.reportId);
        void saveOfflineDraft(keyNow, { sectionPhotos, signatureData, scrollY: window.scrollY });
      } catch {}
    };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [sectionPhotos, signatureData, form.reportId]);

  useEffect(() => {
    const id = String(form.reportId || '').trim();
    if (!id) return;
    (async () => {
      try {
        const draft = await loadOfflineDraft<any>(draftKeyForReport(id));
        if (draft) {
          if (draft.sectionPhotos && typeof draft.sectionPhotos === 'object') {
            setSectionPhotos((prev) => ({ ...prev, ...draft.sectionPhotos }));
          }
          if (typeof draft.signatureData !== 'undefined') setSignatureData(draft.signatureData);
        }
      } catch {}
    })();
  }, [form.reportId]);

  // Site map auto-include removed

  // If lat/lon are not available, try geocoding the address to include a site map automatically
  // Site map geocode + capture removed

  useEffect(() => {
    const now = new Date();
    setForm((f) => ({
      ...f,
      inspectionDate: f.inspectionDate || now.toISOString().split("T")[0],
      startInspectionTime: f.startInspectionTime || "12:00",
      signatureDateTime: f.signatureDateTime || now.toISOString().slice(0, 16),
    }));

    const fetchWeatherData = async () => {
      if (typeof window !== "undefined" && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          const { latitude, longitude } = position.coords;
          setForm((prev) => ({ ...prev, lat: String(latitude), lon: String(longitude) }));
        });
      }
    };

    fetchWeatherData();
  }, []);

  useEffect(() => {
    try {
      const idle = (cb: any) => (typeof (window as any).requestIdleCallback === 'function' ? (window as any).requestIdleCallback(cb, { timeout: 2000 }) : setTimeout(cb, 1200));
      idle(() => warmupExportLibs());
    } catch {}
  }, []);

  /* ---------------- Helpers ---------------- */

  const adaptPhotos = (arr: DBUPhoto[]): PhotoData[] =>
    (arr || []).map((p: any) => ({
      name: p.name ?? p.filename ?? "Photo",
      data: p.src ?? p.data ?? "",
      includeInSummary: !!p.includeInSummary,
      caption: p.caption ?? p.name ?? "",
      description: p.description ?? "",
      figureNumber: p.figureNumber,
    }));

  const adaptedSectionPhotos = useMemo(() => {
    const out: Record<string, PhotoData[]> = {};
    for (const key of Object.keys(sectionPhotos)) {
      out[key] = adaptPhotos(sectionPhotos[key] || []);
    }
    return out;
  }, [sectionPhotos]);

  const summaryPhotosU = useMemo(() => {
    const bg = adaptPhotos((sectionPhotos.background || []) as any);
    const fo = adaptPhotos((sectionPhotos.fieldObservation || []) as any);
    const add = adaptPhotos((sectionPhotos.additional || []) as any);
    const all = [...bg, ...fo, ...add];
    const selected = all.filter((p: any) => (p as any)?.includeInSummary);
    return selected.length ? selected : all;
  }, [sectionPhotos.background, sectionPhotos.fieldObservation, sectionPhotos.additional]);

  /* ---------------- Derived ---------------- */
  const filledPercent = useMemo(() => {
    // Count only fields the user can actually fill in this UI
    const ids = [
      "purposeOfFieldVisit",
      "reportId",
      "inspectorName",
      "nameandAddressOfCompany",
      "clientName",
      "companyName",
      "contactPhone",
      "contactEmail",
      "location",
      "city",
      "state",
      "country",
      "zipCode",
      "inspectionDate",
      "startInspectionTime",
      // Assessment sections actually rendered:
      "weatherConditions",
      "safetyCompliance",
      "safetySignage",
      // Removed workerAttendance/scheduleCompliance/materialAvailability from progress calc
      // Notes & signature
      "additionalComments",
      "inspectorSummary",
      "fieldObservationText",
      "signatureDateTime",
    ] as (keyof FormData)[];

    let filled = 0;
    ids.forEach((k) => {
      const v = (form as any)[k];
      if (typeof v === "string" && v.trim() !== "") filled++;
    });
    const pct = Math.round((filled / ids.length) * 100);
    return Math.max(0, Math.min(100, pct));
  }, [form]);
 
  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const updateFlex = (id: FlexFieldId, mode: FlexMode, value: string) =>
    setForm((f) => ({
      ...f,
      [id]: value,
      flexibleModes: { ...f.flexibleModes, [id]: mode },
    }));

  const makeAutoBackground = () => {
    const addr = [
      form.streetAddress,
      [form.city, form.state].filter(Boolean).join(", "),
      [form.country, form.zipCode].filter(Boolean).join(" "),
    ]
      .filter(Boolean)
      .map(S)
      .filter(Boolean)
      .join(", ") || S(form.location);

    const purpose = S((form as any).purposeOfFieldVisit);
    const date = formatDateShort(form.inspectionDate) || S(form.inspectionDate);
    const bits: string[] = [];
    if (purpose) bits.push(`${purpose}`);
    if (addr) bits.push(`at ${addr}`);
    if (date) bits.push(`on ${date}`);

    const tail: string[] = [];
    if (S(form.workProgress)) tail.push(`Work: ${S(form.workProgress)}`);
    if (S(form.scheduleCompliance)) tail.push(`Schedule: ${S(form.scheduleCompliance)}`);
    if (S(form.materialAvailability)) tail.push(`Materials: ${S(form.materialAvailability)}`);
    if (S(form.safetyCompliance)) tail.push(`Safety: ${S(form.safetyCompliance)}`);
    if (S(form.safetySignage)) tail.push(`Signage: ${S(form.safetySignage)}`);

    const head = bits.length ? `Inspection ${bits.join(" ")}.` : "Project background summary.";
    const out = [head, tail.join(" | ")].filter(Boolean).join(" ");
    updateField("backgroundAuto", out);
  };

  /* ---------------- DB <-> UI wiring ---------------- */
 
  const mapDbToU = (it: any): DBUPhoto => ({
    _id: it._id,
    name: it.name || "Photo",
    data: it.src || it.data || "",
    src: it.src,
    includeInSummary: !!it.includeInSummary,
    caption: it.caption || "",
    description: it.description || "",
    figureNumber: it.figureNumber,
  });

  useEffect(() => {
    if (!form.reportId) return;

    const keys = Object.keys(sectionPhotos);
    (async () => {
      try {
        const next: Record<string, DBUPhoto[]> = {};
        await Promise.all(
          keys.map(async (k) => {
            const items = await listPhotos(form.reportId, k);
            next[k] = items.map(mapDbToU);
          })
        );
        setSectionPhotos((prev) => {
          const merged: Record<string, DBUPhoto[]> = { ...prev } as any;
          for (const k of Object.keys(next)) {
            const serverArr = (next as any)[k] || [];
            const prevArr = (prev as any)[k] || [];
            const seen = new Set<string>(serverArr.map((p: any) => p?._id || p?.data));
            const extras = prevArr.filter((p: any) => {
              const key = p?._id || p?.data;
              return key ? !seen.has(key) : true;
            });
            (merged as any)[k] = [...serverArr, ...extras];
          }
          return merged;
        });
 
      } catch (e) {
        console.error("Failed to load photos:", e);
      }
    })();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.reportId]);

  function makePersistingSetter(sectionKey: keyof typeof sectionPhotos) {
    return async (nextArr: DBUPhoto[]) => {
      setSectionPhotos((sp) => ({ ...sp, [sectionKey]: nextArr }));

      if (!form.reportId || (typeof navigator !== 'undefined' && !navigator.onLine)) return;

      const prevArr = sectionPhotos[sectionKey] || [];
      const prevMap = new Map((prevArr as DBUPhoto[]).map((p) => [p._id, p]));
      const nextMap = new Map((nextArr as DBUPhoto[]).map((p) => [p._id, p]));

      for (const p of prevArr) {
        if (p._id && !nextMap.has(p._id)) {
          await deletePhoto(p._id);
        }
      }

      for (const p of nextArr) {
        if (!p._id) {
 
          const created = await createPhoto({
            name: p.name || "Photo",
            data: p.data,
            reportId: form.reportId,
            section: sectionKey as string,
            includeInSummary: p.includeInSummary,
            caption: p.caption,
            description: p.description,
            figureNumber: p.figureNumber,
          });

          setSectionPhotos((sp) => {
            const copy = [...(sp[sectionKey] as DBUPhoto[])];
            const idx = copy.findIndex((x) => x === p);
            if (idx >= 0) copy[idx] = { ...p, _id: created._id, src: created.src, data: created.src };
            return { ...sp, [sectionKey]: copy };
          });
        } else {
          const before = prevMap.get(p._id);
          if (
            before &&
            (before.caption !== p.caption ||
              before.description !== p.description ||
              before.includeInSummary !== p.includeInSummary ||
              before.figureNumber !== p.figureNumber)
          ) {
            try {
              await updatePhoto(p._id, {
                caption: p.caption,
                description: p.description,
                includeInSummary: p.includeInSummary,
                figureNumber: p.figureNumber,
              });
            } catch (e: any) {
              const msg = String(e?.message || e || "");
              if (/not\s*found/i.test(msg)) {
                // Record disappeared on server; recreate it and update local state
                try {
                  const created = await createPhoto({
                    name: p.name || "Photo",
                    data: p.src || p.data,
                    reportId: form.reportId,
                    section: sectionKey as string,
                    includeInSummary: p.includeInSummary,
                    caption: p.caption,
                    description: p.description,
                    figureNumber: p.figureNumber,
                  });
                  setSectionPhotos((sp) => {
                    const copy = [...(sp[sectionKey] as DBUPhoto[])];
                    const idx = copy.findIndex((x) => x === p || x._id === p._id);
                    if (idx >= 0) copy[idx] = { ...p, _id: created._id, src: created.src, data: created.src };
                    return { ...sp, [sectionKey]: copy };
                  });
                } catch {
                  // swallow; will be retried on next user change
                }
              } else {
                // rethrow other errors (auth/network)
                throw e;
              }
            }
          }
        }
      }
    };
  }

  const setPhotoBucket =
    (key: keyof typeof sectionPhotos) =>
    (p: DBUPhoto[]) =>
      makePersistingSetter(key)(p);

  /* ---------------- Render ---------------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-[#78c850]/5">
      {/* Fixed Header with improved styling */}
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm shadow-md border-b border-gray-200 z-40">
        <div className="container mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="w-10 h-10 rounded-xl grid place-items-center hover:opacity-80 transition-opacity">
                <Image src="/logo.png" alt="nineKiwi_logo" width={40} height={40} priority />
              </Link>
              <h1 className="text-xl sm:text-2xl font-heading font-bold text-gray-900">
                nine<span className="text-[#78c850]">kiwi</span> <span className="hidden sm:inline text-gray-700">Report Generator</span>
              </h1>
            </div>

            {/* Hamburger Menu Button */}
            <button 
              disabled={pdfGenerating}
              aria-label="Open main menu"
              className="p-2.5 rounded-lg text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#78c850] transition-colors disabled:opacity-50"
              onClick={() => setMenuOpen(true)}
            >
              <svg width="24" height="20" viewBox="0 0 28 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="3" width="24" height="2.5" rx="1.25" fill="currentColor"/>
                <rect x="2" y="9.25" width="24" height="2.5" rx="1.25" fill="currentColor"/>
                <rect x="2" y="15.5" width="24" height="2.5" rx="1.25" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Slide-over Menu with improved design */}
      {menuOpen && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-2xl flex flex-col">
            {/* Menu Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <span className="text-lg font-semibold text-gray-900">Menu</span>
              <button 
                aria-label="Close menu" 
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors" 
                onClick={() => setMenuOpen(false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            {/* User Profile Section */}
            {user && (
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                  <span className="inline-flex h-12 w-12 rounded-full overflow-hidden bg-[#78c850]/10 border-2 border-[#78c850]/20">
                    {avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                    ) : (
                      <span className="h-full w-full grid place-items-center text-gray-900 font-semibold text-base">
                        {(user?.name || "U").slice(0, 1).toUpperCase()}
                      </span>
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-gray-900 truncate">{user?.name}</div>
                    <div className="text-xs text-gray-600 truncate">{user?.email}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Links */}
            <nav className="flex-1 overflow-y-auto px-6 py-4">
              <div className="flex flex-col gap-1">
                <Link href="/" className="px-4 py-2.5 rounded-lg hover:bg-gray-100 text-gray-900 font-medium transition-colors" onClick={() => setMenuOpen(false)}>Home</Link>
                {/** Report Tool link removed on report page */}
                <Link href="/account" className="px-4 py-2.5 rounded-lg hover:bg-gray-100 text-gray-900 font-medium transition-colors" onClick={() => setMenuOpen(false)}>Account</Link>
                {/** Payments link removed on report page */}
                <Link href="/docs" className="px-4 py-2.5 rounded-lg hover:bg-gray-100 text-gray-900 font-medium transition-colors" onClick={() => setMenuOpen(false)}>My Documents</Link>
                {user?.role === "admin" && (
                  <Link href="/admin" className="px-4 py-2.5 rounded-lg hover:bg-gray-100 text-gray-900 font-medium transition-colors" onClick={() => setMenuOpen(false)}>Admin Dashboard</Link>
                )}
              </div>
            </nav>

            {/* Auth Actions */}
            <div className="px-6 py-4 border-t border-gray-200">
              {!user ? (
                <div className="flex flex-col gap-2">
                  <Link href="/login" className="px-4 py-2.5 rounded-lg bg-[#78c850] hover:bg-[#68b840] text-white font-semibold text-center transition-colors" onClick={() => setMenuOpen(false)}>Login</Link>
                  <Link href="/signup" className="px-4 py-2.5 rounded-lg border-2 border-gray-300 hover:bg-gray-50 text-gray-900 font-semibold text-center transition-colors" onClick={() => setMenuOpen(false)}>Sign up</Link>
                </div>
              ) : (
                <button 
                  onClick={() => { setMenuOpen(false); logout(); }} 
                  className="w-full px-4 py-2.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-semibold transition-colors"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content with top padding to account for fixed header */}
      <main className="container mx-auto px-4 sm:px-6 py-8 pt-24">
        {!disclaimerAccepted && !disclaimerDismissed && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
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
                  NINEKIWI.COM provides tools for generating field inspection and construction progress reports. All information, data entries, and photographs included in the reports are provided solely by the user, field inspector, or the company using the application. NINEKIWI.COM is not responsible for the accuracy, completeness, or appropriateness of any content or images entered or generated through the platform. It is the sole responsibility of the user, inspector, or company to verify and confirm the accuracy of all information contained in the generated reports before using, distributing, or relying on them for any purpose.
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
                  onClick={() => { try { localStorage.setItem("nk_disclaimer_accepted", "1"); } catch {}; setDisclaimerAccepted(true); }}
                >
                  I Understand
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT: FORM */}
          <section className="space-y-6">
            <ProgressBar percent={mounted ? filledPercent : 0} />

            {/* Field Condition Summary Section */}
            <div className="form-section bg-white rounded-xl p-6 shadow-sm border border-gray-100 fade-in">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200">Field Condition Summary</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Purpose of Field Visit */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="purposeOfFieldVisit">
                    PURPOSE OF FIELD VISIT
                  </label>
                  <div className="relative w-full sm:max-w-md md:max-w-lg min-w-0">
                    <select
                      id="purposeOfFieldVisit"
                      name="purposeOfFieldVisit"
                      aria-invalid={purposeTouched && !form.purposeOfFieldVisit}
                      aria-describedby="purposeHelp"
                      onBlur={() => setPurposeTouched(true)}
                      className={`peer block w-full min-w-0 appearance-none rounded-lg bg-white px-4 py-2.5 pr-10 text-sm text-gray-900 shadow-sm transition whitespace-nowrap text-ellipsis focus:outline-none border ${
                        purposeTouched && !form.purposeOfFieldVisit
                          ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                          : 'border-gray-300 focus:border-[#78c850] focus:ring-2 focus:ring-[#78c850]/40'
                      }`}
                      value={form.purposeOfFieldVisit}
                      onChange={(e) =>
                        updateField(
                          "purposeOfFieldVisit",
                          e.target.value as FormData["purposeOfFieldVisit"]
                        )
                      }
                    >
                      <option value="" disabled>
                        Select purpose
                      </option>
                      <option value="General Field Inspection">General Field Inspection</option>
                      <option value="Construction Progress">Construction Progress</option>
                      <option value="Structural Condition Survey">Structural Condition Survey</option>
                      <option value="Building Inspection">Building Inspection</option>
                      <option value="Car Garage Inspection">Car Garage Inspection</option>
                    </select>
                    <svg
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 peer-focus:text-[#78c850]"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <p id="purposeHelp" className={`mt-1 text-xs md:w-1/2 ${purposeTouched && !form.purposeOfFieldVisit ? 'text-red-600' : 'text-gray-500'}`}>
                    {purposeTouched && !form.purposeOfFieldVisit ? 'Please select a purpose.' : 'Choose the primary purpose of this inspection.'}
                  </p>
                </div>

                {/* Report ID */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="reportId">
                    Report ID (If any)
                  </label>
                  <input
                    id="reportId"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#78c850] focus:border-transparent transition-shadow"
                    placeholder="1234"
                    value={form.reportId}
                    onChange={(e) => updateField("reportId", e.target.value)}
                  />
                </div>

                {/* Inspector Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="inspectorName">
                    Name of Inspector
                  </label>
                  <input
                    id="inspectorName"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#78c850] focus:border-transparent transition-shadow"
                    placeholder="Inspector name"
                    value={form.inspectorName}
                    onChange={(e) => updateField("inspectorName", e.target.value)}
                  />
                </div>

                {/* Company Address */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="nameandAddressOfCompany">
                    Address of Inspection Company
                  </label>
                  <input
                    id="nameandAddressOfCompany"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#78c850] focus:border-transparent transition-shadow"
                    placeholder="Company name and full address"
                    value={form.nameandAddressOfCompany}
                    onChange={(e) => updateField("nameandAddressOfCompany", e.target.value)}
                  />
                </div>

                {/* Client Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="clientName">
                    Client / Owner NAME
                  </label>
                  <input
                    id="clientName"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#78c850] focus:border-transparent transition-shadow"
                    placeholder="Owner name"
                    value={form.clientName}
                    onChange={(e) => updateField("clientName", e.target.value)}
                  />
                </div>

                {/* Company Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="companyName">
                    Inspection Company Name
                  </label>
                  <input
                    id="companyName"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#78c850] focus:border-transparent transition-shadow"
                    placeholder="Enter company name"
                    value={form.companyName}
                    onChange={(e) => updateField("companyName", e.target.value)}
                  />
                </div>

                {/* Contact Phone */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="contactPhone">
                    Phone Number of Inspection Company
                  </label>
                  <input
                    id="contactPhone"
                    type="tel"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#78c850] focus:border-transparent transition-shadow"
                    placeholder="+1 555 000 000"
                    value={form.contactPhone}
                    onChange={(e) => updateField("contactPhone", e.target.value)}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="contactEmail">
                    Email of Inspection Company
                  </label>
                  <input
                    id="contactEmail"
                    type="email"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#78c850] focus:border-transparent transition-shadow"
                    placeholder="name@gmail.com"
                    value={form.contactEmail}
                    onChange={(e) => updateField("contactEmail", e.target.value)}
                  />
                </div>

                {/* Inspection Date */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="inspectionDate">
                    Date of Inspection
                  </label>
                  <input
                    id="inspectionDate"
                    type="date"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#78c850] focus:border-transparent transition-shadow"
                    value={form.inspectionDate}
                    onChange={(e) => updateField("inspectionDate", e.target.value)}
                  />
                </div>

                {/* Start Time */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="observationTime">
                    Start Time of Inspection
                  </label>
                  <input
                    id="observationTime"
                    type="time"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#78c850] focus:border-transparent transition-shadow"
                    value={form.startInspectionTime}
                    onChange={(e) => updateField("startInspectionTime", e.target.value)}
                  />
                  <span className="text-xs text-gray-500 mt-1.5 block">
                    {mounted && form.startInspectionTime && ` (${formatTime12(form.startInspectionTime)})`}
                  </span>
                </div>

                {/* Location */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="location">
                    Address of Inspection Property
                  </label>
                  <input
                    id="location"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#78c850] focus:border-transparent transition-shadow"
                    placeholder="Ambedkar Nagar Gali No. 4, Jwalapur, Haridwar"
                    value={form.location}
                    onChange={(e) => updateField("location", e.target.value)}
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="city">
                    City
                  </label>
                  <input
                    id="city"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#78c850] focus:border-transparent transition-shadow"
                    placeholder="New York"
                    value={form.city}
                    onChange={(e) => updateField("city", e.target.value)}
                  />
                </div>

                {/* State */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="state">
                    State
                  </label>
                  <input
                    id="state"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#78c850] focus:border-transparent transition-shadow"
                    placeholder="New Jersey"
                    value={form.state}
                    onChange={(e) => updateField("state", e.target.value)}
                  />
                </div>

                {/* Country */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="country">
                    Country
                  </label>
                  <input
                    id="country"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#78c850] focus:border-transparent transition-shadow"
                    placeholder="USA"
                    value={form.country}
                    onChange={(e) => updateField("country", e.target.value)}
                  />
                </div>

                {/* Zip Code */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="zipCode">
                    Zip Code
                  </label>
                  <input
                    id="zipCode"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#78c850] focus:border-transparent transition-shadow"
                    placeholder="XXXXX"
                    value={form.zipCode}
                    onChange={(e) => updateField("zipCode", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Weather Section */}
            <div className="form-section bg-white rounded-xl p-6 shadow-sm border border-gray-100 fade-in">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200">Weather Conditions</h2>
              
              <WeatherPanel
                form={form}
                onField={(key, value) => updateField(key as keyof FormData, value as any)}
                onFetched={(w) => {
                  updateField("temperature", String(w.temperature));
                  updateField("humidity", String(w.humidity));
                  updateField("windSpeed", String(w.windSpeed));
                  updateField("weatherDescription", w.description as string);
                }}
              />
              
              <MapCard
                className="mt-5"
                address={
                  [form.streetAddress, form.city, form.state, form.country, form.zipCode]
                    .filter(Boolean)
                    .join(", ") || form.location
                }
                onCoords={(lat, lon) => { updateField("lat", String(lat)); updateField("lon", String(lon)); }}
              />
              
              {/* Map PDF controls removed */}

              <div className="mt-5">
                <FlexibleAnswer
                  id="weatherConditions"
                  label="Any Weather Interruption"
                  value={form.weatherConditions}
                  onChange={(m, v) => updateFlex("weatherConditions", m, v)}
                  noteOnValue="Yes"
                  noteValue={form.weatherConditionsNote}
                  onNoteChange={(t) => updateField("weatherConditionsNote", t)}
                />
              </div>
            </div>

            {/* Background Section */}
            <div className="form-section bg-white rounded-xl p-6 shadow-sm border border-gray-100 fade-in">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200">Structural Condition Background OR History</h2>

              <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="backgroundManual">
                Below (optional)
              </label>
              <textarea
                id="backgroundManual"
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#78c850] focus:border-transparent transition-shadow resize-none"
                placeholder="Add any project context, scope, prior inspections, approvals, etc."
                value={form.backgroundManual}
                onChange={(e) => updateField("backgroundManual", e.target.value)}
              />

              <div className="mt-4 flex gap-3">
                <button 
                  disabled={pdfGenerating}
                  onClick={makeAutoBackground}
                  className="bg-[#78c850] hover:bg-[#68b840] text-white font-semibold py-2.5 px-5 rounded-lg transition-colors disabled:opacity-50"
                  type="button"
                >
                  Auto-generate Background
                </button>
                <input
                  readOnly
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                  value={form.backgroundAuto}
                  placeholder="Auto background will appear here"
                />
              </div>

              <div className="mt-5">
                <SectionPhotos
                  title="Existing Condition"
                  photos={sectionPhotos.background}
                  setPhotos={setPhotoBucket("background")}
                                  />
              </div>
            </div>

            {/* Safety & Compliance */}
            <div className="form-section bg-white rounded-xl p-6 shadow-sm border border-gray-100 fade-in">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200">Safety & Compliance</h2>
              <div className="space-y-5">
                <FlexibleAnswer
                  id="safetyCompliance"
                  label="All safety protocols & PPE followed?"
                  value={form.safetyCompliance}
                  onChange={(m, v) => updateFlex("safetyCompliance", m, v)}
                  noteValue={form.safetyComplianceNote}
                  onNoteChange={(t) => updateField("safetyComplianceNote", t)}
                />
                <FlexibleAnswer
                  id="safetySignage"
                  label="Safety signage & access control in place?"
                  value={form.safetySignage}
                  onChange={(m, v) => updateFlex("safetySignage", m, v)}
                  noteValue={form.safetySignageNote}
                  onNoteChange={(t) => updateField("safetySignageNote", t)}
                />
              </div>
            </div>

            {/* Personnel & Work Progress (removed/hidden) */}
            <div className="hidden form-section bg-white rounded-xl p-6 shadow-sm border border-gray-100 fade-in">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200">
                Personnel & Work Progress
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">All workers present & on time?</label>
                  <div className="flex gap-4">
                    {["Yes", "No"].map((v) => (
                      <label key={v} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="workerAttendance"
                          value={v}
                          className="w-4 h-4 border-gray-300 text-[#78c850] focus:ring-[#78c850]"
                          checked={form.workerAttendance === v}
                          onChange={(e) => updateField("workerAttendance", e.target.value)}
                        />
                        <span className="text-sm font-medium text-gray-700">{v}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Progress vs schedule</label>
                  <div className="flex gap-4">
                    {["Ahead", "On Track", "Behind"].map((v) => (
                      <label key={v} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="scheduleCompliance"
                          value={v}
                          className="w-4 h-4 border-gray-300 text-[#78c850] focus:ring-[#78c850]"
                          checked={form.scheduleCompliance === v}
                          onChange={(e) => updateField("scheduleCompliance", e.target.value)}
                        />
                        <span className="text-sm font-medium text-gray-700">{v}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Materials available & usable?</label>
                  <div className="flex gap-4">
                    {["Yes", "Partial", "No"].map((v) => (
                      <label key={v} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="materialAvailability"
                          value={v}
                          className="w-4 h-4 border-gray-300 text-[#78c850] focus:ring-[#78c850]"
                          checked={form.materialAvailability === v}
                          onChange={(e) => updateField("materialAvailability", e.target.value)}
                        />
                        <span className="text-sm font-medium text-gray-700">{v}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <SectionPhotos
                  title="Inspection / Construction Progress / Field Observation"
                  photos={sectionPhotos.work}
                  setPhotos={setPhotoBucket("work")}
                />
              </div>
            </div>

            {/* Field Observation */}
            <div className="form-section bg-white rounded-xl p-6 shadow-sm border border-gray-100 fade-in">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200">Field Observation</h2>

              <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="fieldObservationText">
                Field Observation 
              </label>
              <textarea
                id="fieldObservationText"
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#78c850] focus:border-transparent transition-shadow resize-none"
                placeholder="Summarize key on-site observations, hazards, deviations, or noteworthy progress."
                value={form.fieldObservationText}
                onChange={(e) => updateField("fieldObservationText", e.target.value)}
              />

              <div className="mt-5">
                <SectionPhotos
                  title="Field Observation Photos"
                  photos={sectionPhotos.fieldObservation}
                  setPhotos={setPhotoBucket("fieldObservation")}
                                  />
              </div>
            </div>

            {/* Equipment Section */}
            <div className="form-section bg-white rounded-xl p-6 shadow-sm border border-gray-100 fade-in">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200">
                Inspection Support Equipment (if any)
              </h2>

              <div className="mt-4">
                <SectionPhotos
                  title=""
                  photos={sectionPhotos.equipment}
                  setPhotos={setPhotoBucket("equipment")}
                                  />
              </div>
            </div>

            {/* Notes & Summary */}
            <div className="form-section bg-white rounded-xl p-6 shadow-sm border border-gray-100 fade-in">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200">
                Additional Notes (if any)
              </h2>
              <div className="space-y-5">
                {(
                  [
                    ["additionalComments", "Additional comments / observations", ""],
                    ["inspectorSummary", "Inspector's Summary (short)", ""]
                  ] as const
                ).map(([id, label, ph]) => (
                  <div key={id}>
                    <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor={id}>
                      {label}
                    </label>
                    <textarea
                      id={id}
                      rows={3}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#78c850] focus:border-transparent transition-shadow resize-none"
                      placeholder={ph}
                      value={form[id as keyof FormData] as string}
                      onChange={(e) => updateField(id as keyof FormData, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Images */}
            <div className="form-section bg-white rounded-xl p-6 shadow-sm border border-gray-100 fade-in">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200">
                Add more Photos (optional)
              </h2>
              <SectionPhotos
                title=""
                photos={sectionPhotos.additional}
                setPhotos={setPhotoBucket("additional")}
                              />
            </div>

            <SignaturePadBox
              signatureData={signatureData}
              setSignatureData={setSignatureData}
              value={form.signatureDateTime}
              onDate={(v) => updateField("signatureDateTime", v)}
              signer={form.inspectorName}
            />

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 no-print">
              <button 
                onMouseEnter={() => warmupExportLibs()} 
                onFocus={() => warmupExportLibs()} 
                disabled={pdfGenerating}
                onClick={async () => { 
                  setPdfGenerating(true); 
                  setPdfElapsed(0); 
                  const timer = setInterval(() => setPdfElapsed((s) => s + 1), 1000);
                  const photos = { ...adaptedSectionPhotos } as any;
                  try { 
                    await generateFullReportPDF(form as any, photos as any, signatureData, undefined, { includeSiteMap: false }); 
                  } catch (e) {
                    console.error("PDF generation failed", e);
                    alert("Failed to generate PDF. Please try again or try fewer/lower-res photos.");
                  } finally { 
                    clearInterval(timer); 
                    setPdfGenerating(false); 
                  }
                }}
                className="flex-1 bg-[#78c850] hover:bg-[#68b840] text-white font-bold py-3.5 px-6 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {pdfGenerating ? `Generating... ${pdfElapsed}s` : "Generate PDF Report"}
              </button>

              <button 
                onMouseEnter={() => warmupExportLibs()} 
                onFocus={() => warmupExportLibs()}
                disabled={pdfGenerating}
                onClick={async () => {
                  setPdfGenerating(true);
                  setPdfElapsed(0);
                  const timer = setInterval(() => setPdfElapsed((s) => s + 1), 1000);
                  const photos = { ...adaptedSectionPhotos } as any;
                  try {
                    await generateFullReportDOCX(form as any, photos as any, signatureData, undefined, { includeSiteMap: false });
                  } finally {
                    clearInterval(timer);
                    setPdfGenerating(false);
                  }
                }}
                className="flex-1 bg-gray-900 hover:bg-gray-800 text-white font-bold py-3.5 px-6 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {pdfGenerating ? `Preparing... ${pdfElapsed}s` : "Download Word Report"}
              </button>
            </div>
          </section>

          {/* RIGHT: PREVIEW + AUTO SUMMARY */}
          <aside className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 sticky top-24">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-3 border-b border-gray-200">Live Preview</h2>

              <ReportPreview form={form} sectionPhotos={sectionPhotos} signatureData={signatureData} />

              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Auto-Generated Summary</h3>
                <AutoSummary form={form} photos={summaryPhotosU} />
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Voice to Text floating mic */}
      <VoiceCapture />
      
      {/* Offline Indicator */}
      {mounted && !isOnline && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-yellow-50 text-yellow-900 border border-yellow-300 px-4 py-3 rounded-lg shadow-lg font-medium">
          Are you offline ?? (Progress is saved locally).
        </div>
      )}

      {/* PDF Generation Overlay */}
      {pdfGenerating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm no-print" role="dialog" aria-modal="true" aria-label={exportMode === "docx" ? "Preparing Word" : "Generating PDF"}>
          <div className="bg-white border border-gray-200 rounded-xl shadow-xl p-6 w-[90vw] max-w-md text-center">
            <div className="mx-auto h-12 w-12 mb-4 text-[#78c850]">
              <svg className="animate-spin h-12 w-12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
            </div>
            <div className="text-lg font-semibold text-gray-900">{exportMode === "docx" ? "Preparing Word report" : "Generating PDF report"}</div>
            <div className="mt-1 text-sm text-gray-600">Rendering photos and layout. Please don’t close this tab.</div>
            <div className="mt-3 text-sm font-medium text-gray-700">Elapsed: {pdfElapsed}s</div>
          </div>
        </div>
      )}
    </div>
  );
}






