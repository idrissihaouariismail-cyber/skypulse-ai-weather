import React from "react";
import { useLanguage } from "../src/context/LanguageContext";

interface Props {
  /** Moon illumination 0–100 from API */
  moonIllumination: number;
}

/**
 * Standalone Moon Brightness card. Show only when isNight && moon data exists.
 * Cool moon colors (white/blue); no sun icons or yellow.
 */
export default function MoonBrightnessCard({ moonIllumination }: Props) {
  const { t } = useLanguage();
  const pct = Math.max(0, Math.min(100, Math.round(moonIllumination)));

  return (
    <div className="mt-6 px-4">
      <div className="rounded-xl border border-white/15 bg-gradient-to-b from-slate-800/80 to-slate-900/80 backdrop-blur-md p-5 shadow-lg overflow-hidden">
        <div className="flex flex-col items-center">
          {/* Large circular moon with illumination mask */}
          <div
            className="relative w-24 h-24 rounded-full flex items-center justify-center mb-4"
            style={{
              background: "radial-gradient(circle at 30% 30%, rgba(220, 230, 255, 0.95), rgba(180, 200, 255, 0.6))",
              boxShadow: "0 0 30px rgba(180, 200, 255, 0.35), inset -2px -2px 8px rgba(0,0,0,0.2)",
            }}
          >
            {/* Dark overlay for unlit portion (right side) – illumination from left */}
            <div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                background: `linear-gradient(to right, transparent 0%, transparent ${pct}%, rgba(30, 40, 70, 0.92) ${pct}%, rgba(30, 40, 70, 0.92) 100%)`,
              }}
            />
            {/* Soft glow */}
            <div
              className="absolute inset-0 rounded-full pointer-events-none opacity-60"
              style={{
                boxShadow: "inset 0 0 20px rgba(200, 215, 255, 0.2)",
              }}
            />
          </div>
          <p className="text-sm text-white/90 font-medium">
            {t("moonBrightness")}: {pct}%
          </p>
        </div>
      </div>
    </div>
  );
}
