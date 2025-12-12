
export enum TemperatureUnit {
  CELSIUS = "C",
  FAHRENHEIT = "F",
}

export type CurrentWeather = {
  temperature?: number;
  condition?: string;
  windSpeed?: number;
  humidity?: number;
  pressure?: number;
  uvIndex?: number;
  location?: string;
  sunrise?: string;
  sunset?: string;
};

export type ForecastItem = {
  date: string;
  min: number;
  max: number;
  condition?: string;
};

export type WeatherData = {
  current: CurrentWeather;
  forecast?: ForecastItem[];
  airQuality?: { aqi: number; components?: Record<string, number> };
};

export type Settings = {
  unit: TemperatureUnit;
  theme: "dark" | "light" | "auto";
  language: string;
  savedLocations?: string[];
};