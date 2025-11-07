"use client";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    webkitSpeechRecognition?: any;
    SpeechRecognition?: any;
  }
}

export default function VoiceCapture() {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recogRef = useRef<any>(null);
  const appendModeRef = useRef(true); // true=append, false=replace
  const wantRef = useRef(false); // whether user intends to keep mic on
  const lastEditableRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  // Track the last focused editable input/textarea so we don't lose the target
  useEffect(() => {
    function onFocusIn(e: Event) {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      const tag = t.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") {
        const el = t as HTMLInputElement | HTMLTextAreaElement;
        if (el.readOnly || (el as any).disabled) return;
        lastEditableRef.current = el;
      }
    }
    document.addEventListener("focusin", onFocusIn, true);
    return () => document.removeEventListener("focusin", onFocusIn, true);
  }, []);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSupported(!!SR);
    if (!SR) return;
    const r = new SR();
    r.lang = "en-US";
    r.continuous = true;
    r.interimResults = true;
    r.maxAlternatives = 1;

    r.onresult = (ev: any) => {
      try {
        const results: SpeechRecognitionResultList = ev.results;
        let finalText = "";
        for (let i = ev.resultIndex; i < results.length; i++) {
          const res = results[i];
          if (res.isFinal) finalText += res[0].transcript + " ";
        }
        finalText = finalText.trim();
        if (!finalText) return;
        // Prefer last focused editable; fall back to current active if valid
        let target = lastEditableRef.current;
        const active = document.activeElement as any;
        if (!target && active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) {
          target = active as HTMLInputElement | HTMLTextAreaElement;
        }
        if (!target) {
          setError("Focus a text field to insert voice input");
          return;
        }
        if (target.readOnly || (target as any).disabled) {
          setError("Focused field is read-only");
          return;
        }

        // Compute new value
        const base = appendModeRef.current ? String((target as any).value || "") : "";
        const newVal = (base + (base ? " " : "") + finalText).trim();

        // Use native value setter so React controlled inputs receive updates reliably
        const proto = target.tagName === "TEXTAREA"
          ? Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")
          : Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
        proto?.set?.call(target, newVal);
        // Dispatch input event (React listens to 'input' for onChange). Also fire a fallback 'change'.
        target.dispatchEvent(new Event("input", { bubbles: true }));
        target.dispatchEvent(new Event("change", { bubbles: true }));
        target.focus();
      } catch (e: any) {
        setError(e?.message || "Voice input failed");
      }
    };

    const safeRestart = (delay = 400) => {
      if (!wantRef.current) return;
      try {
        r.start();
        setListening(true);
      } catch {
        // If starting too soon, try shortly after
        setTimeout(() => {
          if (!wantRef.current) return;
          try { r.start(); setListening(true); } catch {}
        }, delay);
      }
    };

    r.onerror = (e: any) => {
      const code = String(e?.error || "");
      // For permission or fatal errors, stop fully
      if (code === "not-allowed" || code === "service-not-allowed") {
        setError("Microphone access denied.");
        wantRef.current = false;
        setListening(false);
        try { r.stop(); } catch {}
        return;
      }
      // For transient cases, attempt seamless restart if user still wants it
      if (wantRef.current && (code === "no-speech" || code === "audio-capture" || code === "aborted" || code === "network")) {
        setError(null);
        safeRestart(600);
        return;
      }
      setError(code || "Speech recognition error");
      setListening(false);
    };
    r.onend = () => {
      if (wantRef.current) {
        // Auto-resume to behave like a continuous dictation button
        safeRestart(500);
      } else {
        setListening(false);
      }
    };
    recogRef.current = r;
    return () => {
      wantRef.current = false;
      try { r.stop(); } catch {}
    };
  }, []);

  function toggle() {
    if (!supported) return;
    setError(null);
    const r = recogRef.current;
    try {
      if (!listening) { wantRef.current = true; r.start(); setListening(true); }
      else { wantRef.current = false; r.stop(); setListening(false); }
    } catch (e: any) {
      setError(e?.message || "Could not start mic");
      wantRef.current = false;
      setListening(false);
    }
  }

  if (!supported) return null;

  return (
    <div className="fixed z-40 bottom-5 right-5 flex flex-col items-end gap-2 no-print">
      <div className="flex items-center gap-2 bg-white/90 border rounded-full px-3 py-1 shadow">
        <label className="text-xs text-gray-700 select-none">
          <input type="checkbox" className="mr-1 align-middle" defaultChecked onChange={(e)=> (appendModeRef.current = e.target.checked)} />
          Append
        </label>
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={toggle}
          title="Voice to text: click then speak; click again to stop. Text goes into the focused field."
          className={`h-11 w-11 rounded-full grid place-items-center ${listening ? "bg-red-500" : "bg-kiwi-green"} text-white shadow hover:opacity-95`}
        >
          {listening ? (
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor"><path d="M12 3a3 3 0 00-3 3v6a3 3 0 006 0V6a3 3 0 00-3-3z"/><path d="M19 11a7 7 0 11-14 0H3a9 9 0 0018 0h-2z"/></svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor"><path d="M12 14a3 3 0 003-3V7a3 3 0 00-6 0v4a3 3 0 003 3z"/><path d="M19 11a7 7 0 11-14 0H3a9 9 0 0018 0h-2z"/></svg>
          )}
        </button>
      </div>
      {error && <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-2 py-1 shadow">{error}</div>}
    </div>
  );
}
