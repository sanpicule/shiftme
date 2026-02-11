import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(supabaseUrl, serviceRoleKey)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ connected: false }), { headers: corsHeaders })
    }

    const accessToken = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)

    if (userError || !user) {
      return new Response(JSON.stringify({ connected: false }), { headers: corsHeaders })
    }

    const { data, error } = await supabase
      .from('google_calendar_tokens')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      console.error('Status lookup failed:', error)
      return new Response(JSON.stringify({ connected: false }), { headers: corsHeaders })
    }

    return new Response(JSON.stringify({ connected: Boolean(data?.user_id) }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    console.error('Status error:', error)
    return new Response(JSON.stringify({ connected: false }), { headers: corsHeaders })
  }
})
