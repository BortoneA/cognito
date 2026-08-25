import React from 'react';
import { Target, Flame, Brain, CheckCircle2 } from 'lucide-react';
import { useUserProgress } from '../context/UserProgressContext';
import { useQuestionDb } from '../context/QuestionDbContext';
import { getOverviewKPIs } from '../utils/analyticsHelpers';

const ActivityRings = ({ size = 160 }) => {
  const { progress } = useUserProgress();
  const { questions } = useQuestionDb();
  const kpis = getOverviewKPIs(questions, progress);

  const dailyGoal = progress.dailyGoal || 20;
  const today = new Date().toISOString().slice(0, 10);
  const todayActivity = (progress.dailyActivity || {})[today] || { questions: 0, flashcards: 0 };
  const todayQuestions = todayActivity.questions || 0;

  // Ring 1: Daily Goal (Red / Orange)
  const goalPct = Math.min(100, Math.round((todayQuestions / dailyGoal) * 100));

  // Ring 2: Clinical Accuracy (Emerald / Mint)
  const accuracyPct = Math.min(100, kpis.accuracyPct || 0);

  // Ring 3: Study Activity / Flashcards (Purple / Indigo)
  const flashcardsToday = todayActivity.flashcards || 0;
  const flashcardsPct = Math.min(100, Math.round((flashcardsToday / 15) * 100));

  // Geometry calculations
  const center = size / 2;
  const strokeWidth = size * 0.085;
  const gap = strokeWidth * 0.35;

  const r1 = center - strokeWidth;
  const r2 = r1 - strokeWidth - gap;
  const r3 = r2 - strokeWidth - gap;

  const getOffset = (radius, pct) => {
    const circumference = 2 * Math.PI * radius;
    return circumference * (1 - pct / 100);
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-[32px] apple-card border border-white/10 relative overflow-hidden shadow-2xl">
      {/* Background ambient gradient glow */}
      <div className="absolute -left-10 -bottom-10 w-48 h-48 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />
      <div className="absolute right-0 -top-10 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

      {/* SVG Concentric Rings */}
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
          <defs>
            {/* Ring 1 Gradient: Red / Coral / Orange */}
            <linearGradient id="ringGoalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ff2d55" />
              <stop offset="100%" stopColor="#ff9500" />
            </linearGradient>

            {/* Ring 2 Gradient: Emerald / Mint */}
            <linearGradient id="ringAccGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#30d158" />
              <stop offset="100%" stopColor="#34c759" />
            </linearGradient>

            {/* Ring 3 Gradient: Purple / Indigo */}
            <linearGradient id="ringCardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#af52de" />
              <stop offset="100%" stopColor="#5856d6" />
            </linearGradient>
          </defs>

          {/* Background Track 1 */}
          <circle
            cx={center} cy={center} r={r1}
            fill="none" stroke="rgba(255, 45, 85, 0.15)"
            strokeWidth={strokeWidth}
          />
          {/* Progress Ring 1: Goal */}
          <circle
            cx={center} cy={center} r={r1}
            fill="none" stroke="url(#ringGoalGrad)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * r1}
            strokeDashoffset={getOffset(r1, goalPct)}
            style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
          />

          {/* Background Track 2 */}
          <circle
            cx={center} cy={center} r={r2}
            fill="none" stroke="rgba(48, 209, 88, 0.15)"
            strokeWidth={strokeWidth}
          />
          {/* Progress Ring 2: Accuracy */}
          <circle
            cx={center} cy={center} r={r2}
            fill="none" stroke="url(#ringAccGrad)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * r2}
            strokeDashoffset={getOffset(r2, accuracyPct)}
            style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
          />

          {/* Background Track 3 */}
          <circle
            cx={center} cy={center} r={r3}
            fill="none" stroke="rgba(175, 82, 222, 0.15)"
            strokeWidth={strokeWidth}
          />
          {/* Progress Ring 3: Flashcards */}
          <circle
            cx={center} cy={center} r={r3}
            fill="none" stroke="url(#ringCardGrad)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * r3}
            strokeDashoffset={getOffset(r3, flashcardsPct)}
            style={{ transition: 'stroke-dashoffset 1.6s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
          />
        </svg>

        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Flame className={`w-6 h-6 ${goalPct >= 100 ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} />
        </div>
      </div>

      {/* Ring Legend & Stats */}
      <div className="flex-1 space-y-3 w-full">
        <div>
          <h4 className="text-sm font-black text-white tracking-tight flex items-center gap-2">
            Anéis de Desempenho Diário
            {goalPct >= 100 && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold border border-emerald-500/30 animate-pulse">
                Meta Fechada! 🔥
              </span>
            )}
          </h4>
          <p className="text-[11px] text-slate-400">Progresso sinérgico de questões, acurácia e repetição</p>
        </div>

        <div className="space-y-2">
          {/* Item 1: Goal */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-[#ff2d55] to-[#ff9500] shadow-sm shadow-rose-500/50" />
              <span className="text-xs text-slate-200 font-bold">Meta Diária</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-white">{todayQuestions}/{dailyGoal} Q.</span>
              <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded-md">{goalPct}%</span>
            </div>
          </div>

          {/* Item 2: Accuracy */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-[#30d158] to-[#34c759] shadow-sm shadow-emerald-500/50" />
              <span className="text-xs text-slate-200 font-bold">Acurácia Geral</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-white">{kpis.totalCorrect}/{kpis.totalAnswered} acertos</span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">{accuracyPct}%</span>
            </div>
          </div>

          {/* Item 3: Flashcards */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-[#af52de] to-[#5856d6] shadow-sm shadow-purple-500/50" />
              <span className="text-xs text-slate-200 font-bold">Flashcards SM-2</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-white">{flashcardsToday} revisados</span>
              <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded-md">{flashcardsPct}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityRings;
