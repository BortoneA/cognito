import React, { useState } from 'react';
import { Trophy, Lock, Star, Zap, Award, ChevronDown } from 'lucide-react';
import { useUserProgress } from '../context/UserProgressContext';
import { getAllAchievementsWithStatus } from '../services/achievementService';

const CATEGORY_LABELS = {
  'início': { label: 'Primeiros Passos', color: 'amber' },
  'volume': { label: 'Volume de Estudo', color: 'blue' },
  'acurácia': { label: 'Acurácia Clínica', color: 'emerald' },
  'consistência': { label: 'Consistência', color: 'purple' },
  'flashcards': { label: 'Flashcards Anki', color: 'indigo' },
  'simulados': { label: 'Simulados', color: 'rose' },
  'estudo': { label: 'Ferramentas de Estudo', color: 'sky' },
};

const AchievementsPanel = () => {
  const { progress } = useUserProgress();
  const [expandedCategory, setExpandedCategory] = useState(null);

  const all = getAllAchievementsWithStatus(progress, progress.unlockedBadges || {});
  const totalUnlocked = all.filter(a => a.unlocked).length;
  const totalAll = all.length;
  const completionPct = Math.round((totalUnlocked / totalAll) * 100);

  // Group by category
  const grouped = {};
  all.forEach(a => {
    if (!grouped[a.category]) grouped[a.category] = [];
    grouped[a.category].push(a);
  });

  const colorMap = {
    amber: { bg: 'bg-amber-500/20', border: 'border-amber-500/40', text: 'text-amber-300', glow: 'shadow-amber-500/20' },
    blue: { bg: 'bg-blue-500/20', border: 'border-blue-500/40', text: 'text-blue-300', glow: 'shadow-blue-500/20' },
    emerald: { bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', text: 'text-emerald-300', glow: 'shadow-emerald-500/20' },
    purple: { bg: 'bg-purple-500/20', border: 'border-purple-500/40', text: 'text-purple-300', glow: 'shadow-purple-500/20' },
    indigo: { bg: 'bg-indigo-500/20', border: 'border-indigo-500/40', text: 'text-indigo-300', glow: 'shadow-indigo-500/20' },
    rose: { bg: 'bg-rose-500/20', border: 'border-rose-500/40', text: 'text-rose-300', glow: 'shadow-rose-500/20' },
    sky: { bg: 'bg-sky-500/20', border: 'border-sky-500/40', text: 'text-sky-300', glow: 'shadow-sky-500/20' },
  };

  return (
    <div className="space-y-8 pb-12 animate-fadeIn">
      {/* Header */}
      <div className="relative overflow-hidden rounded-[36px] apple-glass p-6 sm:p-8 border border-white/10 shadow-2xl">
        <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
        <div className="absolute right-20 -bottom-16 w-48 h-48 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5" />
                Sistema de Conquistas
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Suas Conquistas Médicas
            </h1>
            <p className="text-sm text-slate-300">
              {totalUnlocked} de {totalAll} conquistas desbloqueadas
            </p>
          </div>

          {/* Progress Ring */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                <circle
                  cx="48" cy="48" r="40" fill="none"
                  stroke="url(#achieveGrad)" strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - completionPct / 100)}`}
                  style={{ transition: 'stroke-dashoffset 1s ease' }}
                />
                <defs>
                  <linearGradient id="achieveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f59e0b" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-black text-white">{completionPct}%</span>
              </div>
            </div>
            <span className="text-xs text-slate-400">Completado</span>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-4">
        {Object.entries(grouped).map(([cat, achievements]) => {
          const catInfo = CATEGORY_LABELS[cat] || { label: cat, color: 'indigo' };
          const colors = colorMap[catInfo.color] || colorMap.indigo;
          const unlockedInCat = achievements.filter(a => a.unlocked).length;
          const isOpen = expandedCategory === cat;

          return (
            <div key={cat} className="rounded-3xl apple-card border border-white/10 overflow-hidden">
              <button
                onClick={() => setExpandedCategory(isOpen ? null : cat)}
                className="w-full p-5 flex items-center justify-between hover:bg-white/5 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-xl text-xs font-extrabold ${colors.bg} ${colors.text} border ${colors.border}`}>
                    {catInfo.label}
                  </span>
                  <span className="text-xs text-slate-400">
                    {unlockedInCat}/{achievements.length} desbloqueadas
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {isOpen && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 pt-0">
                  {achievements.map(ach => (
                    <div
                      key={ach.id}
                      className={`p-4 rounded-2xl border transition-all flex items-start gap-3 relative ${
                        ach.unlocked
                          ? `${colors.bg} ${colors.border} shadow-xl ${colors.glow} hologram-shimmer specular-highlight`
                          : 'bg-slate-900/40 border-white/5 opacity-40'
                      }`}
                    >
                      <div className="text-2xl shrink-0 mt-0.5">
                        {ach.unlocked ? ach.icon : <Lock className="w-5 h-5 text-slate-600" />}
                      </div>
                      <div className="min-w-0">
                        <h4 className={`font-extrabold text-sm truncate ${ach.unlocked ? 'text-white' : 'text-slate-500'}`}>
                          {ach.title}
                        </h4>
                        <p className={`text-[11px] mt-0.5 leading-relaxed ${ach.unlocked ? 'text-slate-300' : 'text-slate-600'}`}>
                          {ach.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AchievementsPanel;
