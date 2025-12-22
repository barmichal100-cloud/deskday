"use client";

import { createContext, useContext, ReactNode } from "react";
import type Polyglot from "node-polyglot";
import { Locale, createPolyglot } from "./index";

type I18nContextType = {
  t: (key: string, options?: Polyglot.InterpolationOptions) => string;
  locale: Locale;
};

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({
  children,
  locale,
}: {
  children: ReactNode;
  locale: Locale;
}) {
  const polyglot = createPolyglot(locale);

  const value: I18nContextType = {
    t: (key: string, options?: Polyglot.InterpolationOptions) =>
      polyglot.t(key, options),
    locale,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useTranslation must be used within I18nProvider");
  }
  return context;
}
