import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Filter } from 'lucide-react';
import { useUserProgress } from '../context/UserProgressContext';
import { useQuestionDb } from '../context/QuestionDbContext';
import QuestionCard from './QuestionCard';

const ErrorNotebook = ({ onNavigateToQuestions }) => {
  const { progress } = useUserProgress();
  const { questions } = useQuestionDb();
  const userAnswers = progress.answers || {};

  const incorrectQuestions = questions.filter(q => {
    const ans = userAnswers[q.id];
    return ans && !ans.isCorrect;
  });

  const [selectedAreaFilter, setSelectedAreaFilter] = useState('all');

  const areaErrorCounts = {};
  incorrectQuestions.forEach(q => {
    areaErrorCounts[q.area] = (areaErrorCounts[q.area] || 0) + 1;
  });

  const filteredErrors = selectedAreaFilter === 'all'
    ? incorrectQuestions
    : incorrectQuestions.filter(q => q.area === selectedAreaFilter);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Apple Error Hub Header */}
      <div className="rounded-[32px] apple-glass border border-rose-500/25 p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-72 h-72 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1.5 backdrop-blur-md">
                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                Módulo Erro Zero
              </span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">Caderno de Erros Médico</h1>
            <p className="mt-1 text-sm text-slate-300 max-w-xl font-normal">
              Elimine vulnerabilidades do seu raciocínio refazendo pontualmente cada questão incorreta.
            </p>
          </div>

          <div className="apple-segmented-bg px-6 py-3 border border-white/10 text-center shadow-lg">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Erros Acumulados</span>
            <span className="text-3xl font-black text-rose-400">{incorrectQuestions.length}</span>
            <span className="text-[10px] text-slate-400 block font-medium">para dominar</span>
          </div>
        </div>
      </div>

      {incorrectQuestions.length === 0 ? (
        <div className="rounded-[32px] apple-card p-12 text-center border border-white/10 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-lg">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-extrabold text-white">Seu Caderno de Erros está limpo!</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Você não possui questões erradas registradas ou já superou todos os seus erros no banco.
          </p>
          <button
            onClick={onNavigateToQuestions}
            className="py-3 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold transition-all shadow-lg active:scale-95"
          >
            Ir ao Banco de Questões
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Apple Style Area Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 apple-segmented-bg p-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 shrink-0 px-2">
              <Filter className="w-3.5 h-3.5 text-indigo-400" /> Filtrar:
            </span>
            <button
              onClick={() => setSelectedAreaFilter('all')}
              className={`px-4 py-1.5 apple-segmented-item text-xs font-bold whitespace-nowrap ${
                selectedAreaFilter === 'all'
                  ? 'apple-segmented-item-active'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Todas ({incorrectQuestions.length})
            </button>
            {Object.entries(areaErrorCounts).map(([area, count]) => (
              <button
                key={area}
                onClick={() => setSelectedAreaFilter(area)}
                className={`px-4 py-1.5 apple-segmented-item text-xs font-bold whitespace-nowrap ${
                  selectedAreaFilter === area
                    ? 'apple-segmented-item-active'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {area} ({count})
              </button>
            ))}
          </div>

          <div className="space-y-6">
            {filteredErrors.map(q => (
              <QuestionCard key={q.id} question={q} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ErrorNotebook;
