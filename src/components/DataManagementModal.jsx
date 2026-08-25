import React, { useState } from 'react';
import { X, Download, Upload, Trash2, Database, Check, Edit3, RefreshCw } from 'lucide-react';
import { useUserProgress } from '../context/UserProgressContext';
import { useQuestionDb } from '../context/QuestionDbContext';

const DataManagementModal = ({ isOpen, onClose }) => {
  const { progress, exportData, importData, resetProgress } = useUserProgress();
  const { questions, localEditsCount, resetEdits, exportDatabase } = useQuestionDb();
  const [importStatus, setImportStatus] = useState(null);

  if (!isOpen) return null;

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const success = importData(event.target.result);
      if (success) {
        setImportStatus({ success: true, message: 'Dados de progresso importados com sucesso!' });
      } else {
        setImportStatus({ success: false, message: 'Erro ao importar arquivo JSON.' });
      }
      setTimeout(() => setImportStatus(null), 3000);
    };
    reader.readAsText(file);
  };

  const handleConfirmReset = () => {
    if (window.confirm("Tem certeza que deseja apagar todo o seu histórico de respostas, anotações e favoritos? Esta ação não pode ser desfeita.")) {
      resetProgress();
      onClose();
    }
  };

  const handleResetQuestionEdits = async () => {
    if (window.confirm("Tem certeza que deseja restaurar as edições locais das questões e voltar para a versão original do arquivo?")) {
      await resetEdits();
      alert("Edições restauradas para a versão original do banco!");
    }
  };

  const totalAnswers = Object.keys(progress.answers || {}).length;
  const totalSaved = Object.keys(progress.savedQuestions || {}).length;
  const totalNotes = Object.keys(progress.notes || {}).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl">
      <div className="relative w-full max-w-lg rounded-[32px] apple-glass border border-white/10 p-7 space-y-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Banco de Dados Local & Backup</h3>
              <p className="text-xs text-slate-400">Armazenamento local permanente (IndexedDB / LocalStorage)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Stats */}
        <div className="grid grid-cols-4 gap-2 apple-segmented-bg p-3 border border-white/10 text-center">
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Questões</span>
            <span className="text-base font-black text-indigo-400">{questions.length}</span>
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Editadas</span>
            <span className="text-base font-black text-amber-400">{localEditsCount}</span>
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Respondidas</span>
            <span className="text-base font-black text-emerald-400">{totalAnswers}</span>
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Anotações</span>
            <span className="text-base font-black text-purple-400">{totalNotes}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          
          {/* Export Question Database JSON */}
          <button
            onClick={exportDatabase}
            className="w-full p-3.5 rounded-2xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-200 text-xs font-bold flex items-center justify-between transition-all active:scale-98"
          >
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-purple-400" />
              <div className="text-left">
                <span className="block text-white">Exportar Banco de Questões (.JSON)</span>
                <span className="text-[10px] text-slate-400 font-normal">Baixar o banco de {questions.length} questões com edições locais</span>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 bg-purple-500/30 rounded-xl text-purple-300 border border-purple-500/30">Download</span>
          </button>

          {/* Backup User Progress */}
          <button
            onClick={exportData}
            className="w-full p-3.5 rounded-2xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-200 text-xs font-bold flex items-center justify-between transition-all active:scale-98"
          >
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-indigo-400" />
              <div className="text-left">
                <span className="block text-white">Exportar Histórico de Progresso</span>
                <span className="text-[10px] text-slate-400 font-normal">Baixar histórico de acertos, erros e anotações</span>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 bg-indigo-500/30 rounded-xl text-indigo-300 border border-indigo-500/30">Progresso</span>
          </button>

          {/* Import Backup */}
          <label className="w-full p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-bold flex items-center justify-between transition-all cursor-pointer active:scale-98">
            <div className="flex items-center gap-3">
              <Upload className="w-5 h-5 text-emerald-400" />
              <div className="text-left">
                <span className="block text-white">Importar Progresso (.JSON)</span>
                <span className="text-[10px] text-slate-400 font-normal">Restaurar progresso salvo</span>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 bg-emerald-500/20 text-emerald-300 rounded-xl border border-emerald-500/30">Carregar</span>
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>

          {importStatus && (
            <div className={`p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
              importStatus.success ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40' : 'bg-rose-950/60 text-rose-300 border border-rose-500/40'
            }`}>
              <Check className="w-4 h-4" />
              <span>{importStatus.message}</span>
            </div>
          )}

          {localEditsCount > 0 && (
            <button
              onClick={handleResetQuestionEdits}
              className="w-full p-3.5 rounded-2xl bg-amber-950/30 hover:bg-amber-950/50 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-between transition-all active:scale-98"
            >
              <div className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-amber-400" />
                <div className="text-left">
                  <span className="block text-amber-200">Restaurar Edições de Questões</span>
                  <span className="text-[10px] text-slate-400 font-normal">Voltar {localEditsCount} questões editadas ao original</span>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 bg-amber-500/20 text-amber-300 rounded-xl border border-amber-500/30">Restaurar</span>
            </button>
          )}

          <button
            onClick={handleConfirmReset}
            className="w-full p-3.5 rounded-2xl bg-rose-950/30 hover:bg-rose-950/50 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center justify-between transition-all active:scale-98"
          >
            <div className="flex items-center gap-3">
              <Trash2 className="w-5 h-5 text-rose-400" />
              <div className="text-left">
                <span className="block text-rose-200">Resetar Todo o Progresso</span>
                <span className="text-[10px] text-slate-400 font-normal">Zerar histórico e estatísticas</span>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 bg-rose-500/20 text-rose-300 rounded-xl border border-rose-500/30">Reset</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default DataManagementModal;
