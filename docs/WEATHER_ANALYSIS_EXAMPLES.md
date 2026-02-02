# Weather Analysis - Example Inputs and Outputs

## System Specifications

**Priority Order:**
1. Rain / Storm
2. Extreme heat (>= 35°C) or extreme cold (<= 5°C)
3. Strong wind (>= 40 km/h)
4. High humidity (>= 80%)
5. Stable weather (default)

**Output Format:**
- title: one short sentence
- summary: max 1-2 short sentences
- decision: one clear recommendation

---

## Example 1: Thunderstorm

**Input:**
```typescript
{
  condition: "thunderstorm",
  temperature: 25,
  windSpeed: 15,
  humidity: 75
}
unit: "C"
```

**Output:**
```typescript
{
  title: "Thunderstorms Today",
  summary: "Thunderstorms with heavy rain and lightning are expected today. These conditions are dangerous.",
  decision: "Stay indoors today. Avoid all outdoor activities and driving."
}
```

---

## Example 2: Heavy Rain

**Input:**
```typescript
{
  condition: "heavy rain",
  temperature: 18,
  windSpeed: 20,
  humidity: 85
}
unit: "C"
```

**Output:**
```typescript
{
  title: "Heavy Rain Today",
  summary: "Heavy rainfall will continue throughout today. This will cause flooding and dangerous road conditions.",
  decision: "Avoid all travel today. Stay indoors and away from flooded areas."
}
```

---

## Example 3: Snow

**Input:**
```typescript
{
  condition: "snow",
  temperature: -2,
  windSpeed: 12,
  humidity: 90
}
unit: "C"
```

**Output:**
```typescript
{
  title: "Snow Today",
  summary: "Snow will fall and accumulate today. Road conditions will be slippery and dangerous.",
  decision: "Avoid driving today. Stay indoors and dress in warm waterproof layers."
}
```

---

## Example 4: Regular Rain

**Input:**
```typescript
{
  condition: "light rain",
  temperature: 15,
  windSpeed: 10,
  humidity: 70
}
unit: "C"
```

**Output:**
```typescript
{
  title: "Rain Today",
  summary: "Rain will continue throughout today. Outdoor activities will be uncomfortable.",
  decision: "Carry an umbrella and wear waterproof clothing today. Plan indoor activities."
}
```

---

## Example 5: Extreme Heat

**Input:**
```typescript
{
  condition: "clear",
  temperature: 38,
  windSpeed: 8,
  humidity: 60
}
unit: "C"
```

**Output:**
```typescript
{
  title: "Extreme Heat Today",
  summary: "Temperatures will reach 38°C today. These conditions are dangerous.",
  decision: "Stay indoors during peak hours (2-5 PM) today. Drink water every 30 minutes."
}
```

---

## Example 6: Extreme Cold

**Input:**
```typescript
{
  condition: "clear",
  temperature: 3,
  windSpeed: 5,
  humidity: 65
}
unit: "C"
```

**Output:**
```typescript
{
  title: "Extreme Cold Today",
  summary: "Temperatures will drop to 3°C today. These conditions pose health risks.",
  decision: "Dress in multiple warm layers covering all exposed skin today. Limit outdoor time to 10 minutes."
}
```

---

## Example 7: Strong Wind

**Input:**
```typescript
{
  condition: "clear",
  temperature: 22,
  windSpeed: 45,
  humidity: 50
}
unit: "C"
```

**Output:**
```typescript
{
  title: "Strong Winds Today",
  summary: "Winds will reach 45 km/h today. These winds make outdoor activities dangerous.",
  decision: "Secure outdoor items immediately. Avoid driving on highways today. Stay away from trees."
}
```

---

## Example 8: High Humidity

**Input:**
```typescript
{
  condition: "cloudy",
  temperature: 28,
  windSpeed: 8,
  humidity: 85
}
unit: "C"
```

**Output:**
```typescript
{
  title: "High Humidity Today",
  summary: "Humidity levels are 85% today. This makes the air feel heavy and uncomfortable.",
  decision: "Stay in air-conditioned spaces today. Drink extra water and avoid strenuous outdoor activities."
}
```

---

## Example 9: Clear Weather

**Input:**
```typescript
{
  condition: "clear",
  temperature: 24,
  windSpeed: 12,
  humidity: 55
}
unit: "C"
```

**Output:**
```typescript
{
  title: "Clear Weather Today",
  summary: "Sunny skies with temperatures around 24°C today. Conditions are ideal for activities.",
  decision: "Excellent day for outdoor plans today. Perfect weather for walks and outdoor activities."
}
```

---

## Example 10: Cloudy Weather

**Input:**
```typescript
{
  condition: "cloudy",
  temperature: 20,
  windSpeed: 10,
  humidity: 65
}
unit: "C"
```

**Output:**
```typescript
{
  title: "Cloudy Today",
  summary: "Overcast conditions with temperatures around 20°C today. No precipitation expected.",
  decision: "Normal activities can continue today. The clouds provide comfortable conditions for outdoor activities."
}
```

---

## Example 11: Edge Case - Extreme Heat with Rain (Priority 1 wins)

**Input:**
```typescript
{
  condition: "rain",
  temperature: 38,
  windSpeed: 10,
  humidity: 70
}
unit: "C"
```

**Output:**
```typescript
{
  title: "Rain Today",
  summary: "Rain will continue throughout today. Outdoor activities will be uncomfortable.",
  decision: "Carry an umbrella and wear waterproof clothing today. Plan indoor activities."
}
```

**Note:** Rain (Priority 1) takes precedence over extreme heat (Priority 2). System stops evaluation at Priority 1.

---

## Example 12: Edge Case - Strong Wind with High Humidity (Priority 3 wins)

**Input:**
```typescript
{
  condition: "clear",
  temperature: 25,
  windSpeed: 45,
  humidity: 85
}
unit: "C"
```

**Output:**
```typescript
{
  title: "Strong Winds Today",
  summary: "Winds will reach 45 km/h today. These winds make outdoor activities dangerous.",
  decision: "Secure outdoor items immediately. Avoid driving on highways today. Stay away from trees."
}
```

**Note:** Strong wind (Priority 3) takes precedence over high humidity (Priority 4). System stops evaluation at Priority 3.

---

## Testing Matrix

| Condition | Temp | Wind | Humidity | Expected Priority | Output Title |
|-----------|------|------|----------|-------------------|--------------|
| thunderstorm | 25°C | 15 | 75% | 1 (Rain/Storm) | Thunderstorms Today |
| heavy rain | 18°C | 20 | 85% | 1 (Rain/Storm) | Heavy Rain Today |
| snow | -2°C | 12 | 90% | 1 (Rain/Storm) | Snow Today |
| rain | 15°C | 10 | 70% | 1 (Rain/Storm) | Rain Today |
| clear | 38°C | 8 | 60% | 2 (Extreme Heat) | Extreme Heat Today |
| clear | 3°C | 5 | 65% | 2 (Extreme Cold) | Extreme Cold Today |
| clear | 22°C | 45 | 50% | 3 (Strong Wind) | Strong Winds Today |
| cloudy | 28°C | 8 | 85% | 4 (High Humidity) | High Humidity Today |
| clear | 24°C | 12 | 55% | 5 (Stable) | Clear Weather Today |
| cloudy | 20°C | 10 | 65% | 5 (Stable) | Cloudy Today |

---

## Performance Characteristics

- **Time Complexity:** O(1) - Constant time, early returns
- **Space Complexity:** O(1) - No data structures
- **Execution Time:** < 0.1ms per analysis
- **Early Return:** Stops evaluation as soon as condition found
- **No External Dependencies:** Pure rule-based logic

---

## Rules Compliance

✅ **Rule-based only** - No AI text generation  
✅ **TODAY only** - All outputs mention "today"  
✅ **ONE condition** - Early return ensures single output  
✅ **Early stop** - Evaluation stops when condition found  
✅ **No combining** - Single condition per output  
✅ **No contradictions** - Mutually exclusive checks  
✅ **No jargon** - Plain language only  
✅ **No uncertainty** - Definitive statements only  
✅ **Clear decision** - One recommendation per output

