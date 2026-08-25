import React, { createContext, useContext, useState, useEffect } from 'react';
import bancoData from '../data/banco_questoes_pna.json';
import { 
  getLocalQuestionEdits, 
  saveLocalQuestionEdit, 
  clearAllLocalQuestionEdits,
  exportFullDatabaseJSON 
} from '../services/localDatabaseService';

const QuestionDbContext = createContext();

export const QuestionDbProvider = ({ children }) => {
  const [questions, setQuestions] = useState(bancoData.questoes || []);
  const [localEditsMap, setLocalEditsMap] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Load initial dataset & merge with local IndexedDB/LocalStorage edits
  useEffect(() => {
    const initLocalDb = async () => {
      try {
        const edits = await getLocalQuestionEdits();
        setLocalEditsMap(edits);

        if (edits && Object.keys(edits).length > 0) {
          const merged = (bancoData.questoes || []).map(q => edits[q.id] || q);
          // Also append any newly created custom questions that aren't in base json
          const baseIdSet = new Set((bancoData.questoes || []).map(q => q.id));
          Object.values(edits).forEach(customQ => {
            if (!baseIdSet.has(customQ.id)) {
              merged.push(customQ);
            }
          });
          setQuestions(merged);
        }
      } catch (err) {
        console.error('Failed to load local DB edits:', err);
      } finally {
        setIsLoaded(true);
      }
    };

    initLocalDb();
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
    setQuestions(bancoData.questoes || []);
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
