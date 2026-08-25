import React from 'react';
import { Calendar, Flame, Trophy, Activity, Zap } from 'lucide-react';
import { useUserProgress } from '../context/UserProgressContext';

const ActivityHeatmap = ({ numWeeks = 20 }) => {
  const { progress } = useUserProgress();
  const dailyActivity = progress.dailyActivity || {};

  // Generate grid dates for the last N weeks
  const today = new Date();
  const daysCount = numWeeks * 7;
  const datesList = [];

  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const activity = dailyActivity[dateStr] || { questions: 0, flashcards: 0 };
    const totalCount = (activity.questions || 0) + (activity.flashcards || 0);

    datesList.push({
      dateStr,
      dateObj: d,
      questions: activity.questions || 0,
      flashcards: activity.flashcards || 0,
      totalCount
    });
  }

  // Calculate Streak
  let currentStreak = 0;
  let maxStreak = 0;
  let tempStreak = 0;
  let activeDaysCount = 0;

  // Calculate streaks historically
  for (let i = datesList.length - 1; i >= 0; i--) {
    const item = datesList[i];
    if (item.totalCount > 0) {
      activeDaysCount++;
      tempStreak++;
      if (i === datesList.length - 1 || i === datesList.length - 2) {
        currentStreak = tempStreak;
      }
      if (tempStreak > maxStreak) maxStreak = tempStreak;
    } else {
      tempStreak = 0;
    }
  }

  const totalReviews = datesList.reduce((acc, curr) => acc + curr.totalCount, 0);
  const avgPerActiveDay = activeDaysCount > 0 ? (totalReviews / activeDaysCount).toFixed(1) : 0;

  // Group by week columns
  const weeks = [];
  for (let i = 0; i < datesList.length; i += 7) {
    weeks.push(datesList.slice(i, i + 7));
  }

  const dayLabels = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  return (
    <div className="rounded-[32px] apple-card p-6 sm:p-8 border border-white/10 shadow-2xl space-y-6">
      
      {/* Header Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center font-bold">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
              Heatmap de Estudos Diários
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
                Anki Style
              </span>
            </h3>
            <p className="text-xs text-slate-400">Atividade diária de revisões de flashcards e questões nos últimos 5 meses</p>
          </div>
        </div>

        {/* Quick KPI Badges */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-300">
            <Flame className="w-4 h-4 fill-amber-400 text-amber-400 animate-pulse" />
            <span>{currentStreak} Dias Seguidos</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-purple-500/10 border border-purple-500/25 text-purple-300">
            <Trophy className="w-4 h-4 text-purple-400" />
            <span>Recorde: {maxStreak} dias</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/5 border border-white/10 text-slate-300">
            <Activity className="w-4 h-4 text-indigo-400" />
            <span>{totalReviews} Revisões Totais</span>
          </div>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto pb-2 scrollbar-none">
        <div className="flex items-start gap-1.5 min-w-max">
          
          {/* Day Label column */}
          <div className="grid grid-rows-7 gap-1.5 pr-2 pt-0.5 text-[10px] font-mono font-bold text-slate-500">
            {dayLabels.map((lbl, idx) => (
              <span key={idx} className="h-4 flex items-center">{lbl}</span>
            ))}
          </div>

          {/* Weeks Columns */}
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="grid grid-rows-7 gap-1.5">
              {week.map((day, dIdx) => {
                let colorClass = "bg-slate-900/60 border border-white/5";

                if (day.totalCount >= 10) {
                  colorClass = "bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 border border-white/30 shadow-md shadow-purple-500/30";
                } else if (day.totalCount >= 5) {
                  colorClass = "bg-purple-700/80 border border-purple-400/50 shadow-sm shadow-purple-500/20";
                } else if (day.totalCount >= 1) {
                  colorClass = "bg-purple-900/60 border border-purple-500/40 text-purple-300";
                }

                return (
                  <div
                    key={dIdx}
                    title={`${day.dateStr}: ${day.totalCount} revisões (${day.flashcards} flashcards, ${day.questions} questões)`}
                    className={`w-4 h-4 rounded-md transition-all duration-200 hover:scale-125 cursor-pointer ${colorClass}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/5">
        <div className="flex items-center gap-2">
          <span>Menos atividade</span>
          <div className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-slate-900/60 border border-white/5" />
            <span className="w-3 h-3 rounded bg-purple-900/60 border border-purple-500/40" />
            <span className="w-3 h-3 rounded bg-purple-700/80 border border-purple-400/50" />
            <span className="w-3 h-3 rounded bg-gradient-to-tr from-purple-600 to-pink-500 border border-white/30" />
          </div>
          <span>Mais atividade</span>
        </div>

        <div>
          Média por dia ativo: <strong className="text-white">{avgPerActiveDay} revisões/dia</strong>
        </div>
      </div>

    </div>
  );
};

export default ActivityHeatmap;
