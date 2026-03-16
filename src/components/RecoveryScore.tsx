import { DayData, UserProfile } from '../App';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface RecoveryScoreProps {
  weekData: DayData[];
  profile: UserProfile | null;
}

const calculateRecoveryScore = (weekData: DayData[], profile: UserProfile | null): number => {
  if (weekData.length === 0) return 100;

  const recent = weekData.slice(-7);
  
  let totalStrain = 0;
  let totalRecovery = 0;

  recent.forEach(day => {
    // Calculate strain (0-100)
    const workoutStrain = (day.workoutIntensity * day.workoutDuration) / 10;
    const workStrain = day.workHours * 5;
    const dailyStrain = workoutStrain + workStrain;
    
    // Calculate recovery (0-100)
    const sleepRecovery = (day.sleepQuality * day.sleepDuration) / 0.8;
    
    totalStrain += dailyStrain;
    totalRecovery += sleepRecovery;
  });

  const avgStrain = totalStrain / recent.length;
  const avgRecovery = totalRecovery / recent.length;
  
  // Adjust for age - older athletes need more recovery
  let ageModifier = 1;
  if (profile) {
    if (profile.age > 40) ageModifier = 0.9;
    if (profile.age > 50) ageModifier = 0.85;
    if (profile.age > 60) ageModifier = 0.8;
  }
  
  // Recovery score: higher recovery and lower strain = better score
  const score = Math.max(0, Math.min(100, (100 - (avgStrain - avgRecovery)) * ageModifier));
  
  return Math.round(score);
};

export function RecoveryScore({ weekData, profile }: RecoveryScoreProps) {
  const score = calculateRecoveryScore(weekData, profile);
  
  const getStatus = (score: number) => {
    if (score >= 70) {
      return {
        label: 'Well Recovered',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-300',
        icon: CheckCircle,
        description: 'Your body is well-rested. Great time for intense training!',
      };
    } else if (score >= 40) {
      return {
        label: 'Moderate Fatigue',
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-300',
        icon: AlertCircle,
        description: 'Consider lighter training today. Focus on recovery.',
      };
    } else {
      return {
        label: 'High Risk - Rest Needed',
        color: 'text-pink-600',
        bgColor: 'bg-pink-50',
        borderColor: 'border-pink-300',
        icon: AlertTriangle,
        description: 'Strong signs of overtraining. Take a rest day or active recovery.',
      };
    }
  };

  const status = getStatus(score);
  const Icon = status.icon;

  return (
    <Card className="border border-slate-100 shadow-sm bg-white overflow-hidden rounded-3xl">
      <CardHeader className="bg-[#7E11CC] text-white pb-6 pt-6">
        <CardTitle className="flex items-center justify-center gap-2.5 text-white font-bold text-xl">
          <Icon className="w-6 h-6" />
          Recovery Status
        </CardTitle>
        <CardDescription className="text-white/90 text-center font-medium">Based on your last 7 days of activity</CardDescription>
      </CardHeader>
      <CardContent className="pt-8 pb-8">
        <div className="flex flex-col md:flex-row items-center justify-center gap-8">
          <div className="relative w-36 h-36 shrink-0">
            <svg className="w-36 h-36 transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r="64"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                className="text-slate-100"
              />
              <motion.circle
                cx="72"
                cy="72"
                r="64"
                stroke="url(#gradient)"
                strokeWidth="12"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 64}`}
                strokeDashoffset={`${2 * Math.PI * 64 * (1 - score / 100)}`}
                strokeLinecap="round"
                initial={{ strokeDashoffset: 2 * Math.PI * 64 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 64 * (1 - score / 100) }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#7c3aed" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">{score}</span>
              <span className="text-xs text-slate-400 mt-1 font-semibold">/ 100</span>
            </div>
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <div className={`inline-block px-5 py-2.5 rounded-2xl mb-4 font-bold text-sm ${
              score >= 80 ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white' :
              score >= 60 ? 'bg-gradient-to-r from-blue-400 to-cyan-500 text-white' :
              score >= 40 ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white' :
              'bg-gradient-to-r from-red-400 to-pink-500 text-white'
            }`}>
              {status.label}
            </div>
            <p className="text-slate-600 leading-relaxed font-medium">{status.description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}