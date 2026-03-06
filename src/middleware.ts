import { NextResponse, type NextRequest } from 'next/server';
import { createMiddlewareClient } from '@/lib/supabase';

export async function middleware(request: NextRequest) {
    const response = NextResponse.next({ request });
    const supabase = createMiddlewareClient(request, response);

    // Refresh session (important for SSR)
    const { data: { user } } = await supabase.auth.getUser();

    const isLoginPage = request.nextUrl.pathname === '/login';
    const isHomePage = request.nextUrl.pathname === '/';
    const isAuthCallback = request.nextUrl.pathname.startsWith('/auth/callback');
    const isApiRoute = request.nextUrl.pathname.startsWith('/api/');

    // Allow API routes, auth callback, login, and home page through
    if (isApiRoute || isAuthCallback || isHomePage) {
        return response;
    }

    // If not authenticated, redirect to login
    if (!user && !isLoginPage) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    // If authenticated and on login page, redirect to home
    if (user && isLoginPage) {
        const url = request.nextUrl.clone();
        url.pathname = '/';
        return NextResponse.redirect(url);
    }

    return response;
}

export const config = {
    matcher: [
        // Match all routes except static files and _next
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
