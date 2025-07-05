import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const code = searchParams.code as string
  const next = searchParams.next as string

  if (code) {
    const supabase = createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Redirect to the original destination or dashboard
  const redirectUrl = next || '/dashboard'
  return NextResponse.redirect(new URL(redirectUrl, process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'))
} 