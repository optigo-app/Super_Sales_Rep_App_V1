// IndexedDB persistence for catalog data.

const DB_NAME = "optigo-catalog-cache";
const STORE = "catalogs";
const CACHE_VERSION = "v2"; // v2: article catalog now comes from its own API (EventName "article")
const TTL_MS = 15 * 60 * 1000; // 15 minutes

const isBrowser = () => typeof window !== "undefined" && "indexedDB" in window;

function openDb() {
    return new Promise((resolve, reject) => {
        const req = window.indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = () => {
            if (!req.result.objectStoreNames.contains(STORE)) {
                req.result.createObjectStore(STORE);
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

const key = (view) => `${CACHE_VERSION}:${view}`;

export async function getCachedCatalog(view) {
    if (!isBrowser()) return null;
    try {
        const db = await openDb();
        const entry = await new Promise((resolve) => {
            const tx = db.transaction(STORE, "readonly");
            const req = tx.objectStore(STORE).get(key(view));
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => resolve(null);
        });
        db.close();

        if (!entry || !Array.isArray(entry.data)) return null;
        if (Date.now() - entry.ts > TTL_MS) return null; // expired
        return entry.data;
    } catch {
        return null;
    }
}

export async function setCachedCatalog(view, data) {
    if (!isBrowser() || !Array.isArray(data)) return;
    try {
        const db = await openDb();
        await new Promise((resolve, reject) => {
            const tx = db.transaction(STORE, "readwrite");
            tx.objectStore(STORE).put({ ts: Date.now(), data }, key(view));
            tx.oncomplete = resolve;
            tx.onerror = () => reject(tx.error);
        });
        db.close();
    } catch {
        // Cache write failures are non-fatal — quota, privacy mode, etc.
    }
}

export async function clearCatalogCache() {
    if (!isBrowser()) return;
    try {
        const db = await openDb();
        await new Promise((resolve) => {
            const tx = db.transaction(STORE, "readwrite");
            tx.objectStore(STORE).clear();
            tx.oncomplete = resolve;
            tx.onerror = resolve;
        });
        db.close();
    } catch {
        // ignore
    }
}
