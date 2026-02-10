import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID')!

const supabase = createClient(supabaseUrl, serviceRoleKey)

/**
 * SUPABASE_URL (https://xxx.supabase.co) から
 * Edge Functions の公開URL (https://xxx.functions.supabase.co) を導出
 */
function getFunctionsBaseUrl(): string {
  const u = new URL(supabaseUrl)
  const host = u.hostname.endsWith('.supabase.co')
    ? u.hostname.replace('.supabase.co', '.functions.supabase.co')
    : u.hostname
  return `https://${host}`
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

const generateState = () => {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    const accessToken = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid user' }), { status: 401, headers: corsHeaders })
    }

    const body = await req.json().catch(() => ({})) as { returnTo?: string }

    const state = generateState()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    await supabase
      .from('google_calendar_oauth_states')
      .delete()
      .eq('user_id', user.id)

    const { error: insertError } = await supabase
      .from('google_calendar_oauth_states')
      .insert({
        state,
        user_id: user.id,
        return_to: body.returnTo || null,
        expires_at: expiresAt
      })

    if (insertError) {
      console.error('State insert failed:', insertError)
      return new Response(JSON.stringify({ error: 'Failed to create state' }), { status: 500, headers: corsHeaders })
    }

    const redirectUri = `${getFunctionsBaseUrl()}/functions/v1/google-calendar-callback`
    const scope = 'https://www.googleapis.com/auth/calendar.readonly'

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    authUrl.searchParams.set('client_id', googleClientId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('access_type', 'offline')
    authUrl.searchParams.set('prompt', 'consent')
    authUrl.searchParams.set('scope', scope)
    authUrl.searchParams.set('state', state)

    return new Response(JSON.stringify({ url: authUrl.toString() }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    console.error('Start error:', error)
    return new Response(JSON.stringify({ error: 'Unexpected error' }), { status: 500, headers: corsHeaders })
  }
})
