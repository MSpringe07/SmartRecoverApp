import { useState } from 'react';
import { DayData } from '../App';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Plus } from 'lucide-react';

interface ActivityFormProps {
  onSubmit: (data: Omit<DayData, 'id' | 'userId'>) => void;
}

export function ActivityForm({ onSubmit }: ActivityFormProps) {
  const today = new Date().toISOString().split('T')[0];
  
  const [formData, setFormData] = useState({
    date: today,
    workoutIntensity: 5,
    workoutDuration: 45,
    workoutType: '',
    workHours: 8,
    sleepQuality: 7,
    sleepDuration: 7,
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    
    // Reset form to today with default values
    setFormData({
      date: today,
      workoutIntensity: 5,
      workoutDuration: 45,
      workoutType: '',
      workHours: 8,
      sleepQuality: 7,
      sleepDuration: 7,
      notes: '',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log Your Day</CardTitle>
        <CardDescription>
          Enter your workout, work, and sleep data to track your recovery
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              max={today}
              required
            />
          </div>

          <div className="space-y-4 p-4 bg-red-50 rounded-lg border border-red-100">
            <h3 className="text-slate-900">Workout Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="workoutType">Workout Type</Label>
              <Select
                value={formData.workoutType}
                onValueChange={(value) => setFormData({ ...formData, workoutType: value })}
              >
                <SelectTrigger id="workoutType">
                  <SelectValue placeholder="Select type (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Strength Training">Strength Training</SelectItem>
                  <SelectItem value="Cardio">Cardio</SelectItem>
                  <SelectItem value="HIIT">HIIT</SelectItem>
                  <SelectItem value="Running">Running</SelectItem>
                  <SelectItem value="Cycling">Cycling</SelectItem>
                  <SelectItem value="Swimming">Swimming</SelectItem>
                  <SelectItem value="Sports">Sports</SelectItem>
                  <SelectItem value="Yoga">Yoga</SelectItem>
                  <SelectItem value="CrossFit">CrossFit</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="workoutDuration">Duration (minutes)</Label>
              <Input
                id="workoutDuration"
                type="number"
                min="0"
                max="300"
                value={formData.workoutDuration}
                onChange={(e) => setFormData({ ...formData, workoutDuration: parseInt(e.target.value) || 0 })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="workoutIntensity">
                Intensity: {formData.workoutIntensity}/10
              </Label>
              <Slider
                id="workoutIntensity"
                min={0}
                max={10}
                step={1}
                value={[formData.workoutIntensity]}
                onValueChange={(value) => setFormData({ ...formData, workoutIntensity: value[0] })}
                className="py-4"
              />
              <div className="flex justify-between text-slate-500">
                <span>Rest Day</span>
                <span>Light</span>
                <span>Moderate</span>
                <span>Intense</span>
              </div>
            </div>
          </div>

          <div className="space-y-4 p-4 bg-orange-50 rounded-lg border border-orange-100">
            <h3 className="text-slate-900">Work Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="workHours">Hours Worked</Label>
              <Input
                id="workHours"
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={formData.workHours}
                onChange={(e) => setFormData({ ...formData, workHours: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
          </div>

          <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <h3 className="text-slate-900">Sleep Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="sleepDuration">Duration (hours)</Label>
              <Input
                id="sleepDuration"
                type="number"
                min="0"
                max="24"
                step="0.5"
                value={formData.sleepDuration}
                onChange={(e) => setFormData({ ...formData, sleepDuration: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sleepQuality">
                Quality: {formData.sleepQuality}/10
              </Label>
              <Slider
                id="sleepQuality"
                min={0}
                max={10}
                step={1}
                value={[formData.sleepQuality]}
                onValueChange={(value) => setFormData({ ...formData, sleepQuality: value[0] })}
                className="py-4"
              />
              <div className="flex justify-between text-slate-500">
                <span>Poor</span>
                <span>Fair</span>
                <span>Good</span>
                <span>Excellent</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="How are you feeling? Any injuries or concerns?"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Log Activity
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}