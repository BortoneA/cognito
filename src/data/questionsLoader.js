/**
 * Questions Loader, Dynamic Queue & Filtering Utilities
 */

export const getUniqueYears = (questions = []) => {
  const years = new Set(questions.map(q => q.ano_da_prova).filter(Boolean));
  if (years.size === 0) {
    return [2024, 2023, 2022, 2021, 2020, 2019, 2018];
  }
  return Array.from(years).sort((a, b) => b - a);
};

export const getUniqueAreas = (questions = []) => {
  const areasMap = {};
  questions.forEach(q => {
    const area = q.area || "Outros";
    areasMap[area] = (areasMap[area] || 0) + 1;
  });
  return Object.entries(areasMap)
    .sort((a, b) => b[1] - a[1])
    .map(([area, count]) => ({ area, count }));
};

export const getUniqueSubareas = (questions = [], selectedArea = null) => {
  const subareasMap = {};
  questions.forEach(q => {
    if (selectedArea && selectedArea !== 'all' && q.area !== selectedArea) return;
    const subarea = q.subarea || "Geral";
    subareasMap[subarea] = (subareasMap[subarea] || 0) + 1;
  });
  return Object.entries(subareasMap)
    .sort((a, b) => b[1] - a[1])
    .map(([subarea, count]) => ({ subarea, count }));
};

export const getUniqueDifficulties = (questions = []) => {
  const diffMap = {};
  questions.forEach(q => {
    const diff = q.nivel_de_dificuldade || "Não informada";
    diffMap[diff] = (diffMap[diff] || 0) + 1;
  });
  return Object.entries(diffMap).map(([diff, count]) => ({ difficulty: diff, count }));
};

/**
 * Filters and orders questions with Dynamic Queue Priority:
 * - Unanswered questions always rise to the top of the queue.
 * - Answered questions automatically move to the bottom of the queue.
 */
export const filterQuestions = (questions = [], filters = {}, userProgress = {}) => {
  const userAnswers = userProgress.answers || {};
  const savedMap = userProgress.savedQuestions || {};

  const filtered = questions.filter(q => {
    // Year filter
    if (filters.year && filters.year !== 'all') {
      if (String(q.ano_da_prova) !== String(filters.year)) return false;
    }

    // Area filter
    if (filters.area && filters.area !== 'all') {
      if (q.area !== filters.area) return false;
    }

    // Subarea filter
    if (filters.subarea && filters.subarea !== 'all') {
      if (q.subarea !== filters.subarea) return false;
    }

    // Difficulty filter
    if (filters.difficulty && filters.difficulty !== 'all') {
      if (q.nivel_de_dificuldade !== filters.difficulty) return false;
    }

    // Status filter (all, answered, unanswered, correct, incorrect, saved)
    const history = userAnswers[q.id];
    const isSaved = savedMap[q.id];

    if (filters.status === 'unanswered' && history) return false;
    if (filters.status === 'answered' && !history) return false;
    if (filters.status === 'correct' && (!history || !history.isCorrect)) return false;
    if (filters.status === 'incorrect' && (!history || history.isCorrect)) return false;
    if (filters.status === 'saved' && !isSaved) return false;

    // Search query
    if (filters.search && filters.search.trim() !== '') {
      const term = filters.search.toLowerCase().trim();
      const matchId = q.id?.toLowerCase().includes(term);
      const matchNumber = String(q.numero || '').includes(term);
      const matchEnunciado = q.enunciado?.toLowerCase().includes(term);
      const matchExplicacao = q.explicacao?.toLowerCase().includes(term);
      const matchDoenca = q.doenca_ou_conjunto_de_doencas?.toLowerCase().includes(term);
      const matchArea = q.area?.toLowerCase().includes(term);
      const matchSubarea = q.subarea?.toLowerCase().includes(term);

      if (!matchId && !matchNumber && !matchEnunciado && !matchExplicacao && !matchDoenca && !matchArea && !matchSubarea) {
        return false;
      }
    }

    return true;
  });

  const sortBy = filters.sortBy || 'queue'; // 'queue' (default), 'exam', 'recent'

  if (sortBy === 'queue') {
    return filtered.sort((a, b) => {
      const ansA = userAnswers[a.id];
      const ansB = userAnswers[b.id];

      // 1. Unanswered (pendente) always goes FIRST (top of the queue)
      if (!ansA && ansB) return -1;
      if (ansA && !ansB) return 1;

      // 2. Both answered: older answers come before more recent ones (recently answered goes to absolute bottom)
      if (ansA && ansB) {
        const timeA = ansA.answeredAt || ansA.timestamp || 0;
        const timeB = ansB.answeredAt || ansB.timestamp || 0;
        return timeA - timeB;
      }

      // 3. Both unanswered: preserve official exam year descending, then question number ascending
      if (b.ano_da_prova !== a.ano_da_prova) {
        return (b.ano_da_prova || 0) - (a.ano_da_prova || 0);
      }
      return (a.numero || 0) - (b.numero || 0);
    });
  } else if (sortBy === 'exam') {
    return filtered.sort((a, b) => {
      if (b.ano_da_prova !== a.ano_da_prova) {
        return (b.ano_da_prova || 0) - (a.ano_da_prova || 0);
      }
      return (a.numero || 0) - (b.numero || 0);
    });
  }

  return filtered;
};
