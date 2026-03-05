'use client';

import { useState } from 'react';
import { Generation } from '@/lib/types';
import { Download, MoreHorizontal, Pencil, Clapperboard, AlertCircle, Check, User } from 'lucide-react';
import { IMAGE_MODELS, VIDEO_MODELS } from '@/lib/types';

interface GenerationCardProps {
    generation: Generation;
    onClick: () => void;
    onDeleted: (id: string) => void;
    isSelected?: boolean;
    onToggleSelect?: (id: string) => void;
    onEdit?: (imageUrl: string) => void;
}

export default function GenerationCard({ generation, onClick, onDeleted, isSelected, onToggleSelect, onEdit }: GenerationCardProps) {
    const [deleting, setDeleting] = useState(false);
    const [actorSaved, setActorSaved] = useState(false);
    const isGenerating = generation.status === 'generating' || generation.status === 'pending';
    const isError = generation.status === 'error';
    const isDone = generation.status === 'done';

    const modelInfo = [...IMAGE_MODELS, ...VIDEO_MODELS].find((m) => m.id === generation.model);

    async function handleDelete(e: React.MouseEvent) {
        e.stopPropagation();
        if (!confirm('Delete this generation?')) return;
        setDeleting(true);
        await fetch(`/api/generations/${generation.id}`, { method: 'DELETE' });
        onDeleted(generation.id);
    }

    async function handleDownload(e: React.MouseEvent) {
        e.stopPropagation();
        if (!generation.output_url) return;
        const res = await fetch(generation.output_url);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `arcade-${generation.id}.${generation.type === 'video' ? 'mp4' : 'jpg'}`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function handleSelect(e: React.MouseEvent) {
        e.stopPropagation();
        onToggleSelect?.(generation.id);
    }

    function handleEdit(e: React.MouseEvent) {
        e.stopPropagation();
        if (generation.output_url) {
            onEdit?.(generation.output_url);
        }
    }

    async function handleSaveAsActor(e: React.MouseEvent) {
        e.stopPropagation();
        if (!generation.output_url) return;
        const name = prompt('Nom de l\'acteur :');
        if (!name?.trim()) return;
        await fetch('/api/actors', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name.trim(), description: 'Généré depuis le projet', image_url: generation.output_url }),
        });
        setActorSaved(true);
        setTimeout(() => setActorSaved(false), 2000);
    }

    const aspectClass = 'aspect-square';

    return (
        <div
            className={`group relative rounded-xl overflow-hidden cursor-pointer ${aspectClass} ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
            style={{ background: '#d8d8d8' }}
            onClick={onClick}
        >
            {isGenerating && (
                <div className="absolute inset-0 rounded-xl overflow-hidden" style={{ background: '#e8e8e8' }}>
                    {/* Shimmer sweep */}
                    <div className="absolute inset-0 shimmer" />
                    {/* Centered subtle indicator */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300 border-t-transparent animate-spin" style={{ opacity: 0.5 }} />
                        <p className="text-xs text-gray-400 font-medium" style={{ opacity: 0.7 }}>
                            {generation.status === 'pending' ? 'En attente...' : 'Génération...'}
                        </p>
                    </div>
                </div>
            )}

            {isError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3" style={{ background: '#3a3a3a' }}>
                    <AlertCircle className="w-6 h-6 text-gray-500" />
                    <p className="text-xs text-gray-400 text-center leading-relaxed">
                        An error has occurred. Used credits were not counted. Please contact support for further information.
                    </p>
                </div>
            )}

            {isDone && generation.output_url && (
                <>
                    {generation.type === 'image' ? (
                        <img
                            src={generation.output_url}
                            alt={generation.prompt}
                            className="w-full h-full object-cover"
                            loading="lazy"
                        />
                    ) : (
                        <video
                            src={generation.output_url}
                            className="w-full h-full object-cover"
                            muted
                            loop
                            onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                            onMouseLeave={(e) => { const v = e.target as HTMLVideoElement; v.pause(); v.currentTime = 0; }}
                        />
                    )}

                    {/* Hover overlay */}
                    <div className="card-overlay absolute inset-0 flex flex-col justify-between p-2.5" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.05) 60%, rgba(0,0,0,0.4) 100%)' }}>
                        {/* Top row: checkbox left, buttons right */}
                        <div className="flex items-start justify-between">
                            {/* Select checkbox */}
                            <button
                                onClick={handleSelect}
                                className={`select-checkbox ${isSelected ? 'checked' : ''}`}
                            >
                                {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                            </button>

                            {/* Top right: more + download + (image) save as actor */}
                            <div className="flex flex-col gap-1.5">
                                {generation.type === 'image' && (
                                    <button onClick={handleSaveAsActor} className="overlay-icon-btn" title="Sauvegarder comme acteur">
                                        {actorSaved ? <Check className="w-4 h-4 text-green-400" /> : <User className="w-4 h-4" />}
                                    </button>
                                )}
                                <button onClick={handleDownload} className="overlay-icon-btn" title="Download">
                                    <Download className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Bottom row: Edit + Edit/Use buttons */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleEdit}
                                className="glass-btn flex-1 flex items-center justify-center gap-2 py-2.5 text-gray-700"
                                title="Modifier"
                            >
                                <Pencil className="w-4 h-4" />
                            </button>
                            <button
                                onClick={onClick}
                                className="glass-btn flex-1 flex items-center justify-center gap-2 py-2.5 text-gray-700"
                                title="Voir / Utiliser"
                            >
                                <Clapperboard className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Always show checkbox when selected (even without hover) */}
                    {isSelected && (
                        <div className="absolute top-2.5 left-2.5">
                            <button
                                onClick={handleSelect}
                                className="select-checkbox checked"
                            >
                                <Check className="w-3 h-3 text-white" strokeWidth={3} />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
