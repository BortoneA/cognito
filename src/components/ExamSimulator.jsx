import React, { useState, useEffect } from 'react';
import {
  Clock,
  Play,
  Award,
  CheckCircle2,
  RotateCcw,
  FileSpreadsheet,
  Grid,
  ChevronLeft,
  ChevronRight,
  FileDown,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { getUniqueYears, getUniqueAreas } from '../data/questionsLoader';
import QuestionCard from './QuestionCard';
import { useUserProgress } from '../context/UserProgressContext';
import { useQuestionDb } from '../context/QuestionDbContext';
import { generateExamReport } from '../services/pdfExportService';


const ExamSimulator = ({ onEditQuestion, onOpenNote }) => {
  const { saveExamResult, saveAnswer } = useUserProgress();
  const { questions } = useQuestionDb();

  const [selectedYear, setSelectedYear] = useState('2024');
  const [selectedArea, setSelectedArea] = useState('all');
  const [questionCount, setQuestionCount] = useState(50);
  const [timerMinutes, setTimerMinutes] = useState(60);

  const [isExamRunning, setIsExamRunning] = useState(false);
  const [examQuestions, setExamQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [examAnswers, setExamAnswers] = useState({});
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [examReport, setExamReport] = useState(null);

  const years = getUniqueYears(questions);
  const areas = getUniqueAreas(questions);

  useEffect(() => {
    let interval = null;
    if (isExamRunning && !isFinished && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            handleFinishExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isExamRunning, isFinished, secondsRemaining]);

  const handleStartExam = () => {
    let pool = [...questions];

    if (selectedYear !== 'all') {
      pool = pool.filter(q => q.ano_da_prova === parseInt(selectedYear, 10));
    }

    if (selectedArea !== 'all') {
      pool = pool.filter(q => q.area === selectedArea);
    }

    const shuffled = pool.sort(() => 0.5 - Math.random());
    const selectedList = shuffled.slice(0, Math.min(questionCount, pool.length));

    if (selectedList.length === 0) {
      alert("Nenhuma questão encontrada para os parâmetros selecionados!");
      return;
    }

    setExamQuestions(selectedList);
    setExamAnswers({});
    setCurrentIndex(0);
    setSecondsRemaining(timerMinutes * 60);
    setIsExamRunning(true);
    setIsFinished(false);
    setExamReport(null);
  };

  const handleOptionSelect = (qId, optionKey) => {
    setExamAnswers(prev => ({
      ...prev,
      [qId]: optionKey
    }));
  };

  const handleFinishExam = () => {
    setIsFinished(true);
    setIsExamRunning(false);

    let correctCount = 0;
    let incorrectCount = 0;

    examQuestions.forEach(q => {
      const userOpt = examAnswers[q.id];
      const isCorrect = userOpt === q.resposta_correta;
      if (userOpt) {
        saveAnswer(q.id, userOpt, isCorrect);
        if (isCorrect) correctCount++;
        else incorrectCount++;
      }
    });

    const total = examQuestions.length;
    const scorePct = Math.round((correctCount / total) * 100);
    const durationSec = (timerMinutes * 60) - secondsRemaining;

    const report = {
      id: Date.now(),
      date: new Date().toLocaleDateString('pt-BR'),
      year: selectedYear,
      area: selectedArea,
      total,
      correctCount,
      incorrectCount,
      unansweredCount: total - (correctCount + incorrectCount),
      scorePct,
      durationSec
    };

    setExamReport(report);
    saveExamResult(report);

    if (scorePct >= 70) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (!isExamRunning && !isFinished) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        <div className="rounded-[32px] apple-glass p-8 text-center space-y-3 border border-white/10 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400 glow-indigo">
            <Clock className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Simulado de Prova PNA</h1>
          <p className="text-sm text-slate-300 max-w-xl mx-auto font-normal">
            Treine em condições reais de prova com provas completas de 150 questões ou exames direcionados.
          </p>
        </div>

        <div className="rounded-[32px] apple-card p-8 border border-white/10 space-y-6">
          <h3 className="text-base font-extrabold text-white border-b border-white/10 pb-3 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-indigo-400" /> Configurações da Prova
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Ano da Prova</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full p-3.5 bg-slate-900/90 border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
              >
                <option value="all">Todas as Provas (2018 - 2024)</option>
                {years.map(y => (
                  <option key={y} value={y}>Provas PNA {y} (150 Q.)</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Foco em Área</label>
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="w-full p-3.5 bg-slate-900/90 border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
              >
                <option value="all">Todas as Áreas Médicas</option>
                {areas.map(a => (
                  <option key={a.area} value={a.area}>{a.area} ({a.count} q.)</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Volume de Questões</label>
              <select
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full p-3.5 bg-slate-900/90 border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
              >
                <option value={15}>15 Questões (Simulado Rápido)</option>
                <option value={30}>30 Questões</option>
                <option value={50}>50 Questões (Médio)</option>
                <option value={100}>100 Questões</option>
                <option value={150}>150 Questões (Prova Completa)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Cronômetro</label>
              <select
                value={timerMinutes}
                onChange={(e) => setTimerMinutes(Number(e.target.value))}
                className="w-full p-3.5 bg-slate-900/90 border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
              >
                <option value={30}>30 Minutos</option>
                <option value={60}>60 Minutos (1 Hora)</option>
                <option value={120}>120 Minutos (2 Horas)</option>
                <option value={180}>180 Minutos (3 Horas)</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleStartExam}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all active:scale-98"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Iniciar Simulado PNA</span>
          </button>
        </div>
      </div>
    );
  }

  if (isExamRunning && !isFinished) {
    const currentQRaw = examQuestions[currentIndex];
    const currentQ = currentQRaw ? (questions.find(q => q.id === currentQRaw.id) || currentQRaw) : null;
    const answeredCount = Object.keys(examAnswers).length;

    return (
      <div className="space-y-6 pb-12">
        <div className="sticky top-20 z-30 rounded-2xl apple-glass p-4 border border-white/10 shadow-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-300">
              Questão <strong className="text-indigo-400 text-sm">{currentIndex + 1}</strong> de {examQuestions.length}
            </span>
            <span className="text-slate-700">|</span>
            <span className="text-xs text-slate-400">
              Respondidas: <strong className="text-emerald-400">{answeredCount}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-slate-900 border border-white/10 font-mono text-sm font-bold text-amber-400 shadow-inner">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>{formatTime(secondsRemaining)}</span>
          </div>

          <button
            onClick={handleFinishExam}
            className="py-1.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md transition-colors"
          >
            Finalizar Prova
          </button>
        </div>

        <div className="rounded-2xl apple-card p-4 border border-white/10 flex items-center gap-2 overflow-x-auto">
          <Grid className="w-4 h-4 text-slate-400 shrink-0 mr-2" />
          {examQuestions.map((q, idx) => {
            const isAnswered = !!examAnswers[q.id];
            const isCurrent = idx === currentIndex;
            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={`w-7 h-7 rounded-xl text-xs font-extrabold shrink-0 transition-all ${
                  isCurrent
                    ? 'bg-indigo-600 text-white ring-2 ring-indigo-400 shadow-md'
                    : isAnswered
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {currentQ && (
          <QuestionCard
            question={currentQ}
            isSimulationMode={true}
            onAnswerSimulation={handleOptionSelect}
            onEditQuestion={onEditQuestion}
            onOpenNote={onOpenNote}
          />
        )}

        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <button
            onClick={() => setCurrentIndex(i => Math.max(i - 1, 0))}
            disabled={currentIndex === 0}
            className="py-2.5 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-xs font-bold text-white flex items-center gap-2 border border-white/10"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </button>

          {currentIndex < examQuestions.length - 1 ? (
            <button
              onClick={() => setCurrentIndex(i => Math.min(i + 1, examQuestions.length - 1))}
              className="py-2.5 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white flex items-center gap-2 shadow-lg shadow-indigo-600/30"
            >
              Próxima
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinishExam}
              className="py-2.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-xs font-extrabold text-white flex items-center gap-2 shadow-lg shadow-emerald-600/30 uppercase"
            >
              <span>Submeter Prova</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  if (isFinished && examReport) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        <div className="rounded-[32px] apple-glass border border-white/10 p-8 text-center space-y-4 shadow-2xl">
          <div className="w-20 h-20 rounded-full bg-indigo-600/20 border-2 border-indigo-500 flex items-center justify-center mx-auto text-indigo-400 glow-indigo">
            <Award className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white">Resultado do Simulado</h1>
            <p className="text-xs text-slate-300 mt-1">Concluído em {examReport.date}</p>
          </div>

          <div className="inline-flex items-center gap-6 apple-segmented-bg px-8 py-4 border border-white/10 shadow-lg">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Acurácia</span>
              <span className="text-3xl font-black text-indigo-400">{examReport.scorePct}%</span>
            </div>
            <div className="h-8 w-px bg-white/10"></div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Acertos</span>
              <span className="text-2xl font-black text-emerald-400">{examReport.correctCount} / {examReport.total}</span>
            </div>
            <div className="h-8 w-px bg-white/10"></div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Erros</span>
              <span className="text-2xl font-black text-rose-400">{examReport.incorrectCount}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => {
              setIsFinished(false);
              setIsExamRunning(false);
            }}
            className="py-3.5 px-7 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs flex items-center gap-2 transition-all shadow-lg active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Novo Simulado</span>
          </button>

          <button
            onClick={() => generateExamReport(
              {
                accuracyPct: examReport.scorePct,
                totalQuestions: examReport.total,
                correct: examReport.correctCount,
                incorrect: examReport.incorrectCount,
                avgTimeSec: examReport.durationSec ? Math.round(examReport.durationSec / examReport.total) : 0
              },
              examQuestions
            )}
            className="py-3.5 px-7 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-2 transition-all shadow-lg active:scale-95 border border-emerald-400/30"
          >
            <FileDown className="w-4 h-4" />
            <span>Exportar PDF</span>
          </button>
        </div>


        <div className="space-y-6">
          <h3 className="text-lg font-bold text-white border-b border-white/10 pb-3">
            Gabarito Comentado da Prova
          </h3>
          {examQuestions.map(q => {
            const upToDateQ = questions.find(item => item.id === q.id) || q;
            return (
              <QuestionCard
                key={q.id}
                question={upToDateQ}
                onEditQuestion={onEditQuestion}
                onOpenNote={onOpenNote}
              />
            );
          })}
        </div>
      </div>
    );
  }

  return null;
};

export default ExamSimulator;
