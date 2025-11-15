import axios from 'axios';

export const api = axios.create({ baseURL: 'http://localhost:3004' });

export type Weather = {
  city: string;
  country?: string;
  temperature: number;
  feelsLike: number;
  condition: string;
  description: string;
  humidity: number;
  windSpeed: number;
  windDirection?: number;
  icon: string;
  units: 'metric' | 'imperial';
  timestamp: string;
};

export type HourlyForecast = {
  time: Date | string;
  temperature: number;
  condition: string;
  icon: string;
  precipitation: number;
  windSpeed: number;
  windDirection?: number;
};

export type DailyForecast = {
  date: Date | string;
  min: number;
  max: number;
  condition: string;
  icon: string;
};

export type Forecast = {
  hourly: HourlyForecast[];
  daily: DailyForecast[];
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, { data: Weather | Forecast; timestamp: number }>();

function getCacheKey(endpoint: string, city: string, units: string) {
  return `${endpoint}:${city}:${units}`;
}

function getCached<T>(key: string): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data as T;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: Weather | Forecast) {
  cache.set(key, { data, timestamp: Date.now() });
}

export async function getWeather(city: string, units: 'metric' | 'imperial' = 'metric'): Promise<Weather> {
  const cacheKey = getCacheKey('weather', city, units);
  const cached = getCached<Weather>(cacheKey);
  if (cached) return cached;

  const { data } = await api.get<Weather>('/weather', { params: { city, units } });
  setCache(cacheKey, data);
  return data;
}

export async function getForecast(city: string, units: 'metric' | 'imperial' = 'metric'): Promise<Forecast> {
  const cacheKey = getCacheKey('forecast', city, units);
  const cached = getCached<Forecast>(cacheKey);
  if (cached) {
    // Parse dates from cached data
    return {
      ...cached,
      hourly: cached.hourly.map(h => ({ ...h, time: new Date(h.time) })),
      daily: cached.daily.map(d => ({ ...d, date: new Date(d.date) })),
    };
  }

  const { data } = await api.get<any>('/weather/forecast', { params: { city, units } });
  // Parse dates from API response
  const forecast: Forecast = {
    hourly: data.hourly?.map((h: any) => ({ ...h, time: new Date(h.time) })) || [],
    daily: data.daily?.map((d: any) => ({ ...d, date: new Date(d.date) })) || [],
  };
  setCache(cacheKey, forecast);
  return forecast;
}
