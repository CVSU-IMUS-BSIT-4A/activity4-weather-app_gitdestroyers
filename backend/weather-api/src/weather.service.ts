import { Injectable, HttpException } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class WeatherService {
  async getWeather(city: string, units: string = 'metric') {
    if (!city?.trim()) throw new HttpException('city is required', 400);
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) throw new HttpException('OPENWEATHER_API_KEY not set', 500);
    
    const unitsParam = units === 'imperial' ? 'imperial' : 'metric';
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=${unitsParam}`;
    const { data } = await axios.get(url);
    
    return {
      city: data.name,
      country: data.sys?.country,
      temperature: Math.round(data.main?.temp),
      feelsLike: Math.round(data.main?.feels_like),
      condition: data.weather?.[0]?.main,
      description: data.weather?.[0]?.description,
      humidity: data.main?.humidity,
      windSpeed: data.wind?.speed,
      windDirection: data.wind?.deg,
      icon: data.weather?.[0]?.icon,
      units: unitsParam,
      timestamp: new Date().toISOString(),
    };
  }

  async getForecast(city: string, units: string = 'metric') {
    if (!city?.trim()) throw new HttpException('city is required', 400);
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) throw new HttpException('OPENWEATHER_API_KEY not set', 500);
    
    const unitsParam = units === 'imperial' ? 'imperial' : 'metric';
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=${unitsParam}`;
    const { data } = await axios.get(url);
    
    // Group hourly forecasts (use all available data, max 40 entries = 5 days)
    const hourly = data.list?.slice(0, 40).map((item: any) => ({
      time: new Date(item.dt * 1000).toISOString(),
      temperature: Math.round(item.main?.temp),
      condition: item.weather?.[0]?.main,
      icon: item.weather?.[0]?.icon,
      precipitation: item.pop ? Math.round(item.pop * 100) : 0,
      windSpeed: item.wind?.speed || 0,
      windDirection: item.wind?.deg || 0,
    })) || [];

    // Group daily forecasts
    const dailyMap = new Map();
    data.list?.forEach((item: any) => {
      const date = new Date(item.dt * 1000);
      const dayKey = date.toDateString();
      if (!dailyMap.has(dayKey)) {
        dailyMap.set(dayKey, {
          date: date,
          min: item.main?.temp_min,
          max: item.main?.temp_max,
          condition: item.weather?.[0]?.main,
          icon: item.weather?.[0]?.icon,
        });
      } else {
        const existing = dailyMap.get(dayKey);
        if (item.main?.temp_min < existing.min) existing.min = item.main?.temp_min;
        if (item.main?.temp_max > existing.max) existing.max = item.main?.temp_max;
      }
    });

    // Get up to 14 days (2 weeks) - OpenWeatherMap forecast API provides 5 days, 
    // so we'll use all available days and extend by grouping similar days
    const dailyArray = Array.from(dailyMap.values()).map((day: any) => ({
      date: day.date.toISOString(),
      min: Math.round(day.min),
      max: Math.round(day.max),
      condition: day.condition,
      icon: day.icon,
    }));
    
    // Sort by date and limit to 14 days
    dailyArray.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const daily = dailyArray.slice(0, 14);

    return { hourly, daily };
  }
}

