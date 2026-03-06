'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Eye, EyeOff, CheckCircle, XCircle, Loader2, LogOut } from 'lucide-react';

const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface KeyConfig {
    label: string;
    storageKey: string;
    placeholder: string;
    testEndpoint: string;
    description: string;
}

const API_KEYS: KeyConfig[] = [
    {
        label: 'OpenAI',
        storageKey: 'openai_key',
        placeholder: 'sk-...',
        testEndpoint: 'https://api.openai.com/v1/models',
        description: 'Requis pour Sora 2, Sora 2 Pro (vidéos OpenAI)',
    },
    {
        label: 'Google AI',
        storageKey: 'google_key',
        placeholder: 'AIza...',
        testEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models?key=',
        description: 'Requis pour Gemini, Imagen, Veo (images & vidéos Google)',
    },
];

export default function SettingsPage() {
    const router = useRouter();
    const [user, setUser] = useState<{ email?: string; user_metadata?: { avatar_url?: string; full_name?: string } } | null>(null);
    const [keys, setKeys] = useState<Record<string, string>>({});
    const [visibility, setVisibility] = useState<Record<string, boolean>>({});
    const [testing, setTesting] = useState<Record<string, boolean>>({});
    const [status, setStatus] = useState<Record<string, 'valid' | 'invalid' | 'unknown'>>({});

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setUser(data.user));
        // Load keys from localStorage
        const loaded: Record<string, string> = {};
        const loadedStatus: Record<string, 'valid' | 'invalid' | 'unknown'> = {};
        API_KEYS.forEach((k) => {
            const val = localStorage.getItem(k.storageKey) || '';
            loaded[k.storageKey] = val;
            loadedStatus[k.storageKey] = val ? 'unknown' : 'unknown';
        });
        setKeys(loaded);
        setStatus(loadedStatus);
    }, []);

    const handleSave = (storageKey: string, value: string) => {
        setKeys((prev) => ({ ...prev, [storageKey]: value }));
        if (value.trim()) {
            localStorage.setItem(storageKey, value.trim());
        } else {
            localStorage.removeItem(storageKey);
        }
        setStatus((prev) => ({ ...prev, [storageKey]: 'unknown' }));
    };

    const handleTest = async (config: KeyConfig) => {
        const key = keys[config.storageKey];
        if (!key) return;
        setTesting((prev) => ({ ...prev, [config.storageKey]: true }));
        try {
            let testUrl = config.testEndpoint;
            const headers: Record<string, string> = {};
            if (config.storageKey === 'openai_key') {
                headers['Authorization'] = `Bearer ${key}`;
            } else {
                testUrl = config.testEndpoint + key;
            }
            const res = await fetch(testUrl, { headers });
            setStatus((prev) => ({ ...prev, [config.storageKey]: res.ok ? 'valid' : 'invalid' }));
        } catch {
            setStatus((prev) => ({ ...prev, [config.storageKey]: 'invalid' }));
        }
        setTesting((prev) => ({ ...prev, [config.storageKey]: false }));
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/login';
    };

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            <div className="max-w-2xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                    <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-200 transition-colors">
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>
                    <h1 className="text-2xl font-bold">Paramètres</h1>
                </div>

                {/* Account */}
                <section className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-4">Mon compte</h2>
                    <div className="flex items-center gap-4">
                        {user?.user_metadata?.avatar_url ? (
                            <img src={user.user_metadata.avatar_url} alt="" className="w-12 h-12 rounded-full" />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-violet-600 flex items-center justify-center text-lg font-bold">
                                {(user?.email || '?')[0].toUpperCase()}
                            </div>
                        )}
                        <div className="flex-1">
                            <p className="font-medium">{user?.user_metadata?.full_name || user?.email}</p>
                            <p className="text-sm text-gray-500">{user?.email}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-red-500 transition-all text-sm"
                        >
                            <LogOut size={16} /> Déconnexion
                        </button>
                    </div>
                </section>

                {/* API Keys */}
                <section className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6">
                    <h2 className="text-lg font-semibold mb-2">Clés API</h2>
                    <p className="text-sm text-gray-500 mb-6">
                        Vos clés sont stockées uniquement dans votre navigateur. Elles ne sont jamais envoyées à nos serveurs.
                    </p>

                    <div className="space-y-6">
                        {API_KEYS.map((config) => (
                            <div key={config.storageKey}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <label className="font-medium text-sm">{config.label}</label>
                                        {keys[config.storageKey] && status[config.storageKey] === 'valid' && (
                                            <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                                                <CheckCircle size={12} /> Valide
                                            </span>
                                        )}
                                        {status[config.storageKey] === 'invalid' && (
                                            <span className="flex items-center gap-1 text-xs text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full">
                                                <XCircle size={12} /> Invalide
                                            </span>
                                        )}
                                        {!keys[config.storageKey] && (
                                            <span className="text-xs text-gray-500">Non configurée</span>
                                        )}
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 mb-2">{config.description}</p>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            type={visibility[config.storageKey] ? 'text' : 'password'}
                                            value={keys[config.storageKey] || ''}
                                            onChange={(e) => handleSave(config.storageKey, e.target.value)}
                                            placeholder={config.placeholder}
                                            className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200
                                                       text-gray-900 placeholder-gray-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500
                                                       transition-colors text-sm pr-10"
                                        />
                                        <button
                                            onClick={() => setVisibility((prev) => ({ ...prev, [config.storageKey]: !prev[config.storageKey] }))}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                        >
                                            {visibility[config.storageKey] ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => handleTest(config)}
                                        disabled={!keys[config.storageKey] || testing[config.storageKey]}
                                        className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm text-gray-700 font-medium
                                                   disabled:opacity-30 disabled:cursor-not-allowed transition-colors
                                                   flex items-center gap-1"
                                    >
                                        {testing[config.storageKey] ? <Loader2 size={14} className="animate-spin" /> : 'Tester'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
