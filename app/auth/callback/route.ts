import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)

  // Simply redirect to home - the client-side Supabase will handle the session
  // from the URL fragments (access_token, refresh_token)
  return NextResponse.redirect(new URL('/', requestUrl.origin))
}
