import React, { useState, useEffect } from 'react';
import { UserProfile } from '../App';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Cloud, CloudRain, CloudSnow, Sun, Wind, Droplets, Thermometer, MapPin, AlertTriangle } from 'lucide-react';

interface WeatherWidgetProps {
  profile: UserProfile | null;
}

interface WeatherData {
  temperature: number;
  humidity: number;
  description: string;
  feelsLike: number;
  windSpeed: number;
  location: string;
}

export function WeatherWidget({ profile }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPlaceholder, setIsPlaceholder] = useState(false);

  useEffect(() => {
    fetchWeather();
  }, [profile]);

  const fetchWeather = async () => {
    try {
      setLoading(true);
      setError('');

      // Use Rīga coordinates as placeholder if user hasn't set location
      const latitude = profile?.latitude || 56.9496;
      const longitude = profile?.longitude || 24.1052;
      const locationName = profile?.location || 'Rīga';
      const placeholder = !profile?.latitude || !profile?.longitude;
      setIsPlaceholder(placeholder);

      // Using Open-Meteo API (free, no API key required)
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code&temperature_unit=celsius&wind_speed_unit=kmh`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch weather data');
      }

      const data = await response.json();
      
      const weatherDescription = getWeatherDescription(data.current.weather_code);

      setWeather({
        temperature: Math.round(data.current.temperature_2m),
        humidity: data.current.relative_humidity_2m,
        description: weatherDescription,
        feelsLike: Math.round(data.current.apparent_temperature),
        windSpeed: Math.round(data.current.wind_speed_10m),
        location: locationName,
      });
    } catch (err: any) {
      console.error('Error fetching weather:', err);
      setError('Unable to fetch weather data');
    } finally {
      setLoading(false);
    }
  };

  const getWeatherDescription = (code: number): string => {
    const weatherCodes: { [key: number]: string } = {
      0: 'Clear sky',
      1: 'Mainly clear',
      2: 'Partly cloudy',
      3: 'Overcast',
      45: 'Foggy',
      48: 'Foggy',
      51: 'Light drizzle',
      53: 'Moderate drizzle',
      55: 'Heavy drizzle',
      61: 'Light rain',
      63: 'Moderate rain',
      65: 'Heavy rain',
      71: 'Light snow',
      73: 'Moderate snow',
      75: 'Heavy snow',
      77: 'Snow grains',
      80: 'Light rain showers',
      81: 'Moderate rain showers',
      82: 'Heavy rain showers',
      85: 'Light snow showers',
      86: 'Heavy snow showers',
      95: 'Thunderstorm',
      96: 'Thunderstorm with hail',
      99: 'Thunderstorm with heavy hail',
    };
    return weatherCodes[code] || 'Unknown';
  };

  const getWeatherIcon = (description: string) => {
    const desc = description.toLowerCase();
    if (desc.includes('clear') || desc.includes('sunny')) {
      return <Sun className="w-8 h-8 text-yellow-500" />;
    } else if (desc.includes('rain') || desc.includes('drizzle')) {
      return <CloudRain className="w-8 h-8 text-blue-500" />;
    } else if (desc.includes('snow')) {
      return <CloudSnow className="w-8 h-8 text-blue-300" />;
    } else {
      return <Cloud className="w-8 h-8 text-slate-400" />;
    }
  };

  const getTrainingAdvice = () => {
    if (!weather) return null;

    const warnings = [];

    if (weather.temperature > 30) {
      warnings.push({
        icon: <Thermometer className="w-4 h-4 text-red-500" />,
        text: 'High temperature: Stay hydrated, reduce intensity, and avoid peak heat hours.',
        color: 'bg-red-50 border-red-200',
      });
    } else if (weather.temperature < 5) {
      warnings.push({
        icon: <Thermometer className="w-4 h-4 text-blue-500" />,
        text: 'Cold weather: Ensure proper warm-up and layer clothing appropriately.',
        color: 'bg-blue-50 border-blue-200',
      });
    }

    if (weather.humidity > 70) {
      warnings.push({
        icon: <Droplets className="w-4 h-4 text-blue-600" />,
        text: 'High humidity: Your body will struggle to cool down. Reduce intensity and increase hydration.',
        color: 'bg-blue-50 border-blue-200',
      });
    }

    if (weather.windSpeed > 30) {
      warnings.push({
        icon: <Wind className="w-4 h-4 text-slate-600" />,
        text: 'High winds: Consider indoor training or adjust outdoor routes for safety.',
        color: 'bg-slate-50 border-slate-200',
      });
    }

    if (weather.description.toLowerCase().includes('rain') || 
        weather.description.toLowerCase().includes('snow') ||
        weather.description.toLowerCase().includes('storm')) {
      warnings.push({
        icon: <AlertTriangle className="w-4 h-4 text-orange-500" />,
        text: 'Adverse weather: Consider indoor training for safety and optimal performance.',
        color: 'bg-orange-50 border-orange-200',
      });
    }

    return warnings;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <p className="text-slate-600">Loading weather data...</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !weather) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error || 'Failed to load weather data'}</AlertDescription>
      </Alert>
    );
  }

  const trainingAdvice = getTrainingAdvice();

  return (
    <div className="space-y-4">
      {isPlaceholder && (
        <Alert className="bg-purple-50 border-purple-200 border-l-4 border-l-purple-600 shadow-sm">
          <MapPin className="w-4 h-4 text-purple-600" />
          <AlertDescription className="text-purple-900">
            <strong>Placeholder Example:</strong> Showing weather for Rīga. Add your location in your profile for personalized weather data.
          </AlertDescription>
        </Alert>
      )}
      
      <Card className="border-0 shadow-md bg-white rounded-[2rem] overflow-hidden">
        <CardHeader className="bg-gradient-to-br from-blue-50 to-purple-50 border-b border-purple-100">
          <CardTitle className="flex items-center justify-center sm:justify-start gap-2 text-slate-900">
            <div className="p-2 bg-purple-700 rounded-lg">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            Weather Conditions
          </CardTitle>
          <CardDescription className="text-slate-600 text-center sm:text-left">{weather.location}</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-center sm:justify-between">
            <div className="flex items-center gap-4">
              {getWeatherIcon(weather.description)}
              <div className="text-center sm:text-left">
                <p className="text-4xl font-bold text-slate-900">{weather.temperature}°C</p>
                <p className="text-sm text-slate-600 mt-1">{weather.description}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-4 pt-4 border-t border-purple-100">
            <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-transparent rounded-lg border border-purple-100">
              <Thermometer className="w-5 h-5 mx-auto mb-2 text-purple-600" />
              <p className="text-xs text-slate-500 mb-1">Feels like</p>
              <p className="font-bold text-slate-900">{weather.feelsLike}°C</p>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-transparent rounded-lg border border-blue-100">
              <Droplets className="w-5 h-5 mx-auto mb-2 text-blue-600" />
              <p className="text-xs text-slate-500 mb-1">Humidity</p>
              <p className="font-bold text-slate-900">{weather.humidity}%</p>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-slate-50 to-transparent rounded-lg border border-slate-200">
              <Wind className="w-5 h-5 mx-auto mb-2 text-slate-600" />
              <p className="text-xs text-slate-500 mb-1">Wind</p>
              <p className="font-bold text-slate-900">{weather.windSpeed} km/h</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {trainingAdvice && trainingAdvice.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {trainingAdvice.map((advice, index) => (
            <Alert key={index} className={`${advice.color} border shadow-sm !rounded-2xl p-6 flex flex-col items-center text-center justify-center space-y-3`}>
              <div className="p-3 bg-white/50 rounded-full shadow-sm">
                {/* We scale up the icon here */}
                {React.cloneElement(advice.icon as React.ReactElement, { className: "w-8 h-8" })}
              </div>
              <AlertDescription className="text-base sm:text-lg font-medium max-w-md leading-relaxed">
                {advice.text}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}
    </div>
  );
}