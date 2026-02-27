'use client';

import { useEffect, useState, useRef } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { Actor } from '@/lib/types';
import { Plus, Trash2, User, Upload, X } from 'lucide-react';

export default function ActorsPage() {
    const [actors, setActors] = useState<Actor[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetch('/api/actors')
            .then((r) => r.json())
            .then((data) => { setActors(data); setLoading(false); });
    }, []);

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setImageFile(file);
        const reader = new FileReader();
        reader.onload = () => setImagePreview(reader.result as string);
        reader.readAsDataURL(file);
    }

    async function handleCreate() {
        if (!name.trim() || !imageFile) return;
        setCreating(true);

        // Upload image
        const fd = new FormData();
        fd.append('file', imageFile);
        fd.append('bucket', 'actors');
        const upRes = await fetch('/api/upload', { method: 'POST', body: fd });
        const { url } = await upRes.json();

        // Create actor
        const res = await fetch('/api/actors', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, description, image_url: url }),
        });
        const actor = await res.json();
        setActors((prev) => [actor, ...prev]);

        // Reset
        setName('');
        setDescription('');
        setImageFile(null);
        setImagePreview(null);
        setShowModal(false);
        setCreating(false);
    }

    async function handleDelete(id: string) {
        if (!confirm('Supprimer cet acteur ?')) return;
        await fetch(`/api/actors/${id}`, { method: 'DELETE' });
        setActors((prev) => prev.filter((a) => a.id !== id));
    }

    return (
        <div className="flex h-screen bg-[#0e0e0e] overflow-hidden">
            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top bar */}
                <div className="flex items-center px-6 py-4 border-b border-white/5">
                    <h1 className="text-white font-semibold text-base flex-1">Acteurs</h1>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Nouvel acteur
                    </button>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="grid grid-cols-4 gap-4">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="aspect-square rounded-xl shimmer" />
                            ))}
                        </div>
                    ) : actors.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <div className="text-6xl mb-4">👤</div>
                            <p className="text-white font-semibold mb-2">Aucun acteur</p>
                            <p className="text-gray-500 text-sm">
                                Créez des acteurs pour les réutiliser dans vos générations.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {actors.map((actor) => (
                                <div key={actor.id} className="group relative">
                                    <div className="aspect-square rounded-2xl overflow-hidden bg-[#1a1a1a]">
                                        {actor.image_url ? (
                                            <img
                                                src={actor.image_url}
                                                alt={actor.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <User className="w-12 h-12 text-gray-600" />
                                            </div>
                                        )}
                                        <div className="card-overlay absolute inset-0 bg-black/60 flex items-end p-3">
                                            <button
                                                onClick={() => handleDelete(actor.id)}
                                                className="ml-auto p-1.5 rounded-lg bg-black/50 hover:bg-red-500/70 text-white transition-colors"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="mt-2">
                                        <p className="text-white text-sm font-medium truncate">{actor.name}</p>
                                        {actor.description && (
                                            <p className="text-gray-500 text-xs truncate">{actor.description}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Create modal */}
            {showModal && (
                <div
                    className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
                    onClick={() => setShowModal(false)}
                >
                    <div
                        className="bg-[#161616] border border-white/10 rounded-2xl p-6 w-full max-w-sm animate-slide-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-white font-semibold">Nouvel acteur</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Image upload */}
                        <div
                            onClick={() => fileRef.current?.click()}
                            className="w-full aspect-square rounded-xl bg-[#1a1a1a] border-2 border-dashed border-white/10 hover:border-white/30 flex flex-col items-center justify-center cursor-pointer transition-colors mb-4 overflow-hidden"
                        >
                            {imagePreview ? (
                                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-gray-500">
                                    <Upload className="w-8 h-8" />
                                    <p className="text-sm">Cliquer pour uploader</p>
                                </div>
                            )}
                        </div>
                        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Nom de l'acteur"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 outline-none focus:border-violet-500 mb-3"
                        />
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Description (optionnel)"
                            rows={2}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 outline-none focus:border-violet-500 mb-4 resize-none"
                        />

                        <button
                            onClick={handleCreate}
                            disabled={creating || !name.trim() || !imageFile}
                            className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {creating ? 'Création...' : 'Créer l\'acteur'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
