import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import CloseButton from "./CloseButton";
import { getCoordinates } from "../services/weather";
import { useLanguage } from "../src/context/LanguageContext";
import { useWeather } from "../src/context/WeatherContext";
import { getRadarInsightKeys } from "../services/derivedWeather";
import { Settings } from "../types";

interface Props {
  settings: Settings;
  onClose: () => void;
}

const FIXED_ZOOM = 5;
const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || "";
const MAP_FADE_MS = 600;
const LAYER_CROSSFADE_MS = 300;
const INSIGHT_TYPING_DELAY_MS = 400;
const INSIGHT_TYPING_SPEED_MS = 48;
const INSIGHT_OPACITY_MS = 350;

const OPENWEATHER_LAYERS = {
  clouds: "clouds_new",
  wind: "wind_new",
} as const;

type RadarLayer = "clouds" | "wind";

/** Typing animation: delay then reveal text; opacity 0 → 1; no cursor. */
function TypingInsight({
  text,
  delayMs,
  speedMs,
  opacityMs,
  className,
}: {
  text: string;
  delayMs: number;
  speedMs: number;
  opacityMs: number;
  className?: string;
}) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);
  const [visible, setVisible] = useState(false);
  const indexRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setDisplayed("");
    setStarted(false);
    setVisible(false);
    indexRef.current = 0;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    const startDelay = setTimeout(() => {
      setStarted(true);
      setVisible(true);
    }, delayMs);

    return () => clearTimeout(startDelay);
  }, [text, delayMs]);

  useEffect(() => {
    if (!started || indexRef.current >= text.length) return;
    const t = setTimeout(() => {
      indexRef.current += 1;
      setDisplayed(text.slice(0, indexRef.current));
    }, speedMs);
    timeoutRef.current = t;
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [started, text, speedMs, displayed]);

  return (
    <span
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transition: `opacity ${opacityMs}ms ease-out`,
      }}
    >
      {displayed}
    </span>
  );
}

function isValidCoord(lat: number, lon: number): boolean {
  return (
    typeof lat === "number" &&
    typeof lon === "number" &&
    !Number.isNaN(lat) &&
    !Number.isNaN(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
}

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  return null;
}

export default function RadarMap({ settings, onClose }: Props) {
  const { t, language } = useLanguage();
  const { weather } = useWeather();
  const location = weather?.current?.location ?? "";
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null);
  const [selectedLayer, setSelectedLayer] = useState<RadarLayer>("clouds");
  const [loading, setLoading] = useState(true);
  const [mapVisible, setMapVisible] = useState(false);
  const [overlayOpacity, setOverlayOpacity] = useState(1);
  const crossfadeRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function resolveCoords() {
      if (!location) return;

      const latLonMatch = location.match(/^\s*(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)\s*$/);
      if (latLonMatch) {
        const lat = parseFloat(latLonMatch[1]);
        const lon = parseFloat(latLonMatch[3]);
        if (!cancelled && isValidCoord(lat, lon)) {
          setCoordinates([lat, lon]);
          setLoading(false);
        }
        return;
      }

      try {
        const coords = await getCoordinates(location);
        if (cancelled) return;
        if (coords != null && isValidCoord(coords.lat, coords.lon)) {
          setCoordinates([coords.lat, coords.lon]);
        }
        setLoading(false);
      } catch {
        if (!cancelled) setLoading(false);
      }
    }

    resolveCoords();
    return () => {
      cancelled = true;
    };
  }, [location]);

  useEffect(() => {
    if (!coordinates) return;
    const t = setTimeout(() => setMapVisible(true), 50);
    return () => clearTimeout(t);
  }, [coordinates]);

  const handleLayerChange = useCallback((layer: RadarLayer) => {
    if (layer === selectedLayer) return;
    if (crossfadeRef.current) clearTimeout(crossfadeRef.current);
    setOverlayOpacity(0);
    crossfadeRef.current = setTimeout(() => {
      crossfadeRef.current = null;
      setSelectedLayer(layer);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setOverlayOpacity(1));
      });
    }, LAYER_CROSSFADE_MS);
  }, [selectedLayer]);

  useEffect(() => {
    return () => {
      if (crossfadeRef.current) clearTimeout(crossfadeRef.current);
    };
  }, []);

  const radarInsightKey = `radar.insight.short.${selectedLayer}` as const;
  const insightKeys = useMemo(
    () => getRadarInsightKeys(weather, selectedLayer),
    [weather, selectedLayer]
  );
  const insightText = useMemo(
    () => insightKeys.map((k) => t(k)).join(" "),
    [insightKeys, t]
  );

  if (loading || !coordinates) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0f0f0f] text-white">
        <div
          className="h-10 w-10 rounded-full border-2 border-white/30 border-t-white animate-spin"
          aria-hidden
        />
        <p className="mt-4 text-sm text-white/80">{t("radar.loading")}</p>
      </div>
    );
  }

  const layerName = OPENWEATHER_LAYERS[selectedLayer];
  const overlayUrl = OPENWEATHER_API_KEY
    ? `https://tile.openweathermap.org/map/${layerName}/{z}/{x}/{y}.png?appid=${OPENWEATHER_API_KEY}`
    : null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#0f0f0f] text-white">
      <div className="absolute top-4 left-4 z-[1000]">
        <CloseButton onClose={onClose} />
      </div>

      {/* Radar Weather Insight: top center, 100% transparent, high-contrast text, thin border */}
      <div
        className="absolute left-1/2 -translate-x-1/2 z-[600] w-[90%] max-w-md rounded-xl pointer-events-none"
        style={{
          top: "5rem",
          padding: "0.875rem 1.25rem",
          marginLeft: "max(0px, env(safe-area-inset-left))",
          marginRight: "max(0px, env(safe-area-inset-right))",
          background: "transparent",
          border: "1px solid rgba(120, 230, 130, 0.5)",
          boxShadow: "none",
        }}
        aria-live="polite"
      >
        <p
          className="text-base font-semibold leading-relaxed"
          style={{
            color: "#a8ff88",
            textShadow:
              "0 0 10px rgba(168, 255, 136, 0.4), 0 1px 3px rgba(0, 0, 0, 0.35)",
          }}
          dir={language === "ar" ? "rtl" : "ltr"}
        >
          <TypingInsight
            key={`${insightText.slice(0, 40)}-${selectedLayer}`}
            text={insightText}
            delayMs={INSIGHT_TYPING_DELAY_MS}
            speedMs={INSIGHT_TYPING_SPEED_MS}
            opacityMs={INSIGHT_OPACITY_MS}
          />
        </p>
      </div>

      <div
        className="absolute inset-0 radar-map-fade-in"
        style={{
          height: "100vh",
          width: "100%",
          opacity: mapVisible ? 1 : 0,
          transition: `opacity ${MAP_FADE_MS}ms ease-out`,
        }}
      >
        <MapContainer
          center={coordinates}
          zoom={FIXED_ZOOM}
          minZoom={FIXED_ZOOM}
          maxZoom={FIXED_ZOOM}
          zoomControl={false}
          className="radar-map-leaflet h-full w-full"
          style={{ height: "100%", width: "100%" }}
        >
          <ChangeView center={coordinates} zoom={FIXED_ZOOM} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {overlayUrl && (
            <TileLayer
              url={overlayUrl}
              opacity={overlayOpacity}
              attribution="&copy; OpenWeatherMap"
            />
          )}
        </MapContainer>
      </div>

      <div className="absolute bottom-0 left-0 right-0 z-[500] pointer-events-none">
        <div className="pointer-events-auto px-4 pb-3 pt-3">
          <div
            className="rounded-xl border border-white/20 mx-auto px-4 py-3 max-w-full"
            style={{
              background: "rgba(0, 0, 0, 0.6)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
          >
            <p className="text-sm text-white/90 leading-relaxed">{t(radarInsightKey)}</p>
          </div>
        </div>
        <div className="pointer-events-auto px-4 pb-4">
          <div className="flex items-center justify-center gap-3 flex-wrap max-w-2xl mx-auto">
            <button
              type="button"
              onClick={() => handleLayerChange("clouds")}
              className={`radar-layer-btn radar-layer-btn--clouds ${
                selectedLayer === "clouds" ? "radar-layer-btn--active" : ""
              }`}
              aria-label={t("radar.clouds")}
              aria-pressed={selectedLayer === "clouds"}
            >
              <span className="radar-layer-icon" aria-hidden>
                ☁
              </span>
              <span className="text-xs font-medium">{t("radar.clouds")}</span>
            </button>
            <button
              type="button"
              onClick={() => handleLayerChange("wind")}
              className={`radar-layer-btn radar-layer-btn--wind ${
                selectedLayer === "wind" ? "radar-layer-btn--active" : ""
              }`}
              aria-label={t("radar.wind")}
              aria-pressed={selectedLayer === "wind"}
            >
              <span className="radar-layer-icon" aria-hidden>
                💨
              </span>
              <span className="text-xs font-medium">{t("radar.wind")}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
