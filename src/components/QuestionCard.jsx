import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Bookmark, 
  BookmarkCheck, 
  Highlighter, 
  Strikethrough, 
  MessageSquare, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Share2, 
  BookOpen,
  Sparkles,
  Edit3
} from 'lucide-react';
import { useUserProgress } from '../context/UserProgressContext';

const QuestionCard = ({ question, isSimulationMode = false, onAnswerSimulation, onEditQuestion }) => {
  const { 
    progress, 
    saveAnswer, 
    toggleSaveQuestion, 
    saveNote, 
    setHighlighterColor 
  } = useUserProgress();

  const history = progress.answers?.[question.id];
  const isSaved = !!progress.savedQuestions?.[question.id];
  const savedNote = progress.notes?.[question.id] || '';

  const [selectedOption, setSelectedOption] = useState(history?.selectedOption || null);
  const [isSubmitted, setIsSubmitted] = useState(!!history);
  const [scratchedOptions, setScratchedOptions] = useState({});
  const [noteText, setNoteText] = useState(savedNote);
  const [showNoteBox, setShowNoteBox] = useState(!!savedNote);
  const [showExplanation, setShowExplanation] = useState(isSubmitted);
  const [copied, setCopied] = useState(false);
  const [highlights, setHighlights] = useState([]);
  const [selectedHighlighter, setSelectedHighlighter] = useState(progress.highlighterColor || 'yellow');

  useEffect(() => {
    if (history) {
      setSelectedOption(history.selectedOption);
      setIsSubmitted(true);
      setShowExplanation(true);
    }
  }, [question.id, history]);

  const handleSelectOption = (optKey) => {
    if (isSubmitted && !isSimulationMode) return;
    setSelectedOption(optKey);
    if (isSimulationMode && onAnswerSimulation) {
      onAnswerSimulation(question.id, optKey);
    }
  };

  const handleConfirmAnswer = () => {
    if (!selectedOption) return;
    const isCorrect = selectedOption === question.resposta_correta;
    saveAnswer(question.id, selectedOption, isCorrect);
    setIsSubmitted(true);
    setShowExplanation(true);
  };

  const toggleScratchOption = (optKey, e) => {
    e.stopPropagation();
    setScratchedOptions(prev => ({
      ...prev,
      [optKey]: !prev[optKey]
    }));
  };

  const handleSaveNote = (text) => {
    setNoteText(text);
    saveNote(question.id, text);
  };

  const handleCopyQuestion = () => {
    const textToCopy = `[PNA ${question.ano_da_prova} - Q${question.numero}] ${question.area} - ${question.subarea}\n\nEnunciado: ${question.enunciado}\n\nDoença: ${question.doenca_ou_conjunto_de_doencas}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleHighlightSelection = () => {
    const selection = window.getSelection();
    if (!selection.rangeCount || selection.isCollapsed) return;
    const text = selection.toString().trim();
    if (!text || text.length < 3) return;

    if (!highlights.some(h => h.text === text)) {
      setHighlights(prev => [...prev, { text, color: selectedHighlighter }]);
    }
    selection.removeAllRanges();
  };

  const renderHighlightedEnunciado = (text) => {
    if (!highlights || highlights.length === 0) return text;
    let parts = [text];

    highlights.forEach(h => {
      let newParts = [];
      parts.forEach(part => {
        if (typeof part !== 'string') {
          newParts.push(part);
          return;
        }
        const splitText = part.split(h.text);
        splitText.forEach((st, idx) => {
          newParts.push(st);
          if (idx < splitText.length - 1) {
            const colorClass = h.color === 'green' ? 'highlight-green' : h.color === 'blue' ? 'highlight-blue' : 'highlight-yellow';
            newParts.push(
              <mark key={`${h.text}-${idx}`} className={colorClass}>
                {h.text}
              </mark>
            );
          }
        });
      });
      parts = newParts;
    });

    return parts;
  };

  const difficultyColors = {
    'fácil': 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    'moderada': 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    'moderado': 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    'difícil': 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    'a classificar': 'bg-slate-800/80 text-slate-400 border-slate-700/80'
  };

  const diffKey = (question.nivel_de_dificuldade || '').toLowerCase();
  const diffBadge = difficultyColors[diffKey] || difficultyColors['a classificar'];

  return (
    <div className="rounded-[32px] apple-card p-6 sm:p-8 space-y-6 border border-white/10 shadow-2xl transition-all duration-300">
      
      {/* Question Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3.5 py-1 rounded-2xl bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-xs font-black tracking-wider">
            {question.id} • PNA {question.ano_da_prova}
          </span>
          <span className="px-3 py-1 rounded-2xl bg-white/5 text-slate-200 border border-white/10 text-xs font-bold">
            {question.area}
          </span>
          <span className="px-3 py-1 rounded-2xl bg-white/5 text-slate-300 border border-white/5 text-xs font-medium">
            {question.subarea}
          </span>
          <span className={`px-3 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${diffBadge}`}>
            {question.nivel_de_dificuldade || 'Classificação PNA'}
          </span>
          {question.isCustomEdited && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Editada Localmente
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Edit Question Button */}
          {onEditQuestion && (
            <button
              onClick={() => onEditQuestion(question)}
              title="Editar Questão no Banco Local"
              className="p-2 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-indigo-400 border border-white/10 transition-all text-xs flex items-center gap-1"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}

          {/* Highlighter Color Picker */}
          <div className="hidden sm:flex items-center gap-1.5 apple-segmented-bg px-2.5 py-1 text-xs">
            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
              <Highlighter className="w-3.5 h-3.5 text-indigo-400" />
            </span>
            {['yellow', 'green', 'blue'].map(c => (
              <button
                key={c}
                onClick={() => {
                  setSelectedHighlighter(c);
                  setHighlighterColor(c);
                }}
                className={`w-3.5 h-3.5 rounded-full border transition-all ${
                  c === 'yellow' ? 'bg-yellow-400 border-yellow-200' : c === 'green' ? 'bg-emerald-400 border-emerald-200' : 'bg-blue-400 border-blue-200'
                } ${selectedHighlighter === c ? 'ring-2 ring-white scale-125' : 'opacity-50'}`}
              />
            ))}
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopyQuestion}
            title="Copiar Enunciado"
            className="p-2 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-all text-xs flex items-center gap-1"
          >
            <Share2 className="w-4 h-4" />
            {copied && <span className="text-[10px] text-emerald-400 font-bold">Copiado</span>}
          </button>

          {/* Bookmark Button */}
          <button
            onClick={() => toggleSaveQuestion(question.id)}
            title={isSaved ? "Remover Favorito" : "Favoritar Questão"}
            className={`p-2 rounded-2xl border transition-all ${
              isSaved
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 glow-amber'
                : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-amber-400 border-white/10'
            }`}
          >
            {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Disease Tag */}
      {question.doenca_ou_conjunto_de_doencas && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 text-xs font-semibold">
          <BookOpen className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>Tema Clínico: <strong className="text-white font-bold">{question.doenca_ou_conjunto_de_doencas}</strong></span>
        </div>
      )}

      {/* Enunciado */}
      <div 
        onMouseUp={handleHighlightSelection}
        className="text-sm sm:text-base leading-relaxed text-slate-100 font-normal tracking-tight"
      >
        {renderHighlightedEnunciado(question.enunciado)}
      </div>

      {/* Options Stack */}
      <div className="space-y-3 pt-1">
        {Object.entries(question.alternativas || {}).map(([key, opt]) => {
          const isSelected = selectedOption === key;
          const isCorrectAnswer = key === question.resposta_correta;
          const isScratched = !!scratchedOptions[key];

          let optionStyle = "bg-slate-900/60 border-white/5 text-slate-200 hover:border-indigo-500/40 hover:bg-slate-800/80";

          if (isSubmitted) {
            if (isCorrectAnswer) {
              optionStyle = "bg-emerald-950/40 border-emerald-500/60 text-emerald-100 glow-emerald";
            } else if (isSelected && !isCorrectAnswer) {
              optionStyle = "bg-rose-950/40 border-rose-500/60 text-rose-100 glow-rose";
            } else {
              optionStyle = "bg-slate-900/30 border-white/5 text-slate-500 opacity-60";
            }
          } else if (isSelected) {
            optionStyle = "bg-indigo-950/60 border-indigo-500 text-white glow-indigo ring-1 ring-indigo-500/40";
          }

          return (
            <div
              key={key}
              onClick={() => handleSelectOption(key)}
              className={`group relative flex items-start gap-4 p-4.5 rounded-2xl border transition-all duration-200 cursor-pointer ${optionStyle} ${
                isScratched ? 'scratched-out' : ''
              }`}
            >
              {/* Option Radio Circle */}
              <div className={`flex items-center justify-center w-7 h-7 rounded-xl font-bold text-xs shrink-0 transition-transform ${
                isSubmitted && isCorrectAnswer
                  ? 'bg-emerald-500 text-white shadow-md'
                  : isSubmitted && isSelected && !isCorrectAnswer
                  ? 'bg-rose-500 text-white shadow-md'
                  : isSelected
                  ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white scale-105 shadow-md'
                  : 'bg-slate-800/90 text-slate-300 group-hover:bg-slate-700'
              }`}>
                {key}
              </div>

              {/* Option Text */}
              <div className="flex-1 text-xs sm:text-sm font-medium pt-0.5 leading-relaxed">
                {opt.texto}
              </div>

              {/* Scratch-out Tool */}
              {!isSubmitted && (
                <button
                  onClick={(e) => toggleScratchOption(key, e)}
                  title={isScratched ? "Restaurar Alternativa" : "Eliminar Alternativa"}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-400 hover:text-amber-300 transition-all"
                >
                  <Strikethrough className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Status Icons */}
              {isSubmitted && isCorrectAnswer && (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 self-center" />
              )}
              {isSubmitted && isSelected && !isCorrectAnswer && (
                <XCircle className="w-5 h-5 text-rose-400 shrink-0 self-center" />
              )}
            </div>
          );
        })}
      </div>

      {/* Confirm Button */}
      {!isSubmitted && !isSimulationMode && (
        <div className="flex items-center justify-end pt-2">
          <button
            onClick={handleConfirmAnswer}
            disabled={!selectedOption}
            className={`py-3 px-7 rounded-2xl text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 transition-all duration-200 ${
              selectedOption
                ? 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30 scale-[1.02] active:scale-95'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
            }`}
          >
            <span>Responder & Ver Gabarito</span>
            <Check className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Explanation Drawer */}
      {isSubmitted && (
        <div className="rounded-2xl apple-glass p-5 space-y-4 border border-white/10 shadow-inner">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-xs shadow-md">
                G
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-white">Gabarito & Raciocínio Clínico</h4>
                <p className="text-xs text-slate-400">Alternativa Correta: <strong className="text-emerald-400 font-extrabold">{question.resposta_correta}</strong></p>
              </div>
            </div>

            <button
              onClick={() => setShowExplanation(prev => !prev)}
              className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
            >
              <span>{showExplanation ? "Ocultar" : "Ver Explicação"}</span>
              {showExplanation ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {showExplanation && (
            <div className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal whitespace-pre-line space-y-3">
              {question.explicacao}
            </div>
          )}
        </div>
      )}

      {/* Personal Notes */}
      <div className="pt-2 border-t border-white/5">
        <button
          onClick={() => setShowNoteBox(prev => !prev)}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-indigo-400 transition-colors"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>{savedNote ? "Editar Anotação Pessoal" : "+ Anotação Pessoal"}</span>
        </button>

        {showNoteBox && (
          <div className="mt-3">
            <textarea
              value={noteText}
              onChange={(e) => handleSaveNote(e.target.value)}
              placeholder="Escreva seus resumos, diagnósticos diferenciais, macetes ou flashcards..."
              rows={3}
              className="w-full p-3.5 bg-slate-900/90 border border-white/10 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
            />
            {noteText && (
              <p className="text-[10px] text-emerald-400 mt-1 font-semibold flex items-center gap-1">✓ Anotação salva automaticamente</p>
            )}
          </div>
        )}
      </div>

    </div>
  );
};

export default QuestionCard;
