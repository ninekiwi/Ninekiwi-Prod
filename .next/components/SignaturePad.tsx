// components/SignaturePad.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useRef, useState } from "react";

type Props = {
  signatureData: string | null;
  setSignatureData: (v: string | null) => void;
  value: string;
  onDate: (v: string) => void;
  signer: string;
};

export default function SignaturePadBox({ signatureData, setSignatureData, value, onDate, signer }: Props) {
  const [mode, setMode] = useState<"draw" | "upload">("draw");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const pos = (e: MouseEvent | TouchEvent) => {
      const r = canvas.getBoundingClientRect();
      const x = "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const y = "touches" in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      return { x: x - r.left, y: y - r.top };
    };

    const start = (e: any) => { drawing.current = true; draw(e); };
    const draw = (e: any) => {
      if (!drawing.current || !ctx) return;
      const p = pos(e);
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.strokeStyle = "#1A202C";
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
    };
    const stop = () => { drawing.current = false; ctx?.beginPath(); };

    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stop);
    canvas.addEventListener("mouseleave", stop);
    canvas.addEventListener("touchstart", start, { passive: true });
    canvas.addEventListener("touchmove", draw, { passive: true });
    canvas.addEventListener("touchend", stop);

    return () => {
      canvas.removeEventListener("mousedown", start);
      canvas.removeEventListener("mousemove", draw);
      canvas.removeEventListener("mouseup", stop);
      canvas.removeEventListener("mouseleave", stop);
      canvas.removeEventListener("touchstart", start);
      canvas.removeEventListener("touchmove", draw);
      canvas.removeEventListener("touchend", stop);
    };
  }, []);

  const clear = () => {
    const c = canvasRef.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    setSignatureData(null);
  };

  const save = () => {
    const c = canvasRef.current;
    if (!c) return;
    setSignatureData(c.toDataURL("image/png"));
  };

  const handleUpload = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => setSignatureData(String(e.target?.result || ""));
    reader.readAsDataURL(file);
  };

  return (
    <div className="form-section bg-white rounded-xl p-6 shadow-sm fade-in">
      <h2 className="text-xl font-semibold text-kiwi-dark mb-4">Signature of Inspector</h2>

      <div className="flex gap-3 mb-3">
        <button
          type="button"
          onClick={() => setMode("draw")}
          className={`flex-1 ${mode === "draw" ? "bg-kiwi-green" : "bg-gray-500"} text-white px-4 py-2 rounded-lg`}
        >
          Draw
        </button>
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={`flex-1 ${mode === "upload" ? "bg-kiwi-green" : "bg-gray-500"} text-white px-4 py-2 rounded-lg`}
        >
          Upload
        </button>
      </div>

      {mode === "draw" ? (
        <div>
          <canvas ref={canvasRef} width={500} height={180} className="signature-pad bg-gray-50 w-full max-w-xl rounded border" />
          <div className="flex gap-2 mt-2">
            <button type="button" onClick={clear} className="text-sm bg-gray-500 text-white px-3 py-1 rounded">Clear</button>
            <button type="button" onClick={save} className="text-sm bg-kiwi-green text-white px-3 py-1 rounded">Save</button>
          </div>
        </div>
      ) : (
        <div>
          <div className="border-2 border-dashed border-kiwi-green rounded-lg p-4 text-center">
            <input id="signatureImageUpload" type="file" accept="image/*" className="hidden" onChange={(e) => handleUpload(e.target.files?.[0])} />
            <button type="button" onClick={() => document.getElementById("signatureImageUpload")?.click()} className="bg-kiwi-green text-white px-3 py-1 text-sm rounded">
              Choose Image
            </button>
          </div>
          {signatureData && <img src={signatureData} className="max-h-20 border rounded mt-2" alt="Signature" />}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
        <div>
          <label className="block text-sm mb-2" htmlFor="signatureDateTime">Signature Date & Time</label>
          <input
            id="signatureDateTime"
            type="datetime-local"
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-kiwi-green"
            value={value}
            onChange={(e) => onDate(e.target.value)}
          />
        </div>

        {signatureData && (
          <div className="self-end text-sm text-kiwi-gray">
            <b>Signed By:</b> {signer || "Inspector"}
          </div>
        )}
      </div>
    </div>
  );
}
