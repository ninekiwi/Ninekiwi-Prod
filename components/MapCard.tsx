// components/MapCard.tsx
"use client";
import { useEffect, useMemo, useRef, useState } from "react";

type Props = { address: string; onCoords?: (lat: number, lon: number) => void; className?: string; };
type Coords = { lat: number; lon: number };

export default function MapCard({ address, onCoords, className }: Props) {
  const [coords, setCoords] = useState<Coords | null>(null);
  const cancelRef = useRef(false);

  const embedSrc = useMemo(() => {
    const q = address?.trim();
    return q ? `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed` : "";
  }, [address]);

  useEffect(() => {
    cancelRef.current = false;
    const run = async () => {
      const q = address?.trim();
      if (!q) { setCoords(null); return; }
      try {
        const r = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`, { cache: 'no-store' });
        if (!r.ok) throw new Error(String(r.status));
        const j = await r.json();
        if (j?.success === false) {
          if (!cancelRef.current) setCoords(null);
          return;
        }
        const lat = Number(j?.lat);
        const lon = Number(j?.lon);
        if (!cancelRef.current) {
          if (Number.isFinite(lat) && Number.isFinite(lon)) {
            const c = { lat, lon } as Coords;
            setCoords(c); onCoords?.(c.lat, c.lon);
          } else {
            setCoords(null);
          }
        }
      } catch {
        if (!cancelRef.current) setCoords(null);
      }
    };
    run();
    return () => { cancelRef.current = true; };
  }, [address, onCoords]);

  const staticUrl = useMemo(() => {
    if (!coords) return "";
    const gkey = process.env.NEXT_PUBLIC_GOOGLE_STATIC_MAPS_KEY?.trim();
    if (gkey) {
      return `https://maps.googleapis.com/maps/api/staticmap?center=${coords.lat},${coords.lon}&zoom=15&size=1000x500&scale=2&maptype=roadmap&markers=color:green|${coords.lat},${coords.lon}&key=${gkey}`;
    }
    return `https://staticmap.openstreetmap.de/staticmap.php?center=${coords.lat},${coords.lon}&zoom=15&size=1000x500&markers=${coords.lat},${coords.lon},lightgreen-pushpin`;
  }, [coords]);

  if (!address?.trim()) return null;

  return (
    <div className={className}>
      <h3 className="text-lg font-semibold text-kiwi-dark mb-2">Site Map</h3>

      {embedSrc && (
        <div className="rounded-xl overflow-hidden border screen-only">
          <iframe title="site-map" src={embedSrc} className="w-full" style={{ height: 280, border: 0 }} loading="lazy" />
        </div>
      )}

      {staticUrl && (
        <div className="rounded-xl overflow-hidden border print-only">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={staticUrl} alt="Static site map" className="w-full h-[280px] object-cover" crossOrigin="anonymous" referrerPolicy="no-referrer" loading="eager" />
        </div>
      )}

      <style jsx>{`
        @media print { .screen-only { display: none !important; } .print-only { display: block !important; } }
        @media screen { .print-only { display: none; } }
      `}</style>
    </div>
  );
}
