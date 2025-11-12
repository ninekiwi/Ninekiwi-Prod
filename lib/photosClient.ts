export type PhotoItem = {
  _id: string;
  name: string;
  src: string;
  reportId: string;
  section: string;
  includeInSummary?: boolean;
  caption?: string;
  description?: string;
  figureNumber?: number;
};

export async function listPhotos(reportId: string, section?: string): Promise<PhotoItem[]> {
  try {
    const q = new URLSearchParams({ reportId });
    if (section) q.set("section", section);
    const res = await fetch(`/api/photos?${q.toString()}`, { cache: "no-store" });
    if (!res.ok) {
      return [];
    }
    const json = await res.json().catch(() => ({ items: [] }));
    return (json?.items as PhotoItem[]) || [];
  } catch {
    return [];
  }
}

export async function createPhoto(input: {
  name?: string;
  data: string; // data URL or http(s)
  reportId: string;
  section: string;
  includeInSummary?: boolean;
  caption?: string;
  description?: string;
  figureNumber?: number;
}): Promise<PhotoItem> {
  // If data is a remote URL, try to convert it to a data URL first
  let payload = { ...input } as typeof input;
  try {
    const d = String(input.data || "").trim();
    if (d && /^https?:\/\//i.test(d)) {
      const proxied = `/api/image-proxy?url=${encodeURIComponent(d)}`;
      const resp = await fetch(proxied, { cache: "no-store" });
      if (resp.ok) {
        const blob = await resp.blob();
        const reader = new FileReader();
        const dataUrl: string = await new Promise((resolve, reject) => {
          reader.onloadend = () => resolve(String(reader.result || ""));
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        if (dataUrl.startsWith("data:")) payload = { ...payload, data: dataUrl };
      }
    }
  } catch {}

  const res = await fetch("/api/photos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || "Failed to create photo");
  return json.item as PhotoItem;
}

export async function updatePhoto(id: string, update: {
  includeInSummary?: boolean;
  caption?: string;
  description?: string;
  figureNumber?: number;
}): Promise<void> {
  const res = await fetch(`/api/photos/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(update),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j?.error || "Failed to update photo");
  }
}

export async function deletePhoto(id: string): Promise<void> {
  const res = await fetch(`/api/photos/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j?.error || "Failed to delete photo");
  }
}
