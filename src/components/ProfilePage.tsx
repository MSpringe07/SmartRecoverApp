import { useState, useEffect } from 'react';
import { UserProfile } from '../App';
import { projectId } from '../utils/supabase/info';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { Save } from 'lucide-react';
import { PeriodTracker } from './PeriodTracker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface ProfilePageProps {
  profile: UserProfile | null;
  session: any;
  onUpdate: () => void;
}

export function ProfilePage({ profile, session, onUpdate }: ProfilePageProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    height: '',
    weight: '',
    gender: 'male',
    bodyFatPercentage: '',
    location: '',
    latitude: '',
    longitude: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name,
        age: profile.age.toString(),
        height: profile.height.toString(),
        weight: profile.weight.toString(),
        gender: profile.gender,
        bodyFatPercentage: profile.bodyFatPercentage?.toString() || '',
        location: profile.location || '',
        latitude: profile.latitude?.toString() || '',
        longitude: profile.longitude?.toString() || '',
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b0cf6bec/profile`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            ...formData,
            latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
            longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
          }),
        }
      );

      if (response.ok) {
        setSuccess('Profile updated successfully!');
        onUpdate();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update profile');
      }
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const calculateBMI = () => {
    if (formData.height && formData.weight) {
      const heightM = parseFloat(formData.height) / 100;
      const weightKg = parseFloat(formData.weight);
      return (weightKg / (heightM * heightM)).toFixed(1);
    }
    return 'N/A';
  };

  const getBMICategory = (bmi: string) => {
    if (bmi === 'N/A') return '';
    const bmiNum = parseFloat(bmi);
    if (bmiNum < 18.5) return 'Underweight';
    if (bmiNum < 25) return 'Normal weight';
    if (bmiNum < 30) return 'Overweight';
    return 'Obese';
  };

  const handleLocationChange = async () => {
    setLocationLoading(true);
    setError('');

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b0cf6bec/location`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setFormData({
          ...formData,
          location: data.location,
          latitude: data.latitude,
          longitude: data.longitude,
        });
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to get location');
      }
    } catch (err: any) {
      console.error('Error getting location:', err);
      setError(err.message || 'Failed to get location');
    } finally {
      setLocationLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-2 pb-10">
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 bg-slate-100/50 p-1.5 rounded-2xl h-14">
          <TabsTrigger value="profile" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">Profile</TabsTrigger>
          <TabsTrigger value="period" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm" disabled={formData.gender === 'male'}>
            Period Tracker
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          {success && (
            <Alert className="mb-4 border-green-500 bg-green-50">
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile?.email || ''}
                disabled
                className="bg-slate-100"
              />
              <p className="text-slate-500">Email cannot be changed</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  min="13"
                  max="120"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => setFormData({ ...formData, gender: value })}
                >
                  <SelectTrigger id="gender">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                  min="100"
                  max="250"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  min="30"
                  max="300"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bodyFat">Body Fat Percentage (optional)</Label>
              <Input
                id="bodyFat"
                type="number"
                step="0.1"
                placeholder="e.g., 15.5"
                value={formData.bodyFatPercentage}
                onChange={(e) => setFormData({ ...formData, bodyFatPercentage: e.target.value })}
                min="3"
                max="50"
              />
              <p className="text-slate-500">Enter if you know your body composition</p>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
              <h3 className="text-slate-900 mb-2">Health Metrics</h3>
              <div className="grid grid-cols-2 gap-4 text-slate-600">
                <div>
                  <span className="block">BMI</span>
                  <span className="text-slate-900">{calculateBMI()}</span>
                </div>
                <div>
                  <span className="block">Category</span>
                  <span className="text-slate-900">{getBMICategory(calculateBMI())}</span>
                </div>
                {formData.bodyFatPercentage && (
                  <>
                    <div>
                      <span className="block">Body Fat</span>
                      <span className="text-slate-900">{formData.bodyFatPercentage}%</span>
                    </div>
                    <div>
                      <span className="block">Lean Mass</span>
                      <span className="text-slate-900">
                        {formData.weight && formData.bodyFatPercentage
                          ? (parseFloat(formData.weight) * (1 - parseFloat(formData.bodyFatPercentage) / 100)).toFixed(1)
                          : 'N/A'} kg
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location (for weather data)</Label>
              <Input
                id="location"
                type="text"
                placeholder="Enter city name"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
              <p className="text-xs text-slate-500">Used to provide weather-based training recommendations</p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="period" className="space-y-4">
          {(formData.gender === 'female' || formData.gender === 'other') && (
            <PeriodTracker profile={profile} session={session} onUpdate={onUpdate} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}