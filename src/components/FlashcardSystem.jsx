import React, { useState, useEffect, useCallback } from 'react';
import { 
  Sparkles, 
  RotateCw, 
  Check, 
  Brain, 
  Flame, 
  Plus, 
  BookOpen, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Trash2, 
  ArrowRight,
  Filter,
  Zap
} from 'lucide-react';
import { useQuestionDb } from '../context/QuestionDbContext';
import { useUserProgress } from '../context/UserProgressContext';
import ActivityHeatmap from './ActivityHeatmap';
import { 
  getStoredFlashcards, 
  saveFlashcards, 
  calculateSM2, 
  generateFlashcardsFromQuestions 
} from '../services/flashcardService';

const FlashcardSystem = () => {
  const { questions } = useQuestionDb();
  const { recordActivity } = useUserProgress();

  const [flashcards, setFlashcards] = useState([]);
  const [activeArea, setActiveArea] = useState('all');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Card Form State
  const [newCardForm, setNewCardForm] = useState({
    front: '',
    back: '',
    area: 'Clínica Médica',
    subarea: 'Geral',
    theme: 'Maceio / Conceito'
  });

  // Load or initialize cards
  useEffect(() => {
    const stored = getStoredFlashcards();
    if (stored && stored.length > 0) {
      setFlashcards(stored);
    } else if (questions && questions.length > 0) {
      // Auto-generate initial deck from questions
      const initialDeck = generateFlashcardsFromQuestions(questions, []);
      setFlashcards(initialDeck);
    }
  }, [questions]);

  // Filter cards due or in study list
  const filteredCards = flashcards.filter(c => {
    if (activeArea !== 'all' && c.area !== activeArea) return false;
    return true;
  });

  // Queue of cards due today or new
  const dueCards = filteredCards.filter(c => !c.dueDate || c.dueDate <= Date.now() || c.status === 'new' || c.status === 'learning');
  const currentCard = dueCards[currentCardIndex] || dueCards[0];

  const handleFlip = useCallback(() => {
    setIsFlipped(prev => !prev);
  }, []);

  const handleRate = useCallback((rating) => {
    if (!currentCard) return;

    const updatedCard = calculateSM2(currentCard, rating);

    setFlashcards(prev => {
      const next = prev.map(c => c.id === updatedCard.id ? updatedCard : c);
      saveFlashcards(next);
      return next;
    });

    recordActivity('flashcards', 1);
    setReviewedCount(rc => rc + 1);
    setIsFlipped(false);

    if (currentCardIndex + 1 >= dueCards.length) {
      setSessionCompleted(true);
    } else {
      setCurrentCardIndex(idx => idx + 1);
    }
  }, [currentCard, currentCardIndex, dueCards.length, recordActivity]);

  // Keyboard Shortcuts Listener (Space = Flip, 1/2/3/4 = Ratings)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.code === 'Space') {
        e.preventDefault();
        handleFlip();
      } else if (isFlipped) {
        if (e.key === '1') handleRate(1);
        if (e.key === '2') handleRate(2);
        if (e.key === '3') handleRate(3);
        if (e.key === '4') handleRate(4);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, handleFlip, handleRate]);

  const handleGenerateDeckFromQuestions = () => {
    const updatedDeck = generateFlashcardsFromQuestions(questions, flashcards);
    setFlashcards(updatedDeck);
    alert(`Deck expandido com sucesso! ${updatedDeck.length} flashcards disponíveis.`);
  };

  const handleCreateCustomCard = (e) => {
    e.preventDefault();
    if (!newCardForm.front.trim() || !newCardForm.back.trim()) return;

    const customCard = {
      id: `fc-custom-${Date.now()}`,
      front: newCardForm.front,
      back: newCardForm.back,
      area: newCardForm.area,
      subarea: newCardForm.subarea,
      theme: newCardForm.theme,
      interval: 0,
      repetitions: 0,
      easeFactor: 2.5,
      dueDate: Date.now(),
      lastReviewed: null,
      status: 'new'
    };

    const next = [customCard, ...flashcards];
    setFlashcards(next);
    saveFlashcards(next);
    setShowCreateModal(false);
    setNewCardForm({ front: '', back: '', area: 'Clínica Médica', subarea: 'Geral', theme: 'Maceio / Conceito' });
  };

  // Stats calculation
  const totalCards = flashcards.length;
  const newCount = flashcards.filter(c => c.status === 'new').length;
  const learningCount = flashcards.filter(c => c.status === 'learning').length;
  const masteredCount = flashcards.filter(c => c.status === 'mastered').length;

  const areas = Array.from(new Set(flashcards.map(c => c.area).filter(Boolean)));

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Header Banner */}
      <div className="rounded-[36px] apple-glass p-6 sm:p-8 border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  Flashcards Spaced Repetition <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">ANKI SM-2</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 font-medium">Algoritmo inteligente de repetição espaçada para retenção clínica de longo prazo</p>
              </div>
            </div>
          </div>

          {/* Quick Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-bold border border-white/10 flex items-center gap-2 transition-all hover:scale-105"
            >
              <Plus className="w-4 h-4 text-purple-400" />
              <span>Novo Flashcard</span>
            </button>

            <button
              onClick={handleGenerateDeckFromQuestions}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all hover:scale-105"
            >
              <Sparkles className="w-4 h-4" />
              <span>Gerar Deck das 5.073 Questões</span>
            </button>
          </div>
        </div>

        {/* Deck KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/5 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total no Deck</span>
            <p className="text-lg font-black text-white">{totalCards}</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-blue-950/30 border border-blue-500/20 space-y-1">
            <span className="text-[11px] font-bold text-blue-300 uppercase tracking-wider">Novos</span>
            <p className="text-lg font-black text-blue-400">{newCount}</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/20 space-y-1">
            <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">Para Revisar Hoje</span>
            <p className="text-lg font-black text-amber-400">{dueCards.length}</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/20 space-y-1">
            <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">Dominados</span>
            <p className="text-lg font-black text-emerald-400">{masteredCount}</p>
          </div>
        </div>
      </div>

      {/* Activity Heatmap Grid */}
      <ActivityHeatmap numWeeks={20} />

      {/* Filter by Area */}
      {areas.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1 shrink-0 px-2">
            <Filter className="w-3.5 h-3.5" />
            <span>Deck por Área:</span>
          </span>
          <button
            onClick={() => { setActiveArea('all'); setCurrentCardIndex(0); setSessionCompleted(false); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeArea === 'all' ? 'bg-purple-600 text-white shadow-md' : 'bg-slate-900/60 text-slate-400 border border-white/5 hover:text-white'
            }`}
          >
            Todas as Áreas ({flashcards.length})
          </button>
          {areas.map(area => {
            const count = flashcards.filter(c => c.area === area).length;
            return (
              <button
                key={area}
                onClick={() => { setActiveArea(area); setCurrentCardIndex(0); setSessionCompleted(false); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeArea === area ? 'bg-purple-600 text-white shadow-md' : 'bg-slate-900/60 text-slate-400 border border-white/5 hover:text-white'
                }`}
              >
                {area} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Main Flashcard Review Interactive Board */}
      {sessionCompleted || dueCards.length === 0 ? (
        <div className="rounded-[36px] apple-glass p-12 text-center space-y-6 border border-white/10 shadow-2xl max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-xl">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-white">Sessão de Revisão Concluída! 🎉</h2>
            <p className="text-xs sm:text-sm text-slate-400">Você revisou <strong className="text-white">{reviewedCount}</strong> flashcards hoje. O algoritmo Anki reagendou as revisões perfeitamente.</p>
          </div>

          <button
            onClick={() => { setSessionCompleted(false); setCurrentCardIndex(0); }}
            className="px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold uppercase tracking-wider transition-all"
          >
            Reiniciar Sessão do Deck
          </button>
        </div>
      ) : currentCard ? (
        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* Card Counter Indicator */}
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold px-2">
            <span>Cartão {currentCardIndex + 1} de {dueCards.length}</span>
            <span className="text-purple-400 font-mono">Pressione ESPAÇO para virar</span>
          </div>

          {/* 3D Interactive Flip Card */}
          <div 
            onClick={handleFlip}
            className="relative w-full min-h-[380px] cursor-pointer perspective-1000 group"
          >
            <div className={`w-full h-full min-h-[380px] transition-transform duration-500 transform-style-3d ${
              isFlipped ? 'rotate-y-180' : ''
            }`}>
              
              {/* FRONT OF CARD */}
              <div className="absolute inset-0 w-full h-full backface-hidden apple-card rounded-[32px] p-8 flex flex-col justify-between border border-white/10 shadow-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <span className="px-3 py-1 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-black">
                      {currentCard.area}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">Frente • Caso / Pergunta</span>
                  </div>

                  {currentCard.theme && (
                    <div className="text-xs font-bold text-indigo-300">
                      Tema: {currentCard.theme}
                    </div>
                  )}

                  <p className="text-sm sm:text-base text-slate-100 font-normal leading-relaxed whitespace-pre-line">
                    {currentCard.front}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-center text-xs font-extrabold text-purple-400 gap-2 group-hover:scale-105 transition-transform">
                  <RotateCw className="w-4 h-4" />
                  <span>Clique ou toque ESPAÇO para ver a resposta</span>
                </div>
              </div>

              {/* BACK OF CARD */}
              <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 apple-card rounded-[32px] p-8 flex flex-col justify-between border border-purple-500/30 shadow-2xl bg-gradient-to-b from-slate-900/95 via-purple-950/20 to-slate-950/95">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black">
                      Gabarito & Raciocínio
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">Verso • Resposta</span>
                  </div>

                  <div className="text-xs sm:text-sm text-slate-200 font-normal leading-relaxed whitespace-pre-line">
                    {currentCard.back}
                  </div>
                </div>

                <div className="pt-4 text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Selecione sua classificação abaixo
                </div>
              </div>

            </div>
          </div>

          {/* Anki SM-2 Ratings Buttons (Visible when Flipped) */}
          {isFlipped ? (
            <div className="grid grid-cols-4 gap-3 animate-fadeIn">
              
              <button
                onClick={() => handleRate(1)}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-rose-500/10"
              >
                <span className="text-xs font-black">1 • ERREI</span>
                <span className="text-[10px] text-rose-400 font-mono">1 min</span>
              </button>

              <button
                onClick={() => handleRate(2)}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-amber-500/10"
              >
                <span className="text-xs font-black">2 • DIFÍCIL</span>
                <span className="text-[10px] text-amber-400 font-mono">1 dia</span>
              </button>

              <button
                onClick={() => handleRate(3)}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/10"
              >
                <span className="text-xs font-black">3 • BOM</span>
                <span className="text-[10px] text-emerald-400 font-mono">3 dias</span>
              </button>

              <button
                onClick={() => handleRate(4)}
                className="flex flex-col items-center justify-center p-3 rounded-2xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/10"
              >
                <span className="text-xs font-black">4 • FÁCIL</span>
                <span className="text-[10px] text-indigo-400 font-mono">7 dias</span>
              </button>

            </div>
          ) : (
            <button
              onClick={handleFlip}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-purple-600/30 transition-all hover:scale-[1.01]"
            >
              Mostrar Resposta & Avaliar (Espaço)
            </button>
          )}

        </div>
      ) : null}

      {/* Create Custom Flashcard Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl">
          <div className="w-full max-w-lg apple-glass rounded-[32px] p-6 border border-white/10 shadow-2xl space-y-5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-purple-400" />
              Criar Flashcard Personalizado
            </h3>

            <form onSubmit={handleCreateCustomCard} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Frente (Pergunta / Caso Clínico)</label>
                <textarea
                  value={newCardForm.front}
                  onChange={(e) => setNewCardForm(prev => ({ ...prev, front: e.target.value }))}
                  rows={3}
                  placeholder="Ex: Qual o tratamento de primeira linha para Cetoacidose Diabética?"
                  className="w-full p-3 rounded-2xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Verso (Resposta / Conceito)</label>
                <textarea
                  value={newCardForm.back}
                  onChange={(e) => setNewCardForm(prev => ({ ...prev, back: e.target.value }))}
                  rows={3}
                  placeholder="Ex: Hidratação venosa (SF 0,9%) + Insulina regular EV contínua (0,1 U/kg/h) + Reposição de potássio."
                  className="w-full p-3 rounded-2xl bg-slate-900 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Área</label>
                  <input
                    type="text"
                    value={newCardForm.area}
                    onChange={(e) => setNewCardForm(prev => ({ ...prev, area: e.target.value }))}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Tema Clínico</label>
                  <input
                    type="text"
                    value={newCardForm.theme}
                    onChange={(e) => setNewCardForm(prev => ({ ...prev, theme: e.target.value }))}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-slate-400 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 text-white text-xs font-extrabold"
                >
                  Criar Flashcard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default FlashcardSystem;
