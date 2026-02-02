import React, { useCallback } from "react";
import { canShowRadarInterstitial, showRadarInterstitial } from "../services/ads";
import { useLanguage } from "../src/context/LanguageContext";

interface Props {
  /** Called when user may proceed to Radar (after ad if shown, or immediately if skipped). */
  onContinue: () => void;
}

/**
 * Lightweight intro screen before Radar. One action: "Continuer".
 * Shows interstitial only if cooldown (15 min) has passed; otherwise skips ad and continues.
 */
export default function RadarAdGate({ onContinue }: Props) {
  const { t } = useLanguage();

  const handleContinue = useCallback(() => {
    if (canShowRadarInterstitial()) {
      showRadarInterstitial().then(onContinue);
    } else {
      onContinue();
    }
  }, [onContinue]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0f0f0f] text-white min-h-screen">
      <div className="text-5xl mb-4" aria-hidden>
        📡
      </div>
      <h1 className="text-xl font-semibold text-white/95 mb-8">
        {t("radar.gate.title")}
      </h1>
      <button
        type="button"
        onClick={handleContinue}
        className="px-8 py-3 rounded-xl bg-white/15 hover:bg-white/25 text-white font-medium border border-white/20 transition-colors"
        aria-label={t("radar.continue")}
      >
        {t("radar.continue")}
      </button>
    </div>
  );
}
