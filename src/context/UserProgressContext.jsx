import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const UserProgressContext = createContext();

const LOCAL_STORAGE_KEY = 'PNA_MED_USER_PROGRESS_V2';

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

// Disk Persistence Helper
const saveProgressToDisk = async (payload) => {
  try {
    const res = await fetch('/api/save-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      console.warn('Could not sync progress to local disk file:', res.statusText);
    }
  } catch (e) {
    // Offline or server not responding, LocalStorage remains safe
    console.debug('Disk sync skipped (offline mode):', e.message);
  }
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

  const syncTimeoutRef = useRef(null);

  // 1. Initial Load: Check disk file on startup
  useEffect(() => {
    const loadDiskProgress = async () => {
      try {
        const res = await fetch('/api/load-progress');
        if (res.ok) {
          const diskData = await res.json();
          if (diskData && !diskData.empty && diskData.answers) {
            setProgress(prev => {
              // Merge disk data with local data (giving priority to highest answer count or newest timestamp)
              const diskAnswersCount = Object.keys(diskData.answers || {}).length;
              const localAnswersCount = Object.keys(prev.answers || {}).length;
              
              if (diskAnswersCount >= localAnswersCount) {
                return {
                  ...defaultState,
                  ...prev,
                  ...diskData,
                  answers: { ...prev.answers, ...diskData.answers },
                  savedQuestions: { ...prev.savedQuestions, ...diskData.savedQuestions },
                  notes: { ...prev.notes, ...diskData.notes }
                };
              }
              return prev;
            });
          }
        }
      } catch (e) {
        console.debug('No disk server available on initial load');
      }
    };
    loadDiskProgress();
  }, []);

  // 2. Continuous Persistence: Save to LocalStorage + Direct Disk File on EVERY change
  useEffect(() => {
    // Save to browser LocalStorage immediately
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(progress));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }

    // Debounced direct disk write (200ms)
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => {
      saveProgressToDisk(progress);
    }, 200);

    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
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
      const updated = {
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
      // Trigger instant direct save
      saveProgressToDisk(updated);
      return updated;
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
      const updated = { ...prev, savedQuestions: newSaved };
      saveProgressToDisk(updated);
      return updated;
    });
  };

  const saveNote = (questionId, text) => {
    setProgress(prev => {
      const updated = {
        ...prev,
        notes: {
          ...prev.notes,
          [questionId]: text
        }
      };
      saveProgressToDisk(updated);
      return updated;
    });
  };

  const saveExamResult = (examLog) => {
    setProgress(prev => {
      const updated = {
        ...prev,
        examHistory: [examLog, ...(prev.examHistory || [])]
      };
      saveProgressToDisk(updated);
      return updated;
    });
  };

  const setHighlighterColor = (color) => {
    setProgress(prev => ({
      ...prev,
      highlighterColor: color
    }));
  };

  const resetAllProgress = () => {
    if (window.confirm("Atenção: Deseja realmente zerar todo o seu histórico de desempenho e anotações?")) {
      setProgress(defaultState);
      saveProgressToDisk(defaultState);
    }
  };

  return (
    <UserProgressContext.Provider
      value={{
        progress,
        saveAnswer,
        toggleSaveQuestion,
        saveNote,
        saveExamResult,
        setHighlighterColor,
        recordActivity,
        resetAllProgress
      }}
    >
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
