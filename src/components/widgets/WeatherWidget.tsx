import React, { useState, useEffect } from 'react';
import { MapPin, RefreshCw, Sun, Cloud, CloudRain } from 'lucide-react';
import { Widget } from '../../types';
import { useLayoutStore } from '../../store/layoutStore';
import { Button } from '../ui/Button';

interface WeatherWidgetProps {
  widget: Widget;
}

interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  icon: string;
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ widget }) => {
  const { updateWidget } = useLayoutStore();
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState(widget.data?.location || '');

  const weatherData: WeatherData | null = widget.data?.weather || null;

  // Mock weather data (in real app, call weather API)
  const mockWeatherData = {
    'New York': {
      location: 'New York, NY',
      temperature: 22,
      condition: 'Partly Cloudy',
      humidity: 65,
      windSpeed: 12,
      icon: 'partly-cloudy',
    },
    'London': {
      location: 'London, UK',
      temperature: 18,
      condition: 'Rainy',
      humidity: 80,
      windSpeed: 8,
      icon: 'rainy',
    },
    'Tokyo': {
      location: 'Tokyo, Japan',
      temperature: 25,
      condition: 'Sunny',
      humidity: 55,
      windSpeed: 6,
      icon: 'sunny',
    },
    'San Francisco': {
      location: 'San Francisco, CA',
      temperature: 19,
      condition: 'Foggy',
      humidity: 75,
      windSpeed: 15,
      icon: 'cloudy',
    },
  };

  const fetchWeather = async (city: string) => {
    setIsLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Get mock data or default
    const cityKey = Object.keys(mockWeatherData).find(key => 
      key.toLowerCase().includes(city.toLowerCase())
    );
    
    const weather = cityKey 
      ? mockWeatherData[cityKey as keyof typeof mockWeatherData]
      : {
          location: city,
          temperature: Math.floor(Math.random() * 30) + 10,
          condition: ['Sunny', 'Cloudy', 'Partly Cloudy', 'Rainy'][Math.floor(Math.random() * 4)],
          humidity: Math.floor(Math.random() * 40) + 40,
          windSpeed: Math.floor(Math.random() * 20) + 5,
          icon: 'partly-cloudy',
        };

    updateWidget(widget.id, {
      data: { ...widget.data, weather, location: city }
    });
    
    setIsLoading(false);
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          // Mock: use a default city for location
          fetchWeather('Current Location');
        },
        () => {
          alert('Unable to get your location. Please enter a city manually.');
        }
      );
    }
  };

  const getWeatherIcon = (icon: string) => {
    switch (icon) {
      case 'sunny':
        return <Sun className="w-8 h-8 text-yellow-500" />;
      case 'rainy':
        return <CloudRain className="w-8 h-8 text-blue-500" />;
      case 'cloudy':
      case 'partly-cloudy':
      default:
        return <Cloud className="w-8 h-8 text-gray-500" />;
    }
  };

  const handleLocationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (location.trim()) {
      fetchWeather(location.trim());
    }
  };

  return (
    <div className="space-y-4">
      {/* Location Input */}
      <form onSubmit={handleLocationSubmit} className="space-y-2">
        <div className="flex space-x-2">
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Enter city name..."
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button
            type="submit"
            size="sm"
            disabled={isLoading || !location.trim()}
            className="px-3"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              'Get Weather'
            )}
          </Button>
        </div>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={getCurrentLocation}
          disabled={isLoading}
          className="w-full"
        >
          <MapPin className="w-4 h-4 mr-1" />
          Use Current Location
        </Button>
      </form>

      {/* Weather Display */}
      {weatherData ? (
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center space-x-2">
              <MapPin className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                {weatherData.location}
              </span>
            </div>

            <div className="flex items-center justify-center space-x-4">
              {getWeatherIcon(weatherData.icon)}
              <div>
                <div className="text-3xl font-bold text-gray-800">
                  {weatherData.temperature}°C
                </div>
                <div className="text-sm text-gray-600">
                  {weatherData.condition}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-blue-200">
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-800">
                  {weatherData.humidity}%
                </div>
                <div className="text-xs text-gray-600">Humidity</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-800">
                  {weatherData.windSpeed} km/h
                </div>
                <div className="text-xs text-gray-600">Wind Speed</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">🌤️</div>
          <p className="text-sm">No weather data yet</p>
          <p className="text-xs">Enter a city above to get started</p>
        </div>
      )}

      {/* Popular Cities */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-700">Quick access:</div>
        <div className="grid grid-cols-2 gap-1">
          {Object.keys(mockWeatherData).map((city) => (
            <Button
              key={city}
              variant="outline"
              size="sm"
              onClick={() => fetchWeather(city)}
              disabled={isLoading}
              className="text-xs py-1"
            >
              {city}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeatherWidget;