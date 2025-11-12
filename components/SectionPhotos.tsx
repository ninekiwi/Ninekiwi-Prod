// components/SectionPhotos.tsx

"use client";

import React, { useCallback, useRef, useState } from "react";
import { UPhoto } from "@/lib/types";

type Props = {
  title: string;
  photos: UPhoto[] | undefined;
  setPhotos: (p: UPhoto[]) => void;
  summaryToggle?: boolean;
  section?: string; // NEW: Track section name
};

export default function SectionPhotos({ title, photos, setPhotos, summaryToggle, section }: Props) {
  const safePhotos: UPhoto[] = Array.isArray(photos) ? photos : [];
  const [count, setCount] = useState(safePhotos.length);
  const fileRef = useRef<HTMLInputElement>(null);

  const renumber = useCallback(
    (arr: UPhoto[]) => arr.map((p, i) => ({ ...p, figureNumber: i + 1, section })),
    [section]
  );

  const addFiles = useCallback(
    (files: FileList | null) => {
      if (!files?.length) return;
      const readers = Array.from(files).map(
        (file) =>
          new Promise<UPhoto>((res) => {
            const r = new FileReader();
            r.onload = async () => {
              try {
                const src = String(r.result || "");
                // Downscale very large images to improve mobile stability
                const out = await new Promise<string>((done) => {
                  try {
                    const im = new Image();
                    im.onload = () => {
                      try {
                        const maxW = 2000;
                        const maxH = 2000;
                        let w = im.naturalWidth || im.width || 1;
                        let h = im.naturalHeight || im.height || 1;
                        const scale = Math.min(1, Math.min(maxW / w, maxH / h));
                        if (scale < 1) { w = Math.round(w * scale); h = Math.round(h * scale); }
                        const c = document.createElement('canvas');
                        c.width = w; c.height = h;
                        const ctx = c.getContext('2d');
                        if (ctx) ctx.drawImage(im, 0, 0, w, h);
                        const dst = c.toDataURL('image/jpeg', 0.88);
                        done(dst || src);
                      } catch { done(src); }
                    };
                    im.onerror = () => done(src);
                    im.src = src;
                  } catch { done(src); }
                });
                res({ name: file.name, data: out, section });
              } catch {
                res({ name: file.name, data: String(r.result || ""), section });
              }
            };
            r.readAsDataURL(file);
          })
      );
      Promise.all(readers).then((arr) => {
        const next = renumber([...safePhotos, ...arr]);
        setPhotos(next);
        setCount(next.length);
      });
    },
    [safePhotos, renumber, setPhotos, section]
  );
  const removeAt = (idx: number) => {
    const next = renumber(safePhotos.filter((_, i) => i !== idx));
    setPhotos(next);
    setCount(next.length);
  };

  const captureFromCamera = async () => {
    try {
      const input = document.createElement("input");
      input.type = "file";
      // Prefer opening camera on mobile devices
      input.accept = "image/*;capture=camera";
      // @ts-ignore
      input.capture = "environment";
      input.style.position = "fixed";
      input.style.left = "-10000px";
      input.style.top = "-10000px";
      document.body.appendChild(input);
      input.onchange = (ev: any) => {
        try {
          ev?.preventDefault?.();
          ev?.stopPropagation?.();
          addFiles(ev.target.files);
        } finally {
          input.remove();
        }
      };
      input.click();
    } catch {
      fileRef.current?.click();
    }
  };

  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm">
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center justify-between">
        <span className="flex items-center gap-2">
          <svg className="w-6 h-6 text-kiwi-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          {title}
        </span>
        <span className="text-sm font-normal text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          {count} {count === 1 ? "photo" : "photos"}
        </span>
      </h3>

      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex-1 bg-kiwi-green text-white px-4 py-3 rounded-lg font-semibold hover:bg-[#78c850] transition-all hover:scale-105 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add photo
        </button>
        <button
          type="button"
          onClick={captureFromCamera}
          className="flex-1 bg-[#78c850] text-white px-4 py-3 rounded-lg font-semibold hover:bg-[#78c850] transition-all hover:scale-105 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Take photo
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        // Hint to open camera directly on mobile (iOS/Android)
        accept="image/*;capture=camera"
        // @ts-ignore
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => {
          try {
            e.preventDefault();
            e.stopPropagation();
          } catch {}
          addFiles(e.target.files);
          e.currentTarget.value = "";
        }}
        onKeyDown={(e) => {
          // Prevent accidental form submissions on Enter in rare wrappers
          e.preventDefault();
        }}
      />

      <div className="space-y-4">
        {safePhotos.map((p, idx) => (
          <div
            key={idx}
            className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50 hover:border-kiwi-green transition-colors"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.data}
              alt={p.name}
              className="w-full h-48 object-cover rounded-lg mb-3 shadow-sm"
            />

            <div className="bg-white p-4 rounded-lg space-y-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-gray-700 bg-kiwi-green/10 px-3 py-1 rounded-full">
                  Photo {p.figureNumber ?? idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeAt(idx)}
                  aria-label={`Remove photo ${idx + 1}`}
                  className="text-red-500 hover:text-red-700 font-semibold text-sm bg-red-50 px-3 py-1 rounded-lg hover:bg-red-100 transition-colors"
                >
                  Remove
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  placeholder="Enter detailed description..."
                  value={p.description ?? ""}
                  rows={2}
                  className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-kiwi-green focus:border-transparent resize-none"
                  onChange={(e) => {
                    const next = [...safePhotos];
                    next[idx] = { ...next[idx], description: e.currentTarget.value ?? "" };
                    setPhotos(renumber(next));
                    setCount(next.length);
                  }}
                />
              </div>

              {/* Removed "Include in summary" toggle per request */}
              <div className="h-1"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}








