import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

const LANG_CONFIG = {
  tr: { label: 'TR', flag: '🇹🇷', name: 'Türkçe' },
  en: { label: 'EN', flag: '🇬🇧', name: 'English' },
  ar: { label: 'AR', flag: '🇸🇦', name: 'العربية' },
};

export default function LanguageSwitcher({ variant = 'default' }) {
  const { lang, setLang, supportedLangs } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const current = LANG_CONFIG[lang];
  const isCompact = variant === 'compact';

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 rounded-lg transition text-sm font-medium ${
          isCompact
            ? 'px-2 py-1.5 hover:bg-gray-100 text-gray-600'
            : 'px-3 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700'
        }`}
      >
        <span>{current.flag}</span>
        <span>{current.label}</span>
        <svg className={`w-3.5 h-3.5 transition ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full mt-1 right-0 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[140px] z-50">
          {supportedLangs.map((l) => {
            const cfg = LANG_CONFIG[l];
            return (
              <button
                key={l}
                onClick={() => { setLang(l); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition ${
                  l === lang
                    ? 'bg-amber-50 text-amber-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>{cfg.flag}</span>
                <span>{cfg.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
