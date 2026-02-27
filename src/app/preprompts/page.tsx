'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import { Preprompt } from '@/lib/types';
import { Plus, Trash2, Edit2, FileText, X } from 'lucide-react';

const TYPE_LABELS = {
    image: '🖼️ Image',
    video: '🎬 Vidéo',
    both: '✨ Les deux',
};

export default function PrepromptsPage() {
    const [preprompts, setPreprompts] = useState<Preprompt[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [name, setName] = useState('');
    const [content, setContent] = useState('');
    const [type, setType] = useState<'image' | 'video' | 'both'>('both');

    useEffect(() => {
        fetch('/api/preprompts')
            .then((r) => r.json())
            .then((data) => { setPreprompts(data); setLoading(false); });
    }, []);

    function openCreate() {
        setEditingId(null);
        setName('');
        setContent('');
        setType('both');
        setShowModal(true);
    }

    function openEdit(p: Preprompt) {
        setEditingId(p.id);
        setName(p.name);
        setContent(p.content);
        setType(p.type);
        setShowModal(true);
    }

    async function handleSave() {
        if (!name.trim() || !content.trim()) return;
        setSaving(true);

        if (editingId) {
            const res = await fetch(`/api/preprompts/${editingId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, content, type }),
            });
            const updated = await res.json();
            setPreprompts((prev) => prev.map((p) => (p.id === editingId ? updated : p)));
        } else {
            const res = await fetch('/api/preprompts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, content, type }),
            });
            const created = await res.json();
            setPreprompts((prev) => [created, ...prev]);
        }

        setShowModal(false);
        setSaving(false);
    }

    async function handleDelete(id: string) {
        if (!confirm('Supprimer ce pré-prompt ?')) return;
        await fetch(`/api/preprompts/${id}`, { method: 'DELETE' });
        setPreprompts((prev) => prev.filter((p) => p.id !== id));
    }

    return (
        <div className="flex h-screen bg-[#0e0e0e] overflow-hidden">
            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <div className="flex items-center px-6 py-4 border-b border-white/5">
                    <h1 className="text-white font-semibold text-base flex-1">Pré-prompts</h1>
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Nouveau pré-prompt
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="space-y-3">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="h-24 rounded-xl shimmer" />
                            ))}
                        </div>
                    ) : preprompts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <FileText className="w-12 h-12 text-gray-700 mb-4" />
                            <p className="text-white font-semibold mb-2">Aucun pré-prompt</p>
                            <p className="text-gray-500 text-sm max-w-xs">
                                Les pré-prompts sont des instructions appliquées automatiquement avant chaque génération.
                            </p>
                        </div>
                    ) : (
                        <div className="max-w-2xl space-y-3">
                            {preprompts.map((p) => (
                                <div key={p.id} className="bg-[#161616] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <h3 className="text-white font-medium text-sm">{p.name}</h3>
                                                <span className="text-xs text-gray-600 bg-white/5 px-2 py-0.5 rounded-full">
                                                    {TYPE_LABELS[p.type]}
                                                </span>
                                            </div>
                                            <p className="text-gray-400 text-sm leading-relaxed line-clamp-3">{p.content}</p>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors">
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
                    <div className="bg-[#161616] border border-white/10 rounded-2xl p-6 w-full max-w-lg animate-slide-up" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-white font-semibold">{editingId ? 'Modifier' : 'Nouveau pré-prompt'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
                        </div>

                        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom du pré-prompt" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 outline-none focus:border-violet-500 mb-3" />

                        <div className="mb-3">
                            <label className="text-xs text-gray-500 mb-2 block font-medium uppercase tracking-wider">Type</label>
                            <div className="flex gap-2">
                                {(['image', 'video', 'both'] as const).map((t) => (
                                    <button key={t} onClick={() => setType(t)} className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${type === t ? 'bg-violet-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}>
                                        {TYPE_LABELS[t]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Contenu du pré-prompt..." rows={6} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-gray-600 outline-none focus:border-violet-500 mb-4 resize-none" />

                        <button onClick={handleSave} disabled={saving || !name.trim() || !content.trim()} className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                            {saving ? 'Enregistrement...' : editingId ? 'Enregistrer' : 'Créer'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
