import { useState, useEffect } from 'react';
import { projectId } from '../utils/supabase/info';
import { DayData, UserProfile } from '../App';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Moon, Utensils, Apple, Droplets, Coffee, Dumbbell, Heart, Flame, ExternalLink, AlertCircle } from 'lucide-react';

interface RecoveryTipsProps {
  weekData: DayData[];
  profile: UserProfile | null;
  session: any;
}

export function RecoveryTips({ weekData, profile, session }: RecoveryTipsProps) {
  const [injuries, setInjuries] = useState<any[]>([]);
  
  const recent3Days = weekData.slice(-3);
  
  const avgWorkoutIntensity = recent3Days.length > 0
    ? recent3Days.reduce((sum, d) => sum + d.workoutIntensity, 0) / recent3Days.length
    : 0;
  
  const avgSleepQuality = recent3Days.length > 0
    ? recent3Days.reduce((sum, d) => sum + d.sleepQuality, 0) / recent3Days.length
    : 0;

  const avgSleepDuration = recent3Days.length > 0
    ? recent3Days.reduce((sum, d) => sum + d.sleepDuration, 0) / recent3Days.length
    : 0;

  useEffect(() => {
    loadInjuries();
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

  // Check for current injuries
  const currentInjuries = injuries.filter(i => i.status === 'current');
  const hasCurrentInjuries = currentInjuries.length > 0;

  // Calculate recommended sleep based on age and training intensity
  const getRecommendedSleep = () => {
    let baseSleep = 8;
    
    if (profile) {
      if (profile.age < 18) baseSleep = 9;
      else if (profile.age < 26) baseSleep = 8;
      else if (profile.age < 65) baseSleep = 7.5;
      else baseSleep = 7;
    }

    // Add sleep for high intensity training
    if (avgWorkoutIntensity >= 7) baseSleep += 0.5;
    if (avgWorkoutIntensity >= 9) baseSleep += 1;

    return baseSleep.toFixed(1);
  };

  // Calculate protein needs based on weight and activity
  const getProteinNeeds = () => {
    if (!profile) return { min: 80, max: 120 };
    
    const weight = profile.weight;
    let proteinPerKg = 1.6; // Base for moderate activity
    
    if (avgWorkoutIntensity >= 7) proteinPerKg = 2.0;
    else if (avgWorkoutIntensity >= 5) proteinPerKg = 1.8;
    
    return {
      min: Math.round(weight * (proteinPerKg - 0.2)),
      max: Math.round(weight * (proteinPerKg + 0.2)),
    };
  };

  // Calculate hydration needs
  const getHydrationNeeds = () => {
    if (!profile) return { min: 2.5, max: 3.5 };
    
    const weight = profile.weight;
    let baseWater = weight * 0.033; // 33ml per kg
    
    // Add for workout intensity
    const workoutMinutes = recent3Days.reduce((sum, d) => sum + d.workoutDuration, 0);
    const avgWorkoutMin = workoutMinutes / (recent3Days.length || 1);
    
    baseWater += (avgWorkoutMin / 30) * 0.5; // Extra 500ml per 30min workout
    
    return {
      min: baseWater.toFixed(1),
      max: (baseWater + 1).toFixed(1),
    };
  };

  const recoveryWorkouts = [
    {
      name: 'Yoga Flow',
      duration: '20-30 min',
      description: 'Gentle stretching and mobility work to reduce muscle tension',
      icon: Heart,
      intensity: 'Very Low',
      videoUrl: 'https://www.youtube.com/watch?v=v7AYKMP6rOE'
    },
    {
      name: 'Light Swimming',
      duration: '30-45 min',
      description: 'Low-impact cardio that promotes blood flow without joint stress',
      icon: Droplets,
      intensity: 'Low',
      videoUrl: 'https://www.youtube.com/watch?v=5HLW2AI1Odg'
    },
    {
      name: 'Easy Walk',
      duration: '20-40 min',
      description: 'Gentle movement to aid recovery and reduce soreness',
      icon: Dumbbell,
      intensity: 'Very Low',
      videoUrl: 'https://www.youtube.com/watch?v=gMkFxLBvcZY'
    },
    {
      name: 'Foam Rolling',
      duration: '15-20 min',
      description: 'Self-myofascial release to improve circulation and flexibility',
      icon: Flame,
      intensity: 'Very Low',
      videoUrl: 'https://www.youtube.com/watch?v=yFg7OJCsi8g'
    },
  ];

  const nutritionTips = [
    {
      category: 'Post-Workout',
      icon: Apple,
      tips: [
        'Consume protein within 30-60 minutes after training',
        'Combine protein with carbs in a 3:1 ratio for optimal recovery',
        'Example: Chicken breast with sweet potato, or protein shake with banana',
        ...(hasCurrentInjuries ? ['Include anti-inflammatory foods to support injury recovery'] : []),
      ],
    },
    {
      category: 'Hydration',
      icon: Droplets,
      tips: [
        `Drink ${getHydrationNeeds().min}-${getHydrationNeeds().max}L of water daily`,
        'Add electrolytes after intense workouts (>60 min)',
        'Monitor urine color - aim for light yellow',
        ...(hasCurrentInjuries ? ['Adequate hydration is crucial for tissue repair'] : []),
      ],
    },
    {
      category: 'Protein Intake',
      icon: Utensils,
      tips: [
        `Target ${getProteinNeeds().min}-${getProteinNeeds().max}g of protein daily`,
        'Spread protein intake across 4-5 meals',
        'Include: lean meats, fish, eggs, legumes, dairy',
        ...(hasCurrentInjuries ? ['Increase protein slightly to support tissue healing'] : []),
      ],
    },
    {
      category: 'Anti-Inflammatory',
      icon: Coffee,
      tips: [
        'Include omega-3 rich foods: salmon, walnuts, chia seeds',
        'Add colorful fruits and vegetables (berries, leafy greens)',
        'Consider turmeric, ginger for natural inflammation reduction',
        ...(hasCurrentInjuries ? ['Focus on anti-inflammatory foods to reduce injury inflammation'] : []),
      ],
    },
  ];

  const sleepTips = [
    'Maintain consistent sleep and wake times',
    'Keep bedroom cool (60-67°F / 15-19°C)',
    'Avoid screens 1 hour before bed',
    'Limit caffeine after 2 PM',
    'Consider magnesium supplement for better sleep quality',
    'Use blackout curtains and white noise if needed',
  ];

  const recommendedSleep = getRecommendedSleep();
  const needsMoreSleep = avgSleepDuration < parseFloat(recommendedSleep);

  return (
    <div className="space-y-6">
      {hasCurrentInjuries && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div>
              <strong>Active Injuries Detected:</strong> You have {currentInjuries.length} current {currentInjuries.length === 1 ? 'injury' : 'injuries'}.
              <ul className="mt-2 ml-4 list-disc">
                {currentInjuries.map((injury, idx) => (
                  <li key={idx}>
                    {injury.name} - Consider modified training and consult a healthcare professional
                  </li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Card className={needsMoreSleep ? 'border-orange-300 border-2' : ''}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="w-5 h-5" />
            Sleep Recommendations
          </CardTitle>
          <CardDescription>
            Optimized for your age{profile ? ` (${profile.age} years)` : ''} and training intensity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
            <div>
              <div className="text-slate-900">Recommended Sleep Duration</div>
              <div className="text-slate-600">Based on your profile and activity level</div>
            </div>
            <div className="text-blue-600">{recommendedSleep} hours</div>
          </div>

          {needsMoreSleep && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-orange-800">
                You're currently averaging {avgSleepDuration.toFixed(1)} hours. 
                Try to increase sleep by {(parseFloat(recommendedSleep) - avgSleepDuration).toFixed(1)} hours.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-slate-900">Sleep Optimization Tips</h3>
            <ul className="space-y-2">
              {sleepTips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2 text-slate-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="w-5 h-5" />
            Nutrition Recommendations
          </CardTitle>
          <CardDescription>
            Personalized nutrition guidance for optimal recovery
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {nutritionTips.map((section, index) => {
            const Icon = section.icon;
            return (
              <div key={index} className="space-y-3">
                <h3 className="text-slate-900 flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  {section.category}
                </h3>
                <ul className="space-y-2 pl-6">
                  {section.tips.map((tip, tipIndex) => (
                    <li key={tipIndex} className="flex items-start gap-2 text-slate-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5" />
            Recovery Workouts
          </CardTitle>
          <CardDescription>
            Light activities to promote recovery on rest days
            {hasCurrentInjuries && ' - Modified for your current injuries'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasCurrentInjuries && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <h4 className="text-slate-900 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-600" />
                Injury Considerations
              </h4>
              <p className="text-slate-600 mb-2">
                Due to your current injuries, avoid exercises that stress the affected areas:
              </p>
              <ul className="text-slate-600 ml-4 list-disc">
                {currentInjuries.map((injury, idx) => (
                  <li key={idx}>{injury.name} - Modify or avoid exercises involving this area</li>
                ))}
              </ul>
              <p className="text-slate-600 mt-2">
                Focus on pain-free movements and consult a healthcare professional before starting new activities.
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recoveryWorkouts.map((workout, index) => {
              const Icon = workout.icon;
              return (
                <div key={index} className="p-4 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Icon className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <div className="text-slate-900">{workout.name}</div>
                        <div className="text-slate-500">{workout.duration}</div>
                      </div>
                    </div>
                    <Badge variant="outline">{workout.intensity}</Badge>
                  </div>
                  <p className="text-slate-600 mb-3">{workout.description}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => window.open(workout.videoUrl, '_blank')}
                  >
                    <ExternalLink className="w-3 h-3 mr-2" />
                    Watch Tutorial
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}