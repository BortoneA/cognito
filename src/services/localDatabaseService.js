/**
 * Local Database Service using IndexedDB & LocalStorage fallback
 * Manages full local offline synchronization of all 5,073 questions + user edits.
 */

const DB_NAME = 'PNA_MED_LOCAL_DB_V2';
const DB_VERSION = 2;
const STORE_QUESTIONS_CACHE = 'all_questions';
const STORE_EDITS = 'edited_questions';
const STORE_META = 'metadata';

const LOCAL_STORAGE_OVERRIDE_KEY = 'PNA_MED_LOCAL_QUESTION_EDITS_V1';
const LOCAL_STORAGE_SYNC_META_KEY = 'PNA_MED_SYNC_META_V1';

// Open or initialize IndexedDB
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
          if (list && list.length > 0) {
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
 * Saves/Synchronizes the full dataset into local IndexedDB for instant offline access
 */
export const syncFullDatasetToLocalDB = async (questions) => {
  if (!questions || questions.length === 0) return false;

  try {
    const db = await openDB();
    if (!db) return false;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction([STORE_QUESTIONS_CACHE, STORE_META], 'readwrite');
        const qStore = tx.objectStore(STORE_QUESTIONS_CACHE);
        const mStore = tx.objectStore(STORE_META);

        // Put questions in batch
        questions.forEach(q => {
          qStore.put(q);
        });

        // Update metadata
        const syncMeta = {
          key: 'last_sync',
          timestamp: Date.now(),
          count: questions.length,
          version: '2.0-offline'
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
 * Saves a single edited question permanently to IndexedDB & LocalStorage fallback
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

  // 2. IndexedDB updates (both in edits store and full cache store)
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
      const store = tx.objectStore(STORE_EDITS);
      store.clear();
    }
    return true;
  } catch (e) {
    console.error('Failed to clear local DB edits:', e);
    return false;
  }
};

/**
 * Purges full local database cache for a clean resync
 */
export const clearFullLocalCache = async () => {
  try {
    const db = await openDB();
    if (db) {
      const tx = db.transaction([STORE_QUESTIONS_CACHE, STORE_EDITS, STORE_META], 'readwrite');
      tx.objectStore(STORE_QUESTIONS_CACHE).clear();
      tx.objectStore(STORE_EDITS).clear();
      tx.objectStore(STORE_META).clear();
    }
    localStorage.removeItem(LOCAL_STORAGE_OVERRIDE_KEY);
    localStorage.removeItem(LOCAL_STORAGE_SYNC_META_KEY);
    return true;
  } catch {
    return false;
  }
};

/**
 * Gets sync status metadata
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
 * Exports current full merged database to JSON file
 */
export const exportFullDatabaseJSON = (allQuestions) => {
  const exportData = {
    titulo: "Banco de questões — PNA 2018 a 2024 e Simulações APNA 2023 — Sincronização Local",
    versao: "2.0",
    ano_da_prova: "2018–2024",
    total_questoes: allQuestions.length,
    data_exportacao: new Date().toISOString(),
    questoes: allQuestions
  };

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `banco_questoes_pna_local_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};
