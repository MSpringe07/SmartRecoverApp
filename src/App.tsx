import { useState, useEffect } from 'react';
import { supabase } from './utils/supabase/client';
import { AuthPage } from './components/AuthPage';
import { Dashboard } from './components/Dashboard';

export interface UserProfile {
  userId: string;
  name: string;
  email: string;
  age: number;
  height: number;
  weight: number;
  gender: 'male' | 'female' | 'other';
  bodyFatPercentage?: number;
  createdAt: string;
  // Period tracking for female/other users
  lastPeriodDate?: string;
  cycleLength?: number; // average cycle length in days
  periodLength?: number; // average period length in days
  // Location for weather data
  location?: string; // city name or coordinates
  latitude?: number;
  longitude?: number;
}

export interface Injury {
  id: string;
  userId: string;
  name: string;
  type: string; // e.g., "Muscle strain", "Joint pain", "Tendonitis", etc.
  severity: 'mild' | 'moderate' | 'severe';
  status: 'current' | 'recovered';
  dateOccurred: string;
  dateRecovered?: string;
  notes?: string;
}

export interface DayData {
  id: string;
  date: string;
  workoutIntensity: number;
  workoutDuration: number;
  workoutType?: string;
  workHours: number;
  sleepQuality: number;
  sleepDuration: number;
  notes?: string;
  userId: string;
}

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return <AuthPage />;
  }

  return <Dashboard session={session} />;
}