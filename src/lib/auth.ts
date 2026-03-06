import { createAuthServerClient, createServerSupabaseClient } from '@/lib/supabase';
import { NextRequest } from 'next/server';



/**
 * Get the authenticated user from the request.
 * Returns the user + an auth-aware Supabase client (RLS enforced).
 * For admin user, we fallback to the service role client so server-side
 * operations (like polling) work without user cookies.
 */
export async function getAuthClient(req?: NextRequest) {
    const supabase = await createAuthServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        throw new Error('Unauthorized');
    }

    return { user, supabase };
}

/**
 * Check if a user is the admin
 */
export function isAdmin(userId: string): boolean {
    const adminId = process.env.ADMIN_USER_ID;
    return !!adminId && userId === adminId;
}

/**
 * Get the appropriate API key for a provider.
 * Admin uses server-side .env keys.
 * Normal users must provide their key via request headers.
 */
export function getApiKey(
    req: NextRequest,
    provider: 'openai' | 'google',
    userId: string,
): string | null {
    // Admin always uses .env keys
    if (isAdmin(userId)) {
        if (provider === 'openai') return process.env.OPENAI_API_KEY || null;
        if (provider === 'google') return process.env.GEMINI_API_KEY || null;
        return null;
    }

    // Normal users provide their key via headers
    const headerKey = provider === 'openai'
        ? req.headers.get('x-openai-key')
        : req.headers.get('x-google-key');

    return headerKey || null;
}

/**
 * Determine which provider a model belongs to
 */
export function getProviderForModel(modelId: string): 'openai' | 'google' {
    if (modelId.startsWith('sora-')) return 'openai';
    return 'google'; // gemini, imagen, veo
}
