// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
// @ts-ignore
import { createClient } from "jsr:@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// @ts-ignore
Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    console.log("Received raw request body:", rawBody);

    if (!rawBody) {
      return new Response(JSON.stringify({ error: 'Request body is empty' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const parsedBody = JSON.parse(rawBody);
    const message = parsedBody.message;
    const chatHistory = parsedBody.chatHistory;
    const profile = parsedBody.profile;
    const weekData = parsedBody.weekData;
    const sessionId = parsedBody.sessionId;
    const isNewSession = parsedBody.isNewSession;

    if (!message) {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'Session ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      // @ts-ignore
      Deno.env.get('SUPABASE_URL') ?? '',
      // @ts-ignore
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the user from the authorization header
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response(JSON.stringify({ error: 'Unauthorized', details: userError }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = `You are an AI Training Assistant for a fitness and recovery app called SmartRecovery. 
The user is asking a question. Be helpful, encouraging, and highly specific to their fitness, injury recovery, and wellness.

USER PROFILE: 
${profile ? JSON.stringify(profile, null, 2) : 'No user profile provided'}

CURRENT WEEK'S DATA (Workouts, Sleep, Stress, Readiness, etc.):
${weekData ? JSON.stringify(weekData, null, 2) : 'No recent week data provided'}

IMPORTANT FORMATTING INSTRUCTIONS:
Always use markdown for formatting (e.g. **bold**, *italics*, lists). Never output raw HTML.
CRITICAL: You must be EXTREMELY concise. Keep your answers to 1-3 short sentences maximum unless the user explicitly asks for a long detailed plan. Do not be overly chatty or give long generic health disclaimers. Get straight to the point. Tailor your short response uniquely based on the User Profile and Week Data.

Previous conversation history (if any):
${chatHistory ? JSON.stringify(chatHistory) : 'None'}

User: ${message}`;

    // Prepare the payload for the Gemini API
    // @ts-ignore
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error("GEMINI_API_KEY is not set in environment variables");
    }

    // Call Google Gemini API (gemini-2.5-flash)
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;
    
    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: systemPrompt }]
        }]
      })
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      throw new Error(`Gemini API error: ${errorText}`);
    }

    const geminiData = await geminiResponse.json();
    const assistantReply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't generate a response.";

    // If it's a new session, we should generate a title
    let sessionTitle = "New Chat";
    if (isNewSession) {
      try {
        const titlePrompt = `Summarize the following message in 3-5 words as a title for a chat conversation. Do not use quotes or prefixes. Message: "${message}"`;
        const titleResponse = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: titlePrompt }] }] })
        });
        if (titleResponse.ok) {
          const titleData = await titleResponse.json();
          const generatedTitle = titleData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (generatedTitle) {
            sessionTitle = generatedTitle.trim().replace(/^["']|["']$/g, '');
          }
        }
      } catch (titleError) {
        console.error("Error generating title:", titleError);
      }
      
      // Save the new session to the database
      const { error: sessionError } = await supabaseClient
        .from('chat_sessions')
        .insert([{ id: sessionId, user_id: user.id, title: sessionTitle }]);
        
      if (sessionError) {
         console.error("Error saving new session to database:", sessionError);
      }
    }

    // Save the new messages to the database
    const { error: dbError } = await supabaseClient
      .from('chat_messages')
      .insert([
        { user_id: user.id, session_id: sessionId, role: 'user', content: message },
        { user_id: user.id, session_id: sessionId, role: 'assistant', content: assistantReply }
      ]);

    if (dbError) {
      console.error("Error saving to database:", dbError);
      // We don't fail the request just because the save failed, but we log it
    }

    return new Response(
      JSON.stringify({ response: assistantReply, title: isNewSession ? sessionTitle : undefined }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );

  } catch (error: any) {
    console.error("Error in chat edge function:", error);
    // TEMPORARY DEBUG: Return 200 so the Supabase SDK doesn't throw a generic FunctionsHttpError
    return new Response(
      JSON.stringify({ 
        isError: true,
        error: error.message || 'An internal error occurred',
        stack: error.stack 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
