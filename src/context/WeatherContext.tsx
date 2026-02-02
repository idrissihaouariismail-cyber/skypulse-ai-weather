/**
 * Central weather state – single source of truth.
 * All UI (current, 48h, 5-day, AI Insight, Air Quality, Radar) reads ONLY from this.
 * No component may interpret weather data independently; use derived + getUnifiedCondition for icons.
 */

import React, { createContext, useContext, useCallback, useEffect, useMemo, useState, ReactNode } from "react";
import { TemperatureUnit, WeatherData, WeatherDerived } from "../../types";
import { getComposedWeather } from "../../services/composeWeather";
import { computeDerived } from "../../services/derivedWeather";

interface WeatherContextValue {
  weather: WeatherData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  derived: WeatherDerived | null;
  setLocationLabel: (label: string) => void;
}

const WeatherContext = createContext<WeatherContextValue | undefined>(undefined);

interface WeatherProviderProps {
  children: ReactNode;
  /** Coordinates to fetch weather for */
  lat: number | null;
  lon: number | null;
  unit: TemperatureUnit;
  /** Optional display label (e.g. city name); applied to weather.current.location after fetch */
  locationLabel?: string | null;
}

export function WeatherProvider({ children, lat, lon, unit, locationLabel: initialLocationLabel }: WeatherProviderProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationLabel, setLocationLabelState] = useState<string | null>(initialLocationLabel ?? null);

  const fetchWeather = useCallback(async () => {
    if (lat == null || lon == null || isNaN(lat) || isNaN(lon)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getComposedWeather(lat, lon, unit);
      const label = initialLocationLabel ?? locationLabel;
      if (label != null) {
        data.current.location = label;
      }
      setWeather(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch weather data.";
      setError(message);
      setWeather((prev) => prev);
    } finally {
      setLoading(false);
    }
  }, [lat, lon, unit]); // Do not depend on labels to avoid refetch when only label changes

  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  const setLocationLabel = useCallback((label: string) => {
    setLocationLabelState(label);
    setWeather((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        current: { ...prev.current, location: label },
      };
    });
  }, []);

  const derived = useMemo(() => (weather ? computeDerived(weather) : null), [weather]);

  const value: WeatherContextValue = useMemo(
    () => ({
      weather,
      loading,
      error,
      refetch: fetchWeather,
      derived,
      setLocationLabel,
    }),
    [weather, loading, error, fetchWeather, derived, setLocationLabel]
  );

  return <WeatherContext.Provider value={value}>{children}</WeatherContext.Provider>;
}

export function useWeather(): WeatherContextValue {
  const ctx = useContext(WeatherContext);
  if (ctx === undefined) {
    throw new Error("useWeather must be used within a WeatherProvider");
  }
  return ctx;
}
