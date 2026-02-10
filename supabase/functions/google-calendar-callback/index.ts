import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID')!
const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')!
const appUrl = Deno.env.get('APP_URL') || ''

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

/**
 * エラー時にユーザーをアプリにリダイレクト（クエリでエラー内容を渡す）
 */
function errorRedirect(message: string): Response {
  const target = appUrl
    ? `${appUrl}?google_calendar_error=${encodeURIComponent(message)}`
    : message
  if (appUrl) {
    return new Response(null, { status: 302, headers: { Location: target } })
  }
  return new Response(message, { status: 400 })
}

serve(async (req) => {
  try {
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const error = url.searchParams.get('error')

    // Google がエラーを返した場合（ユーザーが拒否した等）
    if (error) {
      console.error('Google OAuth error:', error)
      return errorRedirect(`Google認証エラー: ${error}`)
    }

    if (!code || !state) {
      return errorRedirect('認証パラメータが不足しています')
    }

    // --- state をDBで検証 ---
    const { data: stateRow, error: stateError } = await supabase
      .from('google_calendar_oauth_states')
      .select('*')
      .eq('state', state)
      .maybeSingle()

    if (stateError || !stateRow) {
      console.error('State lookup failed:', stateError)
      return errorRedirect('認証セッションが無効です')
    }

    if (new Date(stateRow.expires_at).getTime() < Date.now()) {
      await supabase.from('google_calendar_oauth_states').delete().eq('state', state)
      return errorRedirect('認証セッションが期限切れです')
    }

    // --- redirect_uri を start 関数と同じ方法で構築 ---
    const redirectUri = `${getFunctionsBaseUrl()}/functions/v1/google-calendar-callback`
    console.log('Token exchange redirect_uri:', redirectUri)

    // --- code → tokens 交換 ---
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: googleClientId,
        client_secret: googleClientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    const tokenBody = await tokenResponse.text()

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', tokenResponse.status, tokenBody)
      return errorRedirect('トークン交換に失敗しました')
    }

    const tokenData = JSON.parse(tokenBody) as {
      access_token: string
      refresh_token?: string
      expires_in: number
    }

    if (!tokenData.access_token) {
      console.error('No access_token in response:', tokenBody)
      return errorRedirect('アクセストークンを取得できませんでした')
    }

    // --- DB にトークン保存 ---
    const expiryDate = new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
    const { error: upsertError } = await supabase
      .from('google_calendar_tokens')
      .upsert({
        user_id: stateRow.user_id,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token || '',
        expiry_date: expiryDate,
        updated_at: new Date().toISOString(),
      })

    if (upsertError) {
      console.error('Token upsert failed:', upsertError)
      return errorRedirect('トークンの保存に失敗しました')
    }

    // --- 使用済み state を削除 ---
    await supabase.from('google_calendar_oauth_states').delete().eq('state', state)

    // --- アプリにリダイレクト ---
    const returnTo = stateRow.return_to || appUrl
    if (returnTo) {
      const successUrl = `${returnTo}${returnTo.includes('?') ? '&' : '?'}google_calendar_connected=true`
      return new Response(null, { status: 302, headers: { Location: successUrl } })
    }

    return new Response('Google Calendar connected successfully')
  } catch (err) {
    console.error('Callback unexpected error:', err)
    return errorRedirect('予期しないエラーが発生しました')
  }
})
