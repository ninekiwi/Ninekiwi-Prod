"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

type WeatherOut = {
  temperature: number;
  humidity: number;
  windSpeed: number;
  description: string;
};

type Props = {
  form: any;
  onField: (key: string, value: string) => void;
  onFetched?: (w: WeatherOut) => void;
};

const FALLBACK = "--";

const WIND_UNIT = "km/h";
const TEMP_UNIT = "deg C";

const WEATHER_CODES: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Foggy",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  71: "Slight snow",
  73: "Moderate snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail",
};

function getWeatherDescription(code: number): string {
  return WEATHER_CODES[code] || "Unknown";
}

export default function WeatherPanel({ form, onField, onFetched }: Props) {
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const debTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastKeyRef = useRef<string>("");
  const lastAddrRef = useRef<string>("");
  const lastAddrAtRef = useRef<number>(0);

  const addressQuery = useMemo(() => {
    const parts = [form?.streetAddress, form?.city, form?.state, form?.country, form?.zipCode].filter(
      (x: string) => typeof x === "string" && x.trim()
    );
    return (parts.join(", ") || form?.location || "").trim();
  }, [form]);

  const pushToForm = useCallback(
    (w: WeatherOut) => {
      if (typeof onField !== "function") {
        console.error("onField is not a function:", onField);
        return;
      }
      onField("temperature", String(w.temperature));
      onField("humidity", String(w.humidity));
      onField("windSpeed", String(w.windSpeed));
      onField("weatherDescription", w.description);
      onFetched?.(w);
    },
    [onField, onFetched]
  );

  const fetchWeatherByCoords = useCallback(
    async (lat: number, lon: number) => {
      setErrMsg(null);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        setErrMsg("Invalid coordinates.");
        return;
      }

      const key = `weather:${lat.toFixed(4)},${lon.toFixed(4)}`;
      if (lastKeyRef.current === key && !loading) return;
      lastKeyRef.current = key;

      setLoading(true);
      try {
        const resp = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&temperature_unit=celsius&wind_speed_unit=kmh&timezone=auto`
        );

        if (!resp.ok) {
          setErrMsg(`Weather API error (HTTP ${resp.status}).`);
          return;
        }

        const data = await resp.json();
        const current = data?.current;

        if (!current) {
          setErrMsg("No weather data available for this location.");
          return;
        }

        const w: WeatherOut = {
          temperature: Math.round(Number(current.temperature_2m ?? 0)),
          humidity: Math.round(Number(current.relative_humidity_2m ?? 0)),
          windSpeed: Math.round(Number(current.wind_speed_10m ?? 0)),
          description: getWeatherDescription(Number(current.weather_code ?? 0)),
        };

        pushToForm(w);
      } catch (error) {
        console.error("Weather fetch error:", error);
        setErrMsg("Failed to fetch weather.");
      } finally {
        setLoading(false);
      }
    },
    [pushToForm, loading]
  );

  const fetchByAddress = useCallback(async () => {
    setErrMsg(null);
    const q = addressQuery;
    if (!q) return;
    const norm = q.trim().toLowerCase();
    const now = Date.now();
    if (lastAddrRef.current === norm && now - lastAddrAtRef.current < 5000) return;
    lastAddrRef.current = norm; lastAddrAtRef.current = now;

    setLoading(true);
    try {
      const r = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`, { cache: "no-store" });
      if (!r.ok) {
        setErrMsg(`Geocoding error (HTTP ${r.status}).`);
        setLoading(false);
        return;
      }
      const j = await r.json();
      if (j?.success === false) {
        setErrMsg(j?.error || "Could not geocode address.");
        setLoading(false);
        return;
      }
      const lat = Number(j?.lat);
      const lon = Number(j?.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        setErrMsg("Could not geocode address.");
        setLoading(false);
        return;
      }
      onField("lat", String(lat));
      onField("lon", String(lon));
      await fetchWeatherByCoords(lat, lon);
    } catch (error) {
      console.error("Geocoding error:", error);
      setErrMsg("Geocoding failed.");
      setLoading(false);
    }
  }, [addressQuery, fetchWeatherByCoords, onField]);

  useEffect(() => {
    if (!addressQuery) return;
    if (debTimer.current) clearTimeout(debTimer.current);
    debTimer.current = setTimeout(() => { void fetchByAddress(); }, 800);
    return () => { if (debTimer.current) clearTimeout(debTimer.current); };
  }, [addressQuery, fetchByAddress]);

  useEffect(() => {
    const lat = Number(form?.lat);
    const lon = Number(form?.lon);
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      fetchWeatherByCoords(lat, lon);
    }
  }, [form?.lat, form?.lon, fetchWeatherByCoords]);

  // Ensure initial client render matches SSR by showing placeholders until mounted
  useEffect(() => { setMounted(true); }, []);

  const handleUseMyLocation = useCallback(() => {
    setErrMsg(null);
    if (!navigator.geolocation) {
      setErrMsg("Geolocation not supported.");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        onField("lat", String(latitude));
        onField("lon", String(longitude));
        fetchWeatherByCoords(latitude, longitude);
      },
      () => {
        setErrMsg("Location permission denied.");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [fetchWeatherByCoords, onField]);

  const readings = useMemo(() => {
    const vTemp = form?.temperature ? String(form.temperature) : FALLBACK;
    const vHum = form?.humidity ? String(form.humidity) : FALLBACK;
    const vWind = form?.windSpeed ? String(form.windSpeed) : FALLBACK;
    const vDesc = form?.weatherDescription ? String(form.weatherDescription) : FALLBACK;
    // On the very first client render (before mounted), force FALLBACK to avoid hydration mismatch
    const gate = (v: string) => (mounted ? v : FALLBACK);
    return [
      { label: `Temperature (${TEMP_UNIT})`, value: gate(vTemp) },
      { label: "Humidity (%)", value: gate(vHum) },
      { label: `Wind (${WIND_UNIT})`, value: gate(vWind) },
      { label: "Conditions", value: gate(vDesc) },
    ];
  }, [mounted, form?.temperature, form?.humidity, form?.windSpeed, form?.weatherDescription]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
      <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        {readings.map((reading) => (
          <div
            key={reading.label}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm"
          >
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {reading.label}
            </div>
            <div className="mt-1 text-base font-semibold text-gray-900">{reading.value}</div>
          </div>
        ))}
      </div>

      {/* Location control buttons removed */}
      {errMsg && <div className="mt-2 text-xs font-medium text-red-600">{errMsg}</div>}
    </div>
  );
}
