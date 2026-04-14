'use client';

import { useEffect, useMemo, useState } from 'react';
import { Generation, Preprompt, AspectRatio, GenerateImageFormatVariantsRequest } from '@/lib/types';
import { X, Download, Copy, Check, ChevronLeft, ChevronRight, Trash2, Pencil, User } from 'lucide-react';
import { IMAGE_MODELS, VIDEO_MODELS } from '@/lib/types';

interface ExpandedViewProps {
    generation: Generation;
    allGenerations: Generation[];
    preprompts: Preprompt[];
    onClose: () => void;
    onNavigate: (gen: Generation) => void;
    onDeleted: (id: string) => void;
    onEdit?: (imageUrl: string) => void;
    onGenerateFormats?: (generation: Generation, request: GenerateImageFormatVariantsRequest) => void;
}

const DEFAULT_FORMAT_PREPROMPT = `Recreate the provided reference image as faithfully as possible while adapting it to the requested aspect ratio. Preserve the same subject, composition intent, mood, styling, colors, typography, branding, and key visual elements. Expand the canvas naturally instead of cropping important content, and fill the new space in a coherent, realistic way suitable for paid social placements.`;
const FORMAT_VARIANT_OPTIONS: Array<{ ratio: AspectRatio; label: string; description: string }> = [
    { ratio: '9:16', label: '9:16', description: 'Story / Reels / mobile vertical' },
    { ratio: '16:9', label: '16:9', description: 'Banniere / landscape / Facebook' },
];

function scoreFormatPreprompt(preprompt: Preprompt): number {
    const haystack = `${preprompt.name} ${preprompt.content}`.toLowerCase();
    const keywords = ['format', 'formats', 'ratio', 'facebook', 'banner', 'banniere', 'declinaison', 'resize', 'recadr', 'outpaint', 'expand'];
    return keywords.reduce((score, keyword) => score + (haystack.includes(keyword) ? 1 : 0), 0);
}

function getDefaultFormatPreprompt(preprompts: Preprompt[]): Preprompt | null {
    const eligiblePreprompts = preprompts.filter((preprompt) => preprompt.type === 'image' || preprompt.type === 'both');
    if (eligiblePreprompts.length === 0) return null;

    return [...eligiblePreprompts].sort((a, b) => scoreFormatPreprompt(b) - scoreFormatPreprompt(a))[0];
}

export default function ExpandedView({ generation, allGenerations, preprompts, onClose, onNavigate, onDeleted, onEdit, onGenerateFormats }: ExpandedViewProps) {
    const [copied, setCopied] = useState(false);
    const [showActorModal, setShowActorModal] = useState(false);
    const [actorName, setActorName] = useState('');
    const [savingActor, setSavingActor] = useState(false);
    const [actorSaved, setActorSaved] = useState(false);
    const [showFormatsModal, setShowFormatsModal] = useState(false);
    const [selectedFormatRatios, setSelectedFormatRatios] = useState<AspectRatio[]>(['9:16', '16:9']);
    const [selectedFormatPrepromptId, setSelectedFormatPrepromptId] = useState<string | null>(null);
    const [formatPrepromptContent, setFormatPrepromptContent] = useState(DEFAULT_FORMAT_PREPROMPT);

    const currentIndex = allGenerations.findIndex((g) => g.id === generation.id);
    const prev = currentIndex > 0 ? allGenerations[currentIndex - 1] : null;
    const next = currentIndex < allGenerations.length - 1 ? allGenerations[currentIndex + 1] : null;

    const modelInfo = [...IMAGE_MODELS, ...VIDEO_MODELS].find((m) => m.id === generation.model);
    const imagePreprompts = useMemo(
        () => preprompts.filter((preprompt) => preprompt.type === 'image' || preprompt.type === 'both'),
        [preprompts]
    );

    useEffect(() => {
        if (!showFormatsModal) return;

        const defaultPreprompt = getDefaultFormatPreprompt(preprompts);
        setSelectedFormatRatios(['9:16', '16:9']);
        setSelectedFormatPrepromptId(defaultPreprompt?.id || null);
        setFormatPrepromptContent(defaultPreprompt?.content || DEFAULT_FORMAT_PREPROMPT);
    }, [showFormatsModal, preprompts]);

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
        a.download = `aura-${generation.id}.${generation.type === 'video' ? 'mp4' : 'jpg'}`;
        a.click();
        URL.revokeObjectURL(url);
    }

    async function handleDelete() {
        if (!confirm('Delete this generation?')) return;
        await fetch(`/api/generations/${generation.id}`, { method: 'DELETE' });
        onDeleted(generation.id);
        onClose();
    }

    async function handleSaveAsActor() {
        if (!actorName.trim() || !generation.output_url) return;
        setSavingActor(true);
        try {
            await fetch('/api/actors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: actorName.trim(),
                    description: 'Généré depuis le projet',
                    image_url: generation.output_url,
                }),
            });
            setActorSaved(true);
            setShowActorModal(false);
            setActorName('');
            setTimeout(() => setActorSaved(false), 3000);
        } finally {
            setSavingActor(false);
        }
    }

    function handleToggleFormatRatio(ratio: AspectRatio) {
        setSelectedFormatRatios((prev) =>
            prev.includes(ratio)
                ? prev.filter((item) => item !== ratio)
                : [...prev, ratio]
        );
    }

    function handlePrepromptSelection(prepromptId: string) {
        const selectedPreprompt = imagePreprompts.find((preprompt) => preprompt.id === prepromptId) || null;
        setSelectedFormatPrepromptId(selectedPreprompt?.id || null);
        setFormatPrepromptContent(selectedPreprompt?.content || DEFAULT_FORMAT_PREPROMPT);
    }

    function handleGenerateFormats() {
        if (!onGenerateFormats || !generation.output_url || selectedFormatRatios.length === 0) return;

        onGenerateFormats(generation, {
            aspectRatios: FORMAT_VARIANT_OPTIONS
                .map((option) => option.ratio)
                .filter((ratio) => selectedFormatRatios.includes(ratio)),
            prepromptId: selectedFormatPrepromptId,
            prepromptOverride: formatPrepromptContent.trim() || DEFAULT_FORMAT_PREPROMPT,
        });
        setShowFormatsModal(false);
    }

    return (
        <div
            className="fixed inset-0 z-50 flex animate-fade-in"
            style={{ background: 'rgba(0,0,0,0.85)' }}
            onClick={onClose}
        >
            {/* Close button — top-right, always visible */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur flex items-center justify-center text-white transition-all"
            >
                <X className="w-5 h-5" />
            </button>

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
                        {generation.type === 'image' && generation.output_url && onEdit && (
                            <button
                                onClick={() => { onEdit(generation.output_url!); onClose(); }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
                            >
                                <Pencil className="w-3.5 h-3.5" />
                                Edit
                            </button>
                        )}
                        {generation.type === 'image' && generation.output_url && onGenerateFormats && (
                            <button
                                onClick={() => setShowFormatsModal(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-white text-sm font-medium transition-colors"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                    <rect x="3" y="5" width="7" height="14" rx="1.5" />
                                    <rect x="14" y="8" width="7" height="8" rx="1.5" />
                                </svg>
                                Formats
                            </button>
                        )}
                    </div>
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

                    {/* Save as actor — images only */}
                    {generation.type === 'image' && generation.output_url && generation.status === 'done' && (
                        <div>
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">Actions</p>
                            {actorSaved ? (
                                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-50 border border-green-100">
                                    <Check className="w-4 h-4 text-green-500" />
                                    <span className="text-sm text-green-700 font-medium">Acteur sauvegardé !</span>
                                </div>
                            ) : showActorModal ? (
                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-2">
                                    <p className="text-xs text-gray-500 font-medium">Nom de l&apos;acteur</p>
                                    <input
                                        autoFocus
                                        value={actorName}
                                        onChange={(e) => setActorName(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') handleSaveAsActor(); if (e.key === 'Escape') setShowActorModal(false); }}
                                        placeholder="Ex: Marie, Jean-Pierre..."
                                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-violet-400"
                                    />
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setShowActorModal(false)}
                                            className="flex-1 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-200 transition-colors"
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            onClick={handleSaveAsActor}
                                            disabled={savingActor || !actorName.trim()}
                                            className="flex-1 py-1.5 rounded-lg text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-colors disabled:opacity-40"
                                        >
                                            {savingActor ? 'Sauvegarde...' : 'Confirmer'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowActorModal(true)}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 hover:border-violet-300 hover:bg-violet-50 text-sm text-gray-700 font-medium transition-colors"
                                >
                                    <User className="w-4 h-4 text-gray-400" />
                                    Sauvegarder comme acteur
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {showFormatsModal && (
                <div className="fixed inset-0 z-[60] bg-black/35 flex items-center justify-center p-4" onClick={() => setShowFormatsModal(false)}>
                    <div
                        className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl animate-slide-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <div>
                                <h3 className="text-gray-900 font-semibold text-base">Decliner en plusieurs formats</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    L&apos;image actuelle sera reprise comme reference, puis regeneree dans les formats selectionnes.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowFormatsModal(false)}
                                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors shrink-0"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">Formats cibles</p>
                                <div className="grid gap-2">
                                    {FORMAT_VARIANT_OPTIONS.map((option) => {
                                        const isSelected = selectedFormatRatios.includes(option.ratio);
                                        return (
                                            <button
                                                key={option.ratio}
                                                onClick={() => handleToggleFormatRatio(option.ratio)}
                                                className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition-colors ${isSelected ? 'border-amber-300 bg-amber-50' : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'}`}
                                            >
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'border-amber-500 bg-amber-500 text-white' : 'border-gray-300 bg-white text-transparent'}`}>
                                                    <Check className="w-3 h-3" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900">{option.label}</p>
                                                    <p className="text-xs text-gray-500">{option.description}</p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">Pre-prompt</p>
                                <select
                                    value={selectedFormatPrepromptId || ''}
                                    onChange={(e) => handlePrepromptSelection(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-amber-400"
                                >
                                    {imagePreprompts.length === 0 && <option value="">Pre-prompt par defaut</option>}
                                    {imagePreprompts.length > 0 && (
                                        <>
                                            <option value="">Pre-prompt par defaut</option>
                                            {imagePreprompts.map((preprompt) => (
                                                <option key={preprompt.id} value={preprompt.id}>{preprompt.name}</option>
                                            ))}
                                        </>
                                    )}
                                </select>
                            </div>

                            <div>
                                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">Instructions modifiables</p>
                                <textarea
                                    value={formatPrepromptContent}
                                    onChange={(e) => setFormatPrepromptContent(e.target.value)}
                                    rows={6}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 leading-relaxed resize-none outline-none focus:border-amber-400"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 mt-5">
                            <button
                                onClick={() => setShowFormatsModal(false)}
                                className="px-4 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleGenerateFormats}
                                disabled={selectedFormatRatios.length === 0}
                                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-sm font-semibold transition-colors disabled:opacity-40"
                            >
                                Generer les formats
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
