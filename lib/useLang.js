'use client';
import { useEffect, useState } from 'react';

// English / Hindi switch that remembers the choice on this phone.
export function useLang() {
  const [lang, setLang] = useState('en');
  useEffect(() => {
    const saved = localStorage.getItem('nowait-lang');
    if (saved === 'en' || saved === 'hi') setLang(saved);
  }, []);
  const toggle = () => {
    const next = lang === 'en' ? 'hi' : 'en';
    setLang(next);
    localStorage.setItem('nowait-lang', next);
  };
  return [lang, toggle];
}
