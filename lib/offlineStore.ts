// Lightweight IndexedDB wrapper for offline drafts
// Stores large objects like photos/signatures safely (beyond localStorage limits)

type DraftPayload = {
  form?: any;
  sectionPhotos?: Record<string, any[]>;
  signatureData?: string | null;
  map?: { mapForPdfUrl?: string; includeMapInPdf?: boolean; autoIncludeSiteMap?: boolean };
  scrollY?: number;
  updatedAt?: number;
};

const DB_NAME = 'nk-offline';
const STORE = 'drafts';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('indexedDB not available'));
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('indexedDB open failed'));
  });
}

export async function saveDraft(key: string, value: DraftPayload): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      const data: DraftPayload = { ...value, updatedAt: Date.now() };
      store.put(data, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('indexedDB tx error'));
    });
    db.close();
  } catch {
    // Ignore; offline fallback not available
  }
}

export async function loadDraft<T = DraftPayload>(key: string): Promise<T | null> {
  try {
    const db = await openDB();
    const val = await new Promise<any>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const store = tx.objectStore(STORE);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error || new Error('indexedDB get error'));
    });
    db.close();
    return (val as T) || null;
  } catch {
    return null;
  }
}

export async function clearDraft(key: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      store.delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('indexedDB tx error'));
    });
    db.close();
  } catch {
    // ignore
  }
}

export function draftKeyForReport(reportId?: string | null): string {
  const id = String(reportId || '').trim();
  return id ? `report:${id}` : 'report:unsaved';
}

