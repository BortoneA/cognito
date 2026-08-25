import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import staticDatabase from '../data/banco_questoes_pna.json';
import { 
  getLocalQuestionEdits, 
  saveLocalQuestionEdit, 
  clearAllLocalQuestionEdits,
  clearFullLocalCache,
  exportFullDatabaseJSON,
  loadAllQuestionsFromLocalDB,
  syncFullDatasetToLocalDB,
  getSyncMetadata,
  CURRENT_DATABASE_VERSION
} from '../services/localDatabaseService';

const QuestionDbContext = createContext();

const initialQuestions = staticDatabase?.questoes || [];

export const QuestionDbProvider = ({ children }) => {
  const [questions, setQuestions] = useState(initialQuestions);
  const [localEditsMap, setLocalEditsMap] = useState({});
  const [isLoaded, setIsLoaded] = useState(true); // Instant load
  const [isSynchronized, setIsSynchronized] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState(Date.now());
  const [loadError, setLoadError] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusText, setSyncStatusText] = useState(`🟢 Sincronizado (${initialQuestions.length} questões)`);

  // Master background synchronization routine
  const performSync = useCallback(async (forceRemote = false) => {
    try {
      setIsSyncing(true);
      let baseQuestions = initialQuestions;
      const syncMeta = getSyncMetadata();
      const isVersionValid = syncMeta?.version === CURRENT_DATABASE_VERSION && (syncMeta?.count || 0) >= 5000;

      // 1. If valid cache exists in IndexedDB, load it
      if (!forceRemote && isVersionValid) {
        const localCached = await loadAllQuestionsFromLocalDB();
        if (localCached && localCached.length >= 5000) {
          baseQuestions = localCached;
        }
      } else {
        // Sync static base to local IndexedDB
        if (baseQuestions.length > 0) {
          await syncFullDatasetToLocalDB(baseQuestions, CURRENT_DATABASE_VERSION);
        }
      }

      // 2. Overlay user custom edits and additions
      const edits = await getLocalQuestionEdits();
      setLocalEditsMap(edits || {});

      let merged = [...baseQuestions];
      if (edits && Object.keys(edits).length > 0) {
        const baseIdSet = new Set(baseQuestions.map(q => q.id));
        merged = baseQuestions.map(q => edits[q.id] || q);
        Object.values(edits).forEach(customQ => {
          if (!baseIdSet.has(customQ.id)) {
            merged.push(customQ);
          }
        });
      }

      setQuestions(merged);
      setIsSynchronized(true);
      setLastSyncTime(Date.now());
      setSyncStatusText(`🟢 Sincronizado (${merged.length} questões)`);
      setIsLoaded(true);
      return merged;
    } catch (err) {
      console.warn('Sync notice:', err);
      // Fallback to initial questions
      setQuestions(initialQuestions);
      setIsLoaded(true);
      return initialQuestions;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Initial Background Sync + Cross-tab listeners
  useEffect(() => {
    performSync();

    let channel = null;
    try {
      if (typeof window !== 'undefined' && window.BroadcastChannel) {
        channel = new BroadcastChannel('PNA_DATABASE_SYNC_CHANNEL');
        channel.onmessage = (msg) => {
          if (msg.data === 'QUESTION_UPDATED' || msg.data === 'FORCE_RESYNC') {
            performSync(false);
          }
        };
      }
    } catch (e) {
      console.debug('BroadcastChannel not supported', e);
    }

    const handleStorageChange = (e) => {
      if (e.key && e.key.startsWith('PNA_MED_')) {
        performSync(false);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('online', () => performSync(true));

    const interval = setInterval(() => {
      performSync(false);
    }, 60000);

    return () => {
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [performSync]);

  const notifyOtherTabs = () => {
    try {
      if (typeof window !== 'undefined' && window.BroadcastChannel) {
        const channel = new BroadcastChannel('PNA_DATABASE_SYNC_CHANNEL');
        channel.postMessage('QUESTION_UPDATED');
        channel.close();
      }
    } catch (e) {
      console.debug(e);
    }
  };

  // Save/Edit a question with immediate real-time synchronization and direct disk persistence
  const editQuestion = async (updatedQuestion) => {
    const saved = await saveLocalQuestionEdit(updatedQuestion);
    if (!saved) return false;

    // Direct Disk File Write
    try {
      fetch('/api/save-question', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify(saved)
      });
    } catch (e) {
      console.debug('Disk save question fallback');
    }

    setLocalEditsMap(prev => ({
      ...prev,
      [saved.id]: saved
    }));

    setQuestions(prev => {
      const exists = prev.some(q => q.id === saved.id);
      if (exists) {
        return prev.map(q => q.id === saved.id ? saved : q);
      } else {
        return [saved, ...prev];
      }
    });

    setLastSyncTime(Date.now());
    notifyOtherTabs();
    return true;
  };

  const resetAllEdits = async () => {
    await clearAllLocalQuestionEdits();
    await performSync(true);
    notifyOtherTabs();
    return true;
  };

  const forceFullResync = async () => {
    await clearFullLocalCache();
    const list = await performSync(true);
    notifyOtherTabs();
    return list.length;
  };

  const exportDatabase = () => {
    exportFullDatabaseJSON(questions);
  };

  const syncDatabaseLocally = async () => {
    try {
      const list = await performSync(true);
      return { success: true, count: list.length };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  const importFullDatabase = async (jsonString) => {
    try {
      const parsed = JSON.parse(jsonString);
      const list = Array.isArray(parsed) ? parsed : (parsed.questoes || []);
      if (list.length > 0) {
        await syncFullDatasetToLocalDB(list);
        setQuestions(list);
        notifyOtherTabs();
        return { success: true, count: list.length };
      }
      return { success: false, error: "Arquivo inválido ou sem questões" };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  return (
    <QuestionDbContext.Provider
      value={{
        questions,
        isLoaded,
        isSynchronized,
        isSyncing,
        lastSyncTime,
        syncStatusText,
        loadError,
        localEditsCount: Object.keys(localEditsMap).length,
        localEditsMap,
        editQuestion,
        resetAllEdits,
        resetEdits: resetAllEdits,
        forceFullResync,
        syncDatabaseLocally,
        importFullDatabase,
        exportDatabase,
        performSync
      }}
    >
      {children}
    </QuestionDbContext.Provider>
  );
};

export const useQuestionDb = () => {
  const context = useContext(QuestionDbContext);
  if (!context) {
    throw new Error('useQuestionDb must be used within a QuestionDbProvider');
  }
  return context;
};
