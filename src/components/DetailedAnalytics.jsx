import React, { useState } from 'react';
import { 
  BarChart3, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  PieChart as PieIcon, 
  Zap, 
  ArrowRight, 
  BookOpen, 
  ShieldCheck, 
  Sparkles,
  Database
} from 'lucide-react';
import { useQuestionDb } from '../context/QuestionDbContext';
import { useUserProgress } from '../context/UserProgressContext';
import { getFullDistributionStats, getQuickTestDiagnostics } from '../utils/analyticsHelpers';

const DetailedAnalytics = ({ onOpenQuickTest, onSelectFilter }) => {
  const { questions, localEditsCount } = useQuestionDb();
  const { progress } = useUserProgress();
  const userAnswers = progress.answers || {};

  const stats = getFullDistributionStats(questions, userAnswers);
  const diagnostics = getQuickTestDiagnostics(questions, userAnswers);

  const [activeTab, setActiveTab] = useState('areas'); // 'areas' | 'subareas' | 'difficulties' | 'errors'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAreaFilter, setSelectedAreaFilter] = useState('all');

  // Filtered subareas based on search & area filter
  const filteredSubareas = stats.subareas.filter(s => {
    if (selectedAreaFilter !== 'all' && s.area !== selectedAreaFilter) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      return s.name.toLowerCase().includes(term) || s.area.toLowerCase().includes(term);
    }
    return true;
  });

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      
      {/* Header Banner */}
      <div className="rounded-[36px] apple-glass p-6 sm:p-8 border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                Relatório de Cobertura Total
              </span>
              <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Integrado com Banco Local
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Matriz de Distribuição & Diagnóstico de Erros
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              Análise completa de todas as 15+ Áreas, Subespecialidades, Níveis de Dificuldade e Diagnóstico de Lacunas do Teste Rápido.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenQuickTest}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>Iniciar Teste Rápido Express</span>
            </button>
          </div>
        </div>

        {/* Database Sync Status Chip */}
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-400" />
            <span>Banco Ativo: <strong className="text-white">{questions.length} questões</strong> (IndexedDB / LocalStorage)</span>
          </div>

          {localEditsCount > 0 && (
            <span className="px-3 py-1 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold text-[11px]">
              ✏️ {localEditsCount} edições locais sincronizadas
            </span>
          )}
        </div>
      </div>

      {/* Segmented Tab Navigation */}
      <div className="flex items-center gap-2 apple-segmented-bg p-1.5 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('areas')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'areas' ? 'apple-segmented-item-active' : 'text-slate-400 hover:text-white'
          }`}
        >
          <PieIcon className="w-4 h-4" />
          <span>Distribuição por Áreas ({stats.areas.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('subareas')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'subareas' ? 'apple-segmented-item-active' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Todas as Subárea ({stats.subareas.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('difficulties')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'difficulties' ? 'apple-segmented-item-active' : 'text-slate-400 hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Níveis de Dificuldade ({stats.difficulties.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('errors')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
            activeTab === 'errors' ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30' : 'text-rose-400 hover:bg-rose-500/10'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Pontos Fracos do Teste Rápido ({diagnostics.totalErrors})</span>
        </button>
      </div>

      {/* TAB 1: AREAS BREAKDOWN */}
      {activeTab === 'areas' && (
        <div className="space-y-4">
          <h3 className="text-base font-extrabold text-white flex items-center justify-between">
            <span>Distribuição de Questões por Área Médica</span>
            <span className="text-xs text-slate-400 font-normal">Total: {questions.length} questões</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.areas.map(area => (
              <div 
                key={area.name}
                className="p-5 rounded-3xl apple-card border border-white/10 space-y-3 hover:border-indigo-500/40 transition-all cursor-pointer"
                onClick={() => onSelectFilter({ area: area.name })}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-white text-sm">{area.name}</span>
                  <span className="px-3 py-1 rounded-xl bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-xs font-black">
                    {area.total} questões ({area.sharePct}%)
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-white/5">
                  <div 
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, area.sharePct * 3)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>Respondidas: <strong className="text-white">{area.answered}</strong> / {area.total}</span>
                  <span className="text-emerald-400 font-bold">Acurácia: {area.accuracyPct}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: SUBAREAS BREAKDOWN */}
      {activeTab === 'subareas' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar subárea ou tópico (Ex: Diabetes, Eletrocardiograma, Nefrologia)..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-900/90 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>

            {/* Area Filter */}
            <select
              value={selectedAreaFilter}
              onChange={(e) => setSelectedAreaFilter(e.target.value)}
              className="px-4 py-2.5 rounded-2xl bg-slate-900/90 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Todas as Áreas ({stats.areas.length})</option>
              {stats.areas.map(a => (
                <option key={a.name} value={a.name}>{a.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredSubareas.map(sub => (
              <div 
                key={sub.fullKey}
                className="p-4 rounded-2xl apple-card border border-white/5 space-y-2 hover:border-indigo-500/30 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-white text-xs">{sub.name}</h4>
                    <span className="text-[10px] text-slate-400 font-medium">{sub.area}</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-lg bg-white/5 text-slate-300 font-mono text-[10px] font-bold border border-white/10">
                    {sub.total} q ({sub.sharePct}%)
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400 border-t border-white/5">
                  <span>Respostas: <strong className="text-white">{sub.answered}</strong></span>
                  <span className="text-emerald-400 font-bold">{sub.accuracyPct}% Acurácia</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: DIFFICULTY BREAKDOWN */}
      {activeTab === 'difficulties' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {stats.difficulties.map(diff => {
            const isEasy = diff.name.toLowerCase().includes('fácil');
            const isHard = diff.name.toLowerCase().includes('difícil');
            const style = isEasy 
              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' 
              : isHard 
              ? 'bg-rose-950/30 border-rose-500/40 text-rose-300' 
              : 'bg-amber-950/30 border-amber-500/40 text-amber-300';

            return (
              <div key={diff.name} className={`p-6 rounded-3xl apple-card border space-y-4 ${style}`}>
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-white text-base uppercase tracking-wider">{diff.name}</span>
                  <span className="px-3 py-1 rounded-xl bg-white/10 font-black text-xs">
                    {diff.sharePct}% do Banco
                  </span>
                </div>

                <div className="space-y-1">
                  <p className="text-3xl font-black text-white">{diff.total}</p>
                  <p className="text-xs text-slate-400">Questões nesta dificuldade</p>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                  <span>Respondidas: <strong className="text-white">{diff.answered}</strong></span>
                  <span className="font-extrabold">Acurácia: {diff.accuracyPct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 4: QUICK TEST DIAGNOSTICS & WEAK POINTS */}
      {activeTab === 'errors' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl apple-glass border border-rose-500/30 bg-rose-950/20 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">Diagnóstico de Pontos Fracos do Teste Rápido</h3>
                <p className="text-xs text-rose-300">Identificação automática dos temas clínicos em que você cometeu erros</p>
              </div>
            </div>
          </div>

          {diagnostics.weakPoints.length === 0 ? (
            <div className="p-12 text-center rounded-3xl apple-card border border-white/10 space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <h4 className="text-base font-bold text-white">Nenhum Erro Registrado Ainda!</h4>
              <p className="text-xs text-slate-400">Inicie um Teste Rápido para que a IA analise seus padrões de erro e recomende pontos fracos a reforçar.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {diagnostics.weakPoints.map((item, idx) => (
                <div key={item.key} className="p-5 rounded-3xl apple-card border border-white/10 space-y-4 hover:border-rose-500/40 transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{item.area}</span>
                      <h4 className="font-extrabold text-white text-sm">{item.theme}</h4>
                    </div>
                    <span className="px-3 py-1 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-black shrink-0">
                      {item.errorCount} {item.errorCount === 1 ? 'Erro' : 'Erros'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-2xl border border-white/5">
                    📌 <strong>Recomendação Médica:</strong> Revisar a fisiopatologia, critérios diagnósticos e condutas terapêuticas de <em>{item.theme}</em>.
                  </p>

                  <button
                    onClick={onOpenQuickTest}
                    className="w-full py-2.5 rounded-2xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-200 text-xs font-extrabold flex items-center justify-center gap-2 transition-all"
                  >
                    <span>Treinar {item.theme} no Teste Rápido</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default DetailedAnalytics;
