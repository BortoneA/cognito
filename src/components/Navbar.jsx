import React from 'react';
import {
  BarChart3,
  BookOpen,
  AlertCircle,
  Clock,
  Stethoscope,
  Database,
  Zap,
  Brain,
  PieChart,
  Trophy,
  Sparkles,
} from 'lucide-react';
import { useUserProgress } from '../context/UserProgressContext';
import { useQuestionDb } from '../context/QuestionDbContext';
import { getOverviewKPIs } from '../utils/analyticsHelpers';
import ThemeSwitcher from './ThemeSwitcher';

const Navbar = ({ activeTab, setActiveTab, onOpenDataModal, onOpenQuickTest }) => {
  const { progress } = useUserProgress();
  const { questions } = useQuestionDb();
  const kpis = getOverviewKPIs(questions, progress);

  const tabs = [
    { id: 'dashboard',   label: 'Analytics',         icon: BarChart3 },
    { id: 'matrix',      label: 'Matriz',             icon: PieChart },
    { id: 'questions',   label: 'Questões',           icon: BookOpen,    badge: questions.length },
    { id: 'errors',      label: 'Erros',              icon: AlertCircle, badge: kpis.totalIncorrect, badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
    { id: 'flashcards',  label: 'Flashcards',         icon: Brain,       badge: 'SM-2', badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
    { id: 'adaptive',    label: 'Inteligente',        icon: Sparkles },
    { id: 'achievements',label: 'Conquistas',         icon: Trophy },
    { id: 'simulations', label: 'Simulados',          icon: Clock },
  ];

  // Mobile tabs (show top 5 most important)
  const mobileTabs = [
    { id: 'dashboard',    label: 'Analytics',  icon: BarChart3 },
    { id: 'questions',    label: 'Questões',   icon: BookOpen },
    { id: 'flashcards',   label: 'Anki',       icon: Brain },
    { id: 'adaptive',     label: 'IA',         icon: Sparkles },
    { id: 'achievements', label: 'Troféus',    icon: Trophy },
  ];

  return (
    <>
      {/* ── DESKTOP HEADER (md+) ── */}
      <header className="sticky top-0 z-40 w-full apple-glass border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Brand */}
            <div className="flex items-center gap-3 cursor-pointer shrink-0" onClick={() => setActiveTab('dashboard')}>
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 text-white border border-white/20">
                <Stethoscope className="w-4.5 h-4.5 drop-shadow" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-black text-white leading-none">PNA MedPremium</p>
                <p className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">Residência Médica</p>
              </div>
            </div>

            {/* Desktop Tab Navigation */}
            <nav className="hidden md:flex items-center gap-1 apple-segmented-bg p-1 overflow-x-auto scrollbar-none">
              {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold apple-segmented-item whitespace-nowrap touch-target ${
                      isActive ? 'apple-segmented-item-active' : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                    {tab.badge !== undefined && (
                      <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${
                        tab.badgeColor || (isActive ? 'bg-white/20 text-white border-white/20' : 'bg-slate-800/80 text-slate-300 border-white/5')
                      }`}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
              {/* Accuracy chip */}
              <div className="hidden lg:flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-2xl border border-white/10 text-xs">
                <span className="text-emerald-400 font-bold">{kpis.accuracyPct}%</span>
                <span className="text-slate-700">|</span>
                <span className="text-slate-300">{kpis.totalAnswered}/{questions.length}</span>
              </div>

              {/* Quick test button */}
              <button
                onClick={onOpenQuickTest}
                className="px-3 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all hover:scale-105 active:scale-95 touch-target"
              >
                <Zap className="w-3.5 h-3.5 fill-white" />
                <span className="hidden sm:inline">Teste Rápido</span>
              </button>

              {/* Theme & Reading Customizer */}
              <ThemeSwitcher />

              {/* DB button */}
              <button
                onClick={onOpenDataModal}
                title="Banco de Dados Local"
                className="p-2 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all active:scale-95 touch-target"
              >
                <Database className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── MOBILE BOTTOM TAB BAR (< md) ── */}
      <div className="bottom-nav md:hidden">
        <div className="flex items-center justify-around px-2 pt-2 pb-1">
          {mobileTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all min-w-[52px] touch-target ${
                  isActive
                    ? 'text-indigo-400'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <div className={`relative p-1.5 rounded-xl transition-all ${isActive ? 'bg-indigo-500/20' : ''}`}>
                  <Icon className="w-5 h-5" />
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-400" />
                  )}
                </div>
                <span className={`text-[9px] font-bold leading-none ${isActive ? 'text-indigo-400' : 'text-slate-500'}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── MOBILE FAB — Teste Rápido ── */}
      <button
        onClick={onOpenQuickTest}
        className="fab md:hidden no-select"
        aria-label="Teste Rápido"
      >
        <Zap className="w-6 h-6 text-white fill-white drop-shadow" />
      </button>
    </>
  );
};

export default Navbar;
