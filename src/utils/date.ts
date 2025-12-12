// src/utils/date.ts

export const MOROCCAN_MONTHS: Record<number, string> = {
  0: "يناير",
  1: "فبراير",
  2: "مارس",
  3: "أبريل",
  4: "ماي",
  5: "يونيو",
  6: "يوليوز",
  7: "غشت",
  8: "شتنبر",
  9: "أكتوبر",
  10: "نونبر",
  11: "دجنبر",
};

/**
 * Format dashboard date. For Arabic we force Gregorian calendar and
 * replace month name with Moroccan variant above.
 * Returns full string like: "الخميس، 11 دجنبر 2025"
 */
export function formatDashboardDate(date: Date, language: string) {
  // base options
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  };

  if (language === "ar" || language === "ar-MA") {
    // use Intl to get weekday, day, year in Arabic words but ensure Latin digits.
    // We'll replace the month token with Moroccan month name.
    const parts = new Intl.DateTimeFormat("ar-u-ca-gregory-nu-latn", options).formatToParts(date);

    // build object from parts
    const map: Record<string, string> = {};
    parts.forEach(p => (map[p.type] = p.value));

    // month index from Date -> use MOROCCAN_MONTHS
    const monthName = MOROCCAN_MONTHS[date.getMonth()];

    // Compose: weekday، day month year  (same order as examples)
    // Example: "الخميس، 11 دجنبر 2025"
    const weekday = map["weekday"] ?? "";
    const day = map["day"] ?? date.getDate().toString();
    const year = map["year"] ?? date.getFullYear().toString();

    return `${weekday}، ${day} ${monthName} ${year}`;
  }

  if (language === "fr") {
    return new Intl.DateTimeFormat("fr-FR", options).format(date);
  }

  return new Intl.DateTimeFormat("en-US", options).format(date);
}

/**
 * Format hour label for 48-hour tiles. Always return LATIN digits.
 * Use 2-digit for consistent UI (00..23).
 */
export function formatHourLabel(date: Date, language: string) {
  const options: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    hour12: false,
  };

  const locale =
    language === "ar" || language === "ar-MA" ? "ar-u-nu-latn" :
    language === "fr" ? "fr-FR" :
    "en-US";

  // This returns strings like "00", "01", "23" using Latin digits when locale '...-nu-latn' is used
  return new Intl.DateTimeFormat(locale, options).format(date);
}

/**
 * Format day of week only
 * Used in forecast cards
 */
export function formatDayOfWeek(dateStr: string | undefined, language: string): string {
  if (!dateStr) return "—";
  try {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = {
      weekday: "short",
    };

    if (language === "ar" || language === "ar-MA") {
      return new Intl.DateTimeFormat("ar-u-ca-gregory-nu-latn", options).format(date);
    }

    if (language === "fr") {
      return new Intl.DateTimeFormat("fr-FR", options).format(date);
    }

    return new Intl.DateTimeFormat("en-US", options).format(date);
  } catch {
    return "—";
  }
}
