import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const sessionId = req.cookies.get('session_id')?.value
  const { pathname } = req.nextUrl

  const isPublic = pathname.startsWith('/login') || pathname.startsWith('/api/auth')

  if (!isPublic && !sessionId) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (pathname === '/' && sessionId) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  if (pathname === '/login' && sessionId) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.*|apple-icon).*)'],
}
