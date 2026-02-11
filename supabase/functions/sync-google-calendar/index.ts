import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID')!;
const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TokenRow {
  user_id: string;
  access_token: string;
  refresh_token: string;
  expiry_date: string | null;
}

const refreshAccessToken = async (refreshToken: string) => {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: googleClientId,
      client_secret: googleClientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to refresh token: ${errorText}`);
  }

  return (await response.json()) as {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
  };
};

serve(async req => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const accessToken = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid user' }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const { startDate, endDate } = (await req.json()) as { startDate: string; endDate: string };

    const { data: token, error: tokenError } = await supabase
      .from('google_calendar_tokens')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (tokenError || !token) {
      return new Response(JSON.stringify({ events: [] }), { headers: corsHeaders });
    }

    let activeToken = token as TokenRow;

    const expiry = activeToken.expiry_date ? new Date(activeToken.expiry_date).getTime() : 0;
    if (!expiry || expiry <= Date.now() + 60_000) {
      const refreshed = await refreshAccessToken(activeToken.refresh_token);
      const newExpiry = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
      const refreshToken = refreshed.refresh_token || activeToken.refresh_token;

      const { error: updateError } = await supabase
        .from('google_calendar_tokens')
        .update({
          access_token: refreshed.access_token,
          refresh_token: refreshToken,
          expiry_date: newExpiry,
        })
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Token update failed:', updateError);
        return new Response(JSON.stringify({ error: 'Failed to update token' }), {
          status: 500,
          headers: corsHeaders,
        });
      }

      activeToken = {
        ...activeToken,
        access_token: refreshed.access_token,
        refresh_token: refreshToken,
        expiry_date: newExpiry,
      };
    }

    const apiUrl = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
    apiUrl.searchParams.set('timeMin', new Date(startDate).toISOString());
    apiUrl.searchParams.set('timeMax', new Date(endDate).toISOString());
    apiUrl.searchParams.set('singleEvents', 'true');
    apiUrl.searchParams.set('orderBy', 'startTime');

    const eventsResponse = await fetch(apiUrl.toString(), {
      headers: {
        Authorization: `Bearer ${activeToken.access_token}`,
      },
    });

    if (!eventsResponse.ok) {
      const errorText = await eventsResponse.text();
      console.error('Google Calendar API error:', errorText);
      return new Response(JSON.stringify({ events: [] }), { headers: corsHeaders });
    }

    const eventsPayload = await eventsResponse.json();

    return new Response(JSON.stringify({ events: eventsPayload.items || [] }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Sync error:', error);
    return new Response(JSON.stringify({ events: [] }), { headers: corsHeaders });
  }
});
