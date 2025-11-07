"use client";
<<<<<<< HEAD
import { useEffect, useState } from "react";
=======
>>>>>>> test

type Mode = "yesno"; // single mode only

export default function FlexibleAnswer({
  id,
  label,
  value,                        // "Yes" | "No"
  onChange,                     // (mode, value) -> we'll always send ("yesno", ...)
  required = false,
<<<<<<< HEAD
  noteValue,                    // shown ONLY when value === "No"
=======
  noteValue,                    // shown ONLY when value === "Yes"
>>>>>>> test
  onNoteChange,                 // updates the note when typing
  notePlaceholder = "Add details...",
}: {
  id: string;
  label: string;
  value: string; // "Yes" | "No"
  onChange: (mode: Mode, value: string) => void;
  required?: boolean;

  noteValue?: string;
  onNoteChange?: (text: string) => void;
  notePlaceholder?: string;
}) {
<<<<<<< HEAD
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
=======
>>>>>>> test
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="block text-sm font-medium">
          {label}
          {required && <span className="ml-1 text-red-600">*</span>}
        </label>
      </div>

      {/* Yes / No */}
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

<<<<<<< HEAD
      {/* Auto note input when user chooses No (defer until mounted to avoid hydration mismatch) */}
      {mounted && value === "No" && (
=======
      {/* Auto note input when user chooses Yes */}
      {value === "Yes" && (
>>>>>>> test
        <div className="mt-2">
          <textarea
            id={`${id}-note`}
            rows={2}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-kiwi-green"
            placeholder={notePlaceholder}
            value={noteValue ?? ""}
            onChange={(e) => onNoteChange?.(e.target.value)}
          />
<<<<<<< HEAD
          <p className="text-xs text-gray-500 mt-1">This field appears because you selected "No".</p>
=======
          <p className="text-xs text-gray-500 mt-1">
            This field appears because you selected “Yes”.
          </p>
>>>>>>> test
        </div>
      )}
    </div>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> test
