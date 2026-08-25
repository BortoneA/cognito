/**
 * Local Database Service using IndexedDB & LocalStorage fallback
 * Manages permanent local storage of edited questions and custom questions.
 */

const DB_NAME = 'PNA_MED_LOCAL_DB_V1';
const DB_VERSION = 1;
const STORE_QUESTIONS = 'edited_questions';
const LOCAL_STORAGE_OVERRIDE_KEY = 'PNA_MED_LOCAL_QUESTION_EDITS_V1';

// Open or initialize IndexedDB
const openDB = () => {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      resolve(null);
      return;
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => resolve(null);
    request.onsuccess = (e) => resolve(e.target.result);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_QUESTIONS)) {
        db.createObjectStore(STORE_QUESTIONS, { keyPath: 'id' });
      }
    };
  });
};

/**
 * Gets all saved question edits from IndexedDB / LocalStorage
 */
export const getLocalQuestionEdits = async () => {
  try {
    const db = await openDB();
    if (db) {
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_QUESTIONS, 'readonly');
        const store = tx.objectStore(STORE_QUESTIONS);
        const req = store.getAll();
        req.onsuccess = () => {
          const map = {};
          (req.result || []).forEach(q => {
            map[q.id] = q;
          });
          resolve(map);
        };
        req.onerror = () => resolve(getFallbackLocalStorage());
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

  // 2. IndexedDB update
  try {
    const db = await openDB();
    if (db) {
      const tx = db.transaction(STORE_QUESTIONS, 'readwrite');
      const store = tx.objectStore(STORE_QUESTIONS);
      store.put(updatedQ);
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
      const tx = db.transaction(STORE_QUESTIONS, 'readwrite');
      const store = tx.objectStore(STORE_QUESTIONS);
      store.clear();
    }
    return true;
  } catch (e) {
    console.error('Failed to clear local DB:', e);
    return false;
  }
};

/**
 * Exports current full merged database to JSON file
 */
export const exportFullDatabaseJSON = (allQuestions) => {
  const exportData = {
    titulo: "Banco de questões — PNA 2018 a 2024 e Simulações APNA 2023 — Edição Personalizada",
    versao: "A.2026",
    ano_da_prova: "2018–2024",
    total_questoes: allQuestions.length,
    data_exportacao: new Date().toISOString(),
    questoes: allQuestions
  };

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `banco_questoes_pna_custom_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};
