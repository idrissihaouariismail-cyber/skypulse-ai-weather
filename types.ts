export enum TemperatureUnit {
  CELSIUS = "C",
  FAHRENHEIT = "F",
}

/**
 * Single normalized weather "slot" used everywhere (current, hourly, daily).
 * All modules rely on this; no component interprets raw API data.
 */
export type NormalizedWeatherSlot = {
  temperature?: number;
  feelsLike?: number;
  humidity?: number;
  pressure?: number;
  windSpeed?: number;
  windDeg?: number;
  clouds?: number;           // 0–100 (%)
  pop?: number;              // precipitation probability 0–100
  rain1h?: number;           // mm
  rain3h?: number;           // mm
  conditionCode?: number;   // OpenWeather weather id (2xx=thunder, 3xx=drizzle, 5xx=rain, 6xx=snow, 7xx=atmosphere, 800=clear, 80x=clouds)
  condition?: string;        // description
  timestamp?: number;       // ms (for day/night)
  sunrise?: number;         // ms (optional, for day/night)
  sunset?: number;           // ms (optional, for day/night)
};

export type CurrentWeather = NormalizedWeatherSlot & {
  location?: string;
  /** "HH:MM" for display (SunriseSunsetCard, etc.) */
  sunriseFormatted?: string;
  sunsetFormatted?: string;
  uvIndex?: number;
};

export type ForecastItem = {
  date: string;
  min: number;
  max: number;
  condition?: string;
  conditionCode?: number;
  /** Normalized slot for icon/logic (e.g. noon representative) */
  slot?: NormalizedWeatherSlot;
};

/** Single hour in 48h forecast; same normalized semantics as current */
export type HourlyItem = NormalizedWeatherSlot & {
  /** Display label (e.g. "14:00"); derived from dt + timezone when available */
  time: string;
  temp: number;
  /** Unix seconds UTC (for deriving local hour from timezone) */
  dt?: number;
};

/** Air Quality: numeric data only. All display text is rule-based from AQI ranges (i18n). */
export type AirQualityData = {
  aqi: number;
  components?: Record<string, number>;
};

/**
 * Unified weather condition from ONE global function.
 * Used everywhere: current, 48h, 5-day, AI Insight. Icons must never contradict.
 */
export type UnifiedCondition =
  | "CLEAR"
  | "PARTLY_CLOUDY"
  | "CLOUDY"
  | "RAIN"
  | "THUNDER"
  | "SNOW"
  | "SNOW_RAIN";

/**
 * Central weather state – single source of truth.
 * All UI (current, 48h, 5-day, AI Insight, Air Quality, Radar) reads ONLY from this.
 * derivedConditions are computed on read via getUnifiedCondition(slot); do not store.
 */
export type WeatherData = {
  current: CurrentWeather;
  /** Raw 3-hour API slots for 48h forecast */
  forecast?: ForecastItem[];
  hourly?: HourlyItem[];
  airQuality?: AirQualityData;
  /** City timezone: shift in seconds from UTC (from API); for local hour labels */
  timezoneOffsetSeconds?: number;
  /** Moon illumination 0–100 from API (moon_illumination or moon_phase); optional */
  moonIllumination?: number;
};

/** Alias: central weather state = WeatherData; radar uses current + derived insight */
export type CentralWeatherState = WeatherData;

/** Derived from context only – no component may compute these */
export type WeatherDerived = {
  /** AQI category label key (rule-based: 0–50 good, 51–100 moderate, etc.) */
  aqiCategoryKey: string;
  /** Single fixed explanatory text key for AQI range (rule-based, translated) */
  aqiRangeTextKey: string;
  /** 2–3 short lines describing how the weather may feel. Weather vars only; no AQI. */
  insightKeys: { feelKeys: string[] };
};

export type Settings = {
  unit: TemperatureUnit;
  theme: "dark" | "light" | "auto";
  language: string;
  savedLocations?: string[];
};