/**
 * Format time based on language
 * Arabic: ٢٣:٠٠, French: 23h00, English: 11 PM
 */
export function formatTimeByLanguage(date: Date, language: string): string {
  const localeMap: Record<string, string> = {
    en: "en-US",
    fr: "fr-FR",
    ar: "ar-SA",
    es: "es-ES",
  };

  const locale = localeMap[language] || "en-US";

  if (language === "ar") {
    // Arabic: Use Arabic-Indic numerals
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const arabicHours = hours.toString().replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[parseInt(d)]);
    const arabicMinutes = minutes.toString().replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[parseInt(d)]);
    return `${arabicHours}:${arabicMinutes.padStart(2, "٠")}`;
  }

  if (language === "fr") {
    // French: 23h00 format
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${hours}h${minutes.toString().padStart(2, "0")}`;
  }

  // English and others: Use standard locale formatting
  return date.toLocaleTimeString(locale, {
    hour: "numeric",
    minute: "2-digit",
    hour12: language === "en",
  });
}

/**
 * Format date based on language using Intl.DateTimeFormat
 */
export function formatDateByLanguage(date: Date, language: string): string {
  const localeMap: Record<string, string> = {
    en: "en-US",
    fr: "fr-FR",
    ar: "ar-SA",
    es: "es-ES",
  };

  const locale = localeMap[language] || "en-US";

  return date.toLocaleDateString(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format day of week based on language
 */
export function formatDayOfWeekByLanguage(dateStr: string | undefined, language: string): string {
  if (!dateStr) return "—";
  try {
    const date = new Date(dateStr);
    const localeMap: Record<string, string> = {
      en: "en-US",
      fr: "fr-FR",
      ar: "ar-SA",
      es: "es-ES",
    };
    const locale = localeMap[language] || "en-US";
    return date.toLocaleDateString(locale, { weekday: "short" });
  } catch {
    return "—";
  }
}

