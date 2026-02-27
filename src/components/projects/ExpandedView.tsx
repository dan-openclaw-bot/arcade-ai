'use client';

import { Generation } from '@/lib/types';
import { X, Download, Copy, Check, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { IMAGE_MODELS, VIDEO_MODELS } from '@/lib/types';

interface ExpandedViewProps {
    generation: Generation;
    allGenerations: Generation[];
    onClose: () => void;
    onNavigate: (gen: Generation) => void;
    onDeleted: (id: string) => void;
}

export default function ExpandedView({ generation, allGenerations, onClose, onNavigate, onDeleted }: ExpandedViewProps) {
    const [copied, setCopied] = useState(false);

    const currentIndex = allGenerations.findIndex((g) => g.id === generation.id);
    const prev = currentIndex > 0 ? allGenerations[currentIndex - 1] : null;
    const next = currentIndex < allGenerations.length - 1 ? allGenerations[currentIndex + 1] : null;

    const modelInfo = [...IMAGE_MODELS, ...VIDEO_MODELS].find((m) => m.id === generation.model);

    async function copyPrompt() {
        await navigator.clipboard.writeText(generation.prompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    async function handleDownload() {
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

    async function handleDelete() {
        if (!confirm('Delete this generation?')) return;
        await fetch(`/api/generations/${generation.id}`, { method: 'DELETE' });
        onDeleted(generation.id);
        onClose();
    }

    return (
        <div
            className="fixed inset-0 z-50 flex animate-fade-in"
            style={{ background: 'rgba(0,0,0,0.85)' }}
            onClick={onClose}
        >
            {/* Nav prev */}
            <button
                onClick={(e) => { e.stopPropagation(); prev && onNavigate(prev); }}
                className={`absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center z-10 transition-all ${!prev ? 'opacity-20 pointer-events-none' : 'bg-white/10 hover:bg-white/20 text-white'}`}
            >
                <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Nav next */}
            <button
                onClick={(e) => { e.stopPropagation(); next && onNavigate(next); }}
                className={`absolute z-10 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center transition-all ${!next ? 'opacity-20 pointer-events-none' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                style={{ right: 'calc(340px + 16px)' }}
            >
                <ChevronRight className="w-5 h-5" />
            </button>

            {/* Media area */}
            <div
                className="flex-1 flex items-center justify-center p-12"
                onClick={(e) => e.stopPropagation()}
            >
                {generation.output_url && generation.status === 'done' ? (
                    generation.type === 'image' ? (
                        <img
                            src={generation.output_url}
                            alt={generation.prompt}
                            className="max-h-full max-w-full object-contain rounded-2xl shadow-2xl"
                        />
                    ) : (
                        <video
                            src={generation.output_url}
                            className="max-h-full max-w-full rounded-2xl shadow-2xl"
                            controls autoPlay loop
                        />
                    )
                ) : (
                    <div className="text-gray-400 text-sm">No preview available</div>
                )}
            </div>

            {/* Right panel — WHITE like Arcade */}
            <div
                className="w-[340px] shrink-0 flex flex-col"
                style={{ background: '#fff', borderLeft: '1px solid #e5e7eb' }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleDownload}
                            disabled={!generation.output_url}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-700 text-white text-sm font-medium transition-colors disabled:opacity-40"
                        >
                            <Download className="w-3.5 h-3.5" />
                            Download HD
                        </button>
                        <button
                            onClick={handleDelete}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                    <button onClick={onClose} className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 text-xs transition-colors">
                        ✕
                    </button>
                </div>

                {/* Details */}
                <div className="flex-1 overflow-y-auto p-4 space-y-5">
                    {/* Model */}
                    <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Model</p>
                        <p className="text-gray-900 text-sm font-medium">{modelInfo?.name || generation.model}</p>
                        {modelInfo && (
                            <p className="text-xs text-gray-400 mt-0.5">
                                {modelInfo.pricePerImage != null && `$${modelInfo.pricePerImage.toFixed(3)}/image · `}
                                {modelInfo.pricePerSecond != null && `$${modelInfo.pricePerSecond.toFixed(2)}/sec · `}
                                {modelInfo.quality === 'ultra' ? 'Ultra quality' : modelInfo.quality === 'standard' ? 'Standard quality' : 'Fast'}
                            </p>
                        )}
                    </div>

                    {/* Format */}
                    <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Format</p>
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                            <span>{generation.aspect_ratio}</span>
                            {generation.type === 'video' && generation.duration_seconds && (<><span className="text-gray-300">·</span><span>{generation.duration_seconds}s</span></>)}
                            {generation.resolution && (<><span className="text-gray-300">·</span><span>{generation.resolution}</span></>)}
                        </div>
                    </div>

                    {/* Date */}
                    <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Date</p>
                        <p className="text-gray-700 text-sm">
                            {new Date(generation.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>

                    {/* Actor */}
                    {generation.actor && (
                        <div>
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">Actor</p>
                            <div className="flex items-center gap-2">
                                <img src={generation.actor.image_url} alt={generation.actor.name} className="w-7 h-7 rounded-full object-cover border border-gray-200" />
                                <p className="text-gray-700 text-sm">{generation.actor.name}</p>
                            </div>
                        </div>
                    )}

                    {/* Prompt */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Prompt</p>
                            <button onClick={copyPrompt} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors">
                                {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                                {copied ? 'Copied!' : 'Copy'}
                            </button>
                        </div>
                        <p className="text-gray-700 text-sm leading-relaxed bg-gray-50 rounded-xl p-3 border border-gray-100">
                            {generation.prompt}
                        </p>
                    </div>

                    {generation.error_message && (
                        <div className="bg-red-50 border border-red-100 rounded-xl p-3">
                            <p className="text-red-600 text-xs leading-relaxed">{generation.error_message}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
