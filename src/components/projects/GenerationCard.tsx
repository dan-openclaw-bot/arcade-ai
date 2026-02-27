'use client';

import { Generation } from '@/lib/types';
import { Download, Trash2, AlertCircle } from 'lucide-react';
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

    const aspectClass = generation.aspect_ratio === '9:16' ? 'aspect-[9/16]' : generation.aspect_ratio === '16:9' ? 'aspect-video' : 'aspect-square';

    return (
        <div
            className={`group relative rounded-xl overflow-hidden cursor-pointer ${aspectClass}`}
            style={{ background: '#3a3a3a' }}
            onClick={onClick}
        >
            {isGenerating && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3" style={{ background: '#3a3a3a' }}>
                    <div className="relative w-8 h-8">
                        <div className="absolute inset-0 rounded-full border-2 border-gray-600" />
                        <div className="absolute inset-0 rounded-full border-2 border-gray-300 border-t-transparent animate-spin" />
                    </div>
                    <p className="text-xs text-gray-400">{generation.status === 'pending' ? 'Waiting...' : 'Generating...'}</p>
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
                    <div className="card-overlay absolute inset-0 flex flex-col justify-between p-2" style={{ background: 'rgba(0,0,0,0.45)' }}>
                        <div className="flex justify-end gap-1">
                            <button onClick={handleDownload} className="p-1.5 rounded-lg bg-black/40 text-white hover:bg-black/60 transition-colors" title="Download">
                                <Download className="w-3 h-3" />
                            </button>
                            <button onClick={handleDelete} disabled={deleting} className="p-1.5 rounded-lg bg-black/40 text-white hover:bg-red-600/70 transition-colors" title="Delete">
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                        <div>
                            <p className="text-white text-xs leading-tight line-clamp-2 drop-shadow">{generation.prompt}</p>
                            <p className="text-gray-300 text-xs mt-0.5 opacity-70">{modelInfo?.name} · {generation.aspect_ratio}</p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

// Need to add useState import
import { useState } from 'react';
