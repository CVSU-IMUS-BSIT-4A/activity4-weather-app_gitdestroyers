import { useState, useEffect, useRef } from 'react';
import { getWeather, getForecast, type Weather, type Forecast, type DailyForecast, type HourlyForecast } from './api';
import { 
  getRecentSearches, 
  addRecentSearch, 
  filterCities, 
  formatTime, 
  formatDate,
  formatFullDate
} from './utils';
import { WeatherIcon } from './WeatherIcon';
import './style.css';

type ForecastTab = 'Temperature' | 'Precipitation' | 'Wind';

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('Imus, Cavite');
  const [weather, setWeather] = useState<Weather | null>(null);
  const [originalWeather, setOriginalWeather] = useState<Weather | null>(null);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [units, setUnits] = useState<'metric' | 'imperial'>('metric');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteResults, setAutocompleteResults] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<ForecastTab>('Temperature');
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
  const [displayedHourly, setDisplayedHourly] = useState<HourlyForecast[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load units from URL query param
    const params = new URLSearchParams(window.location.search);
    const urlUnits = params.get('units');
    const initialUnits = (urlUnits === 'imperial' || urlUnits === 'metric') ? urlUnits : 'metric';
    setUnits(initialUnits);

    // Load recent searches
    setRecentSearches(getRecentSearches());

    // Load initial weather
    fetchWeatherData(selectedCity, initialUnits);
  }, []);

  useEffect(() => {
    // Update URL when units change
    const params = new URLSearchParams(window.location.search);
    params.set('units', units);
    window.history.replaceState({}, '', `?${params.toString()}`);
  }, [units]);

  useEffect(() => {
    // Handle click outside to close autocomplete
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowAutocomplete(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      setAutocompleteResults(filterCities(searchQuery));
      setShowAutocomplete(true);
    } else {
      setAutocompleteResults([]);
      setShowAutocomplete(false);
    }
  }, [searchQuery]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      handleSearch(searchQuery.trim());
    }
  }

  async function fetchWeatherData(city: string, unit: 'metric' | 'imperial') {
    setError(null);
    setLoading(true);
    try {
      const [weatherData, forecastData] = await Promise.all([
        getWeather(city, unit),
        getForecast(city, unit)
      ]);
      setWeather(weatherData);
      setOriginalWeather(weatherData); // Store original weather data
      setForecast(forecastData);
      setSelectedCity(city);
      setSelectedDayIndex(0); // Reset to first day when new city is searched
      // Set initial displayed hourly data (first 24 hours)
      setDisplayedHourly(forecastData.hourly.slice(0, 24));
      addRecentSearch(city);
      setRecentSearches(getRecentSearches());
      setShowAutocomplete(false);
      setSearchQuery('');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to fetch weather data.');
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(city: string) {
    fetchWeatherData(city, units);
  }

  function handleUnitToggle(newUnit: 'metric' | 'imperial') {
    if (newUnit !== units && selectedCity) {
      setUnits(newUnit);
      fetchWeatherData(selectedCity, newUnit);
    }
  }

  function getCurrentTime() {
    return new Date().toLocaleString('en-US', { 
      weekday: 'long', 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  }

  function getWindUnit() {
    return units === 'imperial' ? 'mph' : 'km/h';
  }

  function getTempUnit() {
    return units === 'imperial' ? '°F' : '°C';
  }

  function handleDayClick(dayIndex: number, day: DailyForecast) {
    setSelectedDayIndex(dayIndex);
    
    // If clicking on today (index 0), reset to original weather data
    if (dayIndex === 0 && forecast && originalWeather) {
      setDisplayedHourly(forecast.hourly.slice(0, 24));
      setWeather(originalWeather); // Restore original weather data
      return;
    }
    
    // Update displayed hourly data and current weather for selected day
    if (forecast && weather) {
      const selectedDate = new Date(day.date);
      const dayStart = new Date(selectedDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(selectedDate);
      dayEnd.setHours(23, 59, 59, 999);
      
      // Filter hourly data for the selected day
      const dayHourly = forecast.hourly.filter((h) => {
        const hDate = new Date(h.time);
        return hDate >= dayStart && hDate <= dayEnd;
      });
      
      if (dayHourly.length > 0) {
        // Update displayed hourly data
        setDisplayedHourly(dayHourly.slice(0, 24));
        
        // Calculate averages for the selected day
        const avgTemp = Math.round(
          dayHourly.reduce((sum, h) => sum + h.temperature, 0) / dayHourly.length
        );
        const avgFeelsLike = Math.round(
          dayHourly.reduce((sum, h) => sum + h.temperature, 0) / dayHourly.length
        );
        const avgWind = dayHourly.length > 0
          ? dayHourly.reduce((sum, h) => sum + h.windSpeed, 0) / dayHourly.length
          : 0;
        
        // Update weather display with selected day's data
        setWeather({
          ...weather,
          temperature: avgTemp,
          feelsLike: avgFeelsLike,
          condition: day.condition,
          icon: day.icon,
          windSpeed: avgWind,
        });
      } else {
        // If no hourly data for that day, use daily forecast data
        setDisplayedHourly([]);
        const avgTemp = Math.round((day.max + day.min) / 2);
        setWeather({
          ...weather,
          temperature: avgTemp,
          feelsLike: avgTemp,
          condition: day.condition,
          icon: day.icon,
        });
      }
    }
  }

  function getGraphData() {
    // Use displayedHourly if available (for selected day), otherwise use forecast.hourly
    const displayHours = displayedHourly.length > 0 
      ? displayedHourly.slice(0, 24)
      : forecast?.hourly.slice(0, 24) || [];
    
    if (displayHours.length === 0) return [];
    
    switch (activeTab) {
      case 'Temperature':
        return displayHours.map((h) => ({
          x: h.time,
          y: h.temperature,
          label: `${h.temperature}${getTempUnit()}`,
          value: h.temperature,
        }));
      case 'Precipitation':
        return displayHours.map((h) => ({
          x: h.time,
          y: h.precipitation,
          label: `${h.precipitation}%`,
          value: h.precipitation,
        }));
      case 'Wind':
        return displayHours.map((h) => ({
          x: h.time,
          y: h.windSpeed,
          label: `${Math.round(h.windSpeed)} ${getWindUnit()}`,
          value: h.windSpeed,
        }));
      default:
        return [];
    }
  }

  function getGraphColor() {
    switch (activeTab) {
      case 'Temperature':
        return '#FFD700';
      case 'Precipitation':
        return '#4A90E2';
      case 'Wind':
        return '#888888';
      default:
        return '#FFD700';
    }
  }

  function getGraphGradientId() {
    return `${activeTab.toLowerCase()}Gradient`;
  }

  function renderGraph() {
    const graphData = getGraphData();
    if (graphData.length === 0) return null;
    
    const color = getGraphColor();
    const gradientId = getGraphGradientId();
    
    // Calculate min/max for scaling
    const values = graphData.map(d => d.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue || 1;
    
    return (
      <>
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.1" />
          </linearGradient>
        </defs>
        
        {/* Area fill */}
        <path
          d={(() => {
            const points = graphData.map((d, i) => {
              const x = (i / (graphData.length - 1)) * 800;
              const y = 120 - ((d.value - minValue) / range) * 100;
              return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
            });
            return points.join(' ') + ` L 800 120 L 0 120 Z`;
          })()}
          fill={`url(#${gradientId})`}
        />
        
        {/* Line */}
        <path
          d={(() => {
            const points = graphData.map((d, i) => {
              const x = (i / (graphData.length - 1)) * 800;
              const y = 120 - ((d.value - minValue) / range) * 100;
              return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
            });
            return points.join(' ');
          })()}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
        />
        
        {/* Data points */}
        {graphData.map((d, i) => {
          const x = (i / (graphData.length - 1)) * 800;
          const y = 120 - ((d.value - minValue) / range) * 100;
          
          // Show labels every 3 hours or at key points
          const showLabel = i % 3 === 0 || i === graphData.length - 1;
          
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="4" fill={color} />
              {showLabel && (
                <text
                  x={x}
                  y={y - 12}
                  textAnchor="middle"
                  fill="#fff"
                  fontSize="11"
                  fontWeight="600"
                >
                  {activeTab === 'Temperature' ? `${d.value}°` : 
                   activeTab === 'Precipitation' ? `${d.value}%` :
                   Math.round(d.value)}
                </text>
              )}
            </g>
          );
        })}
      </>
    );
  }

  function getDisplayHours() {
    // Use displayedHourly if available (for selected day), otherwise use forecast.hourly
    return displayedHourly.length > 0 
      ? displayedHourly.slice(0, 24)
      : forecast?.hourly.slice(0, 24) || [];
  }

  return (
    <div className="weather-app">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <div className="location-section">
            <span className="location-text">
              Results for <strong>{selectedCity}</strong>
            </span>
            <button className="menu-btn">⋮</button>
          </div>
          <div className="weather-info-section">
            <h1 className="weather-title">Weather</h1>
            <div className="time-condition">
              <div>
                {selectedDayIndex === 0 
                  ? getCurrentTime() 
                  : formatFullDate(forecast?.daily[selectedDayIndex]?.date || new Date())
                }
              </div>
              <div>{weather?.condition || 'Loading...'}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="search-bar-container" ref={searchRef}>
        <form onSubmit={handleSearchSubmit} className="search-form">
          <input
            type="text"
            className="search-input-main"
            placeholder="Search for a city..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value.trim()) {
                setShowAutocomplete(true);
              }
            }}
            onFocus={() => {
              if (searchQuery.trim() || recentSearches.length > 0) {
                setShowAutocomplete(true);
              }
            }}
          />
          <button type="submit" className="search-submit-btn">
            Search
          </button>
        </form>
        
        {/* Autocomplete Dropdown */}
        {showAutocomplete && (autocompleteResults.length > 0 || recentSearches.length > 0) && (
          <div className="autocomplete-dropdown">
            {autocompleteResults.length > 0 && (
              <div className="autocomplete-list">
                {autocompleteResults.map((city, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="autocomplete-item"
                    onClick={() => handleSearch(city)}
                  >
                    {city}
                  </button>
                ))}
              </div>
            )}
            {recentSearches.length > 0 && (
              <div className="recent-searches">
                <div className="recent-searches-header">Recent Searches</div>
                {recentSearches.map((city, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="recent-search-item"
                    onClick={() => handleSearch(city)}
                  >
                    {city}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Content */}
      {error && <div className="error-message">{error}</div>}
      
      {weather && forecast && (
        <>
          {/* Current Weather */}
          <div className="current-weather">
            <div className="weather-icon-container">
              <WeatherIcon 
                condition={weather.condition}
                icon={weather.icon}
                className="weather-icon-large"
              />
            </div>
            <div className="temperature-section">
              <div className="temperature">{weather.temperature}</div>
              <div className="unit-toggle">
                <button
                  className={`unit-btn ${units === 'metric' ? 'active' : ''}`}
                  onClick={() => handleUnitToggle('metric')}
                >
                  °C
                </button>
                <button
                  className={`unit-btn ${units === 'imperial' ? 'active' : ''}`}
                  onClick={() => handleUnitToggle('imperial')}
                >
                  °F
                </button>
              </div>
            </div>
            <div className="weather-details">
              <div>Feels like: {weather.feelsLike}{getTempUnit()}</div>
              <div>Precipitation: {
                displayedHourly.length > 0 
                  ? Math.round(displayedHourly.reduce((sum, h) => sum + h.precipitation, 0) / displayedHourly.length)
                  : forecast.hourly[0]?.precipitation || 0
              }%</div>
              <div>Humidity: {weather.humidity}%</div>
              <div>Wind: {Math.round(weather.windSpeed)} {getWindUnit()}</div>
            </div>
          </div>

          {/* Forecast Tabs */}
          <div className="forecast-tabs">
            <button
              className={`forecast-tab ${activeTab === 'Temperature' ? 'active' : ''}`}
              onClick={() => setActiveTab('Temperature')}
            >
              Temperature
            </button>
            <button
              className={`forecast-tab ${activeTab === 'Precipitation' ? 'active' : ''}`}
              onClick={() => setActiveTab('Precipitation')}
            >
              Precipitation
            </button>
            <button
              className={`forecast-tab ${activeTab === 'Wind' ? 'active' : ''}`}
              onClick={() => setActiveTab('Wind')}
            >
              Wind
            </button>
          </div>

          {/* Hourly Forecast Graph */}
          <div className="hourly-forecast">
            <div className="graph-container">
              <svg className="temperature-graph" viewBox="0 0 800 140">
                {renderGraph()}
              </svg>
              <div className="graph-labels">
                {getDisplayHours().map((h, i) => {
                  // Show 8 labels evenly distributed
                  const totalLabels = 8;
                  const interval = Math.floor(getDisplayHours().length / (totalLabels - 1));
                  const showLabel = i % interval === 0 || i === getDisplayHours().length - 1;
                  
                  return (
                    <div key={i} className="graph-label">
                      {showLabel ? formatTime(h.time) : ''}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Daily Forecast */}
          <div className="daily-forecast">
            {forecast.daily.slice(0, 14).map((day, idx) => (
              <div 
                key={idx} 
                className={`day-card ${idx === selectedDayIndex ? 'active' : ''}`}
                onClick={() => handleDayClick(idx, day)}
                style={{ cursor: 'pointer' }}
              >
                <div className="day-name">{formatDate(day.date)}</div>
                <WeatherIcon 
                  condition={day.condition}
                  icon={day.icon}
                  className="day-icon"
                />
                <div className="day-temps">
                  <span className="day-temp-high">{day.max}°</span>
                  <span className="day-temp-low">{day.min}°</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {loading && !weather && (
        <div className="loading">Loading weather data...</div>
      )}
    </div>
  );
}
