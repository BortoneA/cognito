import React, { useState, useEffect } from 'react';
import { X, Save, Eye, Edit3, Plus, Trash2, CheckCircle2, AlertCircle, Sparkles, Layers, Tag } from 'lucide-react';
import { useQuestionDb } from '../context/QuestionDbContext';
import { MEDICAL_TAXONOMY, getAvailableAreas, getSubareasByArea } from '../data/medicalTaxonomy';

const QuestionEditorModal = ({ isOpen, onClose, questionToEdit }) => {
  const { editQuestion, updateQuestion } = useQuestionDb();
  const availableAreas = getAvailableAreas();

  const [formData, setFormData] = useState({
    id: '',
    numero: 1,
    ano_da_prova: 2024,
    area: availableAreas[0] || 'Cardiologia',
    subarea: getSubareasByArea(availableAreas[0])[0] || '',
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
      const initArea = questionToEdit.area && MEDICAL_TAXONOMY[questionToEdit.area] 
        ? questionToEdit.area 
        : availableAreas[0] || 'Cardiologia';

      const validSubareas = getSubareasByArea(initArea);
      const initSubarea = questionToEdit.subarea && validSubareas.includes(questionToEdit.subarea)
        ? questionToEdit.subarea
        : validSubareas[0] || '';

      setFormData({
        id: questionToEdit.id || '',
        numero: questionToEdit.numero || 1,
        ano_da_prova: questionToEdit.ano_da_prova || 2024,
        area: initArea,
        subarea: initSubarea,
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

  const currentAvailableSubareas = getSubareasByArea(formData.area);

  const handleAreaChange = (e) => {
    const newArea = e.target.value;
    const subList = getSubareasByArea(newArea);
    setFormData(prev => ({
      ...prev,
      area: newArea,
      subarea: subList[0] || ''
    }));
  };

  const handleSubareaChange = (e) => {
    setFormData(prev => ({
      ...prev,
      subarea: e.target.value
    }));
  };

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

    // Validation
    if (!formData.enunciado.trim()) {
      alert("O enunciado não pode ficar em branco.");
      return;
    }

    const optionsCount = Object.keys(formData.alternativas).length;
    if (optionsCount < 2) {
      alert("Adicione pelo menos 2 alternativas.");
      return;
    }

    const hasEmptyOption = Object.entries(formData.alternativas).some(([_, val]) => {
      const text = typeof val === 'string' ? val : val?.texto || '';
      return !text.trim();
    });

    if (hasEmptyOption) {
      alert("Preencha o texto de todas as alternativas.");
      return;
    }

    try {
      const saveFn = editQuestion || updateQuestion;
      if (typeof saveFn === 'function') {
        await saveFn(formData);
      }
      setSuccessMessage('Questão gravada no Neon PostgreSQL com sucesso!');
      setTimeout(() => {
        setSuccessMessage('');
        onClose();
      }, 1200);
    } catch (err) {
      alert("Erro ao gravar questão: " + (err?.message || String(err)));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-xl animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col apple-glass rounded-[32px] border border-white/15 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                Editar Questão <span className="text-indigo-400 font-mono text-sm">{formData.id}</span>
              </h2>
              <p className="text-xs text-slate-400">Classificação clínica fixada pelo arsenal oficial PNA</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Segmented Control: Edit vs Preview */}
            <div className="flex items-center apple-segmented-bg p-1 text-xs">
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
          <div className="bg-emerald-500/20 border-b border-emerald-500/30 px-6 py-3 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'edit' ? (
            <form id="question-edit-form" onSubmit={handleSubmit} className="space-y-6">
              
              {/* Row 1: Fixed Taxonomy Dropdowns (NO free-text typing) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Área Médica (Arsenal Fixo)</span>
                  </label>
                  <select
                    value={formData.area}
                    onChange={handleAreaChange}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-900/90 border border-white/15 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all cursor-pointer font-medium"
                  >
                    {availableAreas.map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Subárea Fixa (Arsenal Clínico)</span>
                  </label>
                  <select
                    value={formData.subarea}
                    onChange={handleSubareaChange}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-900/90 border border-white/15 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all cursor-pointer font-medium"
                  >
                    {currentAvailableSubareas.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Dificuldade</label>
                  <select
                    value={formData.nivel_de_dificuldade}
                    onChange={(e) => setFormData(prev => ({ ...prev, nivel_de_dificuldade: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-900/90 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all"
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
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Tema Clínico / Doença Específica</label>
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
                    onChange={(e) => setFormData(prev => ({ ...prev, ano_da_prova: parseInt(e.target.value) || 2024 }))}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-900/80 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500 transition-all font-mono"
                  />
                </div>
              </div>

              {/* Enunciado */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-300">Enunciado Clínico Completo</label>
                <textarea
                  rows={5}
                  value={formData.enunciado}
                  onChange={(e) => setFormData(prev => ({ ...prev, enunciado: e.target.value }))}
                  placeholder="Digite o texto da vinheta clínica..."
                  className="w-full p-4 rounded-2xl bg-slate-900/80 border border-white/10 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all resize-y leading-relaxed font-sans"
                />
              </div>

              {/* Alternativas */}
              <div className="space-y-3 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Alternativas de Resposta (Marque o Gabarito Correto)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-xl border border-indigo-500/20 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Opção</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {Object.entries(formData.alternativas).map(([key, val]) => {
                    const text = typeof val === 'string' ? val : val?.texto || '';
                    const isCorrect = formData.resposta_correta === key;

                    return (
                      <div
                        key={key}
                        className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all ${
                          isCorrect
                            ? 'bg-emerald-950/30 border-emerald-500/40 ring-1 ring-emerald-500/30'
                            : 'bg-slate-900/60 border-white/5 hover:border-white/10'
                        }`}
                      >
                        {/* Radio Check for Correct Answer */}
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, resposta_correta: key }))}
                          className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                            isCorrect
                              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-105'
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                          }`}
                          title={`Marcar ${key} como alternativa correta`}
                        >
                          {key}
                        </button>

                        <div className="flex-1">
                          <textarea
                            rows={2}
                            value={text}
                            onChange={(e) => handleOptionChange(key, e.target.value)}
                            placeholder={`Texto da alternativa ${key}...`}
                            className="w-full p-2.5 rounded-xl bg-slate-900/80 border border-white/5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all resize-none leading-relaxed"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveOption(key)}
                          className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                          title="Remover alternativa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Explicação & Comentário Clínico */}
              <div className="space-y-1.5 pt-2 border-t border-white/10">
                <label className="block text-xs font-bold text-slate-300">Explicação / Resolução Comentada Oficial</label>
                <textarea
                  rows={4}
                  value={formData.explicacao}
                  onChange={(e) => setFormData(prev => ({ ...prev, explicacao: e.target.value }))}
                  placeholder="Justifique o gabarito e comente as alternativas incorretas..."
                  className="w-full p-4 rounded-2xl bg-slate-900/80 border border-white/10 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all resize-y leading-relaxed font-sans"
                />
              </div>

            </form>
          ) : (
            /* PREVIEW TAB */
            <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
                <span className="px-3 py-1 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold">
                  {formData.id || 'NOVA-QUESTÃO'} • PNA {formData.ano_da_prova}
                </span>
                <span className="px-3 py-1 rounded-2xl bg-white/5 text-slate-200 border border-white/10 text-xs font-bold">
                  {formData.area}
                </span>
                <span className="px-3 py-1 rounded-2xl bg-white/5 text-slate-300 border border-white/5 text-xs font-medium">
                  {formData.subarea}
                </span>
                <span className="px-3 py-1 rounded-2xl bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs font-bold">
                  {formData.nivel_de_dificuldade}
                </span>
              </div>

              <div className="text-sm leading-relaxed text-slate-100 font-normal">
                {formData.enunciado || <span className="text-slate-500 italic">Nenhum enunciado preenchido.</span>}
              </div>

              <div className="space-y-2.5">
                {Object.entries(formData.alternativas).map(([key, val]) => {
                  const text = typeof val === 'string' ? val : val?.texto || '';
                  const isCorrect = formData.resposta_correta === key;

                  return (
                    <div
                      key={key}
                      className={`p-3.5 rounded-2xl border flex items-start gap-3 text-xs leading-relaxed ${
                        isCorrect
                          ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-200'
                          : 'bg-slate-900/40 border-white/5 text-slate-300'
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        isCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {key}
                      </span>
                      <span className="flex-1 pt-0.5">{text || <span className="italic text-slate-500">Em branco</span>}</span>
                      {isCorrect && (
                        <span className="text-[10px] uppercase font-black tracking-wider text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-md">
                          Gabarito
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {formData.explicacao && (
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/10 space-y-2">
                  <h4 className="text-xs font-black uppercase text-indigo-400 tracking-wider">Explicação do Gabarito</h4>
                  <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line">{formData.explicacao}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 border-t border-white/10 bg-slate-900/80 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-2xl border border-white/10 hover:bg-white/5 text-slate-400 text-xs font-bold transition-all"
          >
            Cancelar
          </button>

          <button
            type="submit"
            form="question-edit-form"
            className="px-7 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-extrabold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all scale-[1.02] active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Alterações no Banco</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default QuestionEditorModal;
