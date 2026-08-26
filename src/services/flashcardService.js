/**
 * Flashcard Service implementing Anki SM-2 Spaced Repetition Algorithm
 * with Direct Neon PostgreSQL Universal Cloud Sync
 */
import { 
  loadFlashcardsFromNeon, 
  saveFlashcardsToNeon as saveFlashcardsNeonDirect 
} from './neonDatabaseService';

const FLASHCARDS_STORAGE_KEY = 'PNA_MED_FLASHCARDS_V2';

export const calculateSM2 = (card, rating) => {
  // rating: 1 (Errei), 2 (Difícil), 3 (Bom), 4 (Fácil)
  let { repetitions = 0, easeFactor = 2.5, interval = 0 } = card;

  if (rating === 1) {
    // Errei (Again)
    repetitions = 0;
    interval = 1;
    easeFactor = Math.max(1.3, easeFactor - 0.20);
  } else if (rating === 2) {
    // Difícil (Hard)
    repetitions += 1;
    interval = Math.max(1, Math.round(interval * 1.2));
    easeFactor = Math.max(1.3, easeFactor - 0.15);
  } else if (rating === 3) {
    // Bom (Good)
    repetitions += 1;
    if (repetitions === 1) {
      interval = 1;
    } else if (repetitions === 2) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
  } else if (rating === 4) {
    // Fácil (Easy)
    repetitions += 1;
    if (repetitions === 1) {
      interval = 4;
    } else {
      interval = Math.round(interval * easeFactor * 1.3);
    }
    easeFactor += 0.15;
  }

  const nextReviewDate = Date.now() + interval * 24 * 60 * 60 * 1000;
  const status = interval >= 21 ? 'mastered' : rating === 1 ? 'learning' : 'review';

  return {
    ...card,
    repetitions,
    easeFactor: parseFloat(easeFactor.toFixed(2)),
    interval,
    dueDate: nextReviewDate,
    lastReviewed: Date.now(),
    status
  };
};

export const getStoredFlashcards = () => {
  try {
    const saved = localStorage.getItem(FLASHCARDS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

export const fetchFlashcardsFromNeon = async () => {
  // 1. Direct Neon Serverless Query First
  try {
    const res = await loadFlashcardsFromNeon();
    if (res.success && Array.isArray(res.flashcards) && res.flashcards.length > 0) {
      saveFlashcardsLocal(res.flashcards);
      return res.flashcards;
    }
  } catch (neonErr) {
    console.debug('[Flashcards] Direct Neon query notice:', neonErr.message);
  }

  // 2. Fallback to API route
  try {
    const res = await fetch('/api/flashcards', {
      headers: { 'ngrok-skip-browser-warning': 'true' }
    });
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.flashcards) && data.flashcards.length > 0) {
        saveFlashcardsLocal(data.flashcards);
        return data.flashcards;
      }
    }
  } catch (e) {
    console.debug('Neon flashcards load offline notice:', e.message);
  }

  return getStoredFlashcards();
};

const saveFlashcardsLocal = (cards) => {
  try {
    localStorage.setItem(FLASHCARDS_STORAGE_KEY, JSON.stringify(cards));
  } catch (e) {
    console.error('Failed to save flashcards to localStorage:', e);
  }
};

export const saveFlashcards = (cards) => {
  // 1. Save local
  saveFlashcardsLocal(cards);

  // 2. Direct Neon Serverless Write
  try {
    saveFlashcardsNeonDirect(cards).catch(err => {
      console.debug('[Flashcards] Direct save notice:', err.message);
    });
  } catch (e) {
    console.debug('[Flashcards] Direct save catch:', e.message);
  }

  // 3. Fallback server.js route write
  try {
    fetch('/api/save-flashcards', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify({ flashcards: cards })
    }).catch(() => {});
  } catch (_) {}
};

export const clearAllFlashcards = () => {
  try {
    localStorage.removeItem(FLASHCARDS_STORAGE_KEY);
    saveFlashcardsNeonDirect([]).catch(() => {});
    fetch('/api/save-flashcards', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify({ flashcards: [] })
    }).catch(() => {});
    return [];
  } catch (e) {
    console.error('Failed to clear flashcards:', e);
    return [];
  }
};

/**
 * Creates a new custom crafted flashcard
 */
export const createCustomFlashcard = (cardData) => {
  const currentCards = getStoredFlashcards();
  const newCard = {
    id: `fc-custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    front: cardData.front || '',
    back: cardData.back || '',
    area: cardData.area || 'Clínica Médica',
    subarea: cardData.subarea || 'Geral',
    theme: cardData.theme || 'Conceito Clínico',
    tags: cardData.tags || [],
    interval: 0,
    repetitions: 0,
    easeFactor: 2.5,
    dueDate: Date.now(),
    lastReviewed: null,
    status: 'new',
    createdAt: Date.now()
  };

  const updated = [newCard, ...currentCards];
  saveFlashcards(updated);
  return { newCard, updated };
};

/**
 * Generates flashcards on-demand from selected questions
 */
export const generateFlashcardsFromQuestions = (questions, currentCards = []) => {
  const existingQuestionIds = new Set(currentCards.map(c => c.questionId).filter(Boolean));
  const newCards = [];

  questions.forEach(q => {
    if (!existingQuestionIds.has(q.id) && q.enunciado && q.explicacao) {
      const front = `[${q.area} • ${q.subarea}]\n\n${q.enunciado.slice(0, 300)}${q.enunciado.length > 300 ? '...' : ''}`;
      const back = `✅ Gabarito: Alternativa ${q.opcao_correta || q.opção_correta || q.resposta_correta}\n\n📌 Tema: ${q.doenca_ou_conjunto_de_doencas || 'Clínico'}\n\n💡 Explicação:\n${q.explicacao.slice(0, 500)}${q.explicacao.length > 500 ? '...' : ''}`;

      newCards.push({
        id: `fc-q-${q.id}`,
        questionId: q.id,
        front,
        back,
        area: q.area || 'Geral',
        subarea: q.subarea || 'Geral',
        theme: q.doenca_ou_conjunto_de_doencas || 'PNA',
        interval: 0,
        repetitions: 0,
        easeFactor: 2.5,
        dueDate: Date.now(),
        lastReviewed: null,
        status: 'new',
        createdAt: Date.now()
      });
    }
  });

  const merged = [...currentCards, ...newCards];
  saveFlashcards(merged);
  return merged;
};
