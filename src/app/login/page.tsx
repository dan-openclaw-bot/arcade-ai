'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useState } from 'react';

const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleGoogle = async () => {
        setLoading(true);
        setError('');
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) { setError(error.message); setLoading(false); }
    };

    const handleEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        if (mode === 'signup') {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
            });
            if (error) { setError(error.message); }
            else { setMessage('Vérifie ton email pour confirmer ton compte !'); }
        } else {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) { setError(error.message); }
            else { window.location.href = '/'; }
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-[#0e0e0e] flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white tracking-tight">
                        Arcade <span className="text-violet-400">AI</span>
                    </h1>
                    <p className="text-gray-500 mt-2 text-sm">Studio créatif propulsé par l&apos;IA</p>
                </div>

                {/* Card */}
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-8">
                    <h2 className="text-xl font-semibold text-white mb-6">
                        {mode === 'login' ? 'Se connecter' : 'Créer un compte'}
                    </h2>

                    {/* Google Button */}
                    <button
                        onClick={handleGoogle}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl
                                   bg-white text-gray-800 font-medium hover:bg-gray-100
                                   transition-all duration-200 disabled:opacity-50 mb-6"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Continuer avec Google
                    </button>

                    {/* Divider */}
                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-[#333]"></div>
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="bg-[#1a1a1a] px-4 text-gray-500">ou</span>
                        </div>
                    </div>

                    {/* Email Form */}
                    <form onSubmit={handleEmail} className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-400 mb-1.5">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 rounded-xl bg-[#111] border border-[#333]
                                           text-white placeholder-gray-600 focus:outline-none focus:border-violet-500
                                           transition-colors"
                                placeholder="ton@email.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1.5">Mot de passe</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full px-4 py-3 rounded-xl bg-[#111] border border-[#333]
                                           text-white placeholder-gray-600 focus:outline-none focus:border-violet-500
                                           transition-colors"
                                placeholder="••••••••"
                            />
                        </div>

                        {error && (
                            <p className="text-red-400 text-sm bg-red-400/10 px-3 py-2 rounded-lg">{error}</p>
                        )}
                        {message && (
                            <p className="text-emerald-400 text-sm bg-emerald-400/10 px-3 py-2 rounded-lg">{message}</p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500
                                       text-white font-medium transition-all duration-200
                                       disabled:opacity-50"
                        >
                            {loading ? '...' : mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
                        </button>
                    </form>

                    {/* Toggle */}
                    <p className="text-center text-sm text-gray-500 mt-6">
                        {mode === 'login' ? (
                            <>Pas encore de compte ?{' '}
                                <button onClick={() => setMode('signup')} className="text-violet-400 hover:text-violet-300">
                                    Créer un compte
                                </button>
                            </>
                        ) : (
                            <>Déjà un compte ?{' '}
                                <button onClick={() => setMode('login')} className="text-violet-400 hover:text-violet-300">
                                    Se connecter
                                </button>
                            </>
                        )}
                    </p>
                </div>

                <p className="text-center text-xs text-gray-600 mt-6">
                    En continuant, tu acceptes nos conditions d&apos;utilisation.
                </p>
            </div>
        </div>
    );
}
