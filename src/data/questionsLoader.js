/**
 * Questions Loader & Filtering Utilities
 */

export const getUniqueYears = (questions = []) => {
  const years = new Set(questions.map(q => q.ano_da_prova).filter(Boolean));
  if (years.size === 0) {
    // Default fallback years for PNA
    return [2024, 2023, 2022, 2021, 2020, 2019, 2018];
  }
  return Array.from(years).sort((a, b) => b - a); // Descending (2024 -> 2018)
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

export const filterQuestions = (questions = [], filters = {}, userProgress = {}) => {
  return questions.filter(q => {
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
    const history = userProgress.answers?.[q.id];
    const isSaved = userProgress.savedQuestions?.[q.id];

    if (filters.status === 'unanswered' && history) return false;
    if (filters.status === 'answered' && !history) return false;
    if (filters.status === 'correct' && (!history || !history.isCorrect)) return false;
    if (filters.status === 'incorrect' && (!history || history.isCorrect)) return false;
    if (filters.status === 'saved' && !isSaved) return false;

    // Search query (text search in enunciado, explicacao, doenca, id, area, subarea)
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
};
