import React, { useState } from 'react';
import { 
  BarChart3, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Layers, 
  PieChart as PieIcon, 
  Zap, 
  ArrowRight, 
  BookOpen, 
  ShieldCheck, 
  Sparkles,
  Database,
  Clock,
  Flame,
  Target,
  ChevronRight,
  RotateCcw,
  Tag,
  TrendingUp,
  Brain
} from 'lucide-react';
import { useQuestionDb } from '../context/QuestionDbContext';
import { useUserProgress } from '../context/UserProgressContext';
import { 
  getOverviewKPIs, 
  getFullDistributionStats, 
  getWeaknessPointsToReinforce 
} from '../utils/analyticsHelpers';

const DetailedAnalytics = ({ onOpenQuickTest, onSelectFilter }) => {
  const { questions, localEditsCount } = useQuestionDb();
  const { progress } = useUserProgress();
  const userAnswers = progress.answers || {};

  const kpis = getOverviewKPIs(questions, progress);
  const stats = getFullDistributionStats(questions, userAnswers);
  const weakness = getWeaknessPointsToReinforce(questions, userAnswers);

  const [activeTab, setActiveTab] = useState('weaknesses'); // 'weaknesses' | 'error_book' | 'areas' | 'subareas' | 'speed'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAreaFilter, setSelectedAreaFilter] = useState('all');

  // Filtered subareas based on search & area filter
  const filteredSubareas = stats.subareas.filter(s => {
    if (selectedAreaFilter !== 'all' && s.area !== selectedAreaFilter) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const sName = (s.name || s.subarea || '').toLowerCase();
      const sArea = (s.area || '').toLowerCase();
      return sName.includes(term) || sArea.includes(term);
    }
    return true;
  });

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      
      {/* Header Banner */}
      <div className="rounded-[36px] apple-glass p-6 sm:p-8 border border-white/10 shadow-2xl relative overflow-hidden specular-highlight">
        <div className="absolute -right-16 -top-16 w-72 h-72 rounded-full bg-gradient-to-tr from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                Inteligência Analítica & Diagnóstico PNA
              </span>
              <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Banco de {questions.length} Questões
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Análise de Desempenho & Pontos a Reforçar
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal max-w-2xl">
              Diagnóstico de erros, acertos por subárea médica, volume de questões do banco e mapeamento de lacunas para a Prova Nacional de Acesso.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenQuickTest}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-amber-500/25 transition-all hover:scale-105 active:scale-95"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>Treinar na Fila Express</span>
            </button>
          </div>
        </div>

        {/* Global KPIs Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Taxa de Acertos</span>
              <Target className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white">
              {kpis.accuracyPct}%
            </div>
            <div className="text-[11px] text-slate-400">
              <strong className="text-emerald-400">{kpis.totalCorrect}</strong> corretas de {kpis.totalAnswered} feitas
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Caderno de Erros</span>
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-black text-rose-400">
              {kpis.totalIncorrect}
            </div>
            <div className="text-[11px] text-slate-400">
              {kpis.totalIncorrect === 0 ? 'Nenhum erro registrado' : 'Necessitam de revisão ativa'}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Tempo Médio / Questão</span>
              <Clock className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-black text-white">
              {kpis.avgTimePerQuestionSec}s
            </div>
            <div className="text-[11px] text-slate-400">
              {kpis.avgTimePerQuestionSec <= 90 ? '✓ Dentro da meta PNA (90s)' : '⚠️ Acima da meta PNA'}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5 space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Escore PNA Estimado</span>
              <TrendingUp className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black bg-gradient-to-r from-purple-400 to-indigo-300 bg-clip-text text-transparent">
              {kpis.estimatedPnaScore} / 100
            </div>
            <div className="text-[11px] text-slate-400">
              Baseado na acurácia do banco
            </div>
          </div>
        </div>
      </div>

      {/* Segmented Navigation Tabs */}
      <div className="flex items-center gap-2 apple-segmented-bg p-1.5 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('weaknesses')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'weaknesses' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>Pontos a Reforçar ({weakness.criticalWeakSubareas.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('error_book')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'error_book' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <XCircle className="w-4 h-4 text-rose-400" />
          <span>Caderno de Erros ({weakness.totalWrongCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('areas')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'areas' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4 text-indigo-400" />
          <span>15 Grandes Áreas</span>
        </button>

        <button
          onClick={() => setActiveTab('subareas')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'subareas' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Tag className="w-4 h-4 text-purple-400" />
          <span>Arsenal 300 Subáreas ({stats.subareas.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('speed')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'speed' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4 text-cyan-400" />
          <span>Tempo & Eficiência</span>
        </button>
      </div>

      {/* TAB 1: PONTOS A REFORÇAR (CRITICAL WEAKNESS RADAR) */}
      {activeTab === 'weaknesses' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Brain className="w-5 h-5 text-amber-400" />
                <span>Radar Diagnóstico: Subáreas com Maior Risco</span>
              </h3>
              <p className="text-xs text-slate-400">
                Subespecialidades com maior incidência de erros e baixa taxa de acerto detectadas nas suas resoluções.
              </p>
            </div>
          </div>

          {weakness.criticalWeakSubareas.length === 0 ? (
            <div className="p-12 rounded-3xl apple-card border border-white/10 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <h4 className="text-base font-extrabold text-white">Nenhum Ponto Crítico Detectado!</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Você ainda não possui erros acumulados em subáreas específicas. Continue resolvendo questões para calibrar o diagnóstico inteligente.
              </p>
              <button
                onClick={onOpenQuickTest}
                className="mt-4 px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all"
              >
                Praticar Questões Agora
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {weakness.criticalWeakSubareas.map(sub => {
                const subName = sub.subarea || sub.name;
                return (
                  <div 
                    key={sub.key || subName}
                    className="p-5 rounded-3xl apple-card border border-rose-500/20 bg-gradient-to-br from-rose-950/20 via-slate-900/80 to-slate-900/90 shadow-xl space-y-4 hover:border-rose-500/40 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
                          {sub.area}
                        </span>
                        <h4 className="text-sm font-bold text-white leading-snug">
                          {subName}
                        </h4>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-lg font-black text-rose-400">
                          {sub.accuracyPct}%
                        </div>
                        <div className="text-[10px] text-slate-400">acertos</div>
                      </div>
                    </div>

                    {/* Stats Mini Bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Erros registrados: <strong className="text-rose-400">{sub.incorrect}</strong> de {sub.answered} feitas</span>
                        <span>Total no banco: <strong>{sub.total}</strong></span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden flex">
                        <div 
                          className="bg-emerald-500 h-full transition-all duration-500" 
                          style={{ width: `${sub.accuracyPct}%` }}
                        />
                        <div 
                          className="bg-rose-500 h-full transition-all duration-500" 
                          style={{ width: `${100 - sub.accuracyPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{sub.avgTimeSec}s / questão</span>
                      </span>

                      {onSelectFilter && (
                        <button
                          onClick={() => onSelectFilter({ area: sub.area, subarea: subName, status: 'all' })}
                          className="px-3.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-extrabold flex items-center gap-1 transition-all active:scale-95"
                        >
                          <span>Treinar Esta Subárea</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CADERNO INTELIGENTE DE ERROS */}
      {activeTab === 'error_book' && (
        <div className="space-y-6 animate-fadeIn">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <XCircle className="w-5 h-5 text-rose-400" />
              <span>Caderno de Revisão de Erros</span>
            </h3>
            <p className="text-xs text-slate-400">
              Reveja detalhadamente cada questão em que você assinalou uma alternativa incorreta, com comparação entre sua resposta e o gabarito oficial.
            </p>
          </div>

          {weakness.wrongQuestionsList.length === 0 ? (
            <div className="p-12 rounded-3xl apple-card border border-white/10 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <h4 className="text-base font-extrabold text-white">Caderno de Erros Vazio!</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Parabéns! Todas as questões respondidas até o momento foram acertadas.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {weakness.wrongQuestionsList.map((q, idx) => (
                <div 
                  key={q.id}
                  className="p-6 rounded-3xl apple-card border border-rose-500/20 bg-slate-950/60 space-y-5 shadow-2xl"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-black">
                        #{idx + 1} • {q.id}
                      </span>
                      <span className="px-3 py-1 rounded-xl bg-white/5 text-slate-300 text-xs font-bold">
                        {q.area}
                      </span>
                      <span className="px-3 py-1 rounded-xl bg-white/5 text-slate-400 text-xs font-medium">
                        {q.subarea}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-rose-400 font-bold bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20">
                        Sua Resposta: {q.userSelectedOption || 'N/A'}
                      </span>
                      <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                        Gabarito: {q.resposta_correta}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-100 leading-relaxed font-normal">
                    {q.enunciado}
                  </p>

                  {/* Alternatives List */}
                  <div className="space-y-2 pt-1">
                    {Object.entries(q.alternativas || {}).map(([key, opt]) => {
                      const optText = typeof opt === 'string' ? opt : (opt?.texto || String(opt || ''));
                      const isCorrect = key === q.resposta_correta;
                      const isUserChoice = key === q.userSelectedOption;

                      let style = "bg-slate-900/60 border-white/5 text-slate-400 opacity-60";
                      if (isCorrect) {
                        style = "bg-emerald-950/40 border-emerald-500/60 text-emerald-100 opacity-100 glow-emerald";
                      } else if (isUserChoice) {
                        style = "bg-rose-950/40 border-rose-500/60 text-rose-100 opacity-100 glow-rose";
                      }

                      return (
                        <div 
                          key={key}
                          className={`p-3 rounded-2xl border text-xs sm:text-sm flex items-start gap-3 transition-all ${style}`}
                        >
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                            isCorrect ? 'bg-emerald-500 text-white' : isUserChoice ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {key}
                          </div>
                          <div className="flex-1 font-medium pt-0.5">
                            {optText}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/10 space-y-2">
                    <h5 className="text-[11px] font-black uppercase text-indigo-400 tracking-wider">
                      Resolução Comentada Oficial
                    </h5>
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                      {q.explicacao}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: 15 GRANDES ÁREAS */}
      {activeTab === 'areas' && (
        <div className="space-y-6 animate-fadeIn">
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <span>Desempenho por Especialidade Médica (15 Áreas)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.areas.map(a => (
              <div 
                key={a.name}
                className="p-5 rounded-3xl apple-card border border-white/10 space-y-4 shadow-xl hover:border-indigo-500/40 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-extrabold text-white">
                      {a.name}
                    </h4>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {a.total} questões no banco ({a.sharePct}%)
                    </span>
                  </div>

                  <span className={`px-2.5 py-1 rounded-xl text-xs font-black ${
                    a.accuracyPct >= 80 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                    a.accuracyPct >= 60 ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                    a.answered > 0 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {a.answered > 0 ? `${a.accuracyPct}%` : 'Não feita'}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>{a.answered} respondidas</span>
                    <span>{a.correct} acertos • {a.incorrect} erros</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div 
                      className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${(a.answered / a.total) * 100}%` }}
                    />
                  </div>
                </div>

                {onSelectFilter && (
                  <button
                    onClick={() => onSelectFilter({ area: a.name, subarea: 'all', status: 'all' })}
                    className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 hover:text-white transition-all flex items-center justify-center gap-1"
                  >
                    <span>Filtrar Questões de {a.name}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: MATRIZ DE 300 SUBÁREAS */}
      {activeTab === 'subareas' && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* Filter & Search Bar */}
          <div className="p-4 rounded-3xl apple-card border border-white/10 flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar subárea, patologia ou especialidade..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-white/10 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <select
              value={selectedAreaFilter}
              onChange={(e) => setSelectedAreaFilter(e.target.value)}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-900/90 border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">Todas as Especialidades</option>
              {stats.areas.map(a => (
                <option key={a.name} value={a.name}>{a.name}</option>
              ))}
            </select>
          </div>

          <div className="text-xs text-slate-400">
            Exibindo <strong>{filteredSubareas.length}</strong> subáreas clínicas
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredSubareas.map(sub => {
              const subName = sub.subarea || sub.name;
              return (
                <div 
                  key={sub.key || subName}
                  className="p-4 rounded-2xl apple-card border border-white/10 space-y-2 hover:border-indigo-500/40 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase">
                        {sub.area}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono font-bold">
                        {sub.total} q.
                      </span>
                    </div>
                    <h5 className="text-xs font-bold text-white leading-snug">
                      {subName}
                    </h5>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px]">
                    <span className={sub.proficiencyColor}>
                      {sub.answered > 0 ? `${sub.accuracyPct}% acertos (${sub.correct}/${sub.answered})` : 'Pendente'}
                    </span>

                    {onSelectFilter && (
                      <button
                        onClick={() => onSelectFilter({ area: sub.area, subarea: subName, status: 'all' })}
                        className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5"
                      >
                        <span>Ver</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: TEMPO & EFICIÊNCIA */}
      {activeTab === 'speed' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="p-6 rounded-3xl apple-card border border-white/10 space-y-4">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-400" />
              <span>Gestão do Tempo & Velocidade Diagnóstica</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Na Prova Nacional de Acesso (PNA), o tempo disponível médio por questão é de aproximadamente <strong>90 segundos (1,5 minutos)</strong>. Manter um ritmo controlado é essencial para garantir a revisão dos casos clínicos mais complexos.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10">
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5">
                <span className="text-xs text-slate-400 block">Tempo Médio Registrado</span>
                <span className="text-2xl font-black text-white">{kpis.avgTimePerQuestionSec} segundos</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5">
                <span className="text-xs text-slate-400 block">Meta Oficial PNA</span>
                <span className="text-2xl font-black text-emerald-400">90 segundos</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/5">
                <span className="text-xs text-slate-400 block">Status de Agilidade</span>
                <span className="text-2xl font-black text-purple-400">
                  {kpis.avgTimePerQuestionSec <= 90 ? '⚡ Ritmo Ideal' : '⚠️ Ritmo Lento'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DetailedAnalytics;
