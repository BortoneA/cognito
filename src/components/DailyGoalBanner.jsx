import React, { useState } from 'react';
import { Target, Flame, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { useUserProgress } from '../context/UserProgressContext';
import { getOverviewKPIs } from '../utils/analyticsHelpers';
import { useQuestionDb } from '../context/QuestionDbContext';

const PRESET_GOALS = [5, 10, 20, 30, 50];

const DailyGoalBanner = () => {
  const { progress, setDailyGoal } = useUserProgress();
  const { questions } = useQuestionDb();
  const [showGoalPicker, setShowGoalPicker] = useState(false);
  const [celebrated, setCelebrated] = useState(false);

  const dailyGoal = progress.dailyGoal || 20;
  const today = new Date().toISOString().slice(0, 10);
  const todayActivity = (progress.dailyActivity || {})[today] || { questions: 0 };
  const todayQuestions = todayActivity.questions || 0;

  const pct = Math.min(100, Math.round((todayQuestions / dailyGoal) * 100));
  const goalMet = todayQuestions >= dailyGoal;

  if (goalMet && !celebrated) {
    setCelebrated(true);
  }

  return (
    <div className={`mx-4 sm:mx-6 lg:mx-8 mb-4 rounded-2xl border transition-all ${
      goalMet
        ? 'bg-emerald-950/40 border-emerald-500/40'
        : 'bg-slate-900/70 border-white/10'
    }`}>
      <div className="px-4 py-3 flex items-center gap-4">
        {/* Icon */}
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
          goalMet ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400'
        }`}>
          {goalMet ? <CheckCircle2 className="w-5 h-5" /> : <Target className="w-5 h-5" />}
        </div>

        {/* Progress */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-white">
              {goalMet ? '🎉 Meta diária atingida!' : `Meta do dia: ${todayQuestions} / ${dailyGoal} questões`}
            </span>
            <button
              onClick={() => setShowGoalPicker(p => !p)}
              className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              Alterar meta {showGoalPicker ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>

          {/* Bar */}
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                goalMet
                  ? 'bg-gradient-to-r from-emerald-500 to-green-400'
                  : 'bg-gradient-to-r from-indigo-500 to-purple-500'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Flame streak */}
        <div className="flex items-center gap-1 shrink-0">
          <Flame className={`w-4 h-4 ${goalMet ? 'text-emerald-400' : 'text-amber-400'}`} />
          <span className="text-xs font-black text-white">{pct}%</span>
        </div>
      </div>

      {/* Goal picker */}
      {showGoalPicker && (
        <div className="px-4 pb-3 flex flex-wrap gap-2 border-t border-white/10 pt-3">
          {PRESET_GOALS.map(g => (
            <button
              key={g}
              onClick={() => { setDailyGoal(g); setShowGoalPicker(false); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all ${
                dailyGoal === g
                  ? 'bg-indigo-500/30 border-indigo-500/50 text-indigo-200'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {g} questões/dia
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default DailyGoalBanner;
