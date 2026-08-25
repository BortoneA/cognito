import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  getLocalQuestionEdits, 
  saveLocalQuestionEdit, 
  clearAllLocalQuestionEdits,
  exportFullDatabaseJSON 
} from '../services/localDatabaseService';

const QuestionDbContext = createContext();

export const QuestionDbProvider = ({ children }) => {
  const [questions, setQuestions] = useState([]);
  const [localEditsMap, setLocalEditsMap] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);

  // Load initial dataset & merge with local IndexedDB/LocalStorage edits
  useEffect(() => {
    let isMounted = true;

    const initDatabase = async () => {
      try {
        let baseQuestions = [];

        // 1. Try fetching from public/data/ (streaming browser JSON parse, highly efficient)
        try {
          const res = await fetch('/data/banco_questoes_pna.json');
          if (res.ok) {
            const data = await res.json();
            baseQuestions = data.questoes || [];
          }
        } catch (fetchErr) {
          console.warn('Fetch from public data failed, trying fallback import...', fetchErr);
        }

        // 2. Fallback to dynamic import if fetch didn't return data
        if (baseQuestions.length === 0) {
          const staticData = await import('../data/banco_questoes_pna.json');
          baseQuestions = staticData.default?.questoes || staticData.questoes || [];
        }

        // 3. Load local edits from IndexedDB / LocalStorage
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
        console.error('Failed to load database:', err);
        if (isMounted) setLoadError(err.message || 'Erro ao carregar banco');
      } finally {
        if (isMounted) setIsLoaded(true);
      }
    };

    initDatabase();

    return () => {
      isMounted = false;
    };
  }, []);

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
        setQuestions(data.questoes || []);
      }
    } catch (e) {
      console.error(e);
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
      loadError,
      updateQuestion,
      addCustomQuestion,
      resetEdits,
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
