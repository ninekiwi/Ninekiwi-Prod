"use client";
import React, { useEffect, useRef, useState } from "react";

type UPhoto = {
  name: string;
  data: string;
  caption?: string;
  description?: string;
  includeInSummary?: boolean;
  figureNumber?: number;
};

export default function PhotoUpload({
  photos,
  setPhotos,
}: {
  photos: UPhoto[];
  setPhotos: (cb: (prev: UPhoto[]) => UPhoto[]) => void;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
    } catch (e) {
      console.error(e);
      alert("Unable to access camera.");
    }
  };

  const captureFrame = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const data = canvas.toDataURL("image/jpeg", 0.92);
    setPhotos((prev) => [...prev, { name: `camera_${Date.now()}.jpg`, data }]);
  };

  const addFiles = async (files: FileList | null) => {
    if (!files) return;
    const arr: UPhoto[] = [];
    for (const f of Array.from(files)) {
      const buf = await f.arrayBuffer();
      const b64 = `data:${f.type};base64,${btoa(String.fromCharCode(...new Uint8Array(buf)))}`;
      arr.push({ name: f.name, data: b64 });
    }
    setPhotos((prev) => {
      const start = prev.length;
      return [...prev, ...arr].map((p, i) => ({ ...p, figureNumber: i + 1 }));
    });
  };

  return (
    <div className="form-section p-5">
      <h3 className="text-lg font-semibold text-kiwi-dark mb-3">Main Photo Uploader</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Files */}
        <div className="p-4 border-2 border-dashed rounded-lg">
          <div className="mb-2 font-semibold">Upload from files</div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
          <button className="btn-primary" onClick={() => fileRef.current?.click()}>
            Choose Images
          </button>
        </div>

        {/* Camera */}
        <div className="p-4 border-2 border-dashed rounded-lg">
          <div className="mb-2 font-semibold">Take live photo (separate from uploads)</div>
          {!stream ? (
            <button className="btn-primary" onClick={startCamera}>Start Camera</button>
          ) : (
            <>
              <video ref={videoRef} autoPlay playsInline className="w-full rounded-md" />
              <div className="mt-2 flex gap-2">
                <button className="btn-primary" onClick={captureFrame}>Capture</button>
                <button
                  className="btn-primary"
                  onClick={() => {
                    stream?.getTracks().forEach((t) => t.stop());
                    setStream(null);
                  }}
                >
                  Stop
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
