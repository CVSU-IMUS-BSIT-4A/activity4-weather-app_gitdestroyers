const RECENT_SEARCHES_KEY = 'weather_recent_searches';
const MAX_RECENT_SEARCHES = 10;

export function getRecentSearches(): string[] {
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function addRecentSearch(city: string): void {
  if (!city?.trim()) return;
  const searches = getRecentSearches();
  const normalized = city.trim();
  const filtered = searches.filter((s: string) => s.toLowerCase() !== normalized.toLowerCase());
  const updated = [normalized, ...filtered].slice(0, MAX_RECENT_SEARCHES);
  try {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {
    // Ignore localStorage errors
  }
}

export function clearRecentSearches(): void {
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch {
    // Ignore localStorage errors
  }
}

// Popular cities for autocomplete
export const POPULAR_CITIES = [
  'Manila', 'Makati', 'Quezon City', 'Cebu City', 'Davao City',
  'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix',
  'London', 'Paris', 'Tokyo', 'Sydney', 'Toronto',
  'Singapore', 'Dubai', 'Hong Kong', 'Bangkok', 'Seoul',
  'Berlin', 'Rome', 'Madrid', 'Amsterdam', 'Barcelona',
  'Mumbai', 'Delhi', 'Bangalore', 'Jakarta', 'Kuala Lumpur',
];

export function filterCities(query: string): string[] {
  if (!query.trim()) return POPULAR_CITIES.slice(0, 5);
  const lowerQuery = query.toLowerCase();
  return POPULAR_CITIES.filter(city => 
    city.toLowerCase().includes(lowerQuery)
  ).slice(0, 10);
}

export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}

export function formatFullDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { 
    weekday: 'long',
    month: 'short', 
    day: 'numeric' 
  });
}

export function getWeatherIcon(icon: string): string {
  return `https://openweathermap.org/img/wn/${icon}@2x.png`;
}

export function getWeatherIconByCondition(condition: string, icon?: string): string {
  // If icon code is provided, use it directly (most accurate)
  if (icon) {
    return `https://openweathermap.org/img/wn/${icon}@2x.png`;
  }
  
  // Fallback to condition-based mapping if icon is not available
  const conditionLower = condition.toLowerCase();
  
  // Map weather conditions to appropriate icon codes
  if (conditionLower.includes('thunderstorm') || conditionLower.includes('storm')) {
    return 'https://openweathermap.org/img/wn/11d@2x.png'; // Thunderstorm
  } else if (conditionLower.includes('rain') || conditionLower.includes('drizzle')) {
    return 'https://openweathermap.org/img/wn/09d@2x.png'; // Rain
  } else if (conditionLower.includes('snow')) {
    return 'https://openweathermap.org/img/wn/13d@2x.png'; // Snow
  } else if (conditionLower.includes('cloud') || conditionLower.includes('overcast')) {
    return 'https://openweathermap.org/img/wn/04d@2x.png'; // Cloudy
  } else if (conditionLower.includes('clear') || conditionLower.includes('sun')) {
    return 'https://openweathermap.org/img/wn/01d@2x.png'; // Clear/Sunny
  } else if (conditionLower.includes('mist') || conditionLower.includes('fog') || conditionLower.includes('haze')) {
    return 'https://openweathermap.org/img/wn/50d@2x.png'; // Mist/Fog
  } else {
    // Default to partly cloudy
    return 'https://openweathermap.org/img/wn/02d@2x.png';
  }
}

