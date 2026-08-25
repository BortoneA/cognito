import React, { useState } from 'react';
import { Palette, Eye, Type, ZoomIn, ZoomOut, RotateCcw, Check, Sparkles, X } from 'lucide-react';
import { useTheme, THEMES } from '../context/ThemeContext';

const ThemeSwitcher = () => {
  const { 
    theme, 
    setTheme, 
    fontScale, 
    increaseFontSize, 
    decreaseFontSize, 
    resetFontSize,
    zenMode,
    toggleZenMode 
  } = useTheme();

  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(o => !o)}
        title="Personalização Visual & Temas"
        className="p-2 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all active:scale-95 touch-target flex items-center gap-1.5"
      >
        <Palette className="w-4 h-4 text-indigo-400" />
      </button>

      {/* Dropdown Modal / Popover */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-[150]" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-12 w-80 sm:w-96 rounded-[32px] apple-glass p-5 border border-white/15 shadow-2xl z-[160] space-y-5 animate-fadeIn">
            
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-black uppercase tracking-wider text-white">Aparência & Leitura</h4>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Theme Selector */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Tema Visual
              </label>
              <div className="grid grid-cols-2 gap-2">
                {THEMES.map(t => {
                  const isSelected = theme === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-2.5 ${
                        isSelected
                          ? 'bg-indigo-600/30 border-indigo-500/60 shadow-lg shadow-indigo-500/10'
                          : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                      }`}
                    >
                      <span className="text-lg">{t.icon}</span>
                      <div className="min-w-0">
                        <span className="text-xs font-black text-white block truncate">{t.label}</span>
                        <span className="text-[9px] text-slate-400 line-clamp-1">{t.desc}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-300 ml-auto shrink-0 mt-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Typography Size Controls */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Tamanho da Fonte das Questões
                </label>
                <span className="text-xs font-black text-indigo-300">{Math.round(fontScale * 100)}%</span>
              </div>

              <div className="flex items-center gap-2 apple-segmented-bg p-1 rounded-2xl">
                <button
                  onClick={decreaseFontSize}
                  disabled={fontScale <= 0.85}
                  className="flex-1 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white disabled:opacity-40 hover:bg-white/10 flex items-center justify-center gap-1 transition-all"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                  <span>A-</span>
                </button>

                <button
                  onClick={resetFontSize}
                  className="px-3 py-2 rounded-xl text-[10px] font-bold text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                  title="Restaurar tamanho padrão (100%)"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={increaseFontSize}
                  disabled={fontScale >= 1.35}
                  className="flex-1 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white disabled:opacity-40 hover:bg-white/10 flex items-center justify-center gap-1 transition-all"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                  <span>A+</span>
                </button>
              </div>
            </div>

            {/* Zen Mode Switch */}
            <div className="pt-2 border-t border-white/10">
              <button
                onClick={toggleZenMode}
                className={`w-full p-3 rounded-2xl border transition-all flex items-center justify-between ${
                  zenMode
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-200'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Eye className="w-4 h-4 text-amber-400" />
                  <div className="text-left">
                    <span className="text-xs font-black block">Modo Foco Zen (Cirúrgico)</span>
                    <span className="text-[10px] text-slate-400">Oculta distrações durante o estudo</span>
                  </div>
                </div>
                <div className={`w-8 h-4.5 rounded-full transition-colors relative p-0.5 ${zenMode ? 'bg-amber-500' : 'bg-slate-700'}`}>
                  <div className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${zenMode ? 'translate-x-3.5' : 'translate-x-0'}`} />
                </div>
              </button>
            </div>

          </div>
        </>
      )}
    </div>
  );
};

export default ThemeSwitcher;
