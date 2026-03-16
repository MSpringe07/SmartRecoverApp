import { useState, useEffect } from 'react';
import { DayData, UserProfile, Injury } from '../App';
import { RecoveryScore } from './RecoveryScore';
import { AnalysisDashboard } from './AnalysisDashboard';
import { WorkoutDetails } from './WorkoutDetails';
import { InjuryTracker } from './InjuryTracker';
import { RecoveryTips } from './RecoveryTips';
import { ActivityForm } from './ActivityForm';
import { PeriodTracker } from './PeriodTracker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { LogOut, User, TrendingUp, ListChecks, Heart, Lightbulb, Activity, CalendarDays } from 'lucide-react';
import { supabase } from '../utils/supabase/client';
import { ProfilePage } from './ProfilePage';
import { AIChat } from './AIChat';
import { CalendarSchedule } from './CalendarSchedule';
import { WeatherWidget } from './WeatherWidget';
import { projectId } from '../utils/supabase/info';
import logoImage from 'figma:asset/e941ba48d68af2d91dc45c7acfd2770d80be6c7d.png';

interface DashboardProps {
  session: any;
}

export function Dashboard({ session }: DashboardProps) {
  const [weekData, setWeekData] = useState<DayData[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [session]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadProfile(), loadActivities()]);
    setLoading(false);
  };

  const loadProfile = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b0cf6bec/profile`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadActivities = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b0cf6bec/activities`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setWeekData(data.activities || []);
      }
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  };

  const handleAddDay = async (newDay: Omit<DayData, 'id' | 'userId'>) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b0cf6bec/activities`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(newDay),
        }
      );

      if (response.ok) {
        await loadActivities();
      }
    } catch (error) {
      console.error('Error saving activity:', error);
    }
  };

  const handleDeleteActivity = async (date: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b0cf6bec/activities/${date}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.ok) {
        await loadActivities();
      }
    } catch (error) {
      console.error('Error deleting activity:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleProfileUpdate = async () => {
    await loadProfile();
    setProfileOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-slate-600 font-medium">Loading...</div>
      </div>
    );
  }

  return (
  <div className="min-h-screen bg-gradient-to-br from-purple-600 via-indigo-500 to-blue-500 font-['Inter',sans-serif]">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-7xl">
        {/* Header with new logo */}
        <header className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-center justify-between bg-white rounded-3xl shadow-sm border border-slate-100 px-4 sm:px-8 py-5 gap-4 sm:gap-0">
          <div className="flex items-center gap-3 sm:gap-4">
            <img 
              src={logoImage} 
              alt="SmartRecover Logo" 
              className="h-24 sm:h-32 w-auto"
            />
          </div>
          <div className="flex items-center gap-2">
            <Sheet open={profileOpen} onOpenChange={setProfileOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="bg-gradient-to-r from-purple-600 to-blue-500 text-white hover:from-purple-700 hover:to-blue-600 rounded-2xl px-5 py-2.5 shadow-sm"
                >
                  <User className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline font-semibold">{profile?.name || 'Profile'}</span>
                </Button>
              </SheetTrigger>
              <SheetContent className="overflow-y-auto bg-white border-slate-100 rounded-l-3xl">
                <SheetHeader>
                  <SheetTitle className="text-slate-900 font-bold text-xl">Your Profile</SheetTitle>
                  <SheetDescription className="text-slate-500">
                    Update your personal information
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 px-1">
                  <ProfilePage 
                    profile={profile} 
                    session={session} 
                    onUpdate={handleProfileUpdate}
                  />
                </div>
              </SheetContent>
            </Sheet>
            <Button 
              variant="ghost" 
              onClick={handleLogout} 
              className="border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-2xl px-4 py-2.5"
            >
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline font-medium">Logout</span>
            </Button>
          </div>
        </header>

        <div className="mb-4 sm:mb-6">
          <RecoveryScore weekData={weekData} profile={profile} />
        </div>

        <div className="mb-4 sm:mb-6 grid grid-cols-1 lg:grid-cols-2 gap-4 rounded-t-[2rem] overflow-hidden">
          <CalendarSchedule session={session} profile={profile} weekData={weekData} />
          <WeatherWidget profile={profile} />
        </div>

        <Tabs defaultValue="dashboard" className="space-y-4 sm:space-y-6">
          <div className="flex justify-center px-2">
            <TabsList className="grid grid-cols-6 w-full max-w-6xl h-20 bg-slate-50/80 backdrop-blur-sm shadow-md border border-slate-100 p-3 rounded-[24px] gap-3">
              <TabsTrigger 
                value="dashboard" 
                className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:bg-white rounded-2xl transition-all px-3 py-4 font-semibold text-center min-h-[56px]"
              >
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs sm:text-sm hidden sm:inline">Analysis</span>
              </TabsTrigger>
              <TabsTrigger 
                value="workouts" 
                className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:bg-white rounded-2xl transition-all px-3 py-4 font-semibold text-center min-h-[56px]"
              >
                <ListChecks className="w-4 h-4" />
                <span className="text-xs sm:text-sm hidden sm:inline">Workouts</span>
              </TabsTrigger>
              <TabsTrigger 
                value="injuries" 
                className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:bg-white rounded-2xl transition-all px-3 py-4 font-semibold text-center min-h-[56px]"
              >
                <Heart className="w-4 h-4" />
                <span className="text-xs sm:text-sm hidden sm:inline">Injuries</span>
              </TabsTrigger>
              <TabsTrigger 
                value="tips" 
                className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:bg-white rounded-2xl transition-all px-3 py-4 font-semibold text-center min-h-[56px]"
              >
                <Lightbulb className="w-4 h-4" />
                <span className="text-xs sm:text-sm hidden sm:inline">Tips</span>
              </TabsTrigger>
              <TabsTrigger 
                value="period" 
                className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:bg-white rounded-2xl transition-all px-3 py-4 font-semibold text-center min-h-[56px]"
              >
                <CalendarDays className="w-4 h-4" />
                <span className="text-xs sm:text-sm hidden sm:inline">Period</span>
              </TabsTrigger>
              <TabsTrigger 
                value="log" 
                className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:bg-white rounded-2xl transition-all px-3 py-4 font-semibold text-center min-h-[56px]"
              >
                <Activity className="w-4 h-4" />
                <span className="text-xs sm:text-sm hidden sm:inline">Log</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dashboard" className="space-y-6">
            <AnalysisDashboard weekData={weekData} profile={profile} session={session} />
          </TabsContent>

          <TabsContent value="workouts" className="space-y-6">
            <WorkoutDetails weekData={weekData} onDelete={handleDeleteActivity} />
          </TabsContent>

          <TabsContent value="injuries" className="space-y-6">
            <InjuryTracker session={session} profile={profile} />
          </TabsContent>

          <TabsContent value="tips" className="space-y-6">
            <RecoveryTips weekData={weekData} profile={profile} session={session} />
          </TabsContent>

          <TabsContent value="period" className="space-y-6">
            <PeriodTracker profile={profile} session={session} onUpdate={loadProfile} />
          </TabsContent>

          <TabsContent value="log" className="space-y-6">
            <ActivityForm onSubmit={handleAddDay} />
          </TabsContent>
        </Tabs>
      </div>
      
      <AIChat session={session} profile={profile} weekData={weekData} />
    </div>
  );
}