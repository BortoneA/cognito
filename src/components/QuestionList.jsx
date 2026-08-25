import React, { useState, useEffect } from 'react';
import QuestionCard from './QuestionCard';
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react';

const QUESTIONS_PER_PAGE = 10;

const QuestionList = ({ questions, onEditQuestion, onOpenNote }) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when question set changes
  useEffect(() => {
    setCurrentPage(1);
  }, [questions.length]);

  const totalPages = Math.ceil(questions.length / QUESTIONS_PER_PAGE);

  const startIndex = (currentPage - 1) * QUESTIONS_PER_PAGE;
  const currentQuestions = questions.slice(startIndex, startIndex + QUESTIONS_PER_PAGE);

  if (questions.length === 0) {
    return (
      <div className="rounded-3xl glass-panel p-12 text-center border border-slate-800 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-500">
          <Inbox className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-white">Nenhuma questão encontrada</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Tente ajustar os filtros selecionados ou digite um termo de busca diferente.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Pagination info */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>
          Exibindo <strong>{startIndex + 1}</strong> - <strong>{Math.min(startIndex + QUESTIONS_PER_PAGE, questions.length)}</strong> de <strong>{questions.length}</strong> questões
        </span>

        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-white">Página {currentPage} de {totalPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Questions Stack */}
      <div className="space-y-6">
        {currentQuestions.map(q => (
          <QuestionCard key={q.id} question={q} onEditQuestion={onEditQuestion} onOpenNote={onOpenNote} />
        ))}
      </div>


      {/* Bottom Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-6 border-t border-slate-800">
          <button
            onClick={() => {
              setCurrentPage(p => Math.max(p - 1, 1));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            disabled={currentPage === 1}
            className="py-2 px-4 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 text-xs font-semibold text-white flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </button>

          <span className="text-xs text-slate-400 font-medium">
            Página <strong className="text-white">{currentPage}</strong> de <strong className="text-white">{totalPages}</strong>
          </span>

          <button
            onClick={() => {
              setCurrentPage(p => Math.min(p + 1, totalPages));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            disabled={currentPage === totalPages}
            className="py-2 px-4 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 text-xs font-semibold text-white flex items-center gap-1"
          >
            Próxima
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default QuestionList;
