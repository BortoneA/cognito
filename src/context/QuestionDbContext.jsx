import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

export const QuestionDbProvider = ({ children }) => {
  const [questions, setQuestions] = useState([]);
  const [localEditsMap, setLocalEditsMap] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSynchronized, setIsSynchronized] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(Date.now());
  const [loadError, setLoadError] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusText, setSyncStatusText] = useState('Sincronizando...');

  // Master synchronization routine
  const performSync = useCallback(async (forceRemote = false) => {
    try {
      setIsSyncing(true);
      let baseQuestions = [];
      const syncMeta = getSyncMetadata();
      const isVersionValid = syncMeta?.version === CURRENT_DATABASE_VERSION && (syncMeta?.count || 0) >= 5000;

      // 1. If not forcing remote, check local IndexedDB first
      if (!forceRemote && isVersionValid) {
        const localCached = await loadAllQuestionsFromLocalDB();
        if (localCached && localCached.length >= 5000) {
          baseQuestions = localCached;
        }
      }

      // 2. Fetch fresh dataset if cache is empty, stale, or forced
      if (baseQuestions.length === 0) {
        try {
          const res = await fetch('/data/banco_questoes_pna.json', { cache: 'no-cache' });
          if (res.ok) {
            const data = await res.json();
            baseQuestions = data.questoes || [];
          }
        } catch (fetchErr) {
          console.warn('Fetch fallback to static import', fetchErr);
        }

        if (baseQuestions.length === 0) {
          const staticData = await import('../data/banco_questoes_pna.json');
          baseQuestions = staticData.default?.questoes || staticData.questoes || [];
        }

        // Store to IndexedDB
        if (baseQuestions.length > 0) {
          await syncFullDatasetToLocalDB(baseQuestions, CURRENT_DATABASE_VERSION);
        }
      }

      // 3. Overlay user custom edits and additions
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
      console.error('Sync error:', err);
      setLoadError(err.message || 'Erro de sincronização');
      setSyncStatusText('⚠️ Erro de sincronização');
      return [];
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Initial Sync on mount + Continuous Sync Heartbeat
  useEffect(() => {
    performSync();

    // Cross-tab synchronization via BroadcastChannel or storage event
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
      console.warn('BroadcastChannel not supported', e);
    }

    const handleStorageChange = (e) => {
      if (e.key && e.key.startsWith('PNA_MED_')) {
        performSync(false);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('online', () => performSync(true));

    // Continuous heartbeat sync every 60 seconds
    const interval = setInterval(() => {
      performSync(false);
    }, 60000);

    return () => {
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [performSync]);

  // Broadcast helper
  const notifyOtherTabs = () => {
    try {
      if (typeof window !== 'undefined' && window.BroadcastChannel) {
        const channel = new BroadcastChannel('PNA_DATABASE_SYNC_CHANNEL');
        channel.postMessage('QUESTION_UPDATED');
        channel.close();
      }
    } catch (e) {
      console.warn(e);
    }
  };

  // Save/Edit a question with immediate real-time synchronization
  const editQuestion = async (updatedQuestion) => {
    const saved = await saveLocalQuestionEdit(updatedQuestion);
    if (!saved) return false;

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

  // Reset local edits
  const resetAllEdits = async () => {
    await clearAllLocalQuestionEdits();
    await performSync(true);
    notifyOtherTabs();
    return true;
  };

  // Force full resync from server
  const forceFullResync = async () => {
    await clearFullLocalCache();
    const list = await performSync(true);
    notifyOtherTabs();
    return list.length;
  };

  // Export full DB
  const exportDatabase = () => {
    exportFullDatabaseJSON(questions);
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
        forceFullResync,
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
