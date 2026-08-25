import React from 'react';
import { 
  BarChart3, 
  BookOpen, 
  AlertCircle, 
  Clock, 
  Stethoscope, 
  Database,
  BookmarkCheck,
  Zap,
  Sparkles,
  Brain,
  PieChart
} from 'lucide-react';
import { useUserProgress } from '../context/UserProgressContext';
import { useQuestionDb } from '../context/QuestionDbContext';
import { getOverviewKPIs } from '../utils/analyticsHelpers';

const Navbar = ({ activeTab, setActiveTab, onOpenDataModal, onOpenQuickTest }) => {
  const { progress } = useUserProgress();
  const { questions } = useQuestionDb();
  const kpis = getOverviewKPIs(questions, progress);

  const tabs = [
    { id: 'dashboard', label: 'Analytics', icon: BarChart3 },
    { id: 'matrix', label: 'Matriz Completa', icon: PieChart },
    { id: 'questions', label: 'Banco de Questões', icon: BookOpen, badge: questions.length },
    { id: 'errors', label: 'Caderno de Erros', icon: AlertCircle, badge: kpis.totalIncorrect, badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
    { id: 'flashcards', label: 'Flashcards Anki', icon: Brain, badge: 'SM-2', badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
    { id: 'simulations', label: 'Simulados', icon: Clock },
  ];

  return (
    <header className="sticky top-0 z-50 w-full apple-glass border-b border-white/10 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          
          {/* Apple Style Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 text-white font-bold border border-white/20">
              <Stethoscope className="w-5 h-5 drop-shadow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-white tracking-tight">PNA <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">MedPremium</span></span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider backdrop-blur-md">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium tracking-tight">Apple Clinical Edition • 5.073 Questões</p>
            </div>
          </div>

          {/* Apple macOS Segmented Control Tabs */}
          <nav className="hidden md:flex items-center apple-segmented-bg">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold apple-segmented-item ${
                    isActive ? 'apple-segmented-item-active' : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      tab.badgeColor || (isActive ? 'bg-white/20 text-white border-white/20' : 'bg-slate-800/80 text-slate-300 border-white/5')
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Widgets */}
          <div className="flex items-center gap-3">
            
            {/* Express Quick Test Button */}
            <button
              onClick={onOpenQuickTest}
              className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all hover:scale-105 active:scale-95 border border-amber-300/30"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span className="hidden sm:inline">Teste Rápido</span>
            </button>

            {/* Quick KPI Badge */}
            <div className="hidden lg:flex items-center gap-2 bg-slate-900/80 px-3.5 py-1.5 rounded-2xl border border-white/10 text-xs shadow-inner">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <span>{kpis.accuracyPct}% Acurácia</span>
              </div>
              <span className="text-slate-700">|</span>
              <div className="flex items-center gap-1 text-slate-300 font-medium">
                <span>{kpis.totalAnswered} / {questions.length}</span>
              </div>
            </div>

            {/* Backup & Settings button */}
            <button
              onClick={onOpenDataModal}
              title="Gerenciamento de Dados & Banco Local"
              className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all duration-200 active:scale-95 shadow-sm"
            >
              <Database className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Segmented Navigation Bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-white/5">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1 p-2 text-[10px] font-semibold transition-all ${
                  isActive ? 'text-indigo-400 scale-105' : 'text-slate-400'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
};

export default Navbar;
