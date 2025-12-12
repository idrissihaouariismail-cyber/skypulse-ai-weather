export function detectDeviceLanguage(): string {
  if (typeof navigator !== "undefined" && navigator.language) {
    return navigator.language.split("-")[0];
  }
  return "en";
}

export const DEFAULT_LOCALE = "en";

export const VIEWS = {
  en: "English",
  fr: "French",
  ar: "Arabic",
  es: "Spanish",
};
