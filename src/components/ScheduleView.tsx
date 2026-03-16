import { DayData } from '../App';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Moon, Dumbbell, Briefcase, Clock } from 'lucide-react';

interface ScheduleViewProps {
  weekData: DayData[];
}

export function ScheduleView({ weekData }: ScheduleViewProps) {
  const sortedData = [...weekData].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const getIntensityColor = (intensity: number) => {
    if (intensity >= 8) return 'bg-red-500';
    if (intensity >= 6) return 'bg-orange-500';
    if (intensity >= 4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getSleepColor = (quality: number) => {
    if (quality >= 8) return 'bg-green-500';
    if (quality >= 6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-4">
      {sortedData.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-slate-500">No activities logged yet. Start by logging your first day!</p>
          </CardContent>
        </Card>
      ) : (
        sortedData.map(day => (
          <Card key={day.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>{formatDate(day.date)}</CardTitle>
                <div className="flex gap-2">
                  <Badge variant="outline" className="gap-1">
                    <div className={`w-2 h-2 rounded-full ${getIntensityColor(day.workoutIntensity)}`} />
                    Intensity: {day.workoutIntensity}/10
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <div className={`w-2 h-2 rounded-full ${getSleepColor(day.sleepQuality)}`} />
                    Sleep: {day.sleepQuality}/10
                  </Badge>
                </div>
              </div>
              <CardDescription>{day.date}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Dumbbell className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <div className="text-slate-900">Workout</div>
                    <div className="text-slate-600">{day.workoutDuration} min</div>
                    <div className="text-slate-500">Intensity: {day.workoutIntensity}/10</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Briefcase className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <div className="text-slate-900">Work</div>
                    <div className="text-slate-600">{day.workHours} hours</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Moon className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-slate-900">Sleep</div>
                    <div className="text-slate-600">{day.sleepDuration} hours</div>
                    <div className="text-slate-500">Quality: {day.sleepQuality}/10</div>
                  </div>
                </div>
              </div>

              {day.notes && (
                <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                  <div className="text-slate-900 mb-1">Notes</div>
                  <p className="text-slate-600">{day.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
