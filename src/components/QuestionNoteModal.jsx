import React, { useState } from 'react';
import { X, StickyNote, Save, Trash2 } from 'lucide-react';
import { useUserProgress } from '../context/UserProgressContext';

const QuestionNoteModal = ({ isOpen, onClose, question }) => {
  const { progress, saveNote } = useUserProgress();
  const [text, setText] = useState(() => {
    if (!question) return '';
    return (progress.notes || {})[question.id] || '';
  });

  // Sync text when question changes
  React.useEffect(() => {
    if (question) {
      setText((progress.notes || {})[question.id] || '');
    }
  }, [question?.id]);

  if (!isOpen || !question) return null;

  const handleSave = () => {
    saveNote(question.id, text);
    onClose();
  };

  const handleDelete = () => {
    saveNote(question.id, '');
    setText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg rounded-t-[32px] sm:rounded-[32px] apple-glass border border-white/10 shadow-2xl flex flex-col max-h-[85dvh]">

        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
              <StickyNote className="w-4.5 h-4.5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white">Anotação Pessoal</h3>
              <p className="text-[10px] text-slate-400 truncate max-w-[220px]">
                {question.area} • {question.ano_da_prova}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Question preview */}
        <div className="px-5 py-3 bg-slate-900/50 border-b border-white/5 shrink-0">
          <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
            {question.enunciado?.substring(0, 160)}...
          </p>
        </div>

        {/* Text area */}
        <div className="p-5 flex-1 overflow-hidden flex flex-col gap-3">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Escreva aqui sua anotação sobre esta questão: conceitos-chave, macetes clínicos, dúvidas para revisar..."
            className="w-full flex-1 min-h-[160px] bg-slate-900/70 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
          />
          <p className="text-[10px] text-slate-500">{text.length} caracteres</p>
        </div>

        {/* Actions */}
        <div className="p-5 pt-0 flex items-center gap-3">
          {(progress.notes || {})[question.id] && (
            <button
              onClick={handleDelete}
              className="px-4 py-2.5 rounded-2xl border border-rose-500/30 text-rose-400 text-xs font-bold hover:bg-rose-500/10 transition-all flex items-center gap-2"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Apagar
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-2xl border border-white/10 text-slate-400 text-xs font-bold hover:bg-white/5 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
          >
            <Save className="w-3.5 h-3.5" />
            Salvar Anotação
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionNoteModal;
