'use client';

import { useState, useEffect } from 'react';
import { Generation } from '@/lib/types';
import { Download, Trash2, AlertCircle, PlayCircle } from 'lucide-react';
import { IMAGE_MODELS, VIDEO_MODELS } from '@/lib/types';

interface GenerationCardProps {
    generation: Generation;
    onClick: () => void;
    onDeleted: (id: string) => void;
}

export default function GenerationCard({ generation, onClick, onDeleted }: GenerationCardProps) {
    const [deleting, setDeleting] = useState(false);
    const isGenerating = generation.status === 'generating' || generation.status === 'pending';
    const isError = generation.status === 'error';
    const isDone = generation.status === 'done';

    const modelInfo = [...IMAGE_MODELS, ...VIDEO_MODELS].find((m) => m.id === generation.model);

    async function handleDelete(e: React.MouseEvent) {
        e.stopPropagation();
        if (!confirm('Supprimer cette génération ?')) return;
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

    // Aspect ratio to CSS
    const aspectClass =
        generation.aspect_ratio === '9:16'
            ? 'aspect-[9/16]'
            : generation.aspect_ratio === '16:9'
                ? 'aspect-video'
                : 'aspect-square';

    return (
        <div
            className={`group relative rounded-xl overflow-hidden cursor-pointer ${aspectClass} bg-[#1a1a1a]`}
            onClick={onClick}
        >
            {/* Content */}
            {isGenerating && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#111]">
                    <div className="relative">
                        <div className="w-8 h-8 rounded-full border-2 border-violet-500/20" />
                        <div className="absolute inset-0 w-8 h-8 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
                    </div>
                    <p className="text-xs text-gray-500">
                        {generation.status === 'pending' ? 'En attente...' : 'Génération...'}
                    </p>
                </div>
            )}

            {isError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#111] p-3">
                    <AlertCircle className="w-6 h-6 text-red-400" />
                    <p className="text-xs text-red-400 text-center line-clamp-3">
                        {generation.error_message || 'Erreur'}
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
                        <div className="relative w-full h-full">
                            <video
                                src={generation.output_url}
                                className="w-full h-full object-cover"
                                muted
                                loop
                                onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                                onMouseLeave={(e) => {
                                    const v = e.target as HTMLVideoElement;
                                    v.pause();
                                    v.currentTime = 0;
                                }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-0">
                                <PlayCircle className="w-10 h-10 text-white/70" />
                            </div>
                        </div>
                    )}

                    {/* Hover overlay */}
                    <div className="card-overlay absolute inset-0 bg-black/50 flex flex-col justify-between p-2">
                        {/* Top actions */}
                        <div className="flex justify-end gap-1">
                            <button
                                onClick={handleDownload}
                                className="p-1.5 rounded-lg bg-black/50 text-white hover:bg-black/70 transition-colors"
                                title="Télécharger"
                            >
                                <Download className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="p-1.5 rounded-lg bg-black/50 text-white hover:bg-red-500/70 transition-colors"
                                title="Supprimer"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {/* Bottom info */}
                        <div>
                            <p className="text-white text-xs font-medium line-clamp-2 leading-tight">
                                {generation.prompt}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1">
                                <span className="text-gray-400 text-xs">{modelInfo?.name || generation.model}</span>
                                <span className="text-gray-600 text-xs">•</span>
                                <span className="text-gray-400 text-xs">{generation.aspect_ratio}</span>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
