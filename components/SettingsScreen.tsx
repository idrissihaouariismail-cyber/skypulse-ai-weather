// src/components/SettingsScreen.tsx
import React from "react";
import CloseButton from "./CloseButton";
import WeatherBackground from "./WeatherBackground";
import WeatherIcon from "./WeatherIcon";
import { Settings, TemperatureUnit } from "../types";
import { useLanguage } from "../src/context/LanguageContext";
import { useWeather } from "../src/context/WeatherContext";

const getLanguageName = (code: string): string => {
  const names: Record<string, string> = {
    en: "English",
    ar: "Arabic",
    fr: "French",
    es: "Spanish",
    de: "German",
  };
  return names[code] || code.toUpperCase();
};

interface Props {
  settings: Settings;
  setSettings: (s: Settings) => void;
  detectedLanguage: string;
  onClose: () => void;
  goTo: (view: { id: string; name: string }) => void;
}

export default function SettingsScreen({ settings, setSettings, detectedLanguage, onClose, goTo }: Props) {
  const { language, setLanguage, t } = useLanguage();
  const { weather } = useWeather();
  
  const handleUnitChange = (unit: TemperatureUnit) => {
    setSettings({ ...settings, unit });
  };

  const handleThemeChange = (theme: Settings["theme"]) => {
    setSettings({ ...settings, theme });
  };

  const handleLanguageChange = (lang: "en" | "fr" | "ar" | "es") => {
    setLanguage(lang);
    // Also update settings to keep them in sync
    setSettings({ ...settings, language: lang });
  };

  // Get the effective language (auto -> detected, otherwise the selected one)
  const effectiveLanguage = settings.language === "auto" ? detectedLanguage : settings.language;
  const detectedLanguageName = getLanguageName(detectedLanguage);

  return (
    <div className="relative min-h-screen bg-[#0b0f16] text-white">
      <CloseButton onClose={onClose} />
      <div className="relative pt-16 px-6">
        <h1 className="text-2xl font-semibold mb-6">{t("settings")}</h1>

      <div className="pb-10 space-y-5">
        {/* Language */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
          <div className="text-lg font-semibold">{t("language")}</div>
          <div className="space-y-2">
            {/* Auto (Detected) Option */}
            <button
              onClick={() => {
                // For "auto", use detected language
                const detectedLang = detectedLanguage as "en" | "fr" | "ar" | "es";
                if (["en", "fr", "ar", "es"].includes(detectedLang)) {
                  handleLanguageChange(detectedLang);
                }
                setSettings({ ...settings, language: "auto" });
              }}
              className={`w-full flex items-center gap-3 rounded-xl border border-white/10 px-4 py-3 transition ${
                settings.language === "auto"
                  ? "bg-blue-500 text-white border-blue-400"
                  : "bg-white/5 text-gray-200 hover:bg-white/10"
              }`}
            >
              <span className="text-xl">🌐</span>
              <div className="flex flex-col items-start flex-1">
                <span className="text-base font-medium">{t("autoDetected")}</span>
                <span className="text-sm opacity-80">
                  {t("current")}: {detectedLanguageName}
                </span>
              </div>
              {settings.language === "auto" && (
                <span className="text-sm">✓</span>
              )}
            </button>
            
            {/* Manual Language Options */}
            {(["en", "ar", "fr", "es"] as const).map((langCode) => {
              const isActive = language === langCode;
              return (
                <button
                  key={langCode}
                  onClick={() => handleLanguageChange(langCode)}
                  className={`w-full flex items-center gap-3 rounded-xl border border-white/10 px-4 py-3 transition ${
                    isActive
                      ? "bg-blue-500 text-white border-blue-400"
                      : "bg-white/5 text-gray-200 hover:bg-white/10"
                  }`}
                >
                  <span className="text-xl">
                    {langCode === "en" ? "🇬🇧" : langCode === "ar" ? "🇸🇦" : langCode === "fr" ? "🇫🇷" : langCode === "es" ? "🇪🇸" : "🇩🇪"}
                  </span>
                  <div className="flex flex-col items-start flex-1">
                    <span className="text-base font-medium">{getLanguageName(langCode)}</span>
                  </div>
                  {isActive && (
                    <span className="text-sm">✓</span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="text-xs text-gray-400 pt-2">
            {t("active")}: {getLanguageName(language)}
          </div>
        </div>

        {/* Units */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
          <div className="text-lg font-semibold">{t("units")}</div>
          <div className="flex items-center gap-3">
            {[
              { label: "°C", value: TemperatureUnit.CELSIUS },
              { label: "°F", value: TemperatureUnit.FAHRENHEIT },
            ].map((u) => {
              const active = settings.unit === u.value;
              return (
                <button
                  key={u.value}
                  onClick={() => handleUnitChange(u.value)}
                  className={`flex-1 py-3 rounded-full text-center border border-white/10 transition ${
                    active ? "bg-blue-500 text-white" : "bg-white/5 text-gray-200 hover:bg-white/10"
                  }`}
                >
                  {u.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Theme */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
          <div className="text-lg font-semibold">{t("theme")}</div>
          <div className="flex items-center gap-3">
            {["auto", "light", "dark"].map((t) => {
              const active = settings.theme === t;
              return (
                <button
                  key={t}
                  onClick={() => handleThemeChange(t as Settings["theme"])}
                  className={`flex-1 py-3 rounded-full border border-white/10 text-sm capitalize transition ${
                    active ? "bg-blue-500 text-white" : "bg-white/5 text-gray-200 hover:bg-white/10"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Preview - Dynamic Weather Card */}
        <div className="rounded-xl border border-white/10 overflow-hidden bg-white/5">
          <div className="relative h-40 overflow-hidden">
            {weather?.current ? (
              <>
                <div className="absolute inset-0">
                  <WeatherBackground
                    condition={(weather.current.condition || "clear").toLowerCase()}
                  />
                </div>
                <div className="absolute inset-0 bg-black/30" />
                <div className="relative h-full w-full flex items-center justify-between px-5 z-10">
                  <div className="text-left">
                    <div className="text-3xl font-bold text-white">
                      {Math.round(weather.current.temperature ?? 0)}°{settings.unit}
                    </div>
                    <div className="text-sm text-white/90">
                      {weather.current.condition || "Clear"} – Live Preview
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <WeatherIcon
                      condition={weather.current.condition || "clear"}
                      size={48}
                      className="drop-shadow-lg"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="relative h-full w-full flex items-center justify-center bg-gray-800/50">
                <div className="text-white/60 text-sm">Loading weather preview...</div>
              </div>
            )}
          </div>
        </div>

        {/* About */}
        <div className="rounded-xl border border-white/10 bg-white/5">
          <button
            onClick={() => goTo({ id: "about_app", name: t("aboutAppTitle") })}
            className="w-full flex items-center justify-between px-4 py-4 text-left border-b border-white/10 hover:bg-white/5 transition"
          >
            <span className="text-base text-white">{t("aboutAppTitle")}</span>
            <span className="text-xl text-white/60">{">"}</span>
          </button>
          <button
            onClick={() => goTo({ id: "privacy_policy", name: t("privacyPolicyTitle") })}
            className="w-full flex items-center justify-between px-4 py-4 text-left hover:bg-white/5 transition"
          >
            <span className="text-base text-white">{t("privacyPolicyTitle")}</span>
            <span className="text-xl text-white/60">{">"}</span>
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}