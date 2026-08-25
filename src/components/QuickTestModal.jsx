import React, { useState, useEffect } from 'react';
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
  ChevronRight
} from 'lucide-react';
import { useQuestionDb } from '../context/QuestionDbContext';
import { useUserProgress } from '../context/UserProgressContext';

const QuickTestModal = ({ isOpen, onClose, onOpenEditModal }) => {
  const { questions } = useQuestionDb();
  const { saveAnswer } = useUserProgress();

  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  // Pick random question when opened or asked
  const pickRandomQuestion = () => {
    if (!questions || questions.length === 0) return;
    const randomIndex = Math.floor(Math.random() * questions.length);
    setCurrentQuestion(questions[randomIndex]);
    setSelectedOption(null);
    setIsSubmitted(false);
    setTimerSeconds(0);
    setTimerActive(true);
  };

  useEffect(() => {
    if (isOpen) {
      pickRandomQuestion();
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-2xl animate-fadeIn">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col apple-glass rounded-[36px] border border-white/15 shadow-2xl overflow-hidden">
        
        {/* Top Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white font-extrabold shadow-lg shadow-amber-500/20">
              <Zap className="w-5 h-5 fill-white" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                Teste Rápido <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">Express</span>
              </h2>
              <p className="text-xs text-slate-400">Questão aleatória instantânea do banco de 5.073 questões</p>
            </div>
          </div>

          {/* Widgets */}
          <div className="flex items-center gap-4">
            {/* Streak */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-black shadow-inner">
              <Flame className="w-4 h-4 fill-amber-400 text-amber-400 animate-pulse" />
              <span>{streak} Sequência</span>
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
          
          {/* Badges */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-black">
                {currentQuestion.id} • PNA {currentQuestion.ano_da_prova}
              </span>
              <span className="px-3 py-1 rounded-2xl bg-white/5 text-slate-200 border border-white/10 text-xs font-bold">
                {currentQuestion.area}
              </span>
              <span className="px-3 py-1 rounded-2xl bg-white/5 text-slate-300 border border-white/5 text-xs font-medium">
                {currentQuestion.subarea}
              </span>
            </div>

            <button
              onClick={() => onOpenEditModal(currentQuestion)}
              className="text-xs font-bold text-slate-400 hover:text-indigo-300 flex items-center gap-1 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-2xl border border-white/10 transition-all"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Editar Questão</span>
            </button>
          </div>

          {/* Theme */}
          {currentQuestion.doenca_ou_conjunto_de_doencas && (
            <div className="px-4 py-2 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 text-xs font-semibold">
              Tema Clínico: <strong className="text-white">{currentQuestion.doenca_ou_conjunto_de_doencas}</strong>
            </div>
          )}

          {/* Enunciado */}
          <p className="text-sm sm:text-base leading-relaxed text-slate-100 font-normal">
            {currentQuestion.enunciado}
          </p>

          {/* Alternatives */}
          <div className="space-y-3 pt-2">
            {Object.entries(currentQuestion.alternativas || {}).map(([key, opt]) => {
              const isSelected = selectedOption === key;
              const isCorrectAnswer = key === currentQuestion.resposta_correta;

              let style = "bg-slate-900/60 border-white/5 text-slate-200 hover:border-indigo-500/40 hover:bg-slate-800/80";

              if (isSubmitted) {
                if (isCorrectAnswer) {
                  style = "bg-emerald-950/40 border-emerald-500/60 text-emerald-100 glow-emerald";
                } else if (isSelected && !isCorrectAnswer) {
                  style = "bg-rose-950/40 border-rose-500/60 text-rose-100 glow-rose";
                } else {
                  style = "bg-slate-900/30 border-white/5 text-slate-500 opacity-60";
                }
              } else if (isSelected) {
                style = "bg-indigo-950/60 border-indigo-500 text-white glow-indigo ring-1 ring-indigo-500/40";
              }

              return (
                <div
                  key={key}
                  onClick={() => handleSelectOption(key)}
                  className={`flex items-start gap-3.5 p-4 rounded-2xl border transition-all cursor-pointer ${style}`}
                >
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                    isSubmitted && isCorrectAnswer
                      ? 'bg-emerald-500 text-white'
                      : isSubmitted && isSelected && !isCorrectAnswer
                      ? 'bg-rose-500 text-white'
                      : isSelected
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-300'
                  }`}>
                    {key}
                  </div>
                  <div className="flex-1 text-xs sm:text-sm font-medium pt-0.5 leading-relaxed">
                    {opt.texto}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Explanation if submitted */}
          {isSubmitted && (
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-white/10 space-y-3 animate-fadeIn">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-xl text-xs font-black uppercase ${
                  selectedOption === currentQuestion.resposta_correta ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}>
                  {selectedOption === currentQuestion.resposta_correta ? '✓ Resposta Correta!' : '✕ Você Errou!'}
                </span>
                <span className="text-xs text-slate-400">Gabarito: <strong className="text-emerald-400">{currentQuestion.resposta_correta}</strong></span>
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
            Total respondidas nesta sessão: <strong className="text-white">{score.total}</strong> ({score.correct} acertos)
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
              onClick={pickRandomQuestion}
              className="px-7 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all scale-[1.02] active:scale-95 animate-bounce-short"
            >
              <span>Próxima Questão Rápida</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default QuickTestModal;
