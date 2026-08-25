import React from 'react';
import { 
  Search, 
  Filter, 
  Calendar, 
  Layers, 
  Tag, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Bookmark,
  Sparkles
} from 'lucide-react';
import { 
  getUniqueYears, 
  getUniqueAreas, 
  getUniqueSubareas, 
  getUniqueDifficulties 
} from '../data/questionsLoader';
import { useQuestionDb } from '../context/QuestionDbContext';

const QuestionFilter = ({ filters, setFilters, totalFilteredCount, totalCount }) => {
  const { questions } = useQuestionDb();
  const years = getUniqueYears(questions);
  const areas = getUniqueAreas(questions);
  const subareas = getUniqueSubareas(questions, filters.area);
  const difficulties = getUniqueDifficulties(questions);

  const handleAreaChange = (e) => {
    const selectedArea = e.target.value;
    setFilters(prev => ({
      ...prev,
      area: selectedArea,
      subarea: 'all'
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      year: 'all',
      area: 'all',
      subarea: 'all',
      difficulty: 'all',
      status: 'all',
      search: ''
    });
  };

  const statusChips = [
    { id: 'all', label: 'Todas', icon: Layers },
    { id: 'unanswered', label: 'Não Respondidas', icon: HelpCircle },
    { id: 'correct', label: 'Acertos', icon: CheckCircle2, color: 'text-emerald-400' },
    { id: 'incorrect', label: 'Erros', icon: XCircle, color: 'text-rose-400' },
    { id: 'saved', label: 'Salvas', icon: Bookmark, color: 'text-amber-400' },
  ];

  return (
    <div className="rounded-[28px] apple-card p-6 border border-white/10 space-y-4 shadow-2xl">
      
      {/* Search Input & Status Pill Segment */}
      <div className="flex flex-col lg:flex-row items-center gap-3">
        
        {/* Apple Style Search Box */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="Buscar termo médico, síndrome, diagnóstico (ex: ELA, botulismo, PNA2018-001)..."
            className="w-full pl-11 pr-8 py-3 bg-slate-900/90 border border-white/10 rounded-2xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-inner"
          />
          {filters.search && (
            <button
              onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Status Pill Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0 apple-segmented-bg">
          {statusChips.map(chip => {
            const Icon = chip.icon;
            const isActive = filters.status === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => setFilters(prev => ({ ...prev, status: chip.id }))}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold whitespace-nowrap apple-segmented-item ${
                  isActive ? 'apple-segmented-item-active' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${chip.color || ''}`} />
                <span>{chip.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dropdown Filters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-white/5">
        
        {/* Year Filter */}
        <div>
          <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-indigo-400" /> Ano da Prova
          </label>
          <select
            value={filters.year}
            onChange={(e) => setFilters(prev => ({ ...prev, year: e.target.value }))}
            className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
          >
            <option value="all">Todos os anos (2018-2024)</option>
            {years.map(y => (
              <option key={y} value={y}>PNA {y}</option>
            ))}
          </select>
        </div>

        {/* Area Filter */}
        <div>
          <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1 flex items-center gap-1">
            <Layers className="w-3 h-3 text-indigo-400" /> Área Médica
          </label>
          <select
            value={filters.area}
            onChange={handleAreaChange}
            className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
          >
            <option value="all">Todas as Áreas ({areas.length})</option>
            {areas.map(a => (
              <option key={a.area} value={a.area}>{a.area} ({a.count})</option>
            ))}
          </select>
        </div>

        {/* Subarea Filter */}
        <div>
          <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1 flex items-center gap-1">
            <Tag className="w-3 h-3 text-indigo-400" /> Subárea
          </label>
          <select
            value={filters.subarea}
            onChange={(e) => setFilters(prev => ({ ...prev, subarea: e.target.value }))}
            className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
          >
            <option value="all">Todas as Subáreas ({subareas.length})</option>
            {subareas.map(s => (
              <option key={s.subarea} value={s.subarea}>{s.subarea} ({s.count})</option>
            ))}
          </select>
        </div>

        {/* Difficulty Filter */}
        <div>
          <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-indigo-400" /> Dificuldade
          </label>
          <select
            value={filters.difficulty}
            onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value }))}
            className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
          >
            <option value="all">Todas as Dificuldades</option>
            {difficulties.map(d => (
              <option key={d.difficulty} value={d.difficulty}>{d.difficulty} ({d.count})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Filter Info Footer */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-white bg-indigo-500/15 text-indigo-300 px-3 py-1 rounded-full border border-indigo-500/30">
            {totalFilteredCount} {totalFilteredCount === 1 ? 'questão' : 'questões'}
          </span>
          {totalFilteredCount < totalCount && (
            <span className="text-slate-400 font-medium">de {totalCount} total</span>
          )}
        </div>

        <button
          onClick={handleResetFilters}
          className="flex items-center gap-1 text-slate-400 hover:text-indigo-400 transition-colors font-semibold text-xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Resetar Filtros</span>
        </button>
      </div>

    </div>
  );
};

export default QuestionFilter;
