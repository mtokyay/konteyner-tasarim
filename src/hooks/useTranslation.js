import { useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import translations from '../i18n';

export function useTranslation() {
  const { lang, setLang, isRtl } = useLanguage();

  const t = useCallback((key, fallback) => {
    const keys = key.split('.');
    let value = translations[lang];
    for (const k of keys) {
      if (value == null) break;
      value = value[k];
    }
    if (value != null && typeof value === 'string') return value;
    // Fallback to Turkish
    if (lang !== 'tr') {
      let trValue = translations.tr;
      for (const k of keys) {
        if (trValue == null) break;
        trValue = trValue[k];
      }
      if (trValue != null && typeof trValue === 'string') return trValue;
    }
    return fallback || key;
  }, [lang]);

  return { t, lang, setLang, isRtl };
}
