import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser client (uses anon key, safe for client-side)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server client (uses service role key, NEVER expose to browser — bypasses RLS)
export function createServerSupabaseClient() {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    return createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            persistSession: false,
        },
    });
}

// Auth-aware server client — uses user's JWT for RLS enforcement
export async function createAuthServerClient() {
    const cookieStore = await cookies();
    return createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options)
                    );
                } catch {
                    // This can be ignored in Server Components
                }
            },
        },
    });
}

// Middleware-compatible client (for route protection)
export function createMiddlewareClient(req: NextRequest, res: NextResponse) {
    return createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll() {
                return req.cookies.getAll();
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value }) =>
                    req.cookies.set(name, value)
                );
                cookiesToSet.forEach(({ name, value, options }) =>
                    res.cookies.set(name, value, options)
                );
            },
        },
    });
}
