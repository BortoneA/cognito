import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  getLocalQuestionEdits, 
  saveLocalQuestionEdit, 
  clearAllLocalQuestionEdits,
  clearFullLocalCache,
  exportFullDatabaseJSON,
  loadAllQuestionsFromLocalDB,
  syncFullDatasetToLocalDB,
  getSyncMetadata
} from '../services/localDatabaseService';

const QuestionDbContext = createContext();

export const QuestionDbProvider = ({ children }) => {
  const [questions, setQuestions] = useState([]);
  const [localEditsMap, setLocalEditsMap] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSynchronized, setIsSynchronized] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Initialize and synchronize local database
  useEffect(() => {
    let isMounted = true;

    const initDatabase = async () => {
      try {
        let baseQuestions = [];

        // 1. First, check if full dataset already exists in local IndexedDB (instant offline load)
        const localCached = await loadAllQuestionsFromLocalDB();
        const syncMeta = getSyncMetadata();

        if (localCached && localCached.length > 0) {
          baseQuestions = localCached;
          if (isMounted) {
            setIsSynchronized(true);
            setLastSyncTime(syncMeta?.timestamp || Date.now());
          }
        } else {
          // 2. Fetch base JSON from public/data/ or static import
          try {
            const res = await fetch('/data/banco_questoes_pna.json');
            if (res.ok) {
              const data = await res.json();
              baseQuestions = data.questoes || [];
            }
          } catch (fetchErr) {
            console.warn('Fetch failed, falling back to static import', fetchErr);
          }

          if (baseQuestions.length === 0) {
            const staticData = await import('../data/banco_questoes_pna.json');
            baseQuestions = staticData.default?.questoes || staticData.questoes || [];
          }

          // 3. Automatically synchronize full dataset to IndexedDB locally
          if (baseQuestions.length > 0) {
            await syncFullDatasetToLocalDB(baseQuestions);
            if (isMounted) {
              setIsSynchronized(true);
              setLastSyncTime(Date.now());
            }
          }
        }

        // 4. Overlay user edits
        const edits = await getLocalQuestionEdits();
        if (!isMounted) return;

        setLocalEditsMap(edits || {});

        if (edits && Object.keys(edits).length > 0) {
          const merged = baseQuestions.map(q => edits[q.id] || q);
          const baseIdSet = new Set(baseQuestions.map(q => q.id));
          Object.values(edits).forEach(customQ => {
            if (!baseIdSet.has(customQ.id)) {
              merged.push(customQ);
            }
          });
          setQuestions(merged);
        } else {
          setQuestions(baseQuestions);
        }
      } catch (err) {
        console.error('Failed to load local database:', err);
        if (isMounted) setLoadError(err.message || 'Erro ao sincronizar banco local');
      } finally {
        if (isMounted) setIsLoaded(true);
      }
    };

    initDatabase();

    return () => {
      isMounted = false;
    };
  }, []);

  // Force manual synchronization of the local database
  const syncDatabaseLocally = async () => {
    setIsSyncing(true);
    try {
      let freshQuestions = [];
      const res = await fetch('/data/banco_questoes_pna.json');
      if (res.ok) {
        const data = await res.json();
        freshQuestions = data.questoes || [];
      }

      if (freshQuestions.length > 0) {
        const edits = await getLocalQuestionEdits();
        const merged = freshQuestions.map(q => edits[q.id] || q);
        const baseIdSet = new Set(freshQuestions.map(q => q.id));
        Object.values(edits).forEach(customQ => {
          if (!baseIdSet.has(customQ.id)) {
            merged.push(customQ);
          }
        });

        await syncFullDatasetToLocalDB(merged);
        setQuestions(merged);
        setIsSynchronized(true);
        setLastSyncTime(Date.now());
        return { success: true, count: merged.length };
      }
    } catch (e) {
      console.error('Sync failed:', e);
      return { success: false, error: e.message };
    } finally {
      setIsSyncing(false);
    }
  };

  // Update question locally & in memory
  const updateQuestion = async (updatedQ) => {
    if (!updatedQ || !updatedQ.id) return;

    // Save to local storage / IndexedDB permanently
    const saved = await saveLocalQuestionEdit(updatedQ);

    setLocalEditsMap(prev => ({
      ...prev,
      [updatedQ.id]: saved
    }));

    setQuestions(prev => {
      const idx = prev.findIndex(q => q.id === updatedQ.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      } else {
        return [...prev, saved];
      }
    });
  };

  // Add brand new custom question
  const addCustomQuestion = async (newQ) => {
    const customId = newQ.id || `CUSTOM-${Date.now()}`;
    const questionToAdd = {
      ...newQ,
      id: customId,
      numero: newQ.numero || questions.length + 1,
      ano_da_prova: newQ.ano_da_prova || 2026,
      area: newQ.area || 'Clínica Médica',
      subarea: newQ.subarea || 'Geral',
      nivel_de_dificuldade: newQ.nivel_de_dificuldade || 'Moderada',
      isCustomCreated: true
    };
    await updateQuestion(questionToAdd);
    return questionToAdd;
  };

  // Reset all local edits back to raw JSON
  const resetEdits = async () => {
    await clearAllLocalQuestionEdits();
    setLocalEditsMap({});
    // Re-fetch raw dataset
    try {
      const res = await fetch('/data/banco_questoes_pna.json');
      if (res.ok) {
        const data = await res.json();
        const raw = data.questoes || [];
        await syncFullDatasetToLocalDB(raw);
        setQuestions(raw);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Import full external JSON database
  const importFullDatabase = async (jsonString) => {
    try {
      const parsed = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
      const questionsList = parsed.questoes || (Array.isArray(parsed) ? parsed : null);
      if (!questionsList || !Array.isArray(questionsList) || questionsList.length === 0) {
        return { success: false, message: 'Formato inválido. O arquivo deve conter uma lista de questões.' };
      }

      await syncFullDatasetToLocalDB(questionsList);
      setQuestions(questionsList);
      setIsSynchronized(true);
      setLastSyncTime(Date.now());
      return { success: true, count: questionsList.length };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  // Export database
  const exportDatabase = () => {
    exportFullDatabaseJSON(questions);
  };

  return (
    <QuestionDbContext.Provider value={{
      questions,
      totalQuestionsCount: questions.length,
      localEditsCount: Object.keys(localEditsMap).length,
      isLoaded,
      isSynchronized,
      lastSyncTime,
      isSyncing,
      loadError,
      syncDatabaseLocally,
      updateQuestion,
      addCustomQuestion,
      resetEdits,
      importFullDatabase,
      exportDatabase
    }}>
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
