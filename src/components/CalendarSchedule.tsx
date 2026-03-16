import { useState, useEffect } from 'react';
import { DayData, UserProfile } from '../App';
import { projectId } from '../utils/supabase/info';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  X, 
  BookOpen, 
  Dumbbell,
  Moon,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Repeat
} from 'lucide-react';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';

interface CalendarScheduleProps {
  session: any;
  profile: UserProfile | null;
  weekData: DayData[];
}

interface ScheduleEvent {
  id: string;
  userId: string;
  date: string;
  type: 'school' | 'workout' | 'rest' | 'ai-recommendation';
  title: string;
  startTime?: string;
  endTime?: string;
  notes?: string;
  repeatType?: 'none' | 'daily' | 'weekly' | 'monthly';
  repeatEndDate?: string;
  isRepeating?: boolean;
  parentEventId?: string;
}

export function CalendarSchedule({ session, profile, weekData }: CalendarScheduleProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  const [newEvent, setNewEvent] = useState({
    type: 'school' as 'school' | 'workout' | 'rest',
    title: '',
    startTime: '',
    endTime: '',
    notes: '',
    repeatType: 'none' as 'none' | 'daily' | 'weekly' | 'monthly',
    repeatEndDate: '',
    isRepeating: false,
    parentEventId: '',
  });

  useEffect(() => {
    loadEvents();
  }, [session]);

  const loadEvents = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b0cf6bec/schedule`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error('Error loading events:', err);
    }
  };

  const startEditing = (event: ScheduleEvent) => {
    setEditingEventId(event.id);
    setNewEvent({
      type: event.type as any,
      title: event.title,
      startTime: event.startTime || '',
      endTime: event.endTime || '',
      notes: event.notes || '',
      repeatType: event.repeatType || 'none',
      repeatEndDate: event.repeatEndDate || '',
      isRepeating: !!event.isRepeating,
      parentEventId: event.parentEventId || '',
    });
  };

  const handleAddEvent = async () => {
  if (!selectedDate || !newEvent.title) return;

  setLoading(true);
  try {
    // If editingEventId exists, we PUT to the specific ID, otherwise POST to the collection
    const url = editingEventId 
      ? `https://${projectId}.supabase.co/functions/v1/make-server-b0cf6bec/schedule/${editingEventId}`
      : `https://${projectId}.supabase.co/functions/v1/make-server-b0cf6bec/schedule`;
    
    const method = editingEventId ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        ...newEvent,
        date: selectedDate,
      }),
    });

    if (response.ok) {
      await loadEvents();
      setDialogOpen(false);
      setEditingEventId(null); // Reset editing state
      setNewEvent({
        type: 'school',
        title: '',
        startTime: '',
        endTime: '',
        notes: '',
        repeatType: 'none',
        repeatEndDate: '',
        isRepeating: false,
        parentEventId: '',
      });
    }
  } catch (err) {
    console.error('Error saving event:', err);
  } finally {
    setLoading(false);
  }
};

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b0cf6bec/schedule/${eventId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.ok) {
        await loadEvents();
      }
    } catch (err) {
      console.error('Error deleting event:', err);
    }
  };

  const handleGetAIRecommendations = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b0cf6bec/ai-schedule-recommendations`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.ok) {
        await loadEvents();
      }
    } catch (err) {
      console.error('Error getting AI recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const getEventsForDate = (date: Date | null) => {
  if (!date) return [];
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const dateStr = `${y}-${m}-${d}`;

  return events.filter(event => {
    // 1. Direct match
    if (event.date === dateStr) return true;

    // 2. Recurrence check
    if (event.repeatType && event.repeatType !== 'none') {
      // FIX: Add T00:00:00 to force local time interpretation
      const eventStartDate = new Date(event.date + 'T00:00:00'); 
      const targetDate = new Date(dateStr + 'T00:00:00');

      if (targetDate < eventStartDate) return false;

      if (event.repeatEndDate) {
        const endDate = new Date(event.repeatEndDate + 'T23:59:59');
        if (targetDate > endDate) return false;
      }

      switch (event.repeatType) {
        case 'daily': return true;
        case 'weekly':
          return targetDate.getDay() === eventStartDate.getDay();
        case 'monthly':
          return targetDate.getDate() === eventStartDate.getDate();
        default: return false;
      }
    }
    return false;
  });
};

  const getEventColor = (type: string) => {
    switch (type) {
      case 'school':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'workout':
        return 'bg-pink-100 text-pink-700 border-pink-300';
      case 'rest':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'ai-recommendation':
        return 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-purple-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'school':
        return <BookOpen className="w-3 h-3" />;
      case 'workout':
        return <Dumbbell className="w-3 h-3" />;
      case 'rest':
        return <Moon className="w-3 h-3" />;
      case 'ai-recommendation':
        return <Sparkles className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const days = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const aiRecommendations = events.filter(e => e.type === 'ai-recommendation');

  return (
    <div className="space-y-4">
      {aiRecommendations.length > 0 && (
        <Alert className="border-0 border-l-4 border-l-purple-600 bg-purple-50 shadow-sm rounded-[2rem] px-6 py-3 flex items-center gap-3 !rounded-[2rem]">
          <Sparkles className="h-4 w-4 text-purple-600 shrink-0" />
          <AlertDescription className="text-purple-900 font-medium">
            AI has added {aiRecommendations.length} recommended {aiRecommendations.length === 1 ? 'event' : 'events'} to your calendar based on your training data.
          </AlertDescription>
        </Alert>
      )}

      <Card className="border-0 shadow-md bg-white rounded-[2rem] overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-transparent border-b border-purple-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="w-full sm:w-auto">
              <CardTitle className="flex items-center justify-center sm:justify-start gap-2 text-slate-900 mb-2">
                <div className="p-2 bg-purple-700 rounded-lg">
                  <CalendarIcon className="w-4 h-4 text-white" />
                </div>
                Your Schedule
              </CardTitle>
              <CardDescription className="text-center sm:text-left text-slate-600">
                Manage your school schedule, workouts, and rest days
              </CardDescription>
            </div>
            <Button onClick={handleGetAIRecommendations} disabled={loading} className="w-full sm:w-auto bg-purple-700 hover:bg-purple-800">
              <Sparkles className="w-4 h-4 mr-2" />
              Get AI Suggestions
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4"> {/* Changed to space-y-4 instead of grid */}
  {/* Top Navigation Row */}
  <div className="flex items-center justify-between mb-4">
    <Button
      variant="outline"
      size="sm"
      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
      className="hover:bg-purple-50 border-purple-200 bg-white"
    >
      <ChevronLeft className="w-4 h-4 text-purple-700" />
    </Button>
    <h3 className="text-lg font-semibold text-slate-900 text-center">{monthName}</h3>
    <Button
      variant="outline"
      size="sm"
      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
      className="hover:bg-purple-50 border-purple-200 bg-white"
    >
      <ChevronRight className="w-4 h-4 text-purple-700" />
    </Button>
  </div>

  {/* The Actual Calendar Grid */}
  <div className="grid grid-cols-7 gap-1 sm:gap-2">
    {/* Headers (Sun, Mon, Tue...) */}
    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
      <div key={day} className="text-center text-xs font-semibold text-purple-700 p-2">
        {day}
      </div>
    ))}
    
    {/* Calendar Days */}
    {days.map((day, index) => {
      const dayEvents = getEventsForDate(day);
      const isToday = day && day.toDateString() === new Date().toDateString();
      
      return (
        <div
          key={index}
          className={`min-h-[100px] sm:min-h-[120px] w-full p-2 border rounded-2xl transition-all flex flex-col justify-start gap-1 overflow-hidden ${
            day ? 'bg-white hover:bg-slate-50 cursor-pointer shadow-sm' : 'bg-slate-50/50 opacity-40'
          } ${isToday ? 'ring-2 ring-purple-600 border-transparent shadow-md' : 'border-slate-100'}`}
          onClick={() => {
            if (day) {
              const year = day.getFullYear();
              const month = String(day.getMonth() + 1).padStart(2, '0');
              const dateNum = String(day.getDate()).padStart(2, '0');
              const cleanDateStr = `${year}-${month}-${dateNum}`;
              
              setSelectedDate(cleanDateStr);
              setEditingEventId(null);
              setDialogOpen(true);
            }
          }}
        >
          {day && (
            <>
              <div className={`text-xs sm:text-sm font-semibold text-center ${isToday ? 'text-purple-700' : 'text-slate-900'}`}>
                {day.getDate()}
              </div>
              <div className="space-y-1 w-full">
                {dayEvents.slice(0, 2).map((event) => (
                  <div
                    key={event.id}
                    className={`text-xs p-1 rounded border flex items-center gap-1 overflow-hidden ${getEventColor(event.type)}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {getEventIcon(event.type)}
                    <span className="truncate flex-1">{event.title}</span>
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-[10px] text-slate-500 font-medium text-center">
                    +{dayEvents.length - 2} more
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      );
    })}
  </div>
</CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md rounded-[2rem] max-h-[90vh] overflow-y-auto [&::-webkit-scrollbar]:hidden">
          <DialogHeader>
            <DialogTitle>
              {/* FIX 3: Force local date for the title header */}
              {selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { 
                weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' 
              }) : 'Add Event'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2">
              <div className="space-y-2">
              <h4 className="text-slate-700 font-semibold">Existing Events</h4>
              {selectedDate && getEventsForDate(new Date(selectedDate + 'T00:00:00')).map((event) => (
                <div key={event.id} className={`p-4 rounded-2xl border flex items-center justify-between ${getEventColor(event.type)}`}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {getEventIcon(event.type)}
                      <span className="font-bold">{event.title}</span>
                      {event.repeatType !== 'none' && <Repeat className="w-3 h-3 opacity-60" />}
                    </div>
                    <p className="text-sm opacity-80">{event.startTime} - {event.endTime}</p>
                  </div>
                  
                  {/* Edit/Delete Buttons */}
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => startEditing(event)}>
                       Edit
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDeleteEvent(event.id)}>
                       <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 pt-4 border-t">
              <h4 className="text-slate-700 font-semibold">{editingEventId ? 'Edit Event' : 'Add New Event'}</h4>
              
              <div className="space-y-2">
                <Label htmlFor="event-type">Event Type</Label>
                <Select
                  value={newEvent.type}
                  onValueChange={(value: 'school' | 'workout' | 'rest') => 
                    setNewEvent({ ...newEvent, type: value })
                  }
                >
                  <SelectTrigger id="event-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="school">School/Work</SelectItem>
                    <SelectItem value="workout">Workout</SelectItem>
                    <SelectItem value="rest">Rest Day</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="event-title">Title</Label>
                <Input
                  id="event-title"
                  placeholder="e.g., Morning class, Leg day"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="start-time">Start Time</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={newEvent.startTime}
                    onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-time">End Time</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={newEvent.endTime}
                    onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="event-notes">Notes (optional)</Label>
                <Input
                  id="event-notes"
                  placeholder="Additional details..."
                  value={newEvent.notes}
                  onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="repeat-type">Repeat</Label>
                <Select
                  value={newEvent.repeatType}
                  onValueChange={(value: 'none' | 'daily' | 'weekly' | 'monthly') => 
                    setNewEvent({ ...newEvent, repeatType: value })
                  }
                >
                  <SelectTrigger id="repeat-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Does not repeat</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newEvent.repeatType !== 'none' && (
                <div className="space-y-2">
                  <Label htmlFor="repeat-end-date">Repeat Until (optional)</Label>
                  <Input
                    id="repeat-end-date"
                    type="date"
                    value={newEvent.repeatEndDate}
                    onChange={(e) => setNewEvent({ ...newEvent, repeatEndDate: e.target.value })}
                    min={selectedDate || undefined}
                  />
                  <p className="text-xs text-slate-500">Leave empty to repeat indefinitely</p>
                </div>
              )}

              <Button onClick={handleAddEvent} className="w-full bg-purple-700 rounded-xl py-6">
                {editingEventId ? 'Update Event' : 'Add Event'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}