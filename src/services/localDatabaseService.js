/**
 * High-Reliability Real-Time Local Database Service
 * Manages continuous bidirectional synchronization between IndexedDB, LocalStorage,
 * and in-memory cache for 5,073+ questions, custom edits, and user additions.
 */

export const CURRENT_DATABASE_VERSION = '2026.08.25-300-subareas-v4';
const DB_NAME = 'PNA_MED_LOCAL_DB_V3';
const DB_VERSION = 3;

const STORE_QUESTIONS_CACHE = 'all_questions';
const STORE_EDITS = 'edited_questions';
const STORE_META = 'metadata';

const LOCAL_STORAGE_OVERRIDE_KEY = 'PNA_MED_LOCAL_QUESTION_EDITS_V2';
const LOCAL_STORAGE_SYNC_META_KEY = 'PNA_MED_SYNC_META_V2';

// Safe IndexedDB Opener with automatic schema upgrade
const openDB = () => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => resolve(null);
      request.onsuccess = (e) => resolve(e.target.result);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_QUESTIONS_CACHE)) {
          db.createObjectStore(STORE_QUESTIONS_CACHE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_EDITS)) {
          db.createObjectStore(STORE_EDITS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_META)) {
          db.createObjectStore(STORE_META, { keyPath: 'key' });
        }
      };
    } catch {
      resolve(null);
    }
  });
};

/**
 * Gets Sync Metadata
 */
export const getSyncMetadata = () => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_SYNC_META_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

/**
 * Loads all questions directly from local IndexedDB cache
 */
export const loadAllQuestionsFromLocalDB = async () => {
  try {
    const db = await openDB();
    if (!db) return null;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_QUESTIONS_CACHE, 'readonly');
        const store = tx.objectStore(STORE_QUESTIONS_CACHE);
        const req = store.getAll();
        req.onsuccess = () => {
          const list = req.result;
          if (list && list.length >= 5000) {
            resolve(list);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  } catch {
    return null;
  }
};

/**
 * Synchronizes the full dataset into local IndexedDB permanently
 */
export const syncFullDatasetToLocalDB = async (questions, version = CURRENT_DATABASE_VERSION) => {
  if (!questions || questions.length === 0) return false;

  try {
    const db = await openDB();
    if (!db) return false;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction([STORE_QUESTIONS_CACHE, STORE_META], 'readwrite');
        const qStore = tx.objectStore(STORE_QUESTIONS_CACHE);
        const mStore = tx.objectStore(STORE_META);

        // Put all questions in batch
        questions.forEach(q => {
          qStore.put(q);
        });

        // Update metadata
        const syncMeta = {
          key: 'last_sync',
          timestamp: Date.now(),
          count: questions.length,
          version: version
        };
        mStore.put(syncMeta);

        tx.oncomplete = () => {
          try {
            localStorage.setItem(LOCAL_STORAGE_SYNC_META_KEY, JSON.stringify(syncMeta));
          } catch (e) {
            console.error(e);
          }
          resolve(true);
        };
        tx.onerror = () => resolve(false);
      } catch {
        resolve(false);
      }
    });
  } catch {
    return false;
  }
};

/**
 * Gets all saved question edits from IndexedDB / LocalStorage
 */
export const getLocalQuestionEdits = async () => {
  try {
    const db = await openDB();
    if (db) {
      return new Promise((resolve) => {
        try {
          const tx = db.transaction(STORE_EDITS, 'readonly');
          const store = tx.objectStore(STORE_EDITS);
          const req = store.getAll();
          req.onsuccess = () => {
            const map = {};
            (req.result || []).forEach(q => {
              map[q.id] = q;
            });
            resolve(map);
          };
          req.onerror = () => resolve(getFallbackLocalStorage());
        } catch {
          resolve(getFallbackLocalStorage());
        }
      });
    }
  } catch (e) {
    console.warn('IndexedDB read error, using LocalStorage fallback', e);
  }
  return getFallbackLocalStorage();
};

const getFallbackLocalStorage = () => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_OVERRIDE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

/**
 * Saves a single edited question permanently to IndexedDB & LocalStorage
 */
export const saveLocalQuestionEdit = async (question) => {
  if (!question || !question.id) return false;

  const updatedQ = {
    ...question,
    updatedAt: Date.now(),
    isCustomEdited: true
  };

  // 1. LocalStorage update
  try {
    const current = getFallbackLocalStorage();
    current[question.id] = updatedQ;
    localStorage.setItem(LOCAL_STORAGE_OVERRIDE_KEY, JSON.stringify(current));
  } catch (e) {
    console.error('Failed to save to LocalStorage:', e);
  }

  // 2. IndexedDB updates
  try {
    const db = await openDB();
    if (db) {
      const tx = db.transaction([STORE_EDITS, STORE_QUESTIONS_CACHE], 'readwrite');
      tx.objectStore(STORE_EDITS).put(updatedQ);
      tx.objectStore(STORE_QUESTIONS_CACHE).put(updatedQ);
    }
  } catch (e) {
    console.error('Failed to save to IndexedDB:', e);
  }

  return updatedQ;
};

/**
 * Resets all local question edits
 */
export const clearAllLocalQuestionEdits = async () => {
  try {
    localStorage.removeItem(LOCAL_STORAGE_OVERRIDE_KEY);
    const db = await openDB();
    if (db) {
      const tx = db.transaction(STORE_EDITS, 'readwrite');
      tx.objectStore(STORE_EDITS).clear();
    }
    return true;
  } catch {
    return false;
  }
};

/**
 * Clears full local cache forcing complete fresh sync
 */
export const clearFullLocalCache = async () => {
  try {
    localStorage.removeItem(LOCAL_STORAGE_SYNC_META_KEY);
    const db = await openDB();
    if (db) {
      const tx = db.transaction([STORE_QUESTIONS_CACHE, STORE_META], 'readwrite');
      tx.objectStore(STORE_QUESTIONS_CACHE).clear();
      tx.objectStore(STORE_META).clear();
    }
    return true;
  } catch {
    return false;
  }
};

/**
 * Exports full database as formatted JSON file
 */
export const exportFullDatabaseJSON = (questions) => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(
    JSON.stringify({
      dataset: "PNA_MED_PORTUGAL_MASTER",
      exportedAt: new Date().toISOString(),
      totalQuestoes: questions.length,
      questoes: questions
    }, null, 2)
  );
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `banco_questoes_pna_sync_${Date.now()}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};
