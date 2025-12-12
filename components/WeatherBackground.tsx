import React from 'react';

interface WeatherBackgroundProps {
  condition: string;
  className?: string;
}

const WeatherBackground: React.FC<WeatherBackgroundProps> = ({ condition, className = "" }) => {

  const backgroundMap: Record<string, string> = {
    clear: "/weather-images/clear.jpg",
    partly_cloudy: "/weather-images/partly_cloudy.jpg",
    overcast: "/weather-images/overcast.jpg",
    fog: "/weather-images/fog.jpg",
    heavy_fog: "/weather-images/heavy_fog.jpg",
    dust_storm: "/weather-images/dust_storm.jpg",
    aurora: "/weather-images/aurora.jpg",
    windy: "/weather-images/windy.jpg",
    stormy: "/weather-images/stormy.jpg",
    thunderstorm: "/weather-images/thunderstorm.jpg",
    light_rain: "/weather-images/light_rain.jpg",
    rain: "/weather-images/rain.jpg",
    heavy_rain: "/weather-images/heavy_rain.jpg",
    snow: "/weather-images/snow.jpg",
    heavy_snow: "/weather-images/heavy_snow.jpg",
    blowing_snow: "/weather-images/blowing_snow.jpg",
  };

  const normalize = (cond: string) => {
    const c = cond.toLowerCase();

    if (c.includes("partly") || c.includes("scattered")) return "partly_cloudy";
    if (c.includes("overcast") || c.includes("cloudy")) return "overcast";
    if (c.includes("fog") || c.includes("mist") || c.includes("haze")) return "fog";
    if (c.includes("heavy fog")) return "heavy_fog";
    if (c.includes("dust") || c.includes("sand")) return "dust_storm";
    if (c.includes("aurora")) return "aurora";
    if (c.includes("wind")) return "windy";
    if (c.includes("storm") && !c.includes("thunder")) return "stormy";
    if (c.includes("thunder")) return "thunderstorm";
    if (c.includes("light rain")) return "light_rain";
    if (c.includes("heavy rain")) return "heavy_rain";
    if (c.includes("rain")) return "rain";
    if (c.includes("heavy snow")) return "heavy_snow";
    if (c.includes("snow") && c.includes("blowing")) return "blowing_snow";
    if (c.includes("snow")) return "snow";
    if (c.includes("clear") || c.includes("sun")) return "clear";

    return "clear";
  };

  const finalCondition = normalize(condition);
  const bgImage = backgroundMap[finalCondition] || backgroundMap["clear"];

  return (
    <div className={`absolute top-0 left-0 w-full h-[300px] overflow-hidden ${className}`}>
      
      {/* خلفية الصورة */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "brightness(0.9) contrast(1.1) blur(1px)",
        }}
      />

      {/* Overlay gradient باش يجي بحال Stitch */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#00000090]" />
    </div>
  );
};

export default WeatherBackground;