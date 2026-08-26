import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

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

// Immediate Neon Cloud Persistence Helper
const saveProgressToNeon = async (payload) => {
  try {
    const res = await fetch('/api/save-progress', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      console.debug('Neon save response notice:', res.statusText);
    }
  } catch (e) {
    console.debug('Neon progress save offline notice:', e.message);
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

  const [isCloudSynced, setIsCloudSynced] = useState(false);
  const [lastCloudSyncTime, setLastCloudSyncTime] = useState(null);

  // Master function to pull fresh progress directly from Neon PostgreSQL
  const refreshProgressFromNeon = useCallback(async () => {
    try {
      const res = await fetch('/api/load-progress', {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });
      if (res.ok) {
        const cloudData = await res.json();
        if (cloudData && !cloudData.empty && cloudData.answers) {
          setProgress(prev => {
            const merged = {
              ...defaultState,
              ...prev,
              ...cloudData,
              answers: { ...prev.answers, ...cloudData.answers },
              savedQuestions: { ...prev.savedQuestions, ...cloudData.savedQuestions },
              notes: { ...prev.notes, ...cloudData.notes }
            };
            try {
              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
            } catch (_) {}
            return merged;
          });
          setIsCloudSynced(true);
          setLastCloudSyncTime(Date.now());
        }
      }
    } catch (e) {
      console.debug('Neon progress poll offline notice');
    }
  }, []);

  // 1. Initial Load: Immediately pull everything from Neon PostgreSQL Cloud
  useEffect(() => {
    refreshProgressFromNeon();

    // 2. Real-Time Heartbeat: Auto-pull every 20 seconds from Neon for multi-device sync
    const interval = setInterval(() => {
      refreshProgressFromNeon();
    }, 20000);

    const handleOnline = () => {
      refreshProgressFromNeon();
    };

    window.addEventListener('online', handleOnline);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
    };
  }, [refreshProgressFromNeon]);

  // Save to LocalStorage whenever progress changes
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(progress));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }, [progress]);

  const recordActivity = (type = 'flashcards', count = 1) => {
    const today = new Date().toISOString().slice(0, 10);
    setProgress(prev => {
      const currentDaily = prev.dailyActivity || {};
      const todayEntry = currentDaily[today] || { questions: 0, flashcards: 0 };
      const updated = {
        ...prev,
        dailyActivity: {
          ...currentDaily,
          [today]: {
            ...todayEntry,
            [type]: (todayEntry[type] || 0) + count
          }
        }
      };
      saveProgressToNeon(updated);
      return updated;
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
      saveProgressToNeon(updated);
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
      saveProgressToNeon(updated);
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
      saveProgressToNeon(updated);
      return updated;
    });
  };

  const saveExamResult = (examLog) => {
    setProgress(prev => {
      const updated = {
        ...prev,
        examHistory: [examLog, ...(prev.examHistory || [])]
      };
      saveProgressToNeon(updated);
      return updated;
    });
  };

  const unlockAchievement = (id) => {
    setProgress(prev => {
      const badges = prev.unlockedBadges || {};
      if (badges[id]) return prev;
      const updated = {
        ...prev,
        unlockedBadges: {
          ...badges,
          [id]: Date.now()
        }
      };
      saveProgressToNeon(updated);
      return updated;
    });
  };

  const setDailyGoal = (goal) => {
    const parsed = parseInt(goal, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setProgress(prev => {
        const updated = { ...prev, dailyGoal: parsed };
        saveProgressToNeon(updated);
        return updated;
      });
    }
  };

  const setHighlighterColor = (color) => {
    setProgress(prev => ({
      ...prev,
      highlighterColor: color
    }));
  };

  const resetAllProgress = () => {
    if (window.confirm("Atenção: Deseja realmente zerar todo o seu histórico de desempenho e anotações no Neon DB?")) {
      setProgress(defaultState);
      saveProgressToNeon(defaultState);
    }
  };

  const resetProgress = () => {
    setProgress(defaultState);
    saveProgressToNeon(defaultState);
  };

  const exportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(progress, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `pna_progresso_neon_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const importData = (jsonString) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && typeof parsed === 'object') {
        const merged = { ...defaultState, ...parsed };
        setProgress(merged);
        saveProgressToNeon(merged);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return (
    <UserProgressContext.Provider
      value={{
        progress,
        isCloudSynced,
        lastCloudSyncTime,
        refreshProgressFromNeon,
        saveAnswer,
        toggleSaveQuestion,
        saveNote,
        saveExamResult,
        unlockAchievement,
        setDailyGoal,
        setHighlighterColor,
        recordActivity,
        resetAllProgress,
        resetProgress,
        exportData,
        importData
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
