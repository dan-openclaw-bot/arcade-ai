'use client';

import { useState } from 'react';
import { KeyRound, ExternalLink, Eye, EyeOff, CheckCircle, Loader2, X } from 'lucide-react';

interface MissingKeyModalProps {
    provider: 'openai' | 'google';
    onClose: () => void;
    onKeyConfigured: () => void; // Called after key is saved, so generation can retry
}

const PROVIDER_INFO = {
    openai: {
        label: 'OpenAI',
        storageKey: 'openai_key',
        placeholder: 'sk-...',
        testEndpoint: 'https://api.openai.com/v1/models',
        getUrl: 'https://platform.openai.com/api-keys',
        models: 'Sora 2, Sora 2 Pro',
    },
    google: {
        label: 'Google AI',
        storageKey: 'google_key',
        placeholder: 'AIza...',
        testEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models?key=',
        getUrl: 'https://aistudio.google.com/apikey',
        models: 'Gemini, Imagen, Veo',
    },
};

export default function MissingKeyModal({ provider, onClose, onKeyConfigured }: MissingKeyModalProps) {
    const info = PROVIDER_INFO[provider];
    const [key, setKey] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [testing, setTesting] = useState(false);
    const [status, setStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');

    const handleSaveAndTest = async () => {
        if (!key.trim()) return;
        setTesting(true);
        setStatus('idle');

        try {
            let testUrl = info.testEndpoint;
            const headers: Record<string, string> = {};
            if (provider === 'openai') {
                headers['Authorization'] = `Bearer ${key.trim()}`;
            } else {
                testUrl = info.testEndpoint + key.trim();
            }
            const res = await fetch(testUrl, { headers });
            if (res.ok) {
                localStorage.setItem(info.storageKey, key.trim());
                setStatus('valid');
                // Small delay to show the success state
                setTimeout(() => onKeyConfigured(), 800);
            } else {
                setStatus('invalid');
            }
        } catch {
            setStatus('invalid');
        }
        setTesting(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-6 mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-violet-100">
                            <KeyRound size={20} className="text-violet-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Clé {info.label} requise</h2>
                            <p className="text-xs text-gray-500">Pour utiliser {info.models}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
                        <X size={18} className="text-gray-400" />
                    </button>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-4">
                    Entrez votre clé API {info.label} pour commencer à générer.
                    Votre clé est stockée <strong className="text-gray-900 font-medium">uniquement dans votre navigateur</strong>.
                </p>

                {/* Input */}
                <div className="relative mb-3">
                    <input
                        type={showKey ? 'text' : 'password'}
                        value={key}
                        onChange={(e) => { setKey(e.target.value); setStatus('idle'); }}
                        placeholder={info.placeholder}
                        autoFocus
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200
                                   text-gray-900 placeholder-gray-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500
                                   transition-colors text-sm pr-10"
                    />
                    <button
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>

                {/* Status */}
                {status === 'invalid' && (
                    <p className="text-red-400 text-xs mb-3 bg-red-400/10 px-3 py-2 rounded-lg">
                        Clé invalide. Vérifiez qu&apos;elle est correcte et réessayez.
                    </p>
                )}
                {status === 'valid' && (
                    <p className="text-emerald-400 text-xs mb-3 bg-emerald-400/10 px-3 py-2 rounded-lg flex items-center gap-1">
                        <CheckCircle size={14} /> Clé valide ! Lancement de la génération...
                    </p>
                )}

                {/* Actions */}
                <div className="flex gap-2 mb-4">
                    <button
                        onClick={handleSaveAndTest}
                        disabled={!key.trim() || testing || status === 'valid'}
                        className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500
                                   text-white font-medium text-sm transition-all
                                   disabled:opacity-40 disabled:cursor-not-allowed
                                   flex items-center justify-center gap-2"
                    >
                        {testing ? <Loader2 size={16} className="animate-spin" /> : null}
                        {testing ? 'Vérification...' : status === 'valid' ? '✓ Configurée' : 'Enregistrer et tester'}
                    </button>
                </div>

                {/* Link to get a key */}
                <a
                    href={info.getUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 text-xs text-gray-500 hover:text-violet-600 font-medium transition-colors"
                >
                    <ExternalLink size={12} />
                    Obtenir une clé {info.label}
                </a>
            </div>
        </div>
    );
}
