import React, { createContext, useContext, useState, ReactNode } from "react";
import { UI_TEXT } from "../i18n/ui";

type Language = "en" | "fr" | "ar" | "es";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = "skypulse_language";

function detectDeviceLanguage(): Language {
  if (typeof navigator !== "undefined") {
    if (navigator.languages && navigator.languages.length > 0) {
      const lang = navigator.languages[0].split("-")[0].toLowerCase();
      if (["en", "fr", "ar", "es"].includes(lang)) {
        return lang as Language;
      }
    }
    if (navigator.language) {
      const lang = navigator.language.split("-")[0].toLowerCase();
      if (["en", "fr", "ar", "es"].includes(lang)) {
        return lang as Language;
      }
    }
  }
  return "en";
}

function loadLanguageFromStorage(): Language {
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved && ["en", "fr", "ar", "es"].includes(saved)) {
      return saved as Language;
    }
  } catch (err) {
    console.warn("Failed to load language from localStorage:", err);
  }
  return detectDeviceLanguage();
}

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(loadLanguageFromStorage);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch (err) {
      console.warn("Failed to save language to localStorage:", err);
    }
  };

  const t = (key: string): string => {
    const translations = UI_TEXT[language] || UI_TEXT.en;
    return translations[key as keyof typeof UI_TEXT.en] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

