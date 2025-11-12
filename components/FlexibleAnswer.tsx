"use client";
import { useEffect, useState } from "react";

type Mode = "yesno";

export default function FlexibleAnswer({
  id,
  label,
  value,
  onChange,
  required = false,
  noteValue,
  onNoteChange,
  notePlaceholder = "Add details...",
  noteOnValue = "No",
}: {
  id: string;
  label: string;
  value: string; // "Yes" | "No"
  onChange: (mode: Mode, value: string) => void;
  required?: boolean;
  noteValue?: string;
  onNoteChange?: (text: string) => void;
  notePlaceholder?: string;
  /** Which selection should reveal the note input. Defaults to "No" */
  noteOnValue?: "Yes" | "No";
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="block text-sm font-medium">
          {label}
          {required && <span className="ml-1 text-red-600">*</span>}
        </label>
      </div>

      <div className="flex gap-4">
        {["Yes", "No"].map((v) => (
          <label key={v} className="flex items-center gap-2">
            <input
              type="radio"
              name={id}
              value={v}
              checked={value === v}
              onChange={(e) => onChange("yesno", e.target.value)}
            />
            {v}
          </label>
        ))}
      </div>

      {mounted && value === noteOnValue && (
        <div className="mt-2">
          <textarea
            id={`${id}-note`}
            rows={2}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-kiwi-green"
            placeholder={notePlaceholder}
            value={noteValue ?? ""}
            onChange={(e) => onNoteChange?.(e.target.value)}
          />
          <p className="text-xs text-gray-500 mt-1">This field appears because you selected "{noteOnValue}".</p>
        </div>
      )}
    </div>
  );
}
