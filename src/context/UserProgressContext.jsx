import React, { createContext, useContext, useState, useEffect } from 'react';

const UserProgressContext = createContext();

const LOCAL_STORAGE_KEY = 'PNA_MED_USER_PROGRESS_V1';

const defaultState = {
  answers: {},          // { [qId]: { selectedOption, isCorrect, timestamp, timeSpentMs } }
  savedQuestions: {},   // { [qId]: boolean }
  notes: {},            // { [qId]: string }
  examHistory: [],      // Array of exam simulation logs
  dailyActivity: {},    // { 'YYYY-MM-DD': { questions: 0, flashcards: 0 } }
  highlighterColor: 'yellow',
  unlockedBadges: {},   // { [achievementId]: timestamp }
  dailyGoal: 20,        // questões por dia
};

export const UserProgressProvider = ({ children }) => {
  const [progress, setProgress] = useState(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      return saved ? { ...defaultState, ...JSON.parse(saved) } : defaultState;
    } catch (e) {
      console.error('Failed to load user progress from localStorage:', e);
      return defaultState;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(progress));
    } catch (e) {
      console.error('Failed to save user progress to localStorage:', e);
    }
  }, [progress]);

  const recordActivity = (type = 'flashcards', count = 1) => {
    const today = new Date().toISOString().slice(0, 10);
    setProgress(prev => {
      const currentDaily = prev.dailyActivity || {};
      const todayEntry = currentDaily[today] || { questions: 0, flashcards: 0 };
      return {
        ...prev,
        dailyActivity: {
          ...currentDaily,
          [today]: {
            ...todayEntry,
            [type]: (todayEntry[type] || 0) + count
          }
        }
      };
    });
  };

  const saveAnswer = (questionId, selectedOption, isCorrect, timeSpentMs = 0) => {
    const today = new Date().toISOString().slice(0, 10);
    setProgress(prev => {
      const currentDaily = prev.dailyActivity || {};
      const todayEntry = currentDaily[today] || { questions: 0, flashcards: 0 };
      return {
        ...prev,
        answers: {
          ...prev.answers,
          [questionId]: {
            selectedOption,
            isCorrect,
            timestamp: Date.now(),
            timeSpentMs
          }
        },
        dailyActivity: {
          ...currentDaily,
          [today]: {
            ...todayEntry,
            questions: (todayEntry.questions || 0) + 1
          }
        }
      };
    });
  };

  const toggleSaveQuestion = (questionId) => {
    setProgress(prev => {
      const newSaved = { ...prev.savedQuestions };
      if (newSaved[questionId]) {
        delete newSaved[questionId];
      } else {
        newSaved[questionId] = true;
      }
      return { ...prev, savedQuestions: newSaved };
    });
  };

  const saveNote = (questionId, text) => {
    setProgress(prev => ({
      ...prev,
      notes: {
        ...prev.notes,
        [questionId]: text
      }
    }));
  };

  const setHighlighterColor = (color) => {
    setProgress(prev => ({ ...prev, highlighterColor: color }));
  };

  const saveExamResult = (examData) => {
    setProgress(prev => ({
      ...prev,
      examHistory: [examData, ...(prev.examHistory || [])]
    }));
  };

  const exportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(progress, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `pna_progresso_medico_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const importData = (jsonData) => {
    try {
      const parsed = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      if (parsed && typeof parsed === 'object') {
        setProgress({ ...defaultState, ...parsed });
        return true;
      }
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
    return false;
  };

  const resetProgress = () => {
    setProgress(defaultState);
  };

  const unlockAchievement = (achievementId) => {
    setProgress(prev => {
      if (prev.unlockedBadges?.[achievementId]) return prev; // already unlocked
      return {
        ...prev,
        unlockedBadges: {
          ...(prev.unlockedBadges || {}),
          [achievementId]: Date.now()
        }
      };
    });
  };

  const setDailyGoal = (goal) => {
    setProgress(prev => ({ ...prev, dailyGoal: goal }));
  };

  return (
    <UserProgressContext.Provider value={{
      progress,
      saveAnswer,
      recordActivity,
      toggleSaveQuestion,
      saveNote,
      setHighlighterColor,
      saveExamResult,
      exportData,
      importData,
      resetProgress,
      unlockAchievement,
      setDailyGoal,
    }}>
      {children}
    </UserProgressContext.Provider>
  );
};

export const useUserProgress = () => {
  const context = useContext(UserProgressContext);
  if (!context) {
    throw new Error('useUserProgress must be used within a UserProgressProvider');
  }
  return context;
};
