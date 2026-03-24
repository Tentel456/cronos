import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Redirect to dashboard (middleware will handle locale)
  return NextResponse.redirect(new URL('/dashboard', request.url))
}
