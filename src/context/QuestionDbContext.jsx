import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import staticDatabase from '../data/banco_questoes_pna.json';
import { 
  loadAllQuestionsFromNeon, 
  saveQuestionToNeon 
} from '../services/neonDatabaseService';
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
  const [isLoaded, setIsLoaded] = useState(false); // Direct Neon check
  const [isSynchronized, setIsSynchronized] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState(Date.now());
  const [loadError, setLoadError] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusText, setSyncStatusText] = useState('⚡ Neon PostgreSQL Cloud (Conectando...)');
  const [cloudSource, setCloudSource] = useState('Neon PostgreSQL Cloud (Master)');

  // Master Neon PostgreSQL Direct Synchronization Routine
  const performSync = useCallback(async (forceFull = false) => {
    try {
      setIsSyncing(true);
      let baseQuestions = [];
      let sourceName = 'Neon PostgreSQL Cloud (Master)';

      // 1. PRIORIDADE 1: Conexão Direta ao Neon PostgreSQL Cloud via Driver Serverless
      try {
        const neonRes = await loadAllQuestionsFromNeon();
        if (neonRes.success && neonRes.questoes && neonRes.questoes.length >= 5000) {
          baseQuestions = neonRes.questoes;
          sourceName = 'Neon PostgreSQL Cloud (Master)';
          setCloudSource('Neon PostgreSQL Cloud (Master)');
          syncFullDatasetToLocalDB(baseQuestions, CURRENT_DATABASE_VERSION).catch(() => {});
        }
      } catch (neonErr) {
        console.debug('[QuestionDb] Neon direct query notice:', neonErr.message);
      }

      // 2. PRIORIDADE 2: Fallback para rota /api/questions (se rodando via server.js local)
      if (baseQuestions.length === 0) {
        try {
          const res = await fetch('/api/questions', { 
            headers: { 'ngrok-skip-browser-warning': 'true' }
          });
          if (res.ok) {
            const data = await res.json();
            if (data && data.questoes && data.questoes.length >= 5000) {
              baseQuestions = data.questoes;
              sourceName = 'Neon PostgreSQL Local Proxy';
              setCloudSource('Neon PostgreSQL Cloud');
              syncFullDatasetToLocalDB(baseQuestions, CURRENT_DATABASE_VERSION).catch(() => {});
            }
          }
        } catch (_) {}
      }

      // 3. Fallback resiliente se offline
      if (baseQuestions.length === 0) {
        const syncMeta = getSyncMetadata();
        const isVersionValid = syncMeta?.version === CURRENT_DATABASE_VERSION && (syncMeta?.count || 0) >= 5000;
        if (isVersionValid) {
          const localCached = await loadAllQuestionsFromLocalDB();
          if (localCached && localCached.length >= 5000) {
            baseQuestions = localCached;
            sourceName = 'Neon PostgreSQL (Cache Resiliente)';
            setCloudSource('Neon PostgreSQL (Cache Resiliente)');
          }
        }
      }

      // 4. Fallback bundle se primeira inicialização offline
      if (baseQuestions.length === 0) {
        baseQuestions = initialQuestions;
        sourceName = 'Neon PostgreSQL (Base Inicial)';
        setCloudSource('Neon PostgreSQL (Base Inicial)');
        if (baseQuestions.length > 0) {
          syncFullDatasetToLocalDB(baseQuestions, CURRENT_DATABASE_VERSION).catch(() => {});
        }
      }

      // 5. Incorporar edições personalizadas
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
      setSyncStatusText(`⚡ ${sourceName} (${merged.length} questões)`);
      setIsLoaded(true);
      return merged;
    } catch (err) {
      console.warn('Sync notice:', err);
      setQuestions(initialQuestions);
      setIsLoaded(true);
      return initialQuestions;
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Initial Direct Sync + Periodic Cloud Heartbeat every 15s
  useEffect(() => {
    performSync(true);

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
      if (e.key && e.key === 'PNA_MED_LOCAL_QUESTION_EDITS_V2') {
        performSync(false);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('online', () => performSync(true));

    const interval = setInterval(() => {
      performSync(false);
    }, 15000);

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

  // Save/Edit a question directly in Neon PostgreSQL Cloud
  const editQuestion = async (updatedQuestion) => {
    const saved = await saveLocalQuestionEdit(updatedQuestion);
    if (!saved) return false;

    // 1. Direct Neon PostgreSQL Driver Write
    try {
      await saveQuestionToNeon(saved);
    } catch (e) {
      console.debug('Neon direct save notice:', e);
    }

    // 2. Server.js API route write (if running)
    try {
      fetch('/api/save-question', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify(saved)
      }).catch(() => {});
    } catch (_) {}

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
        cloudSource,
        loadError,
        localEditsCount: Object.keys(localEditsMap).length,
        localEditsMap,
        editQuestion,
        updateQuestion: editQuestion,
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
