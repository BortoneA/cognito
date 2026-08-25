/**
 * Adaptive Learning Service — Motor de Estudo Adaptativo
 * Prioriza questões com base nos pontos mais fracos do usuário
 */

/**
 * Calcula o "fragility score" por área:
 * alta taxa de erros * alta frequência de tentativas = área crítica
 */
export const computeFragilityScores = (questions = [], userAnswers = {}) => {
  const areaStats = {};

  questions.forEach(q => {
    const area = q.area || 'Outros';
    if (!areaStats[area]) {
      areaStats[area] = { area, total: 0, answered: 0, correct: 0, incorrect: 0 };
    }
    areaStats[area].total += 1;
    const ans = userAnswers[q.id];
    if (ans) {
      areaStats[area].answered += 1;
      if (ans.isCorrect) areaStats[area].correct += 1;
      else areaStats[area].incorrect += 1;
    }
  });

  return Object.values(areaStats).map(s => {
    const errorRate = s.answered > 0 ? s.incorrect / s.answered : 0;
    const coverageRate = s.total > 0 ? s.answered / s.total : 0;
    // Areas with many errors AND many attempts = critical
    // Areas with 0 answers = also high priority (unknown)
    const fragilityScore = s.answered === 0
      ? 0.6  // unknown area — medium-high priority
      : errorRate * (0.5 + coverageRate * 0.5);

    return {
      ...s,
      errorRate: Math.round(errorRate * 100),
      fragilityScore: parseFloat(fragilityScore.toFixed(3)),
      accuracyPct: s.answered > 0 ? Math.round((s.correct / s.answered) * 100) : 0,
    };
  }).sort((a, b) => b.fragilityScore - a.fragilityScore);
};

/**
 * Gera uma fila adaptativa de questões baseada nos pontos fracos
 * @param {Array} questions - banco completo
 * @param {Object} userAnswers - respostas do usuário
 * @param {number} count - quantas questões sortear
 */
export const buildAdaptiveQueue = (questions = [], userAnswers = {}, count = 20) => {
  const scores = computeFragilityScores(questions, userAnswers);

  // Divide as áreas em 3 tiers por fragilidade
  const criticalAreas = scores.filter(s => s.fragilityScore >= 0.5).map(s => s.area);
  const weakAreas = scores.filter(s => s.fragilityScore >= 0.25 && s.fragilityScore < 0.5).map(s => s.area);
  const okAreas = scores.filter(s => s.fragilityScore < 0.25).map(s => s.area);

  // Distribui: 60% áreas críticas, 30% áreas fracas, 10% áreas ok
  const targetCritical = Math.round(count * 0.6);
  const targetWeak = Math.round(count * 0.3);
  const targetOk = count - targetCritical - targetWeak;

  const pickFrom = (areaList, num) => {
    const pool = questions.filter(q => {
      const area = q.area || 'Outros';
      return areaList.includes(area);
    });
    // Prefer questions never answered, then incorrect ones
    const unanswered = pool.filter(q => !userAnswers[q.id]);
    const incorrect = pool.filter(q => userAnswers[q.id] && !userAnswers[q.id].isCorrect);
    const all = [...unanswered, ...incorrect, ...pool];
    // Shuffle and pick
    const shuffled = all.sort(() => Math.random() - 0.5);
    const seen = new Set();
    const result = [];
    for (const q of shuffled) {
      if (seen.has(q.id)) continue;
      seen.add(q.id);
      result.push(q);
      if (result.length >= num) break;
    }
    return result;
  };

  const criticalQ = pickFrom(criticalAreas, targetCritical);
  const weakQ = pickFrom(weakAreas.filter(a => !criticalAreas.includes(a)), targetWeak);
  const okQ = pickFrom(okAreas, targetOk);

  const combined = [...criticalQ, ...weakQ, ...okQ]
    .sort(() => Math.random() - 0.5)
    .slice(0, count);

  return {
    queue: combined,
    breakdown: {
      critical: criticalQ.length,
      weak: weakQ.length,
      ok: okQ.length,
      topWeakAreas: criticalAreas.slice(0, 3),
    },
    fragilityScores: scores,
  };
};

/**
 * Compara acurácia da sessão atual vs média histórica por área
 */
export const compareSessionToHistory = (sessionAnswers = {}, userAnswers = {}, questions = []) => {
  const qMap = {};
  questions.forEach(q => { qMap[q.id] = q; });

  const improvements = [];

  Object.entries(sessionAnswers).forEach(([id, ans]) => {
    const q = qMap[id];
    if (!q) return;
    const historical = userAnswers[id];
    if (historical && !historical.isCorrect && ans.isCorrect) {
      improvements.push({ question: q, area: q.area });
    }
  });

  return improvements;
};
