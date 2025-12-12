import React from "react";
import CloseButton from "./CloseButton";
import { useLanguage } from "../src/context/LanguageContext";

interface Props {
  onClose: () => void;
}

export default function AboutApp({ onClose }: Props) {
  const { t } = useLanguage();

  return (
    <div className="relative min-h-screen bg-[#0b0f16] text-white">
      <CloseButton onClose={onClose} />
      <div className="relative pt-16 px-6 pb-10">
        <h1 className="text-2xl font-semibold mb-6">{t("aboutAppTitle")}</h1>
        
        <div className="space-y-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-5 shadow-lg">
            <p className="text-base leading-relaxed text-white/90 mb-4">
              {t("about.paragraph1")}
            </p>
            <p className="text-base leading-relaxed text-white/90 mb-4">
              {t("about.paragraph2")}
            </p>
            <p className="text-base leading-relaxed text-white/90">
              {t("about.paragraph3")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

