import { useState, useEffect } from 'react';
import { Injury, UserProfile } from '../App';
import { projectId } from '../utils/supabase/info';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Heart, Plus, X, AlertCircle, CheckCircle, Activity } from 'lucide-react';

interface InjuryTrackerProps {
  session: any;
  profile: UserProfile | null;
}

const injuryTypes = [
  'Muscle Strain',
  'Ligament Sprain',
  'Tendonitis',
  'Joint Pain',
  'Fracture',
  'Stress Fracture',
  'Back Pain',
  'Knee Pain',
  'Shoulder Pain',
  'Ankle Pain',
  'Hip Pain',
  'Elbow Pain',
  'Wrist Pain',
  'Other',
];

export function InjuryTracker({ session, profile }: InjuryTrackerProps) {
  const [injuries, setInjuries] = useState<Injury[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [newInjury, setNewInjury] = useState({
    name: '',
    type: '',
    severity: 'moderate' as 'mild' | 'moderate' | 'severe',
    dateOccurred: new Date().toISOString().split('T')[0],
    notes: '',
  });

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

  const handleAddInjury = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b0cf6bec/injuries`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            ...newInjury,
            status: 'current',
          }),
        }
      );

      if (response.ok) {
        setSuccess('Injury logged successfully');
        setNewInjury({
          name: '',
          type: '',
          severity: 'moderate',
          dateOccurred: new Date().toISOString().split('T')[0],
          notes: '',
        });
        await loadInjuries();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to log injury');
      }
    } catch (err: any) {
      console.error('Error adding injury:', err);
      setError(err.message || 'Failed to log injury');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRecovered = async (injuryId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b0cf6bec/injuries/${injuryId}/recover`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            dateRecovered: new Date().toISOString().split('T')[0],
          }),
        }
      );

      if (response.ok) {
        setSuccess('Injury marked as recovered!');
        await loadInjuries();
      }
    } catch (err) {
      console.error('Error marking injury as recovered:', err);
    }
  };

  const handleDeleteInjury = async (injuryId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b0cf6bec/injuries/${injuryId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.ok) {
        await loadInjuries();
      }
    } catch (err) {
      console.error('Error deleting injury:', err);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'mild':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'moderate':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'severe':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const currentInjuries = injuries.filter(i => i.status === 'current');
  const recoveredInjuries = injuries.filter(i => i.status === 'recovered');

  return (
    <div className="space-y-6">
      {currentInjuries.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You have {currentInjuries.length} active {currentInjuries.length === 1 ? 'injury' : 'injuries'}. 
            Make sure to adjust your training intensity and consult a healthcare professional.
          </AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-500 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Log New Injury
          </CardTitle>
          <CardDescription>
            Track injuries to receive personalized recovery recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddInjury} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="injury-name">Injury Name / Location</Label>
              <Input
                id="injury-name"
                placeholder="e.g., Left knee strain, Right shoulder pain"
                value={newInjury.name}
                onChange={(e) => setNewInjury({ ...newInjury, name: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="injury-type">Type</Label>
                <Select
                  value={newInjury.type}
                  onValueChange={(value) => setNewInjury({ ...newInjury, type: value })}
                  required
                >
                  <SelectTrigger id="injury-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {injuryTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="injury-severity">Severity</Label>
                <Select
                  value={newInjury.severity}
                  onValueChange={(value: 'mild' | 'moderate' | 'severe') => 
                    setNewInjury({ ...newInjury, severity: value })
                  }
                >
                  <SelectTrigger id="injury-severity">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mild">Mild - Minor discomfort</SelectItem>
                    <SelectItem value="moderate">Moderate - Noticeable pain</SelectItem>
                    <SelectItem value="severe">Severe - Significant impairment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="injury-date">Date Occurred</Label>
              <Input
                id="injury-date"
                type="date"
                value={newInjury.dateOccurred}
                onChange={(e) => setNewInjury({ ...newInjury, dateOccurred: e.target.value })}
                max={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="injury-notes">Notes (optional)</Label>
              <Textarea
                id="injury-notes"
                placeholder="How did it happen? What activities aggravate it?"
                value={newInjury.notes}
                onChange={(e) => setNewInjury({ ...newInjury, notes: e.target.value })}
                rows={3}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              <Plus className="w-4 h-4 mr-2" />
              {loading ? 'Logging...' : 'Log Injury'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Tabs defaultValue="current" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="current">
            <Heart className="w-4 h-4 mr-2" />
            Current ({currentInjuries.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            <Activity className="w-4 h-4 mr-2" />
            History ({recoveredInjuries.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4">
          {currentInjuries.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-slate-500">
                No active injuries. Keep up the good work!
              </CardContent>
            </Card>
          ) : (
            currentInjuries.map((injury) => (
              <Card key={injury.id} className="border-2 border-red-200">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-slate-900">{injury.name}</h3>
                        <Badge className={getSeverityColor(injury.severity)}>
                          {injury.severity}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-slate-600">
                        <p>Type: {injury.type}</p>
                        <p>Date occurred: {new Date(injury.dateOccurred).toLocaleDateString()}</p>
                        {injury.notes && (
                          <p className="mt-2 text-slate-500">{injury.notes}</p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteInjury(injury.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleMarkRecovered(injury.id)}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark as Recovered
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {recoveredInjuries.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-slate-500">
                No injury history recorded
              </CardContent>
            </Card>
          ) : (
            recoveredInjuries.map((injury) => (
              <Card key={injury.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-slate-900">{injury.name}</h3>
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                          Recovered
                        </Badge>
                        <Badge className={getSeverityColor(injury.severity)}>
                          {injury.severity}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-slate-600">
                        <p>Type: {injury.type}</p>
                        <p>Occurred: {new Date(injury.dateOccurred).toLocaleDateString()}</p>
                        {injury.dateRecovered && (
                          <p>Recovered: {new Date(injury.dateRecovered).toLocaleDateString()}</p>
                        )}
                        {injury.notes && (
                          <p className="mt-2 text-slate-500">{injury.notes}</p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteInjury(injury.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
