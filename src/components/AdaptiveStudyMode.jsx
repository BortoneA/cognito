import React, { useState, useEffect, useRef } from 'react';
import { Brain, Zap, CheckCircle2, XCircle, ChevronRight, RotateCcw, TrendingUp, AlertTriangle, ArrowRight } from 'lucide-react';
import { useQuestionDb } from '../context/QuestionDbContext';
import { useUserProgress } from '../context/UserProgressContext';
import { buildAdaptiveQueue, computeFragilityScores } from '../services/adaptiveLearningService';

const SESSION_SIZES = [10, 20, 30];

const AdaptiveStudyMode = () => {
  const { questions } = useQuestionDb();
  const { progress, saveAnswer } = useUserProgress();

  const [phase, setPhase] = useState('setup'); // setup | session | results
  const [sessionSize, setSessionSize] = useState(20);
  const [queue, setQueue] = useState([]);
  const [breakdown, setBreakdown] = useState(null);
  const [fragilityScores, setFragilityScores] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [sessionAnswers, setSessionAnswers] = useState({});
  const [startTime, setStartTime] = useState(null);
  const [timePerQuestion, setTimePerQuestion] = useState(null);

  const startTimeRef = useRef(null);

  useEffect(() => {
    const scores = computeFragilityScores(questions, progress.answers || {});
    setFragilityScores(scores);
  }, [questions, progress.answers]);

  const startSession = () => {
    const result = buildAdaptiveQueue(questions, progress.answers || {}, sessionSize);
    setQueue(result.queue);
    setBreakdown(result.breakdown);
    setCurrentIdx(0);
    setSelectedOpt(null);
    setSessionAnswers({});
    setPhase('session');
    startTimeRef.current = Date.now();
    setStartTime(Date.now());
  };

  const handleSelectOption = (opt) => {
    if (selectedOpt) return; // already answered
    const q = queue[currentIdx];
    const isCorrect = (q.opcao_correta || q.opção_correta) === opt;
    const elapsed = Date.now() - (startTimeRef.current || Date.now());
    setSelectedOpt(opt);
    setTimePerQuestion(elapsed);
    saveAnswer(q.id, opt, isCorrect, elapsed);
    setSessionAnswers(prev => ({ ...prev, [q.id]: { opt, isCorrect } }));
  };

  const nextQuestion = () => {
    if (currentIdx < queue.length - 1) {
      setCurrentIdx(i => i + 1);
      setSelectedOpt(null);
      startTimeRef.current = Date.now();
    } else {
      setPhase('results');
    }
  };

  const q = queue[currentIdx];
  const OPTIONS = ['A', 'B', 'C', 'D', 'E'];

  const sessionCorrect = Object.values(sessionAnswers).filter(a => a.isCorrect).length;
  const sessionTotal = Object.keys(sessionAnswers).length;
  const sessionPct = sessionTotal > 0 ? Math.round((sessionCorrect / sessionTotal) * 100) : 0;

  // Setup phase
  if (phase === 'setup') {
    const criticalAreas = fragilityScores.filter(s => s.fragilityScore >= 0.4).slice(0, 3);
    return (
      <div className="space-y-6 pb-12 animate-fadeIn">
        {/* Header */}
        <div className="rounded-[36px] apple-glass p-6 sm:p-8 border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-3">
            <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase tracking-wider flex items-center gap-1.5 w-fit">
              <Brain className="w-3.5 h-3.5" />
              Estudo Adaptativo por IA
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Modo Estudo Inteligente
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
              A IA analisa seu histórico de respostas e monta uma sessão personalizada, priorizando automaticamente suas áreas mais fracas.
            </p>
          </div>
        </div>

        {/* Fragility scores — top weak areas */}
        {criticalAreas.length > 0 && (
          <div className="rounded-3xl apple-card border border-rose-500/25 bg-rose-950/15 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-extrabold text-white">Áreas Críticas Detectadas</h3>
            </div>
            <div className="space-y-2">
              {criticalAreas.map(a => (
                <div key={a.area} className="flex items-center justify-between p-3 rounded-2xl bg-rose-950/30 border border-rose-500/20">
                  <span className="text-sm text-white font-bold">{a.area}</span>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-slate-400">{a.answered} resp.</span>
                    <span className="text-rose-300 font-extrabold">{a.errorRate}% erros</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Session size picker */}
        <div className="rounded-3xl apple-card border border-white/10 p-5 space-y-4">
          <h3 className="text-sm font-extrabold text-white">Tamanho da Sessão</h3>
          <div className="grid grid-cols-3 gap-3">
            {SESSION_SIZES.map(size => (
              <button
                key={size}
                onClick={() => setSessionSize(size)}
                className={`p-4 rounded-2xl border text-center transition-all ${
                  sessionSize === size
                    ? 'bg-blue-500/20 border-blue-500/50 shadow-lg shadow-blue-500/10'
                    : 'bg-slate-900/50 border-white/10 hover:border-white/20'
                }`}
              >
                <span className="text-xl font-black text-white block">{size}</span>
                <span className="text-[10px] text-slate-400">questões</span>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={startSession}
          className="w-full py-4 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm flex items-center justify-center gap-3 shadow-2xl shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Brain className="w-5 h-5" />
          Iniciar Sessão Adaptativa ({sessionSize} questões)
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // Results phase
  if (phase === 'results') {
    return (
      <div className="space-y-6 pb-12 animate-fadeIn">
        <div className="rounded-[36px] apple-glass p-8 border border-white/10 shadow-2xl text-center space-y-4">
          <div className={`text-6xl ${sessionPct >= 70 ? '✅' : '📊'}`}>{sessionPct >= 70 ? '🎉' : '📊'}</div>
          <h1 className="text-3xl font-black text-white">{sessionPct}% de Acurácia</h1>
          <p className="text-sm text-slate-300">
            {sessionCorrect} acertos em {sessionTotal} questões desta sessão adaptativa
          </p>

          {breakdown && (
            <div className="grid grid-cols-3 gap-3 mt-4 text-xs">
              <div className="p-3 rounded-2xl bg-rose-950/30 border border-rose-500/20">
                <span className="text-rose-300 font-black block text-lg">{breakdown.critical}</span>
                <span className="text-slate-400">Críticas</span>
              </div>
              <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-500/20">
                <span className="text-amber-300 font-black block text-lg">{breakdown.weak}</span>
                <span className="text-slate-400">Fracas</span>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-950/30 border border-emerald-500/20">
                <span className="text-emerald-300 font-black block text-lg">{breakdown.ok}</span>
                <span className="text-slate-400">Sólidas</span>
              </div>
            </div>
          )}

          <button
            onClick={() => setPhase('setup')}
            className="mt-4 w-full py-3.5 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white font-extrabold text-sm flex items-center justify-center gap-2 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            Nova Sessão Adaptativa
          </button>
        </div>
      </div>
    );
  }

  // Session phase
  if (!q) return null;
  const correctOpt = q.opcao_correta || q.opção_correta;

  return (
    <div className="space-y-4 pb-12 animate-fadeIn">
      {/* Progress bar */}
      <div className="rounded-2xl apple-card border border-white/10 p-4 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-bold flex items-center gap-1.5">
            <Brain className="w-3.5 h-3.5 text-blue-400" />
            Questão {currentIdx + 1} / {queue.length}
          </span>
          <span className="text-white font-extrabold">{Math.round((currentIdx / queue.length) * 100)}%</span>
        </div>
        <div className="w-full bg-slate-900 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${(currentIdx / queue.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="rounded-3xl apple-card border border-white/10 p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-1 rounded-xl bg-blue-500/15 text-blue-300 text-[10px] font-bold border border-blue-500/30">{q.area}</span>
          <span className="px-2.5 py-1 rounded-xl bg-white/5 text-slate-400 text-[10px] font-bold border border-white/10">{q.ano_da_prova}</span>
        </div>

        <p className="text-sm text-slate-100 leading-relaxed font-medium">{q.enunciado}</p>

        <div className="space-y-2.5">
          {OPTIONS.map(opt => {
            const optText = q[`opcao_${opt.toLowerCase()}`] || q[`opção_${opt}`];
            if (!optText) return null;
            const isSelected = selectedOpt === opt;
            const isCorrect = opt === correctOpt;
            const showResult = !!selectedOpt;

            let style = 'bg-slate-900/60 border-white/10 text-slate-300';
            if (showResult && isCorrect) style = 'bg-emerald-500/20 border-emerald-500/50 text-emerald-100';
            else if (showResult && isSelected && !isCorrect) style = 'bg-rose-500/20 border-rose-500/50 text-rose-200';

            return (
              <button
                key={opt}
                onClick={() => handleSelectOption(opt)}
                disabled={!!selectedOpt}
                className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-3 min-h-[48px] ${style} ${!selectedOpt ? 'hover:border-indigo-500/40 hover:bg-indigo-950/20 active:scale-[0.99]' : ''}`}
              >
                <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-xs font-extrabold shrink-0">{opt}</span>
                <span className="text-sm leading-relaxed">{optText}</span>
                {showResult && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-auto mt-0.5" />}
                {showResult && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-400 shrink-0 ml-auto mt-0.5" />}
              </button>
            );
          })}
        </div>

        {selectedOpt && (
          <div className="pt-2 flex justify-end">
            <button
              onClick={nextQuestion}
              className="px-6 py-3 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-extrabold flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
            >
              {currentIdx < queue.length - 1 ? 'Próxima' : 'Ver Resultado'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdaptiveStudyMode;
