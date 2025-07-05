import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

// Define public routes that don't require authentication
const publicRoutes = ['/login', '/signup', '/auth/callback']

// Define protected routes that require authentication
const protectedRoutes = ['/dashboard', '/settings', '/note', '/search', '/templates', '/team', '/help']

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession()
  const { pathname } = request.nextUrl

  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  
  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  
  // Check if it's the root path
  const isRootPath = pathname === '/'

  // If user is not signed in and trying to access protected routes or root, redirect to login
  if (!session && (isProtectedRoute || isRootPath)) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If user is signed in and trying to access auth pages, redirect to dashboard
  if (session && isPublicRoute && pathname !== '/auth/callback') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // If user is signed in and on root path, redirect to dashboard
  if (session && isRootPath) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes (handled separately)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
}
