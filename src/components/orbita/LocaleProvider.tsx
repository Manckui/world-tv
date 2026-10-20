"use client";

import { createContext, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { translate, type Locale } from "@/lib/i18n";

const storageKey = "world-tv:language";
const changeEvent = "world-tv:language-changed";
let sessionLocale: Locale = "it";

function snapshot(): Locale {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved === "en" || saved === "it") sessionLocale = saved;
  } catch { /* The language still works for this session if storage is disabled. */ }
  return sessionLocale;
}

function subscribe(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener(changeEvent, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(changeEvent, listener);
  };
}

function setLocale(locale: Locale) {
  sessionLocale = locale;
  try { localStorage.setItem(storageKey, locale); } catch { /* Keep the session choice. */ }
  window.dispatchEvent(new Event(changeEvent));
}

type LanguageContext = { locale: Locale; setLocale: typeof setLocale; t: (message: string, values?: Record<string, string | number>) => string };
const Context = createContext<LanguageContext | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  // The server snapshot stays Italian to avoid hydration mismatches. Saved
  // preferences take over on the client without changing the selected country.
  const locale = useSyncExternalStore(subscribe, snapshot, () => "it" as Locale);
  const value = useMemo(() => ({ locale, setLocale,
    t: (message: string, values?: Record<string, string | number>) => translate(locale, message, values),
  }), [locale]);
  useEffect(() => {
    const previous = document.documentElement.lang;
    document.documentElement.lang = locale;
    return () => { document.documentElement.lang = previous; };
  }, [locale]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useLocale() {
  const context = useContext(Context);
  if (!context) throw new Error("useLocale requires LocaleProvider");
  return context;
}
