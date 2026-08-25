import React, { createContext, useContext, useState, useEffect } from 'react';

const THEME_STORAGE_KEY = 'PNA_MED_THEME_V1';
const FONT_SCALE_STORAGE_KEY = 'PNA_MED_FONTSCALE_V1';

const ThemeContext = createContext();

export const THEMES = [
  { id: 'midnight', label: 'Midnight Titanium', icon: '💎', desc: 'Padrão Apple escuro profundo' },
  { id: 'oled', label: 'OLED Pure Black', icon: '🖤', desc: 'Preto absoluto e máximo contraste' },
  { id: 'nightshift', label: 'Hospital Night Shift', icon: '🌙', desc: 'Tons âmbar sem luz azul para plantão' },
  { id: 'editorial', label: 'Editorial Medical', icon: '📄', desc: 'Modo claro papel revista médica' },
];

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(THEME_STORAGE_KEY) || 'midnight';
    } catch {
      return 'midnight';
    }
  });

  const [fontScale, setFontScale] = useState(() => {
    try {
      return parseFloat(localStorage.getItem(FONT_SCALE_STORAGE_KEY)) || 1.0;
    } catch {
      return 1.0;
    }
  });

  const [zenMode, setZenMode] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (e) {
      console.error(e);
    }

    const root = document.documentElement;
    root.classList.remove('theme-midnight', 'theme-oled', 'theme-nightshift', 'theme-editorial');
    root.classList.add(`theme-${theme}`);

    if (theme === 'editorial') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
    }
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem(FONT_SCALE_STORAGE_KEY, fontScale.toString());
    } catch (e) {
      console.error(e);
    }
    document.documentElement.style.setProperty('--user-font-scale', `${fontScale}`);
  }, [fontScale]);

  const increaseFontSize = () => setFontScale(s => Math.min(1.35, parseFloat((s + 0.05).toFixed(2))));
  const decreaseFontSize = () => setFontScale(s => Math.max(0.85, parseFloat((s - 0.05).toFixed(2))));
  const resetFontSize = () => setFontScale(1.0);
  const toggleZenMode = () => setZenMode(z => !z);

  return (
    <ThemeContext.Provider value={{
      theme,
      setTheme,
      fontScale,
      increaseFontSize,
      decreaseFontSize,
      resetFontSize,
      zenMode,
      toggleZenMode,
      setZenMode
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
