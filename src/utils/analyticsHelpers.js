/**
 * Analytical helpers to calculate statistics and format data for Recharts components
 */

export const getOverviewKPIs = (questions, userProgress = {}) => {
  const totalQuestions = questions.length;
  const answersMap = userProgress.answers || {};
  const savedMap = userProgress.savedQuestions || {};
  
  const answeredIds = Object.keys(answersMap);
  const totalAnswered = answeredIds.length;
  
  let totalCorrect = 0;
  let totalIncorrect = 0;
  let totalTimeMs = 0;

  Object.values(answersMap).forEach(ans => {
    if (ans.isCorrect) totalCorrect++;
    else totalIncorrect++;
    if (ans.timeSpentMs) totalTimeMs += ans.timeSpentMs;
  });

  const accuracyPct = totalAnswered > 0 
    ? Math.round((totalCorrect / totalAnswered) * 100) 
    : 0;

  const totalSaved = Object.keys(savedMap).length;
  
  const avgTimePerQuestionSec = totalAnswered > 0 
    ? Math.round((totalTimeMs / totalAnswered) / 1000) 
    : 0;

  return {
    totalQuestions,
    totalAnswered,
    totalCorrect,
    totalIncorrect,
    totalUnanswered: totalQuestions - totalAnswered,
    accuracyPct,
    totalSaved,
    avgTimePerQuestionSec
  };
};

export const getAreaAnalytics = (questions, userAnswers = {}) => {
  const areaStats = {};

  questions.forEach(q => {
    const area = q.area || "Outros";
    if (!areaStats[area]) {
      areaStats[area] = { area, total: 0, correct: 0, incorrect: 0, unanswered: 0 };
    }

    areaStats[area].total += 1;
    const ans = userAnswers[q.id];
    if (ans) {
      if (ans.isCorrect) areaStats[area].correct += 1;
      else areaStats[area].incorrect += 1;
    } else {
      areaStats[area].unanswered += 1;
    }
  });

  return Object.values(areaStats)
    .map(item => {
      const answered = item.correct + item.incorrect;
      const accuracy = answered > 0 ? Math.round((item.correct / answered) * 100) : 0;
      return {
        ...item,
        answered,
        accuracyPct: accuracy
      };
    })
    .sort((a, b) => b.total - a.total);
};

export const getSubareaAnalytics = (questions, userAnswers = {}, limit = 15) => {
  const subareaStats = {};

  questions.forEach(q => {
    const subarea = q.subarea || "Geral";
    if (!subareaStats[subarea]) {
      subareaStats[subarea] = { 
        subarea, 
        area: q.area || "Geral", 
        total: 0, 
        correct: 0, 
        incorrect: 0, 
        unanswered: 0 
      };
    }

    subareaStats[subarea].total += 1;
    const ans = userAnswers[q.id];
    if (ans) {
      if (ans.isCorrect) subareaStats[subarea].correct += 1;
      else subareaStats[subarea].incorrect += 1;
    } else {
      subareaStats[subarea].unanswered += 1;
    }
  });

  return Object.values(subareaStats)
    .map(item => {
      const answered = item.correct + item.incorrect;
      const accuracy = answered > 0 ? Math.round((item.correct / answered) * 100) : 0;
      return {
        ...item,
        answered,
        accuracyPct: accuracy
      };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
};

export const getYearlyAnalytics = (questions, userAnswers = {}) => {
  const yearStats = {};

  questions.forEach(q => {
    const year = String(q.ano_da_prova || "Outros");
    if (!yearStats[year]) {
      yearStats[year] = { year, total: 0, correct: 0, incorrect: 0, unanswered: 0 };
    }

    yearStats[year].total += 1;
    const ans = userAnswers[q.id];
    if (ans) {
      if (ans.isCorrect) yearStats[year].correct += 1;
      else yearStats[year].incorrect += 1;
    } else {
      yearStats[year].unanswered += 1;
    }
  });

  return Object.values(yearStats)
    .map(item => {
      const answered = item.correct + item.incorrect;
      const accuracy = answered > 0 ? Math.round((item.correct / answered) * 100) : 0;
      return {
        ...item,
        answered,
        accuracyPct: accuracy
      };
    })
    .sort((a, b) => a.year.localeCompare(b.year));
};

export const getWeaknessDiagnostics = (questions, userAnswers = {}) => {
  const subareaStats = {};

  questions.forEach(q => {
    const subarea = q.subarea || "Geral";
    const area = q.area || "Outros";
    const key = `${area} - ${subarea}`;

    if (!subareaStats[key]) {
      subareaStats[key] = {
        key,
        area,
        subarea,
        total: 0,
        answered: 0,
        correct: 0,
        incorrect: 0
      };
    }

    subareaStats[key].total += 1;
    const ans = userAnswers[q.id];
    if (ans) {
      subareaStats[key].answered += 1;
      if (ans.isCorrect) subareaStats[key].correct += 1;
      else subareaStats[key].incorrect += 1;
    }
  });

  // Filter subareas with at least 1 error or lowest accuracy
  return Object.values(subareaStats)
    .filter(item => item.incorrect > 0)
    .map(item => ({
      ...item,
      accuracyPct: Math.round((item.correct / item.answered) * 100)
    }))
    .sort((a, b) => b.incorrect - a.incorrect || a.accuracyPct - b.accuracyPct)
    .slice(0, 8);
};

/**
 * Calculates complete distribution across ALL areas, ALL subareas, and ALL difficulties
 */
export const getFullDistributionStats = (questions = [], userAnswers = {}) => {
  const totalQuestions = questions.length || 1;

  // 1. All Areas
  const areaMap = {};
  // 2. All Subareas
  const subareaMap = {};
  // 3. Difficulty Breakdown
  const diffMap = {};

  questions.forEach(q => {
    const area = q.area || "Não Classificada";
    const subarea = q.subarea || "Geral";
    const diff = q.nivel_de_dificuldade || "A Classificar";
    const ans = userAnswers[q.id];

    // Area mapping
    if (!areaMap[area]) {
      areaMap[area] = { name: area, total: 0, answered: 0, correct: 0, incorrect: 0 };
    }
    areaMap[area].total += 1;
    if (ans) {
      areaMap[area].answered += 1;
      if (ans.isCorrect) areaMap[area].correct += 1;
      else areaMap[area].incorrect += 1;
    }

    // Subarea mapping
    const subKey = `${area} › ${subarea}`;
    if (!subareaMap[subKey]) {
      subareaMap[subKey] = { name: subarea, area, fullKey: subKey, total: 0, answered: 0, correct: 0, incorrect: 0 };
    }
    subareaMap[subKey].total += 1;
    if (ans) {
      subareaMap[subKey].answered += 1;
      if (ans.isCorrect) subareaMap[subKey].correct += 1;
      else subareaMap[subKey].incorrect += 1;
    }

    // Difficulty mapping
    if (!diffMap[diff]) {
      diffMap[diff] = { name: diff, total: 0, answered: 0, correct: 0, incorrect: 0 };
    }
    diffMap[diff].total += 1;
    if (ans) {
      diffMap[diff].answered += 1;
      if (ans.isCorrect) diffMap[diff].correct += 1;
      else diffMap[diff].incorrect += 1;
    }
  });

  const areasList = Object.values(areaMap).map(a => ({
    ...a,
    sharePct: parseFloat(((a.total / totalQuestions) * 100).toFixed(1)),
    accuracyPct: a.answered > 0 ? Math.round((a.correct / a.answered) * 100) : 0
  })).sort((a, b) => b.total - a.total);

  const subareasList = Object.values(subareaMap).map(s => ({
    ...s,
    sharePct: parseFloat(((s.total / totalQuestions) * 100).toFixed(1)),
    accuracyPct: s.answered > 0 ? Math.round((s.correct / s.answered) * 100) : 0
  })).sort((a, b) => b.total - a.total);

  const diffList = Object.values(diffMap).map(d => ({
    ...d,
    sharePct: parseFloat(((d.total / totalQuestions) * 100).toFixed(1)),
    accuracyPct: d.answered > 0 ? Math.round((d.correct / d.answered) * 100) : 0
  })).sort((a, b) => b.total - a.total);

  return {
    totalQuestions,
    areas: areasList,
    subareas: subareasList,
    difficulties: diffList
  };
};

/**
 * Diagnostic analysis specifically for Quick Test errors and weak points
 */
export const getQuickTestDiagnostics = (questions = [], userAnswers = {}) => {
  const incorrectList = [];
  const themeErrorMap = {};

  questions.forEach(q => {
    const ans = userAnswers[q.id];
    if (ans && !ans.isCorrect) {
      incorrectList.push(q);

      const theme = q.doenca_ou_conjunto_de_doencas || q.subarea || "Geral";
      const key = `${q.area} | ${theme}`;

      if (!themeErrorMap[key]) {
        themeErrorMap[key] = {
          key,
          area: q.area,
          subarea: q.subarea,
          theme,
          errorCount: 0,
          sampleQuestions: []
        };
      }
      themeErrorMap[key].errorCount += 1;
      if (themeErrorMap[key].sampleQuestions.length < 3) {
        themeErrorMap[key].sampleQuestions.push(q);
      }
    }
  });

  const weakPoints = Object.values(themeErrorMap)
    .sort((a, b) => b.errorCount - a.errorCount)
    .slice(0, 10);

  return {
    totalErrors: incorrectList.length,
    weakPoints,
    incorrectQuestions: incorrectList
  };
};

