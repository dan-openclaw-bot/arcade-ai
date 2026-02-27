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
        if (!confirm('Supprimer cette génération ?')) return;
        await fetch(`/api/generations/${generation.id}`, { method: 'DELETE' });
        onDeleted(generation.id);
        onClose();
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-stretch bg-black/90 animate-fade-in"
            onClick={onClose}
        >
            {/* Left nav */}
            <button
                onClick={(e) => { e.stopPropagation(); prev && onNavigate(prev); }}
                className={`absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10 ${!prev ? 'opacity-20 pointer-events-none' : ''}`}
            >
                <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Right nav */}
            <button
                onClick={(e) => { e.stopPropagation(); next && onNavigate(next); }}
                className={`absolute right-80 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10 ${!next ? 'opacity-20 pointer-events-none' : ''}`}
            >
                <ChevronRight className="w-6 h-6" />
            </button>

            {/* Main image/video area */}
            <div
                className="flex-1 flex items-center justify-center p-16"
                onClick={(e) => e.stopPropagation()}
            >
                {generation.output_url && generation.status === 'done' && (
                    <>
                        {generation.type === 'image' ? (
                            <img
                                src={generation.output_url}
                                alt={generation.prompt}
                                className="max-h-full max-w-full object-contain rounded-xl shadow-2xl"
                            />
                        ) : (
                            <video
                                src={generation.output_url}
                                className="max-h-full max-w-full rounded-xl shadow-2xl"
                                controls
                                autoPlay
                                loop
                            />
                        )}
                    </>
                )}
            </div>

            {/* Right panel */}
            <div
                className="w-80 bg-[#111] border-l border-white/5 flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/5">
                    <h3 className="text-white font-semibold text-sm">Détails</h3>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Info */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Model */}
                    <div>
                        <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wider">Modèle</p>
                        <p className="text-white text-sm">{modelInfo?.name || generation.model}</p>
                        {modelInfo && (
                            <div className="flex items-center gap-2 mt-1">
                                {modelInfo.pricePerImage && (
                                    <span className="text-xs text-emerald-400">${modelInfo.pricePerImage.toFixed(3)}/image</span>
                                )}
                                {modelInfo.pricePerSecond && (
                                    <span className="text-xs text-emerald-400">${modelInfo.pricePerSecond.toFixed(2)}/sec</span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Format */}
                    <div>
                        <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wider">Format</p>
                        <div className="flex items-center gap-2">
                            <span className="text-white text-sm">{generation.aspect_ratio}</span>
                            {generation.type === 'video' && generation.duration_seconds && (
                                <span className="text-gray-400 text-sm">• {generation.duration_seconds}s</span>
                            )}
                            {generation.resolution && (
                                <span className="text-gray-400 text-sm">• {generation.resolution}</span>
                            )}
                        </div>
                    </div>

                    {/* Date */}
                    <div>
                        <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wider">Créé le</p>
                        <p className="text-white text-sm">
                            {new Date(generation.created_at).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </p>
                    </div>

                    {/* Preprompt */}
                    {generation.preprompt && (
                        <div>
                            <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wider">Pré-prompt</p>
                            <p className="text-gray-300 text-sm">{generation.preprompt.name}</p>
                        </div>
                    )}

                    {/* Actor */}
                    {generation.actor && (
                        <div>
                            <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wider">Acteur</p>
                            <div className="flex items-center gap-2">
                                <img
                                    src={generation.actor.image_url}
                                    alt={generation.actor.name}
                                    className="w-6 h-6 rounded-full object-cover"
                                />
                                <p className="text-gray-300 text-sm">{generation.actor.name}</p>
                            </div>
                        </div>
                    )}

                    {/* Prompt */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Prompt</p>
                            <button
                                onClick={copyPrompt}
                                className="text-xs text-gray-500 hover:text-white flex items-center gap-1 transition-colors"
                            >
                                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                {copied ? 'Copié !' : 'Copier'}
                            </button>
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed bg-white/5 rounded-lg p-3">
                            {generation.prompt}
                        </p>
                    </div>

                    {/* Error */}
                    {generation.error_message && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                            <p className="text-red-400 text-xs">{generation.error_message}</p>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="p-4 border-t border-white/5 space-y-2">
                    <button
                        onClick={handleDownload}
                        disabled={!generation.output_url}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <Download className="w-4 h-4" />
                        Télécharger HD
                    </button>
                    <button
                        onClick={handleDelete}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 text-sm transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        Supprimer
                    </button>
                </div>
            </div>
        </div>
    );
}
