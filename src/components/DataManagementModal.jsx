import React, { useState } from 'react';
import { X, Download, Upload, Trash2, Database, Check, Edit3, RefreshCw, HardDrive, CheckCircle2, ShieldCheck, Zap, Cloud, Sparkles } from 'lucide-react';
import { useUserProgress } from '../context/UserProgressContext';
import { useQuestionDb } from '../context/QuestionDbContext';

const DataManagementModal = ({ isOpen, onClose }) => {
  const { progress, exportData, importData, resetProgress, refreshProgressFromNeon } = useUserProgress();
  const { 
    questions, 
    localEditsCount, 
    isSynchronized, 
    lastSyncTime, 
    isSyncing, 
    syncDatabaseLocally, 
    resetEdits, 
    importFullDatabase, 
    exportDatabase,
    performSync,
    cloudSource
  } = useQuestionDb();

  const [importStatus, setImportStatus] = useState(null);
  const [syncFeedback, setSyncFeedback] = useState(null);

  if (!isOpen) return null;

  const handleManualNeonSync = async () => {
    setSyncFeedback({ loading: true, message: 'Consultando Neon PostgreSQL Cloud Master...' });
    try {
      await refreshProgressFromNeon();
      const list = await performSync(true);
      setSyncFeedback({ success: true, message: `Sincronização Neon Cloud concluída! (${list.length} questões e métricas ativas)` });
    } catch (e) {
      setSyncFeedback({ success: false, message: `Erro ao conectar com Neon: ${e.message}` });
    }
    setTimeout(() => setSyncFeedback(null), 4000);
  };

  const handleProgressUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const success = importData(event.target.result);
      if (success) {
        setImportStatus({ success: true, message: 'Dados de progresso importados e enviados ao Neon Cloud!' });
      } else {
        setImportStatus({ success: false, message: 'Erro ao importar arquivo JSON de progresso.' });
      }
      setTimeout(() => setImportStatus(null), 3500);
    };
    reader.readAsText(file);
  };

  const handleDatabaseUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const result = await importFullDatabase(event.target.result);
      if (result.success) {
        setImportStatus({ success: true, message: `Banco atualizado com sucesso (${result.count} questões importadas)!` });
      } else {
        setImportStatus({ success: false, message: `Erro ao importar banco: ${result.message}` });
      }
      setTimeout(() => setImportStatus(null), 4000);
    };
    reader.readAsText(file);
  };

  const handleConfirmReset = () => {
    if (window.confirm("Atenção: Deseja realmente zerar todo o seu histórico de desempenho e anotações no Neon DB?")) {
      resetProgress();
      onClose();
    }
  };

  const handleResetQuestionEdits = async () => {
    if (window.confirm("Deseja restaurar as edições e sincronizar novamente a versão original do Neon?")) {
      await resetEdits();
      alert("Edições restauradas com sucesso a partir do Neon!");
    }
  };

  const totalAnswers = Object.keys(progress.answers || {}).length;
  const totalSaved = Object.keys(progress.savedQuestions || {}).length;
  const totalNotes = Object.keys(progress.notes || {}).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-[32px] apple-glass border border-indigo-500/20 p-7 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90dvh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/40 shadow-lg shadow-indigo-500/20">
              <Zap className="w-5 h-5 fill-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">Neon PostgreSQL Cloud Master</h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Prioritário
                </span>
              </div>
              <p className="text-xs text-indigo-300/80">Sincronização em Nuvem em Tempo Real (AWS Neon DB Cluster)</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sync Feedback Message */}
        {syncFeedback && (
          <div className={`p-3.5 rounded-2xl text-xs flex items-center gap-2.5 border ${
            syncFeedback.loading ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20 animate-pulse' :
            syncFeedback.success ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 
            'bg-rose-500/10 text-rose-300 border-rose-500/20'
          }`}>
            <RefreshCw className={`w-4 h-4 shrink-0 ${syncFeedback.loading ? 'animate-spin' : ''}`} />
            <span className="font-semibold">{syncFeedback.message}</span>
          </div>
        )}

        {/* Live Neon Status Card */}
        <div className="p-4.5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-purple-950/40 border border-indigo-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Cloud className="w-4 h-4 text-indigo-400" />
              Fonte de Dados Ativa:
            </span>
            <span className="text-xs font-black text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {cloudSource}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 text-center">
            <div className="p-2.5 rounded-xl bg-black/20 border border-white/5">
              <span className="text-[10px] text-slate-400 block font-semibold">Questões</span>
              <span className="text-sm font-black text-indigo-400">{questions.length}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-black/20 border border-white/5">
              <span className="text-[10px] text-slate-400 block font-semibold">Respostas</span>
              <span className="text-sm font-black text-emerald-400">{totalAnswers}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-black/20 border border-white/5">
              <span className="text-[10px] text-slate-400 block font-semibold">Favoritas/Notas</span>
              <span className="text-sm font-black text-purple-400">{totalSaved + totalNotes}</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
            <span>Última sincronização:</span>
            <span className="font-semibold text-slate-200">
              {new Date(lastSyncTime).toLocaleTimeString('pt-BR')}
            </span>
          </div>
        </div>

        {/* Actions Grid */}
        <div className="space-y-3">
          <button
            onClick={handleManualNeonSync}
            disabled={isSyncing}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Sincronizar Agora com o Neon PostgreSQL</span>
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={exportData}
              className="py-2.5 px-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all hover:border-white/20"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Exportar Progresso</span>
            </button>

            <button
              onClick={exportDatabase}
              className="py-2.5 px-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all hover:border-white/20"
            >
              <Download className="w-3.5 h-3.5 text-purple-400" />
              <span>Exportar Banco</span>
            </button>
          </div>
        </div>

        {/* Danger / Reset Area */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between">
          <button
            onClick={handleResetQuestionEdits}
            className="text-[11px] text-slate-400 hover:text-slate-200 underline font-medium transition-colors"
          >
            Restaurar Edições
          </button>
          <button
            onClick={handleConfirmReset}
            className="text-[11px] text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            Zerar Histórico
          </button>
        </div>

      </div>
    </div>
  );
};

export default DataManagementModal;
