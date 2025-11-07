"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";

type AccountUser = {
  id: string;
  name: string;
  email: string;
  role?: string;
  avatarUrl?: string;
};

export default function AccountPage() {
  const { update } = useSession();
  const [user, setUser] = useState<AccountUser | null>(null);
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [avatarData, setAvatarData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/account", { cache: "no-store", credentials: "include" });
        if (!res.ok) {
          setError("Please login to view your account");
          return;
        }
        const data = await res.json();
        if (data?.user) {
          setUser(data.user);
          setName(data.user.name || "");
          setAvatarUrl(data.user.avatarUrl || "");
        }
      } catch (e: any) {
        setError(e?.message || "Failed to load account");
      }
    })();
  }, []);

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      setAvatarData(dataUrl);
      setAvatarUrl(dataUrl);
    };
    reader.readAsDataURL(f);
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, avatarData }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Update failed");
      setUser(data.user);
      setAvatarUrl(data.user?.avatarUrl || "");
      setAvatarData(null);
      setSaved(true);
      // notify other parts (navbar) to refresh profile
      try {
        window.dispatchEvent(new Event("nk-profile-updated"));
        // update next-auth session so name/image show immediately
        await update({ name, image: data.user?.avatarUrl || undefined });
      } catch {}
    } catch (e: any) {
      setError(e?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[70vh] container mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-heading font-bold text-kiwi-dark mb-6">My Account</h1>
      {error && <div className="mb-4 text-red-600 text-sm">{error}</div>}

      {user ? (
        <form onSubmit={onSave} className="bg-white shadow p-6 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 flex flex-col items-center gap-3">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-kiwi-light grid place-items-center border">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <Image src="/logo.png" alt="avatar_placeholder" width={64} height={64} />
              )}
            </div>
            <label className="text-sm">
              <span className="underline cursor-pointer">Change photo</span>
              <input type="file" accept="image/*" className="hidden" onChange={onPickFile} />
            </label>
          </div>
          <div className="md:col-span-2 space-y-4">
            <div>
              <label className="text-sm">Full name</label>
              <input className="w-full border rounded px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm">Email</label>
              <input className="w-full border rounded px-3 py-2 bg-gray-50" value={user.email} readOnly />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={loading} className="bg-kiwi-green text-white px-4 py-2 rounded">
                {loading ? "Saving..." : "Save changes"}
              </button>
              {saved && <span className="text-sm text-[#78c850]">Saved</span>}
            </div>
          </div>
        </form>
      ) : (
        <p className="text-sm text-gray-600">Loading account...</p>
      )}
    </div>
  );
}

