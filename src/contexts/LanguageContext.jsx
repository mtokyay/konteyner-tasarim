import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const LanguageContext = createContext();

const SUPPORTED_LANGS = ['tr', 'en', 'ar'];
const DEFAULT_LANG = 'tr';
const STORAGE_KEY = 'kt_lang';

export const RTL_LANGS = ['ar'];

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && SUPPORTED_LANGS.includes(saved)) return saved;
    } catch {}
    return DEFAULT_LANG;
  });

  const setLang = useCallback((newLang) => {
    if (!SUPPORTED_LANGS.includes(newLang)) return;
    setLangState(newLang);
    try { localStorage.setItem(STORAGE_KEY, newLang); } catch {}
  }, []);

  // RTL support
  useEffect(() => {
    const isRtl = RTL_LANGS.includes(lang);
    document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lang);
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, isRtl: RTL_LANGS.includes(lang), supportedLangs: SUPPORTED_LANGS }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
