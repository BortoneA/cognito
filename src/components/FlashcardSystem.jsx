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
  Zap,
  X,
  PlusCircle,
  FolderPlus,
  Edit3
} from 'lucide-react';
import { useQuestionDb } from '../context/QuestionDbContext';
import { useUserProgress } from '../context/UserProgressContext';
import ActivityHeatmap from './ActivityHeatmap';
import { 
  getStoredFlashcards, 
  fetchFlashcardsFromNeon,
  saveFlashcards, 
  calculateSM2, 
  clearAllFlashcards,
  createCustomFlashcard,
  generateFlashcardsFromQuestions 
} from '../services/flashcardService';
import { MEDICAL_TAXONOMY, getAvailableAreas, getSubareasByArea } from '../data/medicalTaxonomy';

const FlashcardSystem = () => {
  const { questions } = useQuestionDb();
  const { progress, recordActivity } = useUserProgress();
  const userAnswers = progress.answers || {};

  const [flashcards, setFlashcards] = useState(getStoredFlashcards() || []);
  const [activeArea, setActiveArea] = useState('all');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewMode, setViewMode] = useState('review'); // 'review' | 'manage'

  // New Card Form State
  const defaultArea = getAvailableAreas()[0] || 'Cardiologia';
  const [newCardForm, setNewCardForm] = useState({
    front: '',
    back: '',
    area: defaultArea,
    subarea: getSubareasByArea(defaultArea)[0] || '',
    theme: ''
  });

  // Load from Neon Cloud Database on mount
  useEffect(() => {
    fetchFlashcardsFromNeon().then(cards => {
      if (cards && cards.length > 0) {
        setFlashcards(cards);
      }
    });
  }, []);

  // Filter cards by active area
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
      // Don't trigger shortcuts if inside input or modal
      if (showCreateModal || ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

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
  }, [handleFlip, handleRate, isFlipped, showCreateModal]);

  // Handle custom card creation
  const handleCreateCard = (e) => {
    e.preventDefault();
    if (!newCardForm.front.trim() || !newCardForm.back.trim()) return;

    const { updated } = createCustomFlashcard(newCardForm);
    setFlashcards(updated);
    setNewCardForm({
      front: '',
      back: '',
      area: newCardForm.area || 'Clínica Médica',
      subarea: '',
      theme: ''
    });
    setShowCreateModal(false);
    setSessionCompleted(false);
  };

  // Generate flashcards from incorrect questions
  const handleGenerateFromErrors = () => {
    const incorrectQuestions = questions.filter(q => userAnswers[q.id] && !userAnswers[q.id].isCorrect);
    if (incorrectQuestions.length === 0) {
      alert('Você ainda não tem questões erradas registradas para gerar flashcards!');
      return;
    }
    const updated = generateFlashcardsFromQuestions(incorrectQuestions, flashcards);
    setFlashcards(updated);
    setSessionCompleted(false);
  };

  // Clear all flashcards
  const handleClearAll = () => {
    if (window.confirm('Tem certeza que deseja apagar todos os flashcards do seu deck? Você poderá confeccionar novos a qualquer momento.')) {
      clearAllFlashcards();
      setFlashcards([]);
      setCurrentCardIndex(0);
      setSessionCompleted(false);
    }
  };

  // Delete single flashcard
  const handleDeleteCard = (cardId) => {
    const updated = flashcards.filter(c => c.id !== cardId);
    saveFlashcards(updated);
    setFlashcards(updated);
  };

  const areas = Array.from(new Set(flashcards.map(c => c.area).filter(Boolean)));
  const totalCards = flashcards.length;
  const masteredCount = flashcards.filter(c => c.status === 'mastered').length;
  const newCount = flashcards.filter(c => c.status === 'new').length;

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      
      {/* Header Banner */}
      <div className="rounded-[36px] apple-glass p-6 sm:p-8 border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-gradient-to-tr from-purple-500/20 via-indigo-500/20 to-pink-500/20 blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-wider flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5" />
                Repetição Espaçada SM-2 (Anki Pro)
              </span>
              <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Deck Personalizado
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Flashcards de Memorização Médica
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              Confeccione seus próprios cartões clínicos e memorize com o algoritmo Anki SM-2.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-purple-500/25 transition-all hover:scale-105 active:scale-95"
            >
              <PlusCircle className="w-4 h-4 fill-white" />
              <span>Confeccionar Flashcard</span>
            </button>

            {totalCards > 0 && (
              <button
                onClick={() => setViewMode(v => v === 'review' ? 'manage' : 'review')}
                className="px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-bold flex items-center gap-2 transition-all"
              >
                <Layers className="w-4 h-4" />
                <span>{viewMode === 'review' ? `Gerenciar Deck (${totalCards})` : 'Modo Revisão'}</span>
              </button>
            )}

            {totalCards > 0 && (
              <button
                onClick={handleClearAll}
                title="Apagar todo o deck de flashcards"
                className="p-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
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
      {areas.length > 0 && viewMode === 'review' && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => { setActiveArea('all'); setCurrentCardIndex(0); setIsFlipped(false); }}
            className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
              activeArea === 'all'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            Todas as Áreas ({totalCards})
          </button>
          {areas.map(area => {
            const count = flashcards.filter(c => c.area === area).length;
            return (
              <button
                key={area}
                onClick={() => { setActiveArea(area); setCurrentCardIndex(0); setIsFlipped(false); }}
                className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                  activeArea === area
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                {area} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* MANAGE / LIST MODE */}
      {viewMode === 'manage' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-white">Cartões Confeccionados ({flashcards.length})</h3>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Novo Card
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {flashcards.map(card => (
              <div key={card.id} className="p-5 rounded-3xl apple-card border border-white/10 space-y-3 relative group">
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2.5 py-0.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                    {card.area} {card.subarea ? `• ${card.subarea}` : ''}
                  </span>
                  <button
                    onClick={() => handleDeleteCard(card.id)}
                    className="p-1.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                    title="Excluir este flashcard"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="bg-slate-900/60 p-3 rounded-2xl border border-white/5">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Frente</span>
                    <p className="text-xs text-white leading-relaxed line-clamp-3">{card.front}</p>
                  </div>
                  <div className="bg-slate-900/60 p-3 rounded-2xl border border-white/5">
                    <span className="text-[10px] font-bold uppercase text-emerald-400 block mb-1">Verso</span>
                    <p className="text-xs text-slate-200 leading-relaxed line-clamp-3">{card.back}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-white/5">
                  <span>Repetições: {card.repetitions || 0}</span>
                  <span>Intervalo: {card.interval || 0} dias</span>
                  <span className={`font-bold ${card.status === 'mastered' ? 'text-emerald-400' : 'text-indigo-400'}`}>
                    {card.status === 'mastered' ? 'Dominado' : 'Em aprendizado'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* EMPTY STATE — READY FOR CRAFTING */}
      {viewMode === 'review' && totalCards === 0 && (
        <div className="rounded-[36px] apple-card p-10 sm:p-14 text-center border border-white/10 space-y-6 max-w-2xl mx-auto shadow-2xl">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-purple-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-400 shadow-xl shadow-purple-500/10">
            <Brain className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white tracking-tight">
              Deck Pronto para Confeccionar
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
              O banco de flashcards está limpo e disponível. Crie cartões com seus próprios conceitos, macetes e condutas clínicas!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-purple-500/25 transition-all hover:scale-105 active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Confeccionar Meu 1º Flashcard</span>
            </button>

            <button
              onClick={handleGenerateFromErrors}
              className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 text-xs font-bold flex items-center justify-center gap-2 transition-all"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Gerar dos Meus Erros</span>
            </button>
          </div>
        </div>
      )}

      {/* SESSION COMPLETED BANNER */}
      {viewMode === 'review' && totalCards > 0 && sessionCompleted && (
        <div className="rounded-[36px] apple-card p-10 sm:p-14 text-center border border-white/10 space-y-6 max-w-2xl mx-auto shadow-2xl">
          <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white tracking-tight">
              Revisão Diária Concluída! 🎉
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
              Você revisou <strong className="text-emerald-400">{reviewedCount} flashcards</strong> hoje. Seus cartões foram reagendados pelo algoritmo Anki SM-2.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setCurrentCardIndex(0);
                setSessionCompleted(false);
                setIsFlipped(false);
              }}
              className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold flex items-center gap-2 transition-all"
            >
              <RotateCw className="w-4 h-4" />
              <span>Revisar Novamente</span>
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold flex items-center gap-2 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Confeccionar Mais Cards</span>
            </button>
          </div>
        </div>
      )}

      {/* ACTIVE FLASHCARD REVIEW BOARD */}
      {viewMode === 'review' && totalCards > 0 && !sessionCompleted && currentCard && (
        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* Progress Bar */}
          <div className="flex items-center justify-between text-xs text-slate-400 px-2">
            <span className="font-bold text-white">
              Cartão {currentCardIndex + 1} de {dueCards.length}
            </span>
            <span className="text-[11px] font-medium text-slate-500">
              Pressione <strong className="text-slate-300">Espaço</strong> para virar • <strong className="text-slate-300">1, 2, 3, 4</strong> para avaliar
            </span>
          </div>

          <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-white/5">
            <div 
              className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${((currentCardIndex + 1) / dueCards.length) * 100}%` }}
            />
          </div>

          {/* 3D Flip Card Container */}
          <div 
            onClick={handleFlip}
            className="perspective-1000 min-h-[320px] sm:min-h-[360px] cursor-pointer no-select"
          >
            <div className={`relative w-full h-full min-h-[320px] sm:min-h-[360px] transform-style-3d transition-transform duration-500 rounded-[36px] apple-card border border-white/10 p-7 sm:p-9 flex flex-col justify-between shadow-2xl hover:border-purple-500/40 ${isFlipped ? 'rotate-y-180' : ''}`}>
              
              {/* FRONT SIDE */}
              {!isFlipped && (
                <div className="space-y-4 flex-1 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-extrabold uppercase tracking-wider">
                      {currentCard.area} {currentCard.subarea ? `• ${currentCard.subarea}` : ''}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <RotateCw className="w-3 h-3" /> Clique ou Espaço para virar
                    </span>
                  </div>

                  <div className="my-auto py-4">
                    <p className="text-base sm:text-lg font-bold text-white leading-relaxed whitespace-pre-line">
                      {currentCard.front}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-white/5">
                    <span>Tema: {currentCard.theme || 'Clínico'}</span>
                    <span>Intervalo atual: {currentCard.interval || 0}d</span>
                  </div>
                </div>
              )}

              {/* BACK SIDE */}
              {isFlipped && (
                <div className="space-y-4 flex-1 flex flex-col justify-between rotate-y-180">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold uppercase tracking-wider">
                      Resposta / Gabarito
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Como foi sua retenção?
                    </span>
                  </div>

                  <div className="my-auto py-4">
                    <p className="text-sm sm:text-base font-normal text-slate-100 leading-relaxed whitespace-pre-line">
                      {currentCard.back}
                    </p>
                  </div>

                  <div className="text-[11px] text-slate-400 pt-2 border-t border-white/5 text-center">
                    Avalie abaixo para agendar a próxima repetição espaçada
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SM-2 RATING BUTTONS */}
          {isFlipped && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 animate-fadeIn">
              <button
                onClick={(e) => { e.stopPropagation(); handleRate(1); }}
                className="p-3.5 rounded-2xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 text-xs font-black flex flex-col items-center gap-1 transition-all hover:scale-105 active:scale-95"
              >
                <span>1. Errei</span>
                <span className="text-[10px] text-rose-400/80 font-normal">Rever em 1 min</span>
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); handleRate(2); }}
                className="p-3.5 rounded-2xl bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/30 text-amber-300 text-xs font-black flex flex-col items-center gap-1 transition-all hover:scale-105 active:scale-95"
              >
                <span>2. Difícil</span>
                <span className="text-[10px] text-amber-400/80 font-normal">Rever em 1 dia</span>
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); handleRate(3); }}
                className="p-3.5 rounded-2xl bg-blue-950/40 hover:bg-blue-900/60 border border-blue-500/30 text-blue-300 text-xs font-black flex flex-col items-center gap-1 transition-all hover:scale-105 active:scale-95"
              >
                <span>3. Bom</span>
                <span className="text-[10px] text-blue-400/80 font-normal">Rever em 3 dias</span>
              </button>

              <button
                onClick={(e) => { e.stopPropagation(); handleRate(4); }}
                className="p-3.5 rounded-2xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 text-xs font-black flex flex-col items-center gap-1 transition-all hover:scale-105 active:scale-95"
              >
                <span>4. Fácil</span>
                <span className="text-[10px] text-emerald-400/80 font-normal">Rever em 7 dias</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* CRAFT FLASHCARD MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={() => setShowCreateModal(false)} />
          
          <div className="relative w-full max-w-lg rounded-[32px] apple-glass border border-white/10 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Confeccionar Flashcard</h3>
                  <p className="text-xs text-slate-400">Adicione ao seu deck com repetição espaçada</p>
                </div>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCard} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Frente do Cartão (Pergunta / Conceito / Caso)</label>
                <textarea
                  required
                  rows={3}
                  value={newCardForm.front}
                  onChange={(e) => setNewCardForm({ ...newCardForm, front: e.target.value })}
                  placeholder="Ex: Qual a tríade clássica da Síndrome de Wernicke e a conduta imediata?"
                  className="w-full p-3.5 bg-slate-900/90 border border-white/10 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Verso do Cartão (Resposta / Conduta / Macete)</label>
                <textarea
                  required
                  rows={4}
                  value={newCardForm.back}
                  onChange={(e) => setNewCardForm({ ...newCardForm, back: e.target.value })}
                  placeholder="Ex: Tríade: Ataxia + Confusão mental + Oftalmoplegia. Conduta: Tiamina (vit B1) EV ANTES de qualquer infusão glicosada."
                  className="w-full p-3.5 bg-slate-900/90 border border-white/10 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Área Médica (Arsenal)</label>
                  <select
                    value={newCardForm.area}
                    onChange={(e) => {
                      const newArea = e.target.value;
                      const subList = getSubareasByArea(newArea);
                      setNewCardForm({
                        ...newCardForm,
                        area: newArea,
                        subarea: subList[0] || ''
                      });
                    }}
                    className="w-full p-3 bg-slate-900/90 border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer font-medium"
                  >
                    {getAvailableAreas().map(area => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">Subárea Fixa (Arsenal)</label>
                  <select
                    value={newCardForm.subarea}
                    onChange={(e) => setNewCardForm({ ...newCardForm, subarea: e.target.value })}
                    className="w-full p-3 bg-slate-900/90 border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer font-medium"
                  >
                    {getSubareasByArea(newCardForm.area).map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-2xl border border-white/10 text-slate-400 text-xs font-bold hover:bg-white/5 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-purple-500/25 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Salvar Flashcard</span>
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
