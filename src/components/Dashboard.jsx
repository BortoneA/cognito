import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  AreaChart, 
  Area 
} from 'recharts';
import { 
  Target, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  AlertTriangle, 
  Award, 
  ArrowRight, 
  Activity, 
  Flame 
} from 'lucide-react';
import StatCard from './StatCard';
import ActivityRings from './ActivityRings';
import ActivityHeatmap from './ActivityHeatmap';
import ProgressTimeline from './ProgressTimeline';
import CompetencyRadar from './CompetencyRadar';
import { useUserProgress } from '../context/UserProgressContext';
import { useQuestionDb } from '../context/QuestionDbContext';
import { 
  getOverviewKPIs, 
  getAreaAnalytics, 
  getSubareaAnalytics, 
  getYearlyAnalytics, 
  getWeaknessDiagnostics 
} from '../utils/analyticsHelpers';

const Dashboard = ({ onSelectFilter }) => {
  const { progress } = useUserProgress();
  const { questions } = useQuestionDb();
  const userAnswers = progress.answers || {};

  const [activeChartTab, setActiveChartTab] = useState('areas');

  const kpis = getOverviewKPIs(questions, progress);
  const areaData = getAreaAnalytics(questions, userAnswers);
  const subareaData = getSubareaAnalytics(questions, userAnswers, 15);
  const yearlyData = getYearlyAnalytics(questions, userAnswers);
  const weaknesses = getWeaknessDiagnostics(questions, userAnswers);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="apple-glass p-3.5 rounded-2xl shadow-2xl text-xs space-y-1.5 border border-white/10 min-w-[160px]">
          <p className="font-bold text-white mb-1.5 border-b border-white/10 pb-1 flex items-center justify-between">
            <span>{label || payload[0].name}</span>
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
          </p>
          {payload.map((entry, index) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-3">
              <span style={{ color: entry.color }} className="font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: entry.color }}></span>
                {entry.name}:
              </span>
              <span className="font-extrabold text-white">{entry.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 pb-12">
      
      {/* Apple Health/Fitness Style Header Banner */}
      <div className="relative overflow-hidden rounded-[36px] apple-glass p-6 sm:p-8 border border-white/10 shadow-2xl specular-highlight">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute right-40 -bottom-20 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5 backdrop-blur-md">
                <Award className="w-3.5 h-3.5 text-indigo-400" />
                Residência Médica • PNA Portugal
              </span>
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 backdrop-blur-md">
                <Flame className="w-3.5 h-3.5 text-emerald-400" />
                Desempenho Clínico
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Análise de Precisão & Métricas
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed font-normal">
              Acompanhe seu rendimento em tempo real com estatísticas divididas em 15 áreas clínicas e subespecialidades do exame PNA.
            </p>
          </div>

          {/* Time and study stats */}
          <div className="flex items-center gap-4 bg-slate-900/60 p-4 rounded-3xl border border-white/10 backdrop-blur-md shadow-inner">
            <div className="text-center px-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
                Tempo Médio
              </span>
              <span className="text-2xl font-black text-indigo-400">
                {kpis.avgTimePerQuestionSec > 0 ? `${kpis.avgTimePerQuestionSec}s` : '--'}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">por questão</span>
            </div>

            <div className="h-10 w-px bg-white/10"></div>

            <div className="text-center px-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1">
                Salvas
              </span>
              <span className="text-2xl font-black text-amber-400">
                {kpis.totalSaved}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">questões</span>
            </div>
          </div>
        </div>
      </div>

      {/* Apple Watch 3-Ring Concentric Activity Widget */}
      <ActivityRings size={170} />

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={Target}
          title="Acurácia Global"
          value={`${kpis.accuracyPct}%`}
          subtitle={`${kpis.totalCorrect} de ${kpis.totalAnswered} resolvidas`}
          color="indigo"
        />
        <StatCard 
          icon={CheckCircle2}
          title="Acertos Clínicos"
          value={kpis.totalCorrect}
          subtitle="Aproveitamento direto"
          color="emerald"
        />
        <StatCard 
          icon={XCircle}
          title="Questões Erradas"
          value={kpis.totalIncorrect}
          subtitle="Caderno de Erros"
          color="rose"
        />
        <StatCard 
          icon={HelpCircle}
          title="Não Respondidas"
          value={kpis.totalUnanswered}
          subtitle="Restantes do banco"
          color="amber"
        />
      </div>

      {/* Heatmap Activity Grid */}
      <ActivityHeatmap numWeeks={18} />

      {/* Evolution Charts — Timeline + Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProgressTimeline />
        <CompetencyRadar />
      </div>

      {/* Weakness Diagnostic Cards */}
      {weaknesses.length > 0 && (
        <div className="rounded-[32px] apple-card p-6 border border-rose-500/25 bg-rose-950/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-inner">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Pontos Cegos & Foco Prioritário</h3>
                <p className="text-xs text-slate-400">Subáreas onde o índice de erros é mais elevado</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {weaknesses.map((w, idx) => (
              <div 
                key={idx} 
                className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/20 space-y-2 hover:border-rose-500/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-bold text-slate-200 line-clamp-1">{w.subarea}</span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 shrink-0">
                    {w.accuracyPct}% acurácia
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{w.incorrect} erros em {w.answered} q.</span>
                  <span className="text-rose-400 font-semibold">{w.area}</span>
                </div>
                <button
                  onClick={() => onSelectFilter({ area: w.area, subarea: w.subarea, status: 'incorrect' })}
                  className="w-full mt-1 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all"
                >
                  <span>Refazer Erros</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Apple Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Chart (2 Cols) */}
        <div className="lg:col-span-2 rounded-[32px] apple-card p-6 sm:p-8 space-y-6 border border-white/10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <h3 className="text-lg font-extrabold text-white">Análise Gráfica Avançada</h3>
              <p className="text-xs text-slate-400">Exibição da quantidade e performance por área e ano</p>
            </div>
            
            {/* Apple Segmented Chart Selector */}
            <div className="flex items-center apple-segmented-bg text-xs">
              <button
                onClick={() => setActiveChartTab('areas')}
                className={`px-3 py-1.5 apple-segmented-item font-bold ${
                  activeChartTab === 'areas' ? 'apple-segmented-item-active' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                15 Áreas
              </button>
              <button
                onClick={() => setActiveChartTab('performance')}
                className={`px-3 py-1.5 apple-segmented-item font-bold ${
                  activeChartTab === 'performance' ? 'apple-segmented-item-active' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Acertos vs Erros
              </button>
              <button
                onClick={() => setActiveChartTab('years')}
                className={`px-3 py-1.5 apple-segmented-item font-bold ${
                  activeChartTab === 'years' ? 'apple-segmented-item-active' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Por Ano
              </button>
            </div>
          </div>

          <div className="h-80 w-full">
            {activeChartTab === 'areas' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={areaData} margin={{ top: 10, right: 10, left: -10, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis 
                    dataKey="area" 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    angle={-45} 
                    textAnchor="end" 
                    interval={0} 
                  />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="total" name="Total de Questões" fill="#6366f1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}

            {activeChartTab === 'performance' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={areaData} margin={{ top: 10, right: 10, left: -10, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis 
                    dataKey="area" 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    angle={-45} 
                    textAnchor="end" 
                    interval={0} 
                  />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="top" height={36} />
                  <Bar dataKey="correct" name="Acertos" stackId="a" fill="#10b981" />
                  <Bar dataKey="incorrect" name="Erros" stackId="a" fill="#f43f5e" />
                  <Bar dataKey="unanswered" name="Não Respondidas" stackId="a" fill="#334155" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}

            {activeChartTab === 'years' && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={yearlyData} margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCorrect" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="year" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="top" height={36} />
                  <Area type="monotone" dataKey="total" name="Total Prova" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" />
                  <Area type="monotone" dataKey="correct" name="Seus Acertos" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorCorrect)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top Subareas List Widget (1 Col) */}
        <div className="rounded-[32px] apple-card p-6 sm:p-8 border border-white/10 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-extrabold text-white">Volume por Subárea</h3>
            <p className="text-xs text-slate-400 mb-5">Distribuição das subespecialidades mais frequentes</p>

            <div className="space-y-3">
              {subareaData.slice(0, 7).map((sub, idx) => {
                const totalCount = questions.length || 1;
                const percentage = Math.round((sub.total / totalCount) * 100);
                return (
                  <div 
                    key={idx} 
                    onClick={() => onSelectFilter({ area: sub.area, subarea: sub.subarea })}
                    className="p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-indigo-500/40 cursor-pointer transition-all duration-200 hover:scale-[1.01]"
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-white truncate max-w-[150px]">{sub.subarea}</span>
                      <span className="text-indigo-400 font-black">{sub.total} q. ({percentage}%)</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 shadow-sm" 
                        style={{ width: `${subareaData[0] ? (sub.total / subareaData[0].total) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => onSelectFilter({ status: 'all' })}
            className="mt-6 w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-extrabold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <span>Ver Todas as {questions.length} Questões</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
