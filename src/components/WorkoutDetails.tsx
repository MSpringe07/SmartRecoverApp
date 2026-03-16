import { DayData } from '../App';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Dumbbell, Trash2, Flame, Clock } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';

interface WorkoutDetailsProps {
  weekData: DayData[];
  onDelete: (date: string) => void;
}

export function WorkoutDetails({ weekData, onDelete }: WorkoutDetailsProps) {
  const workouts = [...weekData]
    .filter(day => day.workoutDuration > 0)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getIntensityColor = (intensity: number) => {
    if (intensity >= 8) return 'bg-red-500';
    if (intensity >= 6) return 'bg-orange-500';
    if (intensity >= 4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getIntensityLabel = (intensity: number) => {
    if (intensity >= 8) return 'Very High';
    if (intensity >= 6) return 'High';
    if (intensity >= 4) return 'Moderate';
    if (intensity >= 2) return 'Low';
    return 'Very Low';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const totalWorkouts = workouts.length;
  const totalMinutes = workouts.reduce((sum, w) => sum + w.workoutDuration, 0);
  const avgIntensity = workouts.length > 0 
    ? (workouts.reduce((sum, w) => sum + w.workoutIntensity, 0) / workouts.length).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4" />
              Total Workouts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-slate-900">{totalWorkouts}</div>
            <p className="text-slate-600">sessions logged</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Total Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-slate-900">{totalMinutes}</div>
            <p className="text-slate-600">minutes trained</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Flame className="w-4 h-4" />
              Avg Intensity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-slate-900">{avgIntensity} / 10</div>
            <p className="text-slate-600">average effort</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Workout History</CardTitle>
          <CardDescription>
            Detailed view of all your logged workouts and their intensities
          </CardDescription>
        </CardHeader>
        <CardContent>
          {workouts.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No workouts logged yet. Start tracking to see your progress!
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Intensity</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workouts.map((workout) => (
                  <TableRow key={workout.id}>
                    <TableCell>{formatDate(workout.date)}</TableCell>
                    <TableCell>
                      {workout.workoutType || 'General Training'}
                    </TableCell>
                    <TableCell>{workout.workoutDuration} min</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-2">
                        <div className={`w-2 h-2 rounded-full ${getIntensityColor(workout.workoutIntensity)}`} />
                        {workout.workoutIntensity}/10 - {getIntensityLabel(workout.workoutIntensity)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {workout.notes || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(workout.date)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
