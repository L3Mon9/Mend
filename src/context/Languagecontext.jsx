import { createContext, useContext, useState } from 'react'
import { translations } from '../i18n/translations.js'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('mend-lang') || 'tl')

  function setLanguage(next) {
    setLang(next)
    localStorage.setItem('mend-lang', next)
  }

  function toggleLanguage() {
    setLanguage(lang === 'tl' ? 'en' : 'tl')
  }

  function t(key) {
    return translations[lang]?.[key] ?? translations.en[key] ?? key
  }

  return (
    <LanguageContext.Provider value={{ lang, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}