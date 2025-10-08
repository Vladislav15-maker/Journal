import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
 
export function middleware(request: NextRequest) {
  const authCookie = request.cookies.get('auth');
  const isAuthenticated = authCookie?.value === 'true';
  const { pathname } = request.nextUrl;
 
  // If user is on the login page but is already authenticated, redirect to dashboard
  if (isAuthenticated && pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
 
  // If user is trying to access dashboard pages but is not authenticated, redirect to login
  if (!isAuthenticated && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/', request.url));
  }
 
  return NextResponse.next();
}
 
export const config = {
  matcher: ['/', '/dashboard/:path*'],
}
