import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const app = new Hono();

app.use('*', cors());
app.use('*', logger(console.log));

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Sign up endpoint
app.post('/make-server-b0cf6bec/signup', async (c) => {
  try {
    const { email, password, name, age, height, weight, gender, bodyFatPercentage } = await c.req.json();

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm since email server not configured
      user_metadata: { name },
    });

    if (authError) {
      console.log(`Auth error during signup: ${authError.message}`);
      return c.json({ error: authError.message }, 400);
    }

    // Store user profile in KV store
    const userProfile = {
      userId: authData.user.id,
      name,
      email,
      age: parseInt(age),
      height: parseFloat(height),
      weight: parseFloat(weight),
      gender,
      bodyFatPercentage: bodyFatPercentage ? parseFloat(bodyFatPercentage) : undefined,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`profile:${authData.user.id}`, userProfile);

    return c.json({ 
      success: true, 
      user: { id: authData.user.id, email: authData.user.email },
    });
  } catch (error) {
    console.log(`Error during signup: ${error}`);
    return c.json({ error: 'Signup failed' }, 500);
  }
});

// Get user profile
app.get('/make-server-b0cf6bec/profile', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (!user || error) {
      console.log(`Auth error while fetching profile: ${error?.message}`);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const profile = await kv.get(`profile:${user.id}`);
    
    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404);
    }

    return c.json({ profile });
  } catch (error) {
    console.log(`Error fetching profile: ${error}`);
    return c.json({ error: 'Failed to fetch profile' }, 500);
  }
});

// Update user profile
app.put('/make-server-b0cf6bec/profile', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (!user || error) {
      console.log(`Auth error while updating profile: ${error?.message}`);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { name, age, height, weight, gender, bodyFatPercentage, location, latitude, longitude } = await c.req.json();

    const existingProfile = await kv.get(`profile:${user.id}`);
    
    // If location is provided without lat/long, geocode it
    let finalLatitude = latitude ? parseFloat(latitude as string) : undefined;
    let finalLongitude = longitude ? parseFloat(longitude as string) : undefined;
    
    if (location && !finalLatitude && !finalLongitude) {
      try {
        // Use Open-Meteo's geocoding API
        const geocodeResponse = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`
        );
        
        if (geocodeResponse.ok) {
          const geocodeData = await geocodeResponse.json();
          if (geocodeData.results && geocodeData.results.length > 0) {
            finalLatitude = geocodeData.results[0].latitude;
            finalLongitude = geocodeData.results[0].longitude;
          }
        }
      } catch (geocodeError) {
        console.log(`Error geocoding location: ${geocodeError}`);
      }
    }
    
    const updatedProfile = {
      ...existingProfile,
      name,
      age: parseInt(age),
      height: parseFloat(height),
      weight: parseFloat(weight),
      gender,
      bodyFatPercentage: bodyFatPercentage ? parseFloat(bodyFatPercentage) : undefined,
      location: location || undefined,
      latitude: finalLatitude,
      longitude: finalLongitude,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`profile:${user.id}`, updatedProfile);

    return c.json({ success: true, profile: updatedProfile });
  } catch (error) {
    console.log(`Error updating profile: ${error}`);
    return c.json({ error: 'Failed to update profile' }, 500);
  }
});

// Update period tracking data
app.put('/make-server-b0cf6bec/profile/period', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (!user || error) {
      console.log(`Auth error while updating period data: ${error?.message}`);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { lastPeriodDate, cycleLength, periodLength } = await c.req.json();

    const existingProfile = await kv.get(`profile:${user.id}`);
    
    const updatedProfile = {
      ...existingProfile,
      lastPeriodDate: lastPeriodDate || undefined,
      cycleLength: cycleLength ? parseInt(cycleLength) : undefined,
      periodLength: periodLength ? parseInt(periodLength) : undefined,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`profile:${user.id}`, updatedProfile);

    return c.json({ success: true, profile: updatedProfile });
  } catch (error) {
    console.log(`Error updating period tracking: ${error}`);
    return c.json({ error: 'Failed to update period tracking' }, 500);
  }
});

// Save workout/activity data
app.post('/make-server-b0cf6bec/activities', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (!user || error) {
      console.log(`Auth error while saving activity: ${error?.message}`);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const activityData = await c.req.json();
    const activityId = `activity:${user.id}:${activityData.date}`;

    const activity = {
      ...activityData,
      userId: user.id,
      id: activityId,
    };

    await kv.set(activityId, activity);

    return c.json({ success: true, activity });
  } catch (error) {
    console.log(`Error saving activity: ${error}`);
    return c.json({ error: 'Failed to save activity' }, 500);
  }
});

// Get all activities for user
app.get('/make-server-b0cf6bec/activities', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (!user || error) {
      console.log(`Auth error while fetching activities: ${error?.message}`);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const activities = await kv.getByPrefix(`activity:${user.id}:`);

    return c.json({ activities: activities || [] });
  } catch (error) {
    console.log(`Error fetching activities: ${error}`);
    return c.json({ error: 'Failed to fetch activities' }, 500);
  }
});

// Delete activity
app.delete('/make-server-b0cf6bec/activities/:date', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (!user || error) {
      console.log(`Auth error while deleting activity: ${error?.message}`);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const date = c.req.param('date');
    const activityId = `activity:${user.id}:${date}`;

    await kv.del(activityId);

    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting activity: ${error}`);
    return c.json({ error: 'Failed to delete activity' }, 500);
  }
});

// Create injury
app.post('/make-server-b0cf6bec/injuries', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (!user || error) {
      console.log(`Auth error while creating injury: ${error?.message}`);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const injuryData = await c.req.json();
    const injuryId = `injury:${user.id}:${Date.now()}`;

    const injury = {
      ...injuryData,
      id: injuryId,
      userId: user.id,
      createdAt: new Date().toISOString(),
    };

    await kv.set(injuryId, injury);

    return c.json({ success: true, injury });
  } catch (error) {
    console.log(`Error creating injury: ${error}`);
    return c.json({ error: 'Failed to create injury' }, 500);
  }
});

// Get all injuries for user
app.get('/make-server-b0cf6bec/injuries', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (!user || error) {
      console.log(`Auth error while fetching injuries: ${error?.message}`);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const injuries = await kv.getByPrefix(`injury:${user.id}:`);

    return c.json({ injuries: injuries || [] });
  } catch (error) {
    console.log(`Error fetching injuries: ${error}`);
    return c.json({ error: 'Failed to fetch injuries' }, 500);
  }
});

// Mark injury as recovered
app.put('/make-server-b0cf6bec/injuries/:injuryId/recover', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (!user || error) {
      console.log(`Auth error while updating injury: ${error?.message}`);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const injuryId = c.req.param('injuryId');
    const { dateRecovered } = await c.req.json();

    const injury = await kv.get(injuryId);
    
    if (!injury || injury.userId !== user.id) {
      return c.json({ error: 'Injury not found' }, 404);
    }

    const updatedInjury = {
      ...injury,
      status: 'recovered',
      dateRecovered,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(injuryId, updatedInjury);

    return c.json({ success: true, injury: updatedInjury });
  } catch (error) {
    console.log(`Error updating injury: ${error}`);
    return c.json({ error: 'Failed to update injury' }, 500);
  }
});

// Delete injury
app.delete('/make-server-b0cf6bec/injuries/:injuryId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (!user || error) {
      console.log(`Auth error while deleting injury: ${error?.message}`);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const injuryId = c.req.param('injuryId');
    await kv.del(injuryId);

    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting injury: ${error}`);
    return c.json({ error: 'Failed to delete injury' }, 500);
  }
});

// Create schedule event
app.post('/make-server-b0cf6bec/schedule', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (!user || error) {
      console.log(`Auth error while creating schedule event: ${error?.message}`);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const eventData = await c.req.json();
    
    // Handle repeating events
    if (eventData.repeatType && eventData.repeatType !== 'none') {
      const startDate = new Date(eventData.date);
      const endDate = eventData.repeatEndDate ? new Date(eventData.repeatEndDate) : null;
      
      // Create parent event as template
      const parentEventId = `schedule:${user.id}:${Date.now()}:parent`;
      const parentEvent = {
        ...eventData,
        id: parentEventId,
        userId: user.id,
        isParent: true,
        createdAt: new Date().toISOString(),
      };
      await kv.set(parentEventId, parentEvent);
      
      // Generate recurring instances for the next 365 days or until end date
      const maxDate = endDate || new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000);
      const instances = [];
      let currentDate = new Date(startDate);
      let instanceCount = 0;
      
      while (currentDate <= maxDate && instanceCount < 365) {
        const instanceId = `schedule:${user.id}:${Date.now()}-instance-${instanceCount}`;
        const instance = {
          ...eventData,
          id: instanceId,
          userId: user.id,
          date: currentDate.toISOString().split('T')[0],
          parentEventId: parentEventId,
          isRepeating: true,
          createdAt: new Date().toISOString(),
        };
        
        await kv.set(instanceId, instance);
        instances.push(instance);
        
        // Increment date based on repeat type
        if (eventData.repeatType === 'daily') {
          currentDate.setDate(currentDate.getDate() + 1);
        } else if (eventData.repeatType === 'weekly') {
          currentDate.setDate(currentDate.getDate() + 7);
        } else if (eventData.repeatType === 'monthly') {
          currentDate.setMonth(currentDate.getMonth() + 1);
        }
        
        instanceCount++;
      }
      
      return c.json({ success: true, event: parentEvent, instances: instances.length });
    } else {
      // Single event
      const eventId = `schedule:${user.id}:${Date.now()}`;
      const event = {
        ...eventData,
        id: eventId,
        userId: user.id,
        createdAt: new Date().toISOString(),
      };

      await kv.set(eventId, event);

      return c.json({ success: true, event });
    }
  } catch (error) {
    console.log(`Error creating schedule event: ${error}`);
    return c.json({ error: 'Failed to create schedule event' }, 500);
  }
});

// Get all schedule events for user
app.get('/make-server-b0cf6bec/schedule', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (!user || error) {
      console.log(`Auth error while fetching schedule: ${error?.message}`);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const events = await kv.getByPrefix(`schedule:${user.id}:`);
    
    // Filter out parent events, only return instances and single events
    const visibleEvents = (events || []).filter((e: any) => !e.isParent);

    return c.json({ events: visibleEvents });
  } catch (error) {
    console.log(`Error fetching schedule: ${error}`);
    return c.json({ error: 'Failed to fetch schedule' }, 500);
  }
});

// Delete schedule event
app.delete('/make-server-b0cf6bec/schedule/:eventId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (!user || error) {
      console.log(`Auth error while deleting schedule event: ${error?.message}`);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const eventId = c.req.param('eventId');
    await kv.del(eventId);

    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting schedule event: ${error}`);
    return c.json({ error: 'Failed to delete schedule event' }, 500);
  }
});

// AI Schedule Recommendations
app.post('/make-server-b0cf6bec/ai-schedule-recommendations', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (!user || error) {
      console.log(`Auth error while generating AI recommendations: ${error?.message}`);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get user profile and data
    const profile = await kv.get(`profile:${user.id}`);
    const activities = await kv.getByPrefix(`activity:${user.id}:`);
    const injuries = await kv.getByPrefix(`injury:${user.id}:`);
    const currentEvents = await kv.getByPrefix(`schedule:${user.id}:`);

    // Calculate training load from last 7 days
    const recentActivities = (activities || []).slice(-7);
    const avgWorkoutIntensity = recentActivities.length > 0
      ? recentActivities.reduce((sum: number, a: any) => sum + (a.workoutIntensity || 0), 0) / recentActivities.length
      : 0;
    
    const avgSleepQuality = recentActivities.length > 0
      ? recentActivities.reduce((sum: number, a: any) => sum + (a.sleepQuality || 0), 0) / recentActivities.length
      : 0;

    const currentInjuries = (injuries || []).filter((i: any) => i.status === 'current');

    // Generate recommendations
    const recommendations = [];
    const today = new Date();

    // Remove existing AI recommendations
    const existingAIRecs = (currentEvents || []).filter((e: any) => e.type === 'ai-recommendation');
    for (const rec of existingAIRecs) {
      await kv.del(rec.id);
    }

    // Logic for recommendations
    if (avgWorkoutIntensity > 7 && avgSleepQuality < 6) {
      // High intensity with poor sleep -> suggest rest
      for (let i = 1; i <= 3; i++) {
        const recDate = new Date(today);
        recDate.setDate(today.getDate() + i);
        
        const eventId = `schedule:${user.id}:${Date.now()}-${i}`;
        const event = {
          id: eventId,
          userId: user.id,
          date: recDate.toISOString().split('T')[0],
          type: 'ai-recommendation',
          title: i === 1 ? 'Rest Day (AI Recommended)' : 'Light Recovery Activity',
          notes: `Based on high training intensity (${avgWorkoutIntensity.toFixed(1)}/10) and low sleep quality (${avgSleepQuality.toFixed(1)}/10), recovery is recommended.`,
          createdAt: new Date().toISOString(),
        };
        
        await kv.set(eventId, event);
        recommendations.push(event);
      }
    } else if (currentInjuries.length > 0) {
      // Active injuries -> suggest modified training
      for (let i = 1; i <= 5; i++) {
        const recDate = new Date(today);
        recDate.setDate(today.getDate() + i);
        
        const eventId = `schedule:${user.id}:${Date.now()}-${i}`;
        const event = {
          id: eventId,
          userId: user.id,
          date: recDate.toISOString().split('T')[0],
          type: 'ai-recommendation',
          title: i % 2 === 0 ? 'Light Recovery Workout' : 'Rest & Rehabilitation',
          notes: `Active injury detected. Focus on recovery and pain-free movements.`,
          createdAt: new Date().toISOString(),
        };
        
        await kv.set(eventId, event);
        recommendations.push(event);
      }
    } else if (avgWorkoutIntensity < 5) {
      // Low intensity -> suggest more training
      for (let i = 1; i <= 4; i++) {
        if (i % 2 === 1) {
          const recDate = new Date(today);
          recDate.setDate(today.getDate() + i);
          
          const eventId = `schedule:${user.id}:${Date.now()}-${i}`;
          const event = {
            id: eventId,
            userId: user.id,
            date: recDate.toISOString().split('T')[0],
            type: 'ai-recommendation',
            title: 'Moderate Intensity Workout',
            notes: `Your recent training intensity has been low. Consider increasing volume.`,
            createdAt: new Date().toISOString(),
          };
          
          await kv.set(eventId, event);
          recommendations.push(event);
        }
      }
    } else {
      // Balanced training -> maintain with rest days
      for (let i = 3; i <= 7; i += 3) {
        const recDate = new Date(today);
        recDate.setDate(today.getDate() + i);
        
        const eventId = `schedule:${user.id}:${Date.now()}-${i}`;
        const event = {
          id: eventId,
          userId: user.id,
          date: recDate.toISOString().split('T')[0],
          type: 'ai-recommendation',
          title: 'Rest Day',
          notes: `Maintain your balanced training load with regular rest days.`,
          createdAt: new Date().toISOString(),
        };
        
        await kv.set(eventId, event);
        recommendations.push(event);
      }
    }

    return c.json({ success: true, recommendations });
  } catch (error) {
    console.log(`Error generating AI recommendations: ${error}`);
    return c.json({ error: 'Failed to generate recommendations' }, 500);
  }
});

// AI Chat endpoint
app.post('/make-server-b0cf6bec/chat', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (!user || error) {
      console.log(`Auth error while processing chat: ${error?.message}`);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { message, chatHistory } = await c.req.json();

    // Get user context
    const profile = await kv.get(`profile:${user.id}`);
    const activities = await kv.getByPrefix(`activity:${user.id}:`);
    const injuries = await kv.getByPrefix(`injury:${user.id}:`);

    const recentActivities = (activities || []).slice(-7);
    const currentInjuries = (injuries || []).filter((i: any) => i.status === 'current');

    // Get weather data if location is available
    let weatherContext = '';
    if (profile?.latitude && profile?.longitude) {
      try {
        const weatherResponse = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${profile.latitude}&longitude=${profile.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code&temperature_unit=celsius&wind_speed_unit=kmh`
        );
        
        if (weatherResponse.ok) {
          const weatherData = await weatherResponse.json();
          const temp = Math.round(weatherData.current.temperature_2m);
          const humidity = weatherData.current.relative_humidity_2m;
          const windSpeed = Math.round(weatherData.current.wind_speed_10m);
          
          weatherContext = `\n\nCurrent Weather (${profile.location || 'User location'}):\n- Temperature: ${temp}°C\n- Humidity: ${humidity}%\n- Wind Speed: ${windSpeed} km/h`;
          
          if (temp > 30 || humidity > 70 || windSpeed > 30) {
            weatherContext += '\n- Note: Weather conditions may affect training performance and recovery needs.';
          }
        }
      } catch (weatherError) {
        console.log(`Error fetching weather: ${weatherError}`);
      }
    }

    // Get period cycle information for female/other users
    let periodContext = '';
    if ((profile?.gender === 'female' || profile?.gender === 'other') && profile?.lastPeriodDate && profile?.cycleLength) {
      const lastPeriod = new Date(profile.lastPeriodDate);
      const today = new Date();
      const daysSinceLastPeriod = Math.floor((today.getTime() - lastPeriod.getTime()) / (1000 * 60 * 60 * 24));
      const cycleDay = (daysSinceLastPeriod % profile.cycleLength) + 1;
      
      const periodLength = profile.periodLength || 5;
      
      let phase = '';
      if (cycleDay <= periodLength) {
        phase = 'Menstrual Phase - Energy levels may be lower, focus on rest and light activity';
      } else if (cycleDay <= profile.cycleLength / 2) {
        phase = 'Follicular Phase - Energy levels rising, good time for high-intensity workouts';
      } else if (cycleDay <= profile.cycleLength / 2 + 3) {
        phase = 'Ovulation - Peak energy and strength, ideal for maximum performance';
      } else {
        phase = 'Luteal Phase - Energy may decline, consider moderate intensity and extra recovery';
      }
      
      periodContext = `\n\nMenstrual Cycle Information:\n- Day ${cycleDay} of cycle\n- Current phase: ${phase}`;
    }

    // Build context for AI
    const contextPrompt = `You are a fitness and training assistant. Here is the user's information:

Profile:
- Age: ${profile?.age || 'Unknown'}
- Gender: ${profile?.gender || 'Unknown'}
- Weight: ${profile?.weight || 'Unknown'} kg
- Height: ${profile?.height || 'Unknown'} cm
${profile?.bodyFatPercentage ? `- Body Fat: ${profile.bodyFatPercentage}%` : ''}${weatherContext}${periodContext}

Recent Training (Last 7 days):
${recentActivities.length > 0 ? recentActivities.map((a: any) => 
  `- ${a.date}: Workout intensity ${a.workoutIntensity}/10, Sleep ${a.sleepDuration}h (quality ${a.sleepQuality}/10), Work ${a.workHours}h`
).join('\n') : 'No recent training data'}

Current Injuries:
${currentInjuries.length > 0 ? currentInjuries.map((i: any) => 
  `- ${i.name} (${i.severity}): ${i.type}`
).join('\n') : 'No active injuries'}

Previous conversation:
${chatHistory.map((m: any) => `${m.role}: ${m.content}`).join('\n')}

User's question: ${message}

Provide helpful, personalized advice based on this information, including weather conditions and menstrual cycle phase if relevant. Be concise but informative.`;

    // Check if OpenAI API key is available
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openaiKey) {
      // Fallback to rule-based responses
      const response = generateRuleBasedResponse(message, profile, recentActivities, currentInjuries);
      
      // Save to chat history
      const chatId = `chat:${user.id}:${Date.now()}`;
      await kv.set(chatId, {
        userId: user.id,
        messages: [...chatHistory, 
          { role: 'user', content: message, timestamp: new Date().toISOString() },
          { role: 'assistant', content: response, timestamp: new Date().toISOString() }
        ],
        updatedAt: new Date().toISOString(),
      });
      
      return c.json({ response });
    }

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: contextPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!openaiResponse.ok) {
      throw new Error('OpenAI API request failed');
    }

    const openaiData = await openaiResponse.json();
    const response = openaiData.choices[0].message.content;

    // Save to chat history
    const chatId = `chat:${user.id}:${Date.now()}`;
    await kv.set(chatId, {
      userId: user.id,
      messages: [...chatHistory, 
        { role: 'user', content: message, timestamp: new Date().toISOString() },
        { role: 'assistant', content: response, timestamp: new Date().toISOString() }
      ],
      updatedAt: new Date().toISOString(),
    });

    return c.json({ response });
  } catch (error) {
    console.log(`Error processing chat: ${error}`);
    
    // Fallback response
    return c.json({ 
      response: "I'm here to help with your training! While I'm having trouble connecting to my AI service, I can still provide basic guidance. Try asking about rest days, nutrition, or recovery based on your recent activities." 
    });
  }
});

// Get chat history
app.get('/make-server-b0cf6bec/chat-history', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (!user || error) {
      console.log(`Auth error while fetching chat history: ${error?.message}`);
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const chats = await kv.getByPrefix(`chat:${user.id}:`);
    
    // Get all messages from all chat sessions, sorted by timestamp
    const allMessages: any[] = [];
    for (const chat of (chats || [])) {
      if (chat.messages) {
        allMessages.push(...chat.messages);
      }
    }
    
    allMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return c.json({ messages: allMessages });
  } catch (error) {
    console.log(`Error fetching chat history: ${error}`);
    return c.json({ error: 'Failed to fetch chat history' }, 500);
  }
});

// Rule-based response generator (fallback)
function generateRuleBasedResponse(message: string, profile: any, activities: any[], injuries: any[]) {
  const msg = message.toLowerCase();
  
  if (msg.includes('overtraining') || msg.includes('over training') || msg.includes('too much')) {
    const avgIntensity = activities.length > 0
      ? activities.reduce((sum, a) => sum + (a.workoutIntensity || 0), 0) / activities.length
      : 0;
    
    if (avgIntensity > 7) {
      return `Based on your recent data, your average workout intensity is ${avgIntensity.toFixed(1)}/10, which is quite high. Consider taking more rest days and reducing intensity to avoid overtraining. Watch for signs like persistent fatigue, decreased performance, or mood changes.`;
    }
    return `Your current training intensity (${avgIntensity.toFixed(1)}/10) appears manageable. Continue monitoring your recovery and adjust if you notice decreased performance or excessive fatigue.`;
  }
  
  if (msg.includes('rest') || msg.includes('recovery')) {
    const avgSleep = activities.length > 0
      ? activities.reduce((sum, a) => sum + (a.sleepQuality || 0), 0) / activities.length
      : 0;
    
    return `For optimal recovery, aim for 7-9 hours of quality sleep per night. Your recent sleep quality average is ${avgSleep.toFixed(1)}/10. ${avgSleep < 6 ? 'Try to improve sleep quality through consistent bedtime routines and reducing screen time before bed.' : 'Keep up the good sleep habits!'}`;
  }
  
  if (msg.includes('eat') || msg.includes('nutrition') || msg.includes('diet') || msg.includes('food')) {
    const proteinNeeds = profile?.weight ? Math.round(profile.weight * 1.8) : 120;
    return `Based on your profile, aim for approximately ${proteinNeeds}g of protein daily, spread across 4-5 meals. Include plenty of fruits, vegetables, and whole grains. Stay hydrated with at least 2.5-3L of water daily, more on training days.`;
  }
  
  if (msg.includes('injury') || msg.includes('hurt') || msg.includes('pain')) {
    if (injuries.length > 0) {
      return `You have ${injuries.length} active ${injuries.length === 1 ? 'injury' : 'injuries'}: ${injuries.map((i: any) => i.name).join(', ')}. Focus on pain-free movements, consider reducing training intensity, and consult a healthcare professional for proper treatment. Don't train through pain.`;
    }
    return `You don't have any logged injuries currently. If you're experiencing pain, log it in the Injuries tab and consider consulting a healthcare professional. Prevention is key - ensure proper warm-up, cool-down, and progressive overload.`;
  }
  
  // Default response
  return `I'm here to help with your training! I can provide insights about your workout intensity, recovery needs, nutrition recommendations, and injury management. What specific aspect of your training would you like to discuss?`;
}

Deno.serve(app.fetch);