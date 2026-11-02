import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import hi from './hi.json';
import pa from './pa.json';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
    pa: { translation: pa },
  },
  lng: localStorage.getItem('lang') || 'en',
  fallbackLng: 'en', // a missing key shows English instead of a blank
  interpolation: { escapeValue: false },
});

i18n.on('languageChanged', (l) => {
  localStorage.setItem('lang', l);
  document.documentElement.lang = l;
});

export default i18n;
