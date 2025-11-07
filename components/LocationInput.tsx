"use client";
import React from "react";

type Address = {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
};

export default function LocationInput({
  value,
  onChange,
}: {
  value: { location?: string; address?: Address };
  onChange: (v: { location?: string; address?: Address }) => void;
}) {
  const addr = value.address || {};

  return (
    <div className="form-section p-5">
      <h3 className="text-lg font-semibold text-kiwi-dark mb-3">Location</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="Location (searchable text)"
          value={value.location || ""}
          onChange={(e) => onChange({ ...value, location: e.target.value })}
        />
        <input
          type="text"
          placeholder="Street / Address"
          value={addr.street || ""}
          onChange={(e) => onChange({ ...value, address: { ...addr, street: e.target.value } })}
        />
        <input
          type="text"
          placeholder="City"
          value={addr.city || ""}
          onChange={(e) => onChange({ ...value, address: { ...addr, city: e.target.value } })}
        />
        <input
          type="text"
          placeholder="State / Province"
          value={addr.state || ""}
          onChange={(e) => onChange({ ...value, address: { ...addr, state: e.target.value } })}
        />
        <input
          type="text"
          placeholder="Country"
          value={addr.country || ""}
          onChange={(e) => onChange({ ...value, address: { ...addr, country: e.target.value } })}
        />
        <input
          type="text"
          placeholder="ZIP / Postal Code"
          value={addr.zipCode || ""}
          onChange={(e) => onChange({ ...value, address: { ...addr, zipCode: e.target.value } })}
        />
      </div>
    </div>
  );
}
