import React from 'react';
import { 
  IoThunderstormSharp, 
  IoSunnySharp, 
  IoRainySharp, 
  IoCloudySharp, 
  IoPartlySunnySharp,
  IoSnowSharp,
  IoWaterSharp
} from 'react-icons/io5';

type WeatherIconProps = {
  condition: string;
  icon?: string;
  className?: string;
};

export function WeatherIcon({ condition, icon, className = '' }: WeatherIconProps) {
  const conditionLower = condition.toLowerCase();
  
  // Determine weather type based on condition and icon code
  let weatherType: 'storm' | 'rain' | 'sunny' | 'cloudy' | 'partly-cloudy' | 'snow' | 'mist' = 'cloudy';
  
  if (icon) {
    // Use icon code for more accurate detection
    if (icon.startsWith('11')) {
      weatherType = 'storm';
    } else if (icon.startsWith('09') || icon.startsWith('10')) {
      weatherType = 'rain';
    } else if (icon.startsWith('01')) {
      weatherType = 'sunny';
    } else if (icon.startsWith('02')) {
      weatherType = 'partly-cloudy';
    } else if (icon.startsWith('03') || icon.startsWith('04')) {
      weatherType = 'cloudy';
    } else if (icon.startsWith('13')) {
      weatherType = 'snow';
    } else if (icon.startsWith('50')) {
      weatherType = 'mist';
    }
  } else {
    // Fallback to condition-based detection
    if (conditionLower.includes('thunderstorm') || conditionLower.includes('storm')) {
      weatherType = 'storm';
    } else if (conditionLower.includes('rain') || conditionLower.includes('drizzle')) {
      weatherType = 'rain';
    } else if (conditionLower.includes('clear') || conditionLower.includes('sun')) {
      weatherType = 'sunny';
    } else if (conditionLower.includes('cloud')) {
      weatherType = 'cloudy';
    } else if (conditionLower.includes('snow')) {
      weatherType = 'snow';
    }
  }

  const iconSize = className.includes('large') ? 72 : className.includes('day-icon') ? 40 : 72;
  
  switch (weatherType) {
    case 'storm':
      return (
        <IoThunderstormSharp 
          size={iconSize} 
          className={className}
          style={{ color: '#FFD700' }}
        />
      );
    
    case 'rain':
      return (
        <IoRainySharp 
          size={iconSize} 
          className={className}
          style={{ color: '#4A90E2' }}
        />
      );
    
    case 'sunny':
      return (
        <IoSunnySharp 
          size={iconSize} 
          className={className}
          style={{ color: '#FFD700' }}
        />
      );
    
    case 'partly-cloudy':
      return (
        <IoPartlySunnySharp 
          size={iconSize} 
          className={className}
          style={{ color: '#FFD700' }}
        />
      );
    
    case 'snow':
      return (
        <IoSnowSharp 
          size={iconSize} 
          className={className}
          style={{ color: '#E0E0E0' }}
        />
      );
    
    case 'mist':
      return (
        <IoWaterSharp 
          size={iconSize} 
          className={className}
          style={{ color: '#B0B0B0', opacity: 0.7 }}
        />
      );
    
    default: // cloudy
      return (
        <IoCloudySharp 
          size={iconSize} 
          className={className}
          style={{ color: '#E0E0E0' }}
        />
      );
  }
}

