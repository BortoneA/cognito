import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Zap, 
  RefreshCw, 
  Flame, 
  Trophy, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Edit3, 
  Sparkles,
  ArrowRight,
  ChevronRight,
  Layers
} from 'lucide-react';
import { useQuestionDb } from '../context/QuestionDbContext';
import { useUserProgress } from '../context/UserProgressContext';

const QuickTestModal = ({ isOpen, onClose, onOpenEditModal }) => {
  const { questions } = useQuestionDb();
  const { progress, saveAnswer } = useUserProgress();

  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  // Build the dynamic question queue (Unanswered questions prioritized at the top of the queue)
  const questionQueue = useMemo(() => {
    if (!questions || questions.length === 0) return [];
    const answers = progress.answers || {};

    const unanswered = [];
    const answered = [];

    questions.forEach(q => {
      if (answers[q.id]) {
        answered.push(q);
      } else {
        unanswered.push(q);
      }
    });

    // Shuffle unanswered slightly so it's dynamic but always prioritizes pending questions
    return [...unanswered, ...answered];
  }, [questions, progress.answers]);

  // Load next question from the top of the queue
  const loadNextFromQueue = () => {
    if (!questionQueue || questionQueue.length === 0) return;

    // Pick from top of unanswered queue or first item
    const answers = progress.answers || {};
    const nextQ = questionQueue.find(q => !answers[q.id]) || questionQueue[0];

    setCurrentQuestion(nextQ);
    setSelectedOption(null);
    setIsSubmitted(false);
    setTimerSeconds(0);
    setTimerActive(true);
  };

  useEffect(() => {
    if (isOpen) {
      loadNextFromQueue();
    } else {
      setTimerActive(false);
    }
  }, [isOpen]);

  // Timer ticker
  useEffect(() => {
    let interval = null;
    if (timerActive && !isSubmitted) {
      interval = setInterval(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerActive, isSubmitted]);

  if (!isOpen || !currentQuestion) return null;

  const handleSelectOption = (optKey) => {
    if (isSubmitted) return;
    setSelectedOption(optKey);
  };

  const handleConfirmAnswer = () => {
    if (!selectedOption || isSubmitted) return;

    const isCorrect = selectedOption === currentQuestion.resposta_correta;
    // Saves answer: moves question to end of queue automatically
    saveAnswer(currentQuestion.id, selectedOption, isCorrect, timerSeconds * 1000);
    setIsSubmitted(true);

    setScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1
    }));

    if (isCorrect) {
      setStreak(s => s + 1);
    } else {
      setStreak(0);
    }
  };

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const totalAnsweredCount = Object.keys(progress.answers || {}).length;
  const pendingCount = Math.max(questions.length - totalAnsweredCount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-2xl animate-fadeIn">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col apple-glass rounded-[36px] border border-white/15 shadow-2xl overflow-hidden specular-highlight">
        
        {/* Top Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white font-extrabold shadow-lg shadow-amber-500/20">
              <Zap className="w-5 h-5 fill-white" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                Fila Dinâmica Express <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">PNA</span>
              </h2>
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>{pendingCount} pendentes na fila • Respondidas vão para o fim</span>
              </p>
            </div>
          </div>

          {/* Widgets */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Streak */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-black shadow-inner">
              <Flame className="w-4 h-4 fill-amber-400 text-amber-400 animate-pulse" />
              <span>{streak} Seguidos</span>
            </div>

            {/* Timer */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/5 border border-white/10 text-slate-300 text-xs font-mono">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>{formatTime(timerSeconds)}</span>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all border border-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Badges & Meta */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-black">
                {currentQuestion.id} • PNA {currentQuestion.ano_da_prova}
              </span>
              <span className="px-3 py-1 rounded-2xl bg-white/5 text-slate-200 border border-white/10 text-xs font-bold">
                {currentQuestion.area}
              </span>
              <span className="px-3 py-1 rounded-2xl bg-white/5 text-slate-300 border border-white/10 text-xs font-medium">
                {currentQuestion.subarea}
              </span>
            </div>

            <button
              onClick={() => onOpenEditModal(currentQuestion)}
              className="text-xs font-bold text-slate-400 hover:text-indigo-300 flex items-center gap-1 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-2xl border border-white/10 transition-all active:scale-95"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editar</span>
            </button>
          </div>

          {/* Enunciado */}
          <div className="text-sm sm:text-base leading-relaxed text-slate-100 font-normal tracking-tight font-scalable">
            {currentQuestion.enunciado}
          </div>

          {/* Options Stack */}
          <div className="space-y-3 pt-2">
            {Object.entries(currentQuestion.alternativas || {}).map(([key, opt]) => {
              const isSelected = selectedOption === key;
              const isCorrectAnswer = key === currentQuestion.resposta_correta;
              const optionText = typeof opt === 'string' ? opt : (opt?.texto || String(opt));

              let optionStyle = "bg-slate-900/60 border-white/5 text-slate-200 hover:border-indigo-500/40 hover:bg-slate-800/80";

              if (isSubmitted) {
                if (isCorrectAnswer) {
                  optionStyle = "bg-emerald-950/40 border-emerald-500/60 text-emerald-100 glow-emerald";
                } else if (isSelected && !isCorrectAnswer) {
                  optionStyle = "bg-rose-950/40 border-rose-500/60 text-rose-100 glow-rose";
                } else {
                  optionStyle = "bg-slate-900/30 border-white/5 text-slate-500 opacity-60";
                }
              } else if (isSelected) {
                optionStyle = "bg-indigo-950/60 border-indigo-500 text-white glow-indigo ring-1 ring-indigo-500/40";
              }

              return (
                <div
                  key={key}
                  onClick={() => handleSelectOption(key)}
                  className={`p-4 rounded-2xl border transition-all duration-200 flex items-start gap-3.5 cursor-pointer active:scale-[0.99] ${optionStyle}`}
                >
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                    isSubmitted && isCorrectAnswer
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                      : isSubmitted && isSelected && !isCorrectAnswer
                      ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                      : isSelected
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                      : 'bg-slate-800 text-slate-300'
                  }`}>
                    {key}
                  </div>
                  <div className="flex-1 text-xs sm:text-sm font-medium pt-0.5 leading-relaxed">
                    {optionText}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Explanation if submitted */}
          {isSubmitted && (
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-white/10 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase ${
                    selectedOption === currentQuestion.resposta_correta 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}>
                    {selectedOption === currentQuestion.resposta_correta ? '✓ Resposta Correta!' : '✕ Você Errou!'}
                  </span>
                  <span className="text-xs text-slate-400">Gabarito: <strong className="text-emerald-400">{currentQuestion.resposta_correta}</strong></span>
                </div>
                <span className="text-[11px] text-indigo-300 font-bold">
                  ↘ Questão movida para o fim da fila
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                {currentQuestion.explicacao}
              </p>
            </div>
          )}

        </div>

        {/* Footer actions */}
        <div className="p-4 sm:p-6 border-t border-white/10 bg-slate-900/80 flex items-center justify-between">
          <div className="text-xs text-slate-400 font-medium">
            Sessão: <strong className="text-white">{score.total}</strong> feitas (<strong className="text-emerald-400">{score.correct}</strong> acertos)
          </div>

          {!isSubmitted ? (
            <button
              onClick={handleConfirmAnswer}
              disabled={!selectedOption}
              className={`px-7 py-3 rounded-2xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 transition-all ${
                selectedOption
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30 scale-[1.02] active:scale-95'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <span>Confirmar Resposta</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={loadNextFromQueue}
              className="px-7 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all scale-[1.02] active:scale-95 animate-bounce-short"
            >
              <span>Próxima da Fila</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default QuickTestModal;
