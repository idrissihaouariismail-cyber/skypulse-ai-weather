# Weather Analysis Decision Logic

## System Overview

Rule-based weather analysis system that selects ONE dominant condition using priority-based decision logic.

## Priority Order (Highest to Lowest)

1. **Rain / Storm** (Highest Priority)
   - Thunderstorms
   - Heavy rain
   - Snow
   - Regular rain

2. **Extreme Temperatures**
   - Extreme heat (≥35°C / ≥95°F)
   - Extreme cold (≤0°C / ≤32°F)

3. **Strong Wind**
   - Wind speed ≥ 30 km/h

4. **High Humidity**
   - Humidity ≥ 70%

5. **Stable / Normal Weather** (Lowest Priority)
   - Clear skies
   - Cloudy (no precipitation)
   - Default fallback

## Decision Logic (Pseudo-code)

```
FUNCTION generateWeatherAnalysis(current, unit):
  
  // Step 1: Detect all conditions
  isStormy = condition contains "thunder" OR "storm"
  isHeavyRain = condition contains "heavy" AND "rain"
  isRainy = condition contains "rain" OR "drizzle"
  isSnowy = condition contains "snow"
  isVeryHot = temp >= 35°C OR temp >= 95°F
  isVeryCold = temp <= 0°C OR temp <= 32°F
  isStrongWind = windSpeed >= 30 km/h
  isHighHumidity = humidity >= 70%
  isClear = condition contains "clear" OR "sunny"
  isCloudy = condition contains "cloud"
  
  // Step 2: Priority-based decision (ONE condition only)
  IF isStormy THEN
    RETURN "Thunderstorms Today"
  ELSE IF isHeavyRain THEN
    RETURN "Heavy Rain Today"
  ELSE IF isSnowy THEN
    RETURN "Snow Today"
  ELSE IF isRainy THEN
    RETURN "Rain Today"
  ELSE IF isVeryHot THEN
    RETURN "Extreme Heat Today"
  ELSE IF isVeryCold THEN
    RETURN "Freezing Conditions Today"
  ELSE IF isStrongWind THEN
    RETURN "Strong Winds Today"
  ELSE IF isHighHumidity THEN
    RETURN "High Humidity Today"
  ELSE IF isClear THEN
    RETURN "Clear Weather Today"
  ELSE IF isCloudy THEN
    RETURN "Cloudy Today"
  ELSE
    RETURN "Stable Weather Today"
  END IF
  
END FUNCTION
```

## TypeScript Implementation

```typescript
export function generateWeatherAnalysis(
  current: CurrentWeather,
  unit: "C" | "F"
): WeatherAnalysis {
  // Condition detection
  const isStormy = condition.includes("thunder") || condition.includes("storm");
  const isHeavyRain = condition.includes("heavy") && condition.includes("rain");
  const isRainy = condition.includes("rain") || condition.includes("drizzle");
  const isVeryHot = (unit === "C" && temp >= 35) || (unit === "F" && temp >= 95);
  const isVeryCold = (unit === "C" && temp <= 0) || (unit === "F" && temp <= 32);
  const isStrongWind = windSpeed >= 30;
  const isHighHumidity = humidity >= 70;

  // Priority-based decision (early return = ONE condition only)
  if (isStormy) return { title: "...", summary: "...", decision: "..." };
  if (isHeavyRain) return { title: "...", summary: "...", decision: "..." };
  if (isRainy) return { title: "...", summary: "...", decision: "..." };
  if (isVeryHot) return { title: "...", summary: "...", decision: "..." };
  // ... etc
}
```

## Example Outputs

### Scenario 1: Thunderstorm
**Input:** condition="thunderstorm", temp=25°C, windSpeed=15 km/h, humidity=80%

**Output:**
```
Title: "Thunderstorms Today"
Summary: "Thunderstorms with heavy rain and lightning are expected today. These conditions are dangerous."
Decision: "Stay indoors today. Avoid all outdoor activities and driving."
```

### Scenario 2: Extreme Heat
**Input:** condition="clear", temp=38°C, windSpeed=10 km/h, humidity=60%

**Output:**
```
Title: "Extreme Heat Today"
Summary: "Temperatures will reach 38°C with high humidity today. These conditions are dangerous."
Decision: "Stay indoors during peak hours (2-5 PM) today. Drink water every 30 minutes."
```

### Scenario 3: Heavy Rain
**Input:** condition="heavy rain", temp=18°C, windSpeed=20 km/h, humidity=85%

**Output:**
```
Title: "Heavy Rain Today"
Summary: "Heavy rainfall will continue throughout today. This will cause flooding and dangerous road conditions."
Decision: "Avoid all travel today. Stay indoors and away from flooded areas."
```

### Scenario 4: Strong Wind
**Input:** condition="clear", temp=22°C, windSpeed=45 km/h, humidity=50%

**Output:**
```
Title: "Strong Winds Today"
Summary: "Winds will reach 45 km/h today. These winds make outdoor activities dangerous."
Decision: "Secure outdoor items immediately. Avoid driving on highways today. Stay away from trees."
```

### Scenario 5: High Humidity
**Input:** condition="cloudy", temp=28°C, windSpeed=8 km/h, humidity=75%

**Output:**
```
Title: "High Humidity Today"
Summary: "Humidity levels are 75% today. This makes the air feel heavy and uncomfortable."
Decision: "Stay in air-conditioned spaces today. Drink extra water and avoid strenuous outdoor activities."
```

### Scenario 6: Clear Weather
**Input:** condition="clear", temp=24°C, windSpeed=12 km/h, humidity=55%

**Output:**
```
Title: "Clear Weather Today"
Summary: "Sunny skies with temperatures around 24°C today. Conditions are ideal for activities."
Decision: "Excellent day for outdoor plans today. Perfect weather for walks and outdoor activities."
```

## Rules

1. **ONE Condition Only**: Early return ensures only the highest priority condition is selected
2. **No Contradictions**: Each condition is mutually exclusive
3. **No Uncertainty**: All statements are definitive ("will", "is", not "may", "might")
4. **Clear Judgment**: Every output has a definitive decision
5. **No Technical Jargon**: Plain language only

## Testing Scenarios

| Condition | Temp | Wind | Humidity | Expected Output |
|-----------|------|------|----------|----------------|
| thunderstorm | 25°C | 15 | 80% | Thunderstorms Today |
| heavy rain | 18°C | 20 | 85% | Heavy Rain Today |
| rain | 15°C | 10 | 70% | Rain Today |
| clear | 38°C | 10 | 60% | Extreme Heat Today |
| clear | -5°C | 8 | 50% | Freezing Conditions Today |
| clear | 22°C | 45 | 50% | Strong Winds Today |
| cloudy | 28°C | 8 | 75% | High Humidity Today |
| clear | 24°C | 12 | 55% | Clear Weather Today |

## Performance

- **Time Complexity**: O(1) - Simple if/else chain
- **Space Complexity**: O(1) - No data structures
- **Execution Time**: < 1ms per analysis
- **No External Dependencies**: Pure rule-based logic

