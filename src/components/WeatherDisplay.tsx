import React, { useEffect, useState } from 'react';
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, Wind, MapPin } from 'lucide-react';

interface WeatherData {
  main: {
    temp: number;
  };
  weather: {
    id: number;
    main: string;
    description: string;
    icon: string;
  }[];
  name: string;
  sys?: {
    country: string;
  };
}

interface WeatherDisplayProps {
  compact?: boolean;
}

const WeatherDisplay: React.FC<WeatherDisplayProps> = ({ compact = false }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{lat: number, lon: number} | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    // Get user's location
    const getLocation = () => {
      setLocationLoading(true);
      setLocationError(null);
      
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setLocation({ lat: latitude, lon: longitude });
            setLocationLoading(false);
          },
          (error) => {
            console.error('Error getting location:', error);
            setLocationError('Could not get your location');
            setLocationLoading(false);
            // Fall back to default location (Hanoi)
            setLocation({ lat: 20.990974913316546, lon: 105.80822326658647 });
          },
          { timeout: 10000, enableHighAccuracy: true }
        );
      } else {
        setLocationError('Geolocation is not supported by your browser');
        setLocationLoading(false);
        // Fall back to default location (Hanoi)
        setLocation({ lat: 20.990974913316546, lon: 105.80822326658647 });
      }
    };
    
    getLocation();
  }, []);

  useEffect(() => {
    const fetchWeather = async () => {
      if (!location) return;
      
      try {
        setLoading(true);
        const apiKey = import.meta.env.VITE_OPENWEATHER_KEY || '6fd287330f4717ca4d55a6bb195ee261';
        
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lon}&appid=${apiKey}`
        );
        
        if (!response.ok) {
          throw new Error('Weather data not available');
        }
        
        const data = await response.json();
        setWeather(data);
      } catch (err) {
        setError('Failed to load weather data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (location) {
      fetchWeather();
      
      // Refresh weather data every 30 minutes
      const intervalId = setInterval(fetchWeather, 30 * 60 * 1000);
      return () => clearInterval(intervalId);
    }
  }, [location]);

  const getWeatherIcon = (weatherId: number) => {
    if (weatherId >= 200 && weatherId < 300) {
      return <CloudLightning className={compact ? "h-4 w-4" : "h-5 w-5"} />;
    } else if (weatherId >= 300 && weatherId < 600) {
      return <CloudRain className={compact ? "h-4 w-4" : "h-5 w-5"} />;
    } else if (weatherId >= 600 && weatherId < 700) {
      return <CloudSnow className={compact ? "h-4 w-4" : "h-5 w-5"} />;
    } else if (weatherId >= 700 && weatherId < 800) {
      return <Wind className={compact ? "h-4 w-4" : "h-5 w-5"} />;
    } else if (weatherId === 800) {
      return <Sun className={compact ? "h-4 w-4" : "h-5 w-5"} />;
    } else {
      return <Cloud className={compact ? "h-4 w-4" : "h-5 w-5"} />;
    }
  };

  const kelvinToCelsius = (kelvin: number) => {
    return Math.round(kelvin - 273.15);
  };

  if (locationLoading) {
    return (
      <div className={`flex items-center ${compact ? 'space-x-1' : 'space-x-2'}`}>
        <MapPin className={`animate-pulse text-gray-400 ${compact ? 'h-4 w-4' : 'h-5 w-5'}`} />
        <span className={`text-gray-400 ${compact ? 'text-xs' : 'text-sm'}`}>Locating...</span>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div className={`flex items-center ${compact ? 'space-x-1' : 'space-x-2'}`}>
        <Cloud className={`animate-pulse text-gray-400 ${compact ? 'h-4 w-4' : 'h-5 w-5'}`} />
        <span className={`text-gray-400 ${compact ? 'text-xs' : 'text-sm'}`}>Loading weather...</span>
      </div>
    );
  }

  if (locationError && !weather) {
    return (
      <div className={`flex items-center ${compact ? 'space-x-1' : 'space-x-2'}`}>
        <MapPin className={`text-yellow-400 ${compact ? 'h-4 w-4' : 'h-5 w-5'}`} />
        <span className={`text-gray-300 ${compact ? 'text-xs' : 'text-sm'}`}>Using default location</span>
      </div>
    );
  }

  if (error || !weather) {
    return null;
  }

  return (
    <div className={`flex items-center ${compact ? 'space-x-1' : 'space-x-2'}`}>
      {getWeatherIcon(weather.weather[0].id)}
      <div className="flex flex-col">
        <span className={`text-gray-300 ${compact ? 'text-xs' : 'text-sm'}`}>
          {weather.name}{weather.sys?.country ? `, ${weather.sys.country}` : ''}, {kelvinToCelsius(weather.main.temp)}°C
        </span>
        {!compact && (
          <div className="flex flex-col">
            <span className="text-xs text-gray-400 capitalize">
              {weather.weather[0].description}
            </span>
            <span className="text-xs text-yellow-400 flex items-center">
              <MapPin className="h-3 w-3 mr-1" /> Your location
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeatherDisplay;
