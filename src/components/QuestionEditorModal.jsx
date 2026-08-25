import React, { useState, useEffect } from 'react';
import { X, Save, Eye, Edit3, Plus, Trash2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { useQuestionDb } from '../context/QuestionDbContext';

const QuestionEditorModal = ({ isOpen, onClose, questionToEdit }) => {
  const { updateQuestion } = useQuestionDb();

  const [formData, setFormData] = useState({
    id: '',
    numero: 1,
    ano_da_prova: 2024,
    area: '',
    subarea: '',
    nivel_de_dificuldade: 'Moderada',
    enunciado: '',
    doenca_ou_conjunto_de_doencas: '',
    resposta_correta: 'A',
    explicacao: '',
    alternativas: {
      A: { texto: '' },
      B: { texto: '' },
      C: { texto: '' },
      D: { texto: '' }
    }
  });

  const [activeTab, setActiveTab] = useState('edit'); // 'edit' | 'preview'
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (questionToEdit) {
      setFormData({
        id: questionToEdit.id || '',
        numero: questionToEdit.numero || 1,
        ano_da_prova: questionToEdit.ano_da_prova || 2024,
        area: questionToEdit.area || 'Clínica Médica',
        subarea: questionToEdit.subarea || 'Geral',
        nivel_de_dificuldade: questionToEdit.nivel_de_dificuldade || 'Moderada',
        enunciado: questionToEdit.enunciado || '',
        doenca_ou_conjunto_de_doencas: questionToEdit.doenca_ou_conjunto_de_doencas || '',
        resposta_correta: questionToEdit.resposta_correta || 'A',
        explicacao: questionToEdit.explicacao || '',
        alternativas: questionToEdit.alternativas ? JSON.parse(JSON.stringify(questionToEdit.alternativas)) : {
          A: { texto: '' },
          B: { texto: '' },
          C: { texto: '' },
          D: { texto: '' }
        }
      });
    }
  }, [questionToEdit]);

  if (!isOpen) return null;

  const handleOptionChange = (key, text) => {
    setFormData(prev => ({
      ...prev,
      alternativas: {
        ...prev.alternativas,
        [key]: { texto: text }
      }
    }));
  };

  const handleAddOption = () => {
    const keys = ['A', 'B', 'C', 'D', 'E', 'F'];
    const currentKeys = Object.keys(formData.alternativas);
    const nextKey = keys.find(k => !currentKeys.includes(k));
    if (nextKey) {
      setFormData(prev => ({
        ...prev,
        alternativas: {
          ...prev.alternativas,
          [nextKey]: { texto: '' }
        }
      }));
    }
  };

  const handleRemoveOption = (key) => {
    if (Object.keys(formData.alternativas).length <= 2) {
      alert("A questão precisa ter pelo menos 2 alternativas.");
      return;
    }
    setFormData(prev => {
      const nextAlts = { ...prev.alternativas };
      delete nextAlts[key];
      let nextCorrect = prev.resposta_correta;
      if (nextCorrect === key) {
        nextCorrect = Object.keys(nextAlts)[0];
      }
      return {
        ...prev,
        resposta_correta: nextCorrect,
        alternativas: nextAlts
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.enunciado.trim()) {
      alert("Por favor, preencha o enunciado da questão.");
      return;
    }

    await updateQuestion(formData);
    setSuccessMessage('Questão atualizada e salva permanentemente no banco local!');
    setTimeout(() => {
      setSuccessMessage('');
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-xl animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col apple-glass rounded-[32px] border border-white/10 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Edição de Questão
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 text-xs font-mono border border-indigo-500/30">
                  {formData.id}
                </span>
              </h2>
              <p className="text-xs text-slate-400">Edite enunciados, alternativas, gabarito e comentários no banco local</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Segmented Edit/Preview */}
            <div className="flex items-center apple-segmented-bg text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all ${
                  activeTab === 'edit' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Editar</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all ${
                  activeTab === 'preview' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Visualizar</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all border border-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="bg-emerald-500/20 border-b border-emerald-500/30 px-6 py-3 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'edit' ? (
            <form id="question-edit-form" onSubmit={handleSubmit} className="space-y-6">
              
              {/* Row 1: Metadata inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Área (Especialidade)</label>
                  <input
                    type="text"
                    value={formData.area}
                    onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))}
                    placeholder="Ex: Endocrinologia e Metabólica"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-900/80 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Subárea / Tópico</label>
                  <input
                    type="text"
                    value={formData.subarea}
                    onChange={(e) => setFormData(prev => ({ ...prev, subarea: e.target.value }))}
                    placeholder="Ex: Diabetes Mellitus"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-900/80 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Dificuldade</label>
                  <select
                    value={formData.nivel_de_dificuldade}
                    onChange={(e) => setFormData(prev => ({ ...prev, nivel_de_dificuldade: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-900/80 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
                  >
                    <option value="Fácil">Fácil</option>
                    <option value="Moderada">Moderada</option>
                    <option value="Difícil">Difícil</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Disease Theme & Year */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Tema Clínico / Doença</label>
                  <input
                    type="text"
                    value={formData.doenca_ou_conjunto_de_doencas}
                    onChange={(e) => setFormData(prev => ({ ...prev, doenca_ou_conjunto_de_doencas: e.target.value }))}
                    placeholder="Ex: Cetoacidose Diabética / Complicações Agudas"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-900/80 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Ano da Prova</label>
                  <input
                    type="number"
                    value={formData.ano_da_prova}
                    onChange={(e) => setFormData(prev => ({ ...prev, ano_da_prova: parseInt(e.target.value, 10) || 2024 }))}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-900/80 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              {/* Enunciado Area */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Enunciado da Questão (Caso Clínico)</label>
                <textarea
                  value={formData.enunciado}
                  onChange={(e) => setFormData(prev => ({ ...prev, enunciado: e.target.value }))}
                  rows={5}
                  placeholder="Escreva ou edite o caso clínico e o enunciado completo..."
                  className="w-full p-4 rounded-2xl bg-slate-900/90 border border-white/10 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all leading-relaxed"
                />
              </div>

              {/* Alternativas Editor */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-300">Alternativas e Gabarito</label>
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Alternativa</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {Object.entries(formData.alternativas).map(([key, opt]) => {
                    const isCorrect = formData.resposta_correta === key;
                    return (
                      <div
                        key={key}
                        className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                          isCorrect ? 'bg-emerald-950/30 border-emerald-500/50' : 'bg-slate-900/60 border-white/5'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, resposta_correta: key }))}
                          title="Marcar como Gabarito Correto"
                          className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                            isCorrect ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                          }`}
                        >
                          {key}
                        </button>

                        <input
                          type="text"
                          value={opt.texto || ''}
                          onChange={(e) => handleOptionChange(key, e.target.value)}
                          placeholder={`Texto da alternativa ${key}...`}
                          className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950/60 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                        />

                        <button
                          type="button"
                          onClick={() => handleRemoveOption(key)}
                          title="Remover Alternativa"
                          className="p-2 text-slate-500 hover:text-rose-400 rounded-xl hover:bg-white/5 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Explanation / Gabarito Comentado */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Explicação Clínica & Raciocínio (Gabarito Comentado)</label>
                <textarea
                  value={formData.explicacao}
                  onChange={(e) => setFormData(prev => ({ ...prev, explicacao: e.target.value }))}
                  rows={4}
                  placeholder="Explicação detalhada do porquê o gabarito está correto e comentários das alternativas incorretas..."
                  className="w-full p-4 rounded-2xl bg-slate-900/90 border border-white/10 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all leading-relaxed"
                />
              </div>

            </form>
          ) : (
            /* Live Preview */
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="px-3 py-1 rounded-2xl bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-xs font-extrabold">
                  {formData.id} • PNA {formData.ano_da_prova}
                </span>
                <span className="text-xs text-slate-400 font-medium">{formData.area} › {formData.subarea}</span>
              </div>

              {formData.doenca_ou_conjunto_de_doencas && (
                <div className="px-3.5 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-300 text-xs font-bold border border-indigo-500/20">
                  Tema: {formData.doenca_ou_conjunto_de_doencas}
                </div>
              )}

              <p className="text-sm text-slate-100 leading-relaxed font-normal">{formData.enunciado}</p>

              <div className="space-y-2 pt-2">
                {Object.entries(formData.alternativas).map(([key, opt]) => {
                  const isCorrect = formData.resposta_correta === key;
                  return (
                    <div
                      key={key}
                      className={`p-3.5 rounded-2xl border text-xs flex items-center gap-3 ${
                        isCorrect ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200' : 'bg-slate-900/60 border-white/5 text-slate-300'
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[10px] ${
                        isCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'
                      }`}>{key}</span>
                      <span>{opt.texto}</span>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/10 text-xs text-slate-300 space-y-2">
                <h4 className="font-bold text-white text-xs">Gabarito Comentado</h4>
                <p className="whitespace-pre-line leading-relaxed">{formData.explicacao}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 sm:p-6 border-t border-white/10 bg-slate-900/80 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold transition-all border border-white/10"
          >
            Cancelar
          </button>

          <button
            type="submit"
            form="question-edit-form"
            className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all scale-[1.02] active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Salvar no Banco Local</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default QuestionEditorModal;
