import React, { useState, useEffect, useRef } from "react";
import { getCitySuggestions } from "../services/weather";

export interface City {
  lat: number;
  lon: number;
  name?: string;
  country?: string;
}

interface Props {
  onCitySelect: (city: City) => void;
  placeholder?: string;
  className?: string;
  initialValue?: string; // Only used for initial display, not controlled
}

/**
 * City Search Autocomplete Component
 * - Autocomplete works from first letter
 * - Input value is always a string (never coordinates)
 * - Suggestions show city name + country
 */
export default function CitySearchAutocomplete({
  onCitySelect,
  placeholder = "Search city...",
  className = "",
  initialValue = "",
}: Props) {
  // State 1: searchQuery - controls input value only (always string, never coordinates)
  const [searchQuery, setSearchQuery] = useState<string>(() => {
    // Filter out coordinates from initial value
    const isCoordinate = /^-?\d+\.?\d*,\s*-?\d+\.?\d*$/.test(initialValue.trim());
    return isCoordinate ? "" : initialValue;
  });
  
  // State 2: suggestions - autocomplete results
  const [suggestions, setSuggestions] = useState<City[]>([]);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  // Refs
  const abortControllerRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Debounce ONLY the API call (300ms). Input value updates immediately via onChange.
  // Trigger suggestions after 2 characters.
  useEffect(() => {
    const query = searchQuery.trim();

    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsLoading(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setIsLoading(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timeoutId = setTimeout(async () => {
      try {
        const results = await getCitySuggestions(query, controller.signal);
        if (!controller.signal.aborted) {
          setSuggestions(results);
          setShowSuggestions(results.length > 0);
          setSelectedIndex(-1);
        }
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Error fetching suggestions:", error);
          setSuggestions([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [searchQuery]);

  // Close suggestions on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fully controlled: update state on every keystroke (no debounce on typing).
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setSearchQuery(newQuery);
    if (newQuery.trim().length >= 2 && suggestions.length > 0) {
      setShowSuggestions(true);
    }
    if (newQuery.trim().length < 2) {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  const handleSelect = (city: City) => {
    // Format display name: "City, Country" (never coordinates)
    const displayName = city.name && city.country 
      ? `${city.name}, ${city.country}`
      : city.name || "";
    
    // Update searchQuery to show city name (never coordinates)
    setSearchQuery(displayName);
    setShowSuggestions(false);
    setSuggestions([]);
    
    // Notify parent with selected city { name, lat, lon }
    onCitySelect({
      name: city.name,
      lat: city.lat,
      lon: city.lon,
      country: city.country,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === "Enter" && searchQuery.trim()) {
        // Allow Enter to submit current input if no suggestions
        return;
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelect(suggestions[selectedIndex]);
        } else if (suggestions.length > 0) {
          handleSelect(suggestions[0]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        break;
    }
  };

  // Highlight matching text
  const highlightText = (text: string, query: string) => {
    if (!query || !text) return text;
    const regex = new RegExp(`(${query})`, "gi");
    const parts = text.split(regex);
    return (
      <>
        {parts.map((part, index) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <span key={index} className="font-bold text-white">
              {part}
            </span>
          ) : (
            <span key={index}>{part}</span>
          )
        )}
      </>
    );
  };

  return (
    <div className={`relative ${className}`} style={{ overflow: "visible" }}>
      {/* Controlled input: value bound to searchQuery, updates on every onChange */}
      <input
        ref={inputRef}
        type="text"
        value={searchQuery}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (suggestions.length > 0 && searchQuery.trim().length >= 2) {
            setShowSuggestions(true);
          }
        }}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full px-4 py-2 bg-transparent text-white placeholder-white/70 text-sm outline-none"
      />

      {/* Suggestions: high z-index, pointer-events, not clipped by overflow */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-2 bg-black/60 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto"
          style={{ zIndex: 9999, pointerEvents: "auto" }}
        >
          {suggestions.map((city, index) => (
            <button
              key={`${city.lat}-${city.lon}-${index}`}
              type="button"
              onClick={() => handleSelect(city)}
              className={`w-full px-4 py-3 text-left hover:bg-white/10 transition-colors ${
                index === selectedIndex ? "bg-white/15" : ""
              }`}
            >
              <div className="font-semibold text-white text-sm">
                {highlightText(city.name || "", searchQuery.trim())}
              </div>
              {city.country && (
                <div className="text-xs text-white/60 mt-0.5">
                  {city.country}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Loading Indicator (only when 2+ chars and fetching) */}
      {isLoading && searchQuery.trim().length >= 2 && (
        <div
          className="absolute top-full left-0 right-0 mt-2 px-4 py-2 text-white/60 text-sm bg-black/60 backdrop-blur-xl border border-white/20 rounded-2xl"
          style={{ zIndex: 9999, pointerEvents: "auto" }}
        >
          Loading...
        </div>
      )}
    </div>
  );
}
