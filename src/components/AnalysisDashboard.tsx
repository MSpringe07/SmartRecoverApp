import { useState, useEffect } from 'react';
import { DayData, UserProfile } from '../App';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, TrendingDown, AlertCircle, Activity, Moon, Briefcase } from 'lucide-react';
import { projectId } from '../utils/supabase/info';
import { AlertTitle } from './ui/alert';

interface AnalysisDashboardProps {
  weekData: DayData[];
  profile: UserProfile | null;
  session: any;
}

export function AnalysisDashboard({ weekData, profile, session }: AnalysisDashboardProps) {
  const [injuries, setInjuries] = useState<any[]>([]);

  useEffect(() => {
    if (session) {
      loadInjuries();
    }
  }, [session]);

  const loadInjuries = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b0cf6bec/injuries`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setInjuries(data.injuries || []);
      }
    } catch (err) {
      console.error('Error loading injuries:', err);
    }
  };

  const sortedData = [...weekData].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Remove duplicates by date and keep the most recent entry for each date
  const uniqueDataMap = new Map();
  sortedData.forEach(day => {
    const dateKey = day.date;
    if (!uniqueDataMap.has(dateKey) || day.id > (uniqueDataMap.get(dateKey)?.id || '')) {
      uniqueDataMap.set(dateKey, day);
    }
  });
  
  const uniqueSortedData = Array.from(uniqueDataMap.values()).sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const chartData = uniqueSortedData.map((day, index) => ({
    date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    'Workout Intensity': day.workoutIntensity,
    'Sleep Quality': day.sleepQuality,
    'Work Hours': day.workHours,
    'Workout Duration': day.workoutDuration,
  }));

  // Calculate warnings
  const warnings = [];
  const recent3Days = sortedData.slice(-3);
  
  // Check for current injuries
  const currentInjuries = injuries.filter(i => i.status === 'current') || [];
  
  if (currentInjuries.length > 0) {
    warnings.push({
      title: 'Active Injuries - Caution Required',
      description: `You have ${currentInjuries.length} active ${currentInjuries.length === 1 ? 'injury' : 'injuries'} (${currentInjuries.map(i => i.name).join(', ')}). Adjust training intensity and consult a healthcare professional.`,
      severity: 'high',
    });
  }
  
  if (recent3Days.length >= 3) {
    const avgWorkoutIntensity = recent3Days.reduce((sum, d) => sum + d.workoutIntensity, 0) / 3;
    const avgSleepQuality = recent3Days.reduce((sum, d) => sum + d.sleepQuality, 0) / 3;
    const avgWorkHours = recent3Days.reduce((sum, d) => sum + d.workHours, 0) / 3;
    const avgSleepDuration = recent3Days.reduce((sum, d) => sum + d.sleepDuration, 0) / 3;

    if (avgWorkoutIntensity > 7 && avgSleepQuality < 6) {
      warnings.push({
        title: 'High Training Load with Poor Sleep',
        description: 'Your workout intensity is high but sleep quality is low. This increases overtraining risk.',
        severity: 'high',
      });
    }

    // Injuries + high intensity warning
    if (currentInjuries.length > 0 && avgWorkoutIntensity > 6) {
      warnings.push({
        title: 'High Intensity Training with Active Injuries',
        description: 'Training at high intensity while injured significantly increases re-injury risk. Consider reducing intensity.',
        severity: 'high',
      });
    }

    if (avgWorkHours > 9 && avgWorkoutIntensity > 6) {
      warnings.push({
        title: 'Combined Work and Training Stress',
        description: 'Long work hours combined with intense training may lead to burnout.',
        severity: 'medium',
      });
    }

    // Age-based sleep recommendations
    let recommendedSleep = 7;
    if (profile) {
      if (profile.age < 18) recommendedSleep = 9;
      else if (profile.age < 26) recommendedSleep = 8;
      else if (profile.age > 65) recommendedSleep = 7;
      
      if (avgWorkoutIntensity >= 7) recommendedSleep += 0.5;
    }

    if (avgSleepDuration < recommendedSleep) {
      warnings.push({
        title: 'Insufficient Sleep Duration',
        description: `You're averaging ${avgSleepDuration.toFixed(1)} hours. For your age${profile ? ` (${profile.age})` : ''} and activity level, aim for ${recommendedSleep} hours.`,
        severity: 'medium',
      });
    }

    // Check for continuous high intensity without rest
    const highIntensityDays = recent3Days.filter(d => d.workoutIntensity >= 7).length;
    if (highIntensityDays === 3) {
      warnings.push({
        title: 'No Recovery Days Detected',
        description: '3 consecutive high-intensity days without rest. Schedule a recovery day soon.',
        severity: 'high',
      });
    }
  }

  const avgMetrics = sortedData.length > 0 ? {
    workoutIntensity: (sortedData.reduce((sum, d) => sum + d.workoutIntensity, 0) / sortedData.length).toFixed(1),
    sleepQuality: (sortedData.reduce((sum, d) => sum + d.sleepQuality, 0) / sortedData.length).toFixed(1),
    workHours: (sortedData.reduce((sum, d) => sum + d.workHours, 0) / sortedData.length).toFixed(1),
  } : null;

  return (
    <div className="space-y-4 sm:space-y-6">
      {warnings.length > 0 && (
        <div className="space-y-3">
          {warnings.map((warning, index) => (
            <Alert 
              key={index} 
              variant={warning.severity === 'high' ? 'destructive' : 'default'}
              className={`border-l-4 shadow-sm ${
                warning.severity === 'high' 
                  ? 'border-l-red-500 bg-red-950/50 border-red-800/30' 
                  : 'border-l-yellow-500 bg-yellow-950/50 border-yellow-800/30'
              }`}
            >
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="font-semibold text-white">{warning.title}</AlertTitle>
              <AlertDescription className={`text-sm ${warning.severity === 'high' ? 'text-red-200' : 'text-yellow-200'}`}>{warning.description}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border border-slate-100 shadow-sm bg-white hover:shadow-md transition-shadow rounded-3xl overflow-hidden">
          <CardHeader className="pb-3 bg-gradient-to-br from-purple-50 to-white pt-5">
            <CardTitle className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2 text-purple-700 text-base font-bold">
              <div className="p-2.5 bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl">
                <Activity className="w-4 h-4 text-white" />
              </div>
              <span className="text-center sm:text-left">Avg Workout Intensity</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5 pb-6 text-center">
            <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">{avgMetrics?.workoutIntensity || 'N/A'}<span className="text-lg text-slate-400 ml-1 font-semibold">/ 10</span></div>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-sm bg-white hover:shadow-md transition-shadow rounded-3xl overflow-hidden">
          <CardHeader className="pb-3 bg-gradient-to-br from-blue-50 to-white pt-5">
            <CardTitle className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2 text-blue-700 text-base font-bold">
              <div className="p-2.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl">
                <Moon className="w-4 h-4 text-white" />
              </div>
              <span className="text-center sm:text-left">Avg Sleep Quality</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5 pb-6 text-center">
            <div className="text-4xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">{avgMetrics?.sleepQuality || 'N/A'}<span className="text-lg text-slate-400 ml-1 font-semibold">/ 10</span></div>
          </CardContent>
        </Card>

        <Card className="border border-slate-100 shadow-sm bg-white hover:shadow-md transition-shadow rounded-3xl overflow-hidden">
          <CardHeader className="pb-3 bg-gradient-to-br from-slate-50 to-white pt-5">
            <CardTitle className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2 text-slate-700 text-base font-bold">
              <div className="p-2.5 bg-gradient-to-r from-slate-500 to-slate-600 rounded-2xl">
                <Briefcase className="w-4 h-4 text-white" />
              </div>
              <span className="text-center sm:text-left">Avg Work Hours</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5 pb-6 text-center">
            <div className="text-4xl font-bold bg-gradient-to-r from-slate-600 to-slate-700 bg-clip-text text-transparent">{avgMetrics?.workHours || 'N/A'}<span className="text-lg text-slate-400 ml-1 font-semibold">hrs/day</span></div>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-slate-100 shadow-sm bg-white rounded-3xl overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-purple-50/50 to-white pt-6 pb-5">
          <CardTitle className="text-slate-900 text-center sm:text-left font-bold text-lg">Training & Recovery Trends</CardTitle>
          <CardDescription className="text-slate-500 text-center sm:text-left font-medium">Workout intensity vs sleep quality over time</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 pb-6">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  color: '#1e293b',
                  padding: '12px'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="Workout Intensity" 
                stroke="#7c3aed" 
                strokeWidth={3}
                dot={{ fill: '#7c3aed', r: 5 }}
                activeDot={{ r: 7 }}
              />
              <Line 
                type="monotone" 
                dataKey="Sleep Quality" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ fill: '#3b82f6', r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border border-slate-100 shadow-sm bg-white rounded-3xl overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-purple-50/50 to-white pt-6 pb-5">
          <CardTitle className="text-slate-900 text-center sm:text-left font-bold text-lg">Weekly Load Breakdown</CardTitle>
          <CardDescription className="text-slate-500 text-center sm:text-left font-medium">Daily workout duration and work hours</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 pb-6">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  color: '#1e293b',
                  padding: '12px'
                }}
              />
              <Legend />
              <Bar dataKey="Workout Duration" fill="url(#purpleGradient)" radius={[12, 12, 0, 0]} />
              <Bar dataKey="Work Hours" fill="url(#orangeGradient)" radius={[12, 12, 0, 0]} />
              <defs>
                <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7c3aed" />
                  <stop offset="100%" stopColor="#a78bfa" />
                </linearGradient>
                <linearGradient id="orangeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#fbbf24" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}