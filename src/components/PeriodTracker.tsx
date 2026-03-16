import { useState, useEffect } from 'react';
import { UserProfile } from '../App';
import { projectId } from '../utils/supabase/info';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Calendar as CalendarIcon, Info } from 'lucide-react';

interface PeriodTrackerProps {
  profile: UserProfile | null;
  session: any;
  onUpdate: () => void;
}

export function PeriodTracker({ profile, session, onUpdate }: PeriodTrackerProps) {
  const [lastPeriodDate, setLastPeriodDate] = useState('');
  const [cycleLength, setCycleLength] = useState('28');
  const [periodLength, setPeriodLength] = useState('5');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (profile) {
      setLastPeriodDate(profile.lastPeriodDate || '');
      setCycleLength(profile.cycleLength?.toString() || '28');
      setPeriodLength(profile.periodLength?.toString() || '5');
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b0cf6bec/profile/period`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            lastPeriodDate,
            cycleLength: parseInt(cycleLength),
            periodLength: parseInt(periodLength),
          }),
        }
      );

      if (response.ok) {
        setSuccess('Period tracking updated successfully!');
        onUpdate();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update period tracking');
      }
    } catch (err: any) {
      console.error('Error updating period tracking:', err);
      setError(err.message || 'Failed to update period tracking');
    } finally {
      setLoading(false);
    }
  };

  const calculateCyclePhase = () => {
    if (!lastPeriodDate || !cycleLength) return null;
    
    const lastPeriod = new Date(lastPeriodDate);
    const today = new Date();
    const daysSinceLastPeriod = Math.floor((today.getTime() - lastPeriod.getTime()) / (1000 * 60 * 60 * 24));
    const cycleDay = (daysSinceLastPeriod % parseInt(cycleLength)) + 1;
    
    const periodLengthNum = parseInt(periodLength);
    const cycleNum = parseInt(cycleLength);
    
    let phase = '';
    let phaseInfo = '';
    let phaseColor = '';
    
    if (cycleDay <= periodLengthNum) {
      phase = 'Menstrual Phase';
      phaseInfo = 'Focus on rest and light activity. Energy levels may be lower.';
      phaseColor = 'bg-red-50 border-red-200';
    } else if (cycleDay <= cycleNum / 2) {
      phase = 'Follicular Phase';
      phaseInfo = 'Energy levels rising. Good time for high-intensity workouts.';
      phaseColor = 'bg-green-50 border-green-200';
    } else if (cycleDay <= cycleNum / 2 + 3) {
      phase = 'Ovulation';
      phaseInfo = 'Peak energy and strength. Ideal for maximum performance.';
      phaseColor = 'bg-blue-50 border-blue-200';
    } else {
      phase = 'Luteal Phase';
      phaseInfo = 'Energy may decline. Consider moderate intensity and extra recovery.';
      phaseColor = 'bg-purple-50 border-purple-200';
    }
    
    const nextPeriod = new Date(lastPeriod);
    nextPeriod.setDate(lastPeriod.getDate() + parseInt(cycleLength));
    
    return {
      cycleDay,
      phase,
      phaseInfo,
      phaseColor,
      nextPeriod: nextPeriod.toLocaleDateString(),
      daysUntilNext: Math.max(0, parseInt(cycleLength) - daysSinceLastPeriod),
    };
  };

  const cycleInfo = calculateCyclePhase();

  return (
    <div className="space-y-6">
      {success && (
        <Alert className="border-0 border-l-4 border-l-green-600 bg-green-50 shadow-sm">
          <AlertDescription className="text-green-800 font-medium">{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="shadow-sm">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card className="border-0 shadow-md bg-white rounded-[2rem] overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
          <CardTitle className="flex items-center gap-2 text-purple-900">
            <div className="p-2 bg-purple-700 rounded-lg">
              <CalendarIcon className="w-4 h-4 text-white" />
            </div>
            Period Tracking
          </CardTitle>
          <CardDescription className="mt-1.5">Track your menstrual cycle for personalized training recommendations</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lastPeriodDate">Last Period Start Date</Label>
              <Input
                id="lastPeriodDate"
                type="date"
                value={lastPeriodDate}
                onChange={(e) => setLastPeriodDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cycleLength">Cycle Length (days)</Label>
                <Input
                  id="cycleLength"
                  type="number"
                  value={cycleLength}
                  onChange={(e) => setCycleLength(e.target.value)}
                  min="21"
                  max="40"
                />
                <p className="text-xs text-slate-500">Average: 28 days</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="periodLength">Period Length (days)</Label>
                <Input
                  id="periodLength"
                  type="number"
                  value={periodLength}
                  onChange={(e) => setPeriodLength(e.target.value)}
                  min="2"
                  max="10"
                />
                <p className="text-xs text-slate-500">Average: 5 days</p>
              </div>
            </div>

            <Button type="submit" className="w-full bg-purple-700 hover:bg-purple-800" disabled={loading}>
              <CalendarIcon className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : 'Save Period Data'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {cycleInfo && (
        <Card className={`border-0 shadow-md ${cycleInfo.phaseColor}`}>
          <CardHeader>
            <CardTitle className="text-lg">Current Cycle Information</CardTitle>
            <CardDescription>Day {cycleInfo.cycleDay} of your cycle</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h4 className="font-semibold mb-1">{cycleInfo.phase}</h4>
              <p className="text-sm text-slate-600">{cycleInfo.phaseInfo}</p>
            </div>
            <div className="flex items-start gap-2 p-3 bg-white/50 rounded-md">
              <Info className="w-4 h-4 mt-0.5 text-purple-600" />
              <div className="text-sm">
                <p className="font-medium">Next period expected: {cycleInfo.nextPeriod}</p>
                <p className="text-slate-600">In {cycleInfo.daysUntilNext} days</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Alert className="bg-purple-50 border-purple-200 border-l-4 border-l-purple-700 shadow-sm">
        <Info className="w-4 h-4 text-purple-700" />
        <AlertDescription className="text-purple-900">
          <strong>Training & Your Cycle:</strong> Your menstrual cycle affects energy, strength, and recovery. 
          This information helps personalize your workout recommendations for optimal performance and wellbeing.
        </AlertDescription>
      </Alert>
    </div>
  );
}