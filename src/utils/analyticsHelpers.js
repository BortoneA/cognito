/**
 * Advanced Medical Analytics & Clinical Performance Diagnostic Engine
 */

export const getOverviewKPIs = (questions = [], userProgress = {}) => {
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

  // Estimated PNA Score (scale 0-100)
  const estimatedPnaScore = totalAnswered >= 5
    ? Math.round(accuracyPct * 0.95 + (totalAnswered / Math.max(1, totalQuestions)) * 5)
    : accuracyPct;

  return {
    totalQuestions,
    totalAnswered,
    totalCorrect,
    totalIncorrect,
    totalUnanswered: totalQuestions - totalAnswered,
    accuracyPct,
    totalSaved,
    avgTimePerQuestionSec,
    estimatedPnaScore
  };
};

export const getAreaAnalytics = (questions = [], userAnswers = {}) => {
  const areaStats = {};

  questions.forEach(q => {
    const area = q.area || "Outros";
    if (!areaStats[area]) {
      areaStats[area] = { area, total: 0, correct: 0, incorrect: 0, unanswered: 0, totalTimeMs: 0 };
    }

    areaStats[area].total += 1;
    const ans = userAnswers[q.id];
    if (ans) {
      if (ans.isCorrect) areaStats[area].correct += 1;
      else areaStats[area].incorrect += 1;
      if (ans.timeSpentMs) areaStats[area].totalTimeMs += ans.timeSpentMs;
    } else {
      areaStats[area].unanswered += 1;
    }
  });

  return Object.values(areaStats)
    .map(item => {
      const answered = item.correct + item.incorrect;
      const accuracy = answered > 0 ? Math.round((item.correct / answered) * 100) : 0;
      const avgSec = answered > 0 ? Math.round((item.totalTimeMs / answered) / 1000) : 0;
      
      let status = 'untested';
      if (answered > 0) {
        if (accuracy >= 80) status = 'mastered';
        else if (accuracy >= 60) status = 'moderate';
        else status = 'critical';
      }

      return {
        ...item,
        answered,
        accuracyPct: accuracy,
        avgTimeSec: avgSec,
        status
      };
    })
    .sort((a, b) => b.total - a.total);
};

export const getSubareaDetailedAnalytics = (questions = [], userAnswers = {}) => {
  const subareaStats = {};

  questions.forEach(q => {
    const subarea = q.subarea || "Geral";
    const area = q.area || "Geral";
    const key = `${area} › ${subarea}`;

    if (!subareaStats[key]) {
      subareaStats[key] = {
        key,
        name: subarea,
        subarea: subarea,
        area: area,
        total: 0,
        answered: 0,
        correct: 0,
        incorrect: 0,
        unanswered: 0,
        totalTimeMs: 0,
        questionsList: []
      };
    }

    subareaStats[key].total += 1;
    subareaStats[key].questionsList.push(q);

    const ans = userAnswers[q.id];
    if (ans) {
      subareaStats[key].answered += 1;
      if (ans.isCorrect) subareaStats[key].correct += 1;
      else subareaStats[key].incorrect += 1;
      if (ans.timeSpentMs) subareaStats[key].totalTimeMs += ans.timeSpentMs;
    } else {
      subareaStats[key].unanswered += 1;
    }
  });

  return Object.values(subareaStats).map(s => {
    const accuracy = s.answered > 0 ? Math.round((s.correct / s.answered) * 100) : 0;
    const avgSec = s.answered > 0 ? Math.round((s.totalTimeMs / s.answered) / 1000) : 0;
    
    let proficiency = 'Não Testada';
    let proficiencyColor = 'text-slate-400';
    let priorityScore = 0;

    if (s.answered > 0) {
      if (accuracy >= 80) {
        proficiency = 'Excelente Domínio';
        proficiencyColor = 'text-emerald-400';
      } else if (accuracy >= 60) {
        proficiency = 'Regular / Atenção';
        proficiencyColor = 'text-amber-400';
        priorityScore = s.incorrect * 2;
      } else {
        proficiency = 'Ponto Crítico de Reforço';
        proficiencyColor = 'text-rose-400';
        priorityScore = s.incorrect * 4 + (s.total - s.answered);
      }
    } else {
      priorityScore = 1;
    }

    return {
      ...s,
      accuracyPct: accuracy,
      avgTimeSec: avgSec,
      proficiency,
      proficiencyColor,
      priorityScore
    };
  });
};

/**
 * Diagnostic Analysis specifically detecting Critical Weak Points & Topics to Reinforce
 */
export const getWeaknessPointsToReinforce = (questions = [], userAnswers = {}) => {
  const subareaAnalytics = getSubareaDetailedAnalytics(questions, userAnswers);

  // Focus on subareas with errors or low accuracy
  const weakPoints = subareaAnalytics
    .filter(s => s.incorrect > 0 || (s.answered >= 1 && s.accuracyPct < 70))
    .sort((a, b) => (b.incorrect - a.incorrect) || (a.accuracyPct - b.accuracyPct))
    .slice(0, 12);

  // Extract list of all wrongly answered questions with detailed metadata
  const wrongQuestions = [];
  questions.forEach(q => {
    const ans = userAnswers[q.id];
    if (ans && !ans.isCorrect) {
      wrongQuestions.push({
        ...q,
        userSelectedOption: ans.selectedOption,
        timeSpentSec: ans.timeSpentMs ? Math.round(ans.timeSpentMs / 1000) : null,
        answeredAt: ans.answeredAt || ans.timestamp
      });
    }
  });

  return {
    criticalWeakSubareas: weakPoints,
    wrongQuestionsList: wrongQuestions.sort((a, b) => (b.answeredAt || 0) - (a.answeredAt || 0)),
    totalWrongCount: wrongQuestions.length
  };
};

/**
 * Calculates Full 300 Subareas Distribution Stats
 */
export const getFullDistributionStats = (questions = [], userAnswers = {}) => {
  const totalQuestions = questions.length || 1;
  const areaStats = getAreaAnalytics(questions, userAnswers);
  const subareaStats = getSubareaDetailedAnalytics(questions, userAnswers);

  // Difficulty breakdown
  const diffMap = {};
  questions.forEach(q => {
    const diff = q.nivel_de_dificuldade || "Moderada";
    if (!diffMap[diff]) {
      diffMap[diff] = { name: diff, total: 0, answered: 0, correct: 0, incorrect: 0 };
    }
    diffMap[diff].total += 1;
    const ans = userAnswers[q.id];
    if (ans) {
      diffMap[diff].answered += 1;
      if (ans.isCorrect) diffMap[diff].correct += 1;
      else diffMap[diff].incorrect += 1;
    }
  });

  const diffList = Object.values(diffMap).map(d => ({
    ...d,
    sharePct: parseFloat(((d.total / totalQuestions) * 100).toFixed(1)),
    accuracyPct: d.answered > 0 ? Math.round((d.correct / d.answered) * 100) : 0
  }));

  return {
    totalQuestions,
    areas: areaStats,
    subareas: subareaStats.sort((a, b) => b.total - a.total),
    difficulties: diffList
  };
};

export const getQuickTestDiagnostics = (questions = [], userAnswers = {}) => {
  const weakness = getWeaknessPointsToReinforce(questions, userAnswers);
  return {
    totalErrors: weakness.totalWrongCount,
    weakPoints: weakness.criticalWeakSubareas,
    incorrectQuestions: weakness.wrongQuestionsList
  };
};

export const getSubareaAnalytics = (questions = [], userAnswers = {}, limit = 15) => {
  return getSubareaDetailedAnalytics(questions, userAnswers)
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
};

export const getYearlyAnalytics = (questions = [], userAnswers = {}) => {
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

export const getWeaknessDiagnostics = (questions = [], userAnswers = {}) => {
  return getWeaknessPointsToReinforce(questions, userAnswers).criticalWeakSubareas;
};
