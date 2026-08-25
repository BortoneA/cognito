/**
 * Achievement Service — Motor de Conquistas PNA MedPremium
 * Calcula e desbloqueia badges com base no progresso do usuário
 */

export const ACHIEVEMENTS = [
  // Primeiros Passos
  {
    id: 'first_question',
    title: 'Primeira Chama',
    description: 'Respondeu sua primeira questão',
    icon: '🔥',
    category: 'início',
    check: (p) => Object.keys(p.answers || {}).length >= 1,
  },
  {
    id: 'ten_questions',
    title: 'Em Movimento',
    description: 'Respondeu 10 questões',
    icon: '🚀',
    category: 'volume',
    check: (p) => Object.keys(p.answers || {}).length >= 10,
  },
  {
    id: 'fifty_questions',
    title: 'Dedicação Crescente',
    description: 'Respondeu 50 questões',
    icon: '📚',
    category: 'volume',
    check: (p) => Object.keys(p.answers || {}).length >= 50,
  },
  {
    id: 'hundred_questions',
    title: '100 Respondidas',
    description: 'Respondeu 100 questões no total',
    icon: '💯',
    category: 'volume',
    check: (p) => Object.keys(p.answers || {}).length >= 100,
  },
  {
    id: 'five_hundred_questions',
    title: 'Maratonista',
    description: 'Respondeu 500 questões',
    icon: '🏃',
    category: 'volume',
    check: (p) => Object.keys(p.answers || {}).length >= 500,
  },
  {
    id: 'thousand_questions',
    title: 'Resistência de Elite',
    description: 'Respondeu 1000 questões',
    icon: '⚡',
    category: 'volume',
    check: (p) => Object.keys(p.answers || {}).length >= 1000,
  },

  // Acurácia
  {
    id: 'accuracy_50',
    title: 'Metade Certa',
    description: 'Atingiu 50% de acurácia global (mín. 20 questões)',
    icon: '🎯',
    category: 'acurácia',
    check: (p) => {
      const answers = Object.values(p.answers || {});
      if (answers.length < 20) return false;
      const correct = answers.filter(a => a.isCorrect).length;
      return (correct / answers.length) >= 0.5;
    },
  },
  {
    id: 'accuracy_70',
    title: 'Aprovado PNA',
    description: 'Atingiu 70% de acurácia global (mín. 50 questões)',
    icon: '🏆',
    category: 'acurácia',
    check: (p) => {
      const answers = Object.values(p.answers || {});
      if (answers.length < 50) return false;
      const correct = answers.filter(a => a.isCorrect).length;
      return (correct / answers.length) >= 0.7;
    },
  },
  {
    id: 'accuracy_80',
    title: 'Excelência Clínica',
    description: 'Atingiu 80% de acurácia global (mín. 100 questões)',
    icon: '🌟',
    category: 'acurácia',
    check: (p) => {
      const answers = Object.values(p.answers || {});
      if (answers.length < 100) return false;
      const correct = answers.filter(a => a.isCorrect).length;
      return (correct / answers.length) >= 0.8;
    },
  },
  {
    id: 'accuracy_90',
    title: 'Mestre Médico',
    description: 'Atingiu 90% de acurácia global (mín. 200 questões)',
    icon: '👑',
    category: 'acurácia',
    check: (p) => {
      const answers = Object.values(p.answers || {});
      if (answers.length < 200) return false;
      const correct = answers.filter(a => a.isCorrect).length;
      return (correct / answers.length) >= 0.9;
    },
  },

  // Consistência
  {
    id: 'streak_3',
    title: '3 Dias Seguidos',
    description: 'Estudou 3 dias consecutivos',
    icon: '📅',
    category: 'consistência',
    check: (p) => getMaxStreak(p.dailyActivity || {}) >= 3,
  },
  {
    id: 'streak_7',
    title: 'Semana Perfeita',
    description: 'Estudou 7 dias consecutivos',
    icon: '🗓️',
    category: 'consistência',
    check: (p) => getMaxStreak(p.dailyActivity || {}) >= 7,
  },
  {
    id: 'streak_30',
    title: 'Mês de Ferro',
    description: 'Estudou 30 dias consecutivos',
    icon: '🔩',
    category: 'consistência',
    check: (p) => getMaxStreak(p.dailyActivity || {}) >= 30,
  },

  // Flashcards
  {
    id: 'first_flashcard',
    title: 'Primeiro Card',
    description: 'Revisou seu primeiro flashcard',
    icon: '🃏',
    category: 'flashcards',
    check: (p) => {
      const activity = Object.values(p.dailyActivity || {});
      return activity.some(day => (day.flashcards || 0) >= 1);
    },
  },
  {
    id: 'flashcard_50',
    title: 'Anki Iniciante',
    description: 'Revisou 50 flashcards no total',
    icon: '🧠',
    category: 'flashcards',
    check: (p) => {
      const total = Object.values(p.dailyActivity || {}).reduce((sum, d) => sum + (d.flashcards || 0), 0);
      return total >= 50;
    },
  },
  {
    id: 'flashcard_200',
    title: 'Anki Master',
    description: 'Revisou 200 flashcards no total',
    icon: '🎖️',
    category: 'flashcards',
    check: (p) => {
      const total = Object.values(p.dailyActivity || {}).reduce((sum, d) => sum + (d.flashcards || 0), 0);
      return total >= 200;
    },
  },

  // Simulados
  {
    id: 'first_exam',
    title: 'Primeiro Simulado',
    description: 'Completou seu primeiro simulado',
    icon: '📝',
    category: 'simulados',
    check: (p) => (p.examHistory || []).length >= 1,
  },
  {
    id: 'five_exams',
    title: 'Candidato Experiente',
    description: 'Completou 5 simulados',
    icon: '🎓',
    category: 'simulados',
    check: (p) => (p.examHistory || []).length >= 5,
  },
  {
    id: 'exam_pass',
    title: 'Aprovado no Simulado',
    description: 'Atingiu 70%+ em um simulado completo',
    icon: '✅',
    category: 'simulados',
    check: (p) => {
      return (p.examHistory || []).some(e => e.accuracyPct >= 70);
    },
  },

  // Notas
  {
    id: 'first_note',
    title: 'Anotador',
    description: 'Criou sua primeira anotação em uma questão',
    icon: '✏️',
    category: 'estudo',
    check: (p) => Object.keys(p.notes || {}).length >= 1,
  },
];

// Helper: calcula a maior sequência de dias consecutivos
function getMaxStreak(dailyActivity) {
  const dates = Object.entries(dailyActivity)
    .filter(([, v]) => (v.questions || 0) + (v.flashcards || 0) > 0)
    .map(([date]) => date)
    .sort();

  if (dates.length === 0) return 0;

  let maxStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diffDays = (curr - prev) / (1000 * 60 * 60 * 24);
    if (diffDays === 1) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }
  return maxStreak;
}

/**
 * Retorna IDs de conquistas recém-desbloqueadas comparando com as já salvas
 */
export const checkNewAchievements = (progress, alreadyUnlocked = {}) => {
  const newlyUnlocked = [];
  for (const achievement of ACHIEVEMENTS) {
    if (alreadyUnlocked[achievement.id]) continue;
    try {
      if (achievement.check(progress)) {
        newlyUnlocked.push(achievement.id);
      }
    } catch (e) {
      // skip
    }
  }
  return newlyUnlocked;
};

/**
 * Retorna todas as conquistas com status desbloqueado
 */
export const getAllAchievementsWithStatus = (progress, unlockedBadges = {}) => {
  return ACHIEVEMENTS.map(a => {
    let unlocked = !!unlockedBadges[a.id];
    let progress_pct = 0;

    // Se não desbloqueado, tenta ver o progresso
    if (!unlocked) {
      try { unlocked = a.check(progress); } catch (e) {}
    }

    return { ...a, unlocked };
  });
};
