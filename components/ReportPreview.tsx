"use client";

import React, { useMemo } from "react";
<<<<<<< HEAD
import { formatTime12 } from "@/lib/time";
=======
>>>>>>> test
import MapCard from "./MapCard";

/* ===== Types (keep aligned with page.tsx) ===== */
interface UPhoto {
  name: string;
  data: string;
  caption?: string;
  description?: string;
  includeInSummary?: boolean;
  figureNumber?: number;
}

type PhotoBuckets = Record<string, UPhoto[]>;

interface FormData {
  status?: "In Progress" | "Completed" | "On Track" | "";
  reportId?: string;
  inspectorName?: string;
  nameandAddressOfCompany?: string;
  clientName?: string;
  companyName?: string;
  contactPhone?: string;
  contactEmail?: string;
  inspectionDate?: string;
  startInspectionTime?: string;
  location?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  lat?: string | number;
  lon?: string | number;
  temperature?: string | number;
  humidity?: string | number;
  windSpeed?: string | number;
  weatherDescription?: string;
  weatherConditions?: string;
  safetyCompliance?: string;
  safetySignage?: string;
  scheduleCompliance?: string;
  materialAvailability?: string;
  workerAttendance?: string;
  numWorkers?: string | number;
  equipmentCondition?: string;
  additionalComments?: string;
  inspectorSummary?: string;
  recommendations?: string;
  backgroundManual?: string;
  backgroundAuto?: string;
  fieldObservationText?: string;
  signatureDateTime?: string;
}

interface ReportPreviewProps {
  form: FormData;
  sectionPhotos?: PhotoBuckets;
  signatureData?: string | null;
}

/* ===== Utils ===== */
function S(v: unknown): string {
  if (v == null) return "";
  const s = String(v).trim();
  return s;
}
function has(v: unknown): boolean {
  return S(v) !== "";
}
function formatTime(time?: string): string {
  const t = S(time);
  if (!t) return "";
<<<<<<< HEAD
  return formatTime12(t);
=======
  try {
    const d = new Date(`2000-01-01T${t}`);
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  } catch {
    return t;
  }
>>>>>>> test
}

/* ===== Status Badge ===== */
const StatusBadge: React.FC<{ status?: string }> = ({ status }) => {
  if (!status) return null;
  
  const getStatusColor = (s: string) => {
    switch (s) {
      case "Completed":
        return "bg-green-50 text-green-700 border-green-300";
      case "In Progress":
        return "bg-yellow-50 text-yellow-700 border-yellow-300";
      case "On Track":
        return "bg-kiwi-dark/10 text-kiwi-dark border-kiwi-dark/30";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <span className={`inline-flex items-center px-4 py-1.5 rounded-md text-sm font-medium border ${getStatusColor(status)}`}>
      {status}
    </span>
  );
};

/* ===== Line Component ===== */
const Line = React.memo<{ label: string; value?: React.ReactNode }>(({ label, value }) => {
  if (value == null) return null;
  const text = typeof value === "string" ? S(value) : value;
  if (text === "" || text == null) return null;

  return (
    <div className="flex flex-col sm:flex-row gap-2 py-2.5 px-1 border-b border-gray-100 last:border-0 hover:bg-kiwi-dark/5 transition-colors rounded">
      <dt className="font-semibold text-gray-700 sm:w-1/3">{label}</dt>
      <dd className="text-gray-600 sm:w-2/3">{text}</dd>
    </div>
  );
});
Line.displayName = "Line";

/* ===== Grid Line Component for Multi-column Layout ===== */
const GridLine = React.memo<{ label: string; value?: React.ReactNode }>(({ label, value }) => {
  if (value == null) return null;
  const text = typeof value === "string" ? S(value) : value;
  if (text === "" || text == null) return null;

  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-semibold text-kiwi-dark uppercase tracking-wide">{label}</dt>
      <dd className="text-sm text-gray-800 font-medium">{text}</dd>
    </div>
  );
});
GridLine.displayName = "GridLine";

/* ===== Section Component ===== */
const Section: React.FC<{ 
  title: string; 
  children?: React.ReactNode; 
  className?: string;
}> = ({ title, children, className = "" }) => {
  if (!children) return null;
  if (Array.isArray(children) && children.every((c) => c == null || c === false)) return null;

  return (
    <section
      className={[
        "bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden",
        "print:shadow-none print:border print:break-inside-avoid",
        className,
      ].join(" ")}
    >
      <div className="border-b border-kiwi-dark/30 bg-gradient-to-r from-kiwi-dark/5 to-transparent px-6 py-3">
        <h2 className="text-base font-semibold text-kiwi-dark tracking-tight">
          {title}
        </h2>
      </div>
      <div className="p-6">
        {children}
      </div>
    </section>
  );
};

/* ===== Photo Grid ===== */
const PhotoGrid = React.memo<{ photos: UPhoto[] }>(({ photos }) => {
  if (!photos?.length) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {photos.map((photo, idx) => (
        <figure
          key={`${photo.name}-${idx}`}
          className="border border-gray-200 rounded-lg overflow-hidden bg-white"
        >
          <div className="bg-gray-50 w-full aspect-[4/3] flex items-center justify-center p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.data}
              alt={photo.name || `photo_${idx + 1}`}
              className="max-h-full max-w-full object-contain"
              crossOrigin="anonymous"
              referrerPolicy="no-referrer"
              loading="eager"
            />
          </div>
          <figcaption className="px-4 py-3 border-t border-gray-200">
            <div className="text-sm font-semibold text-gray-900 mb-1">
              Photo {photo.figureNumber ?? idx + 1}
              {photo.caption ? `: ${photo.caption}` : ""}
            </div>
            {has(photo.description) && (
              <p className="text-xs text-gray-600 leading-relaxed mt-2">
                {photo.description}
              </p>
            )}
          </figcaption>
        </figure>
      ))}
    </div>
  );
});
PhotoGrid.displayName = "PhotoGrid";

/* ===== Main Component ===== */
export default function ReportPreview({ form, sectionPhotos, signatureData }: ReportPreviewProps) {
  const postalAddress = useMemo(() => {
    const parts = [
      form?.streetAddress,
      [form?.city, form?.state].filter(Boolean).join(", "),
      [form?.country, form?.zipCode].filter(Boolean).join(" "),
    ]
      .filter((x) => has(x))
      .join(", ");
    return parts;
  }, [form?.streetAddress, form?.city, form?.state, form?.country, form?.zipCode]);

  const anyLocationProvided = useMemo(
    () => has(form?.location) || has(postalAddress),
    [form?.location, postalAddress]
  );

  const hasWeatherData = useMemo(
    () => has(form?.temperature) || has(form?.humidity) || has(form?.windSpeed) || has(form?.weatherDescription),
    [form?.temperature, form?.humidity, form?.windSpeed, form?.weatherDescription]
  );

  const buckets: PhotoBuckets = useMemo(
    () =>
      sectionPhotos || {
        weather: [],
        safety: [],
        work: [],
        equipment: [],
        incidents: [],
        quality: [],
        notes: [],
        evidence: [],
        additional: [],
        background: [],
        fieldObservation: [],
      },
    [sectionPhotos]
  );

  const observationTime = useMemo(() => formatTime(form?.startInspectionTime), [form?.startInspectionTime]);
  const mapAddress = useMemo(() => (postalAddress ? postalAddress : S(form?.location)), [postalAddress, form?.location]);

  const handleCoords = (lat: number, lon: number) => {
    console.log(`Map coords in preview: ${lat}, ${lon}`);
  };

  const conclusionParts = useMemo(() => {
    const parts: string[] = [];
    if (has(form?.status)) parts.push(`Overall status: ${S(form?.status)}.`);
    if (has(form?.scheduleCompliance)) parts.push(`Schedule: ${S(form?.scheduleCompliance)}.`);
    if (has(form?.materialAvailability)) parts.push(`Materials: ${S(form?.materialAvailability)}.`);
    if (has(form?.safetyCompliance)) parts.push(`Safety: ${S(form?.safetyCompliance)}.`);
    return parts;
  }, [form?.status, form?.scheduleCompliance, form?.materialAvailability, form?.safetyCompliance]);

  const conclusionExtras = useMemo(() => {
    const arr: string[] = [];
    if (has(form?.additionalComments)) arr.push(`Notes & Recommendations: ${S(form?.additionalComments)}`);
    if (has(form?.inspectorSummary)) arr.push(`Inspector Summary: ${S(form?.inspectorSummary)}`);
    if (has(form?.recommendations)) arr.push(`Recommended Actions: ${S(form?.recommendations)}`);
    return arr;
  }, [form?.additionalComments, form?.inspectorSummary, form?.recommendations]);

  return (
    <div id="reportPreview" className="report-preview space-y-6 bg-transparent max-w-6xl mx-auto">
      
      {/* ===== Field Condition Summary ===== */}
      <Section title="Field Condition Summary">
        {form?.status && (
          <div className="mb-6 flex justify-end">
            <StatusBadge status={form.status} />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 pb-6 border-b-2 border-kiwi-dark/20">
<<<<<<< HEAD
          <GridLine label="Report ID (If any)" value={S(form?.reportId)} />
          <GridLine label="Name of Inspector" value={S(form?.inspectorName)} />
          <GridLine label="Inspection Date" value={S(form?.inspectionDate)} />
          <GridLine label="Start Time of Inspection" value={observationTime} />
        </div>

        <dl className="space-y-0">
          <Line label="Address of Inspection Company" value={S(form?.nameandAddressOfCompany)} />
          <Line label="Client / Owner Name" value={S(form?.clientName)} />
          <Line label="Inspection Company Name" value={S(form?.companyName)} />
          <Line label="Phone Number of Inspection Company" value={S(form?.contactPhone)} />
          <Line label="Email of Inspection Company" value={S(form?.contactEmail)} />
          <Line label="Address of Inspection Property" value={S(form?.location)} />
=======
          <GridLine label="Report ID" value={S(form?.reportId)} />
          <GridLine label="Inspector Name" value={S(form?.inspectorName)} />
          <GridLine label="Inspection Date" value={S(form?.inspectionDate)} />
          <GridLine label="Start Time" value={observationTime} />
        </div>

        <dl className="space-y-0">
          <Line label="Name and Address of Inspection Company" value={S(form?.nameandAddressOfCompany)} />
          <Line label="Client / Owner Name" value={S(form?.clientName)} />
          <Line label="Company Name" value={S(form?.companyName)} />
          <Line label="Phone Number of Inspection Company" value={S(form?.contactPhone)} />
          <Line label="Email of Inspection Company" value={S(form?.contactEmail)} />
          <Line label="Inspection Property Address" value={S(form?.location)} />
>>>>>>> test
        </dl>
      </Section>

      {/* ===== Weather Conditions ===== */}
      {(anyLocationProvided || hasWeatherData || (buckets.weather?.length ?? 0) > 0) && (
        <Section title="Weather Conditions">
          {postalAddress && (
            <div className="mb-6 p-4 bg-kiwi-dark/5 rounded-md border border-kiwi-dark/20">
              <Line label="Full Inspection Property Address" value={postalAddress} />
            </div>
          )}

          {hasWeatherData && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {has(form?.temperature) && (
                <GridLine label="Temperature" value={`${form?.temperature} °C`} />
              )}
              {has(form?.humidity) && (
                <GridLine label="Humidity" value={`${form?.humidity} %`} />
              )}
              {has(form?.windSpeed) && (
                <GridLine label="Wind Speed" value={`${form?.windSpeed} m/s`} />
              )}
              {has(form?.weatherDescription) && (
                <GridLine label="Description" value={S(form?.weatherDescription)} />
              )}
            </div>
          )}

          {mapAddress && (
            <div className="mb-6 rounded-md overflow-hidden border border-gray-200">
              <MapCard
                address={mapAddress}
                onCoords={handleCoords}
                className="nk-print-map w-full h-80"
              />
            </div>
          )}

          {(buckets.weather?.length ?? 0) > 0 && (
            <PhotoGrid photos={buckets.weather} />
          )}
        </Section>
      )}

      {/* ===== Background ===== */}
      {(has(form?.backgroundManual) || has(form?.backgroundAuto) || (buckets.background?.length ?? 0) > 0) && (
        <Section title="Background">
          {has(form?.backgroundManual) && (
            <div className="prose max-w-none mb-4">
              <p className="text-sm leading-relaxed text-gray-700 text-justify p-4 bg-kiwi-dark/5 rounded-md border-l-4 border-kiwi-dark">
                {S(form?.backgroundManual)}
              </p>
            </div>
          )}
          {has(form?.backgroundAuto) && (
            <div className="prose max-w-none mb-4">
              <p className="text-sm leading-relaxed text-gray-700 text-justify italic p-4 bg-blue-50 rounded-md border-l-4 border-blue-400">
                {S(form?.backgroundAuto)}
              </p>
            </div>
          )}
          {(buckets.background?.length ?? 0) > 0 && (
            <PhotoGrid photos={buckets.background} />
          )}
        </Section>
      )}

      {/* ===== Safety & Compliance ===== */}
      {(has(form?.safetyCompliance) || has(form?.safetySignage) || (buckets.safety?.length ?? 0) > 0) && (
        <Section title="Safety & Compliance">
          <dl className="space-y-0 mb-6">
            <Line label="All safety protocols & PPE followed?" value={S(form?.safetyCompliance)} />
            <Line label="Safety signage & access control in place?" value={S(form?.safetySignage)} />
          </dl>
          {(buckets.safety?.length ?? 0) > 0 && (
            <PhotoGrid photos={buckets.safety} />
          )}
        </Section>
      )}

<<<<<<< HEAD
      {/* Personnel & Work Progress section removed as requested */}
=======
      {/* ===== Personnel & Work Progress ===== */}
      {(has(form?.workerAttendance) || has(form?.scheduleCompliance) || has(form?.materialAvailability) || (buckets.work?.length ?? 0) > 0) && (
        <Section title="Personnel & Work Progress">
          <dl className="space-y-0 mb-6">
            <Line label="All workers present & on time?" value={S(form?.workerAttendance)} />
            <Line label="Progress vs schedule" value={S(form?.scheduleCompliance)} />
            <Line label="Materials available & usable?" value={S(form?.materialAvailability)} />
          </dl>
          {(buckets.work?.length ?? 0) > 0 && (
            <PhotoGrid photos={buckets.work} />
          )}
        </Section>
      )}
>>>>>>> test

      {/* ===== Field Observation ===== */}
      {(has(form?.fieldObservationText) || (buckets.fieldObservation?.length ?? 0) > 0) && (
        <Section title="Field Observation">
          {has(form?.fieldObservationText) && (
            <div className="prose max-w-none mb-4">
              <p className="text-sm leading-relaxed text-gray-700 text-justify p-4 bg-kiwi-dark/5 rounded-md border-l-4 border-kiwi-dark">
                {S(form?.fieldObservationText)}
              </p>
            </div>
          )}
          {(buckets.fieldObservation?.length ?? 0) > 0 && (
            <PhotoGrid photos={buckets.fieldObservation} />
          )}
        </Section>
      )}

      {/* ===== Inspection Support Equipment ===== */}
      {(buckets.equipment?.length ?? 0) > 0 && (
        <Section title="Inspection Support Equipment (if any)">
          <PhotoGrid photos={buckets.equipment} />
        </Section>
      )}

      {/* ===== Additional Inspection Notes ===== */}
      {(has(form?.additionalComments) || has(form?.inspectorSummary) || has(form?.recommendations) || (buckets.notes?.length ?? 0) > 0) && (
        <Section title="Additional Inspection Notes (if any)">
          <dl className="space-y-0 mb-6">
            <Line label="Additional comments / observations" value={S(form?.additionalComments)} />
            <Line label="Inspector's Summary (short)" value={S(form?.inspectorSummary)} />
            <Line label="Recommendations / next actions" value={S(form?.recommendations)} />
          </dl>
          {(buckets.notes?.length ?? 0) > 0 && (
            <PhotoGrid photos={buckets.notes} />
          )}
        </Section>
      )}

      {/* ===== Additional Images ===== */}
      {(buckets.additional?.length ?? 0) > 0 && (
        <Section title="Additional Images (optional)">
          <PhotoGrid photos={buckets.additional} />
        </Section>
      )}

      {/* ===== Signature ===== */}
      {signatureData && (
        <Section title="Signature of Inspector">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6 bg-kiwi-dark/5 rounded-md border-l-4 border-kiwi-dark">
            <div className="flex-shrink-0 p-4 bg-white rounded-md border-2 border-kiwi-dark/30 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={signatureData} 
                alt="Signature of Inspector" 
                className="max-h-20 object-contain" 
              />
            </div>
            <div className="flex-1">
              <div className="text-base font-semibold text-kiwi-dark mb-1">
                {S(form?.inspectorName) || "Inspector"}
              </div>
              <div className="text-sm text-gray-600">
                Signed on: {S(form?.signatureDateTime) || "—"}
              </div>
            </div>
          </div>
        </Section>
      )}

      {/* ===== Conclusion (Auto) ===== */}
      {(conclusionParts.length > 0 || conclusionExtras.length > 0) && (
        <Section title="Conclusion">
          <div className="prose max-w-none">
            {conclusionParts.length > 0 ? (
              <p className="text-sm leading-relaxed text-gray-800 text-justify">
                {conclusionParts.join(" ")}
              </p>
            ) : (
              <p className="text-sm leading-relaxed text-gray-600 text-justify">
                No critical blockers observed at the time of inspection. Continue to monitor schedule, safety, and materials.
              </p>
            )}
            {conclusionExtras.map((line, idx) => (
              <p key={idx} className="text-sm leading-relaxed text-gray-700 text-justify">
                {line}
              </p>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}
