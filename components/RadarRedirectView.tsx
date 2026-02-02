import React, { useState, useCallback } from "react";
import CloseButton from "./CloseButton";
import {
  getRadarUrl,
  getRadarOpenExternally,
  setRadarOpenExternally,
} from "../services/radarRedirect";
import { useLanguage } from "../src/context/LanguageContext";

interface Props {
  lat: number | null;
  lon: number | null;
  onClose: () => void;
}

/**
 * Smart Radar Redirect view.
 * In-app WebView (iframe) with Windy; "Open in external browser" saves preference.
 * No Radar page UI beyond minimal bar + label; smooth loading.
 */
export default function RadarRedirectView({ lat, lon, onClose }: Props) {
  const { t } = useLanguage();
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const url = getRadarUrl(lat, lon);

  const handleOpenInBrowser = useCallback(() => {
    setRadarOpenExternally(true);
    window.open(url, "_blank", "noopener,noreferrer");
    onClose();
  }, [url, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Minimal top bar: back + open in browser */}
      <div className="flex-shrink-0 flex items-center justify-between gap-3 px-3 py-2 bg-black/90 border-b border-white/10">
        <CloseButton onClose={onClose} className="text-white" />
        <button
          type="button"
          onClick={handleOpenInBrowser}
          className="text-sm font-medium text-white/90 hover:text-white underline"
        >
          {t("radar.openInBrowser")}
        </button>
      </div>

      {/* Non-intrusive label */}
      <div className="flex-shrink-0 px-3 py-1.5 bg-black/70">
        <p className="text-xs text-white/70">{t("radar.externalLabel")}</p>
      </div>

      {/* Loading indicator – minimal, until iframe loads */}
      {!iframeLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"
              aria-hidden
            />
            <span className="text-sm text-white/70">{t("radar.loading")}</span>
          </div>
        </div>
      )}

      {/* In-app WebView (iframe) */}
      <div className="flex-1 min-h-0 relative">
        <iframe
          src={url}
          title={t("radar")}
          className="absolute inset-0 w-full h-full border-0"
          onLoad={() => setIframeLoaded(true)}
        />
      </div>
    </div>
  );
}
