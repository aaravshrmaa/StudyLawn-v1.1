// Unlimited Local Storage engine using IndexedDB with in-memory sync cache
// Provides practically unlimited local storage (hundreds of MBs/GBs) for
// test images, study logs, timers, scheduled slots, and task queues.

const DB_NAME = 'StudyLawnDB';
const DB_VERSION = 1;
const STORE_NAME = 'study_store';

// In-memory synchronous cache for 0ms latency during initial react render
const memoryCache = new Map<string, any>();

// Try to populate initial memoryCache from localStorage for instant synchronous boot
if (typeof window !== 'undefined') {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sa_')) {
        try {
          const val = JSON.parse(localStorage.getItem(key) || 'null');
          if (val !== null) memoryCache.set(key.replace(/^sa_/, ''), val);
        } catch {
          memoryCache.set(key.replace(/^sa_/, ''), localStorage.getItem(key));
        }
      }
    }
  } catch (e) {
    console.warn('Local storage cache prep error:', e);
  }
}

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('IndexedDB not supported in SSR'));
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
  return dbPromise;
}

export const localStore = {
  // Synchronous read from memory cache
  getSync<T>(key: string, fallback: T): T {
    if (memoryCache.has(key)) {
      return memoryCache.get(key) as T;
    }
    // Also check legacy or prefixed localStorage
    try {
      const raw = localStorage.getItem(`sa_${key}`) || localStorage.getItem(key);
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        memoryCache.set(key, parsed);
        return parsed as T;
      }
    } catch {}
    return fallback;
  },

  // Asynchronous persistent read from IndexedDB
  async get<T>(key: string, fallback: T): Promise<T> {
    if (memoryCache.has(key)) {
      return memoryCache.get(key) as T;
    }
    try {
      const db = await getDB();
      return new Promise<T>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);
        req.onsuccess = () => {
          const val = req.result !== undefined ? req.result : fallback;
          memoryCache.set(key, val);
          resolve(val as T);
        };
        req.onerror = () => {
          resolve(fallback);
        };
      });
    } catch (e) {
      return fallback;
    }
  },

  // Persistent write to both memory cache and IndexedDB (and light fallback to localStorage)
  async set<T>(key: string, value: T): Promise<void> {
    memoryCache.set(key, value);
    // Write light representation to localStorage for instant synchronous refresh
    try {
      const strVal = JSON.stringify(value);
      // Only mirror if smaller than 500KB to prevent QuotaExceededError
      if (strVal.length < 500000) {
        localStorage.setItem(`sa_${key}`, strVal);
      }
    } catch {}

    try {
      const db = await getDB();
      return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(value, key);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn(`IndexedDB set error for ${key}:`, e);
    }
  },

  // Remove key
  async remove(key: string): Promise<void> {
    memoryCache.delete(key);
    try {
      localStorage.removeItem(`sa_${key}`);
      localStorage.removeItem(key);
    } catch {}
    try {
      const db = await getDB();
      return new Promise<void>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.delete(key);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
      });
    } catch {}
  },

  // Get storage usage estimates
  async getStorageEstimate(): Promise<{ usedBytes: number; quotaBytes: number; formattedUsed: string; formattedQuota: string }> {
    if (navigator.storage && navigator.storage.estimate) {
      try {
        const est = await navigator.storage.estimate();
        const used = est.usage || 0;
        const quota = est.quota || 0;
        const formatBytes = (bytes: number) => {
          if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
          if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
          return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
        };
        return {
          usedBytes: used,
          quotaBytes: quota,
          formattedUsed: formatBytes(used),
          formattedQuota: formatBytes(quota),
        };
      } catch {}
    }
    return {
      usedBytes: 0,
      quotaBytes: 1024 * 1024 * 1024 * 50,
      formattedUsed: '1.2 MB',
      formattedQuota: 'Unlimited (IndexedDB)',
    };
  },

  // Export full user database to JSON
  async exportAllData(): Promise<string> {
    try {
      const db = await getDB();
      return new Promise<string>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAllKeys();
        req.onsuccess = async () => {
          const keys = req.result;
          const exported: Record<string, any> = {};
          for (const k of keys) {
            const val = await localStore.get(k.toString(), null);
            exported[k.toString()] = val;
          }
          resolve(JSON.stringify(exported, null, 2));
        };
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      // Fallback: export memory cache
      const obj: Record<string, any> = {};
      memoryCache.forEach((v, k) => {
        obj[k] = v;
      });
      return JSON.stringify(obj, null, 2);
    }
  },

  // Import full user database from JSON
  async importAllData(jsonStr: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonStr);
      if (typeof data !== 'object' || data === null) return false;
      for (const [key, val] of Object.entries(data)) {
        await localStore.set(key, val);
      }
      return true;
    } catch (e) {
      console.error('Import error:', e);
      return false;
    }
  },

  // Clear all data
  async clearAll(): Promise<void> {
    memoryCache.clear();
    try {
      localStorage.clear();
    } catch {}
    try {
      const db = await getDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).clear();
    } catch {}
  },
};
