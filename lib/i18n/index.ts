import Polyglot from "node-polyglot";
import { en } from "./locales/en";
import { he } from "./locales/he";

const locales = {
  EN: en,
  HE: he,
};

export type Locale = "EN" | "HE";

export function createPolyglot(locale: Locale): Polyglot {
  const polyglot = new Polyglot({
    phrases: locales[locale],
    locale: locale.toLowerCase(),
  });

  return polyglot;
}

export function getTranslator(locale: Locale) {
  const polyglot = createPolyglot(locale);
  return (key: string, options?: Polyglot.InterpolationOptions) => {
    return polyglot.t(key, options);
  };
}
