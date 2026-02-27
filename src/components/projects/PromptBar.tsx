'use client';

import { useState, useRef } from 'react';
import {
    Image,
    Video,
    Settings,
    Plus,
    Minus,
    ChevronDown,
    Send,
    Wand2,
    User,
    X,
    AlertCircle,
} from 'lucide-react';
import {
    IMAGE_MODELS,
    VIDEO_MODELS,
    AspectRatio,
    ModelInfo,
    GenerateImageRequest,
    GenerateVideoRequest,
} from '@/lib/types';
import ModelPicker from './ModelPicker';

type Tab = 'image' | 'video';

interface PromptBarProps {
    projectId: string;
    preprompts: { id: string; name: string }[];
    actors: { id: string; name: string; image_url: string }[];
    onGenerationStarted: () => void;
}

export default function PromptBar({ projectId, preprompts, actors, onGenerationStarted }: PromptBarProps) {
    const [tab, setTab] = useState<Tab>('image');
    const [prompt, setPrompt] = useState('');
    const [count, setCount] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [showPreprompts, setShowPreprompts] = useState(false);
    const [showActors, setShowActors] = useState(false);
    const [selectedPreprompt, setSelectedPreprompt] = useState<string | null>(null);
    const [selectedActor, setSelectedActor] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Image settings
    const [imageModel, setImageModel] = useState(IMAGE_MODELS[1].id); // Default: Imagen 4 Standard
    const [imageAspect, setImageAspect] = useState<AspectRatio>('9:16');

    // Video settings
    const [videoModel, setVideoModel] = useState(VIDEO_MODELS[0].id);
    const [videoAspect, setVideoAspect] = useState<AspectRatio>('9:16');
    const [videoDuration, setVideoDuration] = useState(8);
    const [videoResolution, setVideoResolution] = useState('1080p');
    const [referenceImageFile, setReferenceImageFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const currentModel: ModelInfo =
        tab === 'image'
            ? IMAGE_MODELS.find((m) => m.id === imageModel) || IMAGE_MODELS[1]
            : VIDEO_MODELS.find((m) => m.id === videoModel) || VIDEO_MODELS[0];

    const estimatedCost =
        tab === 'image'
            ? ((currentModel.pricePerImage || 0) * count).toFixed(3)
            : ((currentModel.pricePerSecond || 0) * videoDuration * count).toFixed(2);

    async function handleGenerate() {
        if (!prompt.trim()) return;
        setLoading(true);
        setError(null);

        try {
            if (tab === 'image') {
                const body: GenerateImageRequest = {
                    project_id: projectId,
                    prompt: prompt.trim(),
                    model: imageModel,
                    aspect_ratio: imageAspect,
                    count,
                    preprompt_id: selectedPreprompt || undefined,
                    actor_id: selectedActor || undefined,
                };

                const res = await fetch('/api/generate/image', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                });

                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || 'Erreur de génération');
                }
            } else {
                // Video generation
                let refImageUrl: string | undefined;
                if (referenceImageFile) {
                    const fd = new FormData();
                    fd.append('file', referenceImageFile);
                    fd.append('bucket', 'generations');
                    const upRes = await fetch('/api/upload', { method: 'POST', body: fd });
                    if (upRes.ok) {
                        const { url } = await upRes.json();
                        refImageUrl = url;
                    }
                }

                const body: GenerateVideoRequest = {
                    project_id: projectId,
                    prompt: prompt.trim(),
                    model: videoModel,
                    aspect_ratio: videoAspect,
                    duration_seconds: videoDuration,
                    resolution: videoResolution,
                    count,
                    preprompt_id: selectedPreprompt || undefined,
                    actor_id: selectedActor || undefined,
                    reference_image_url: refImageUrl,
                };

                const res = await fetch('/api/generate/video', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                });

                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data.error || 'Erreur de génération vidéo');
                }
            }

            setPrompt('');
            onGenerationStarted();
        } catch (e: unknown) {
            setError(String(e));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="relative">
            {/* Settings panel */}
            {showSettings && (
                <div className="absolute bottom-full mb-3 left-0 right-0 mx-4 glass rounded-2xl p-4 animate-slide-up z-20">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-white text-sm font-semibold">
                            {tab === 'image' ? '⚙️ Paramètres image' : '⚙️ Paramètres vidéo'}
                        </h3>
                        <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-white">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {tab === 'image' ? (
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-400 mb-2 block font-medium">Modèle</label>
                                <ModelPicker
                                    models={IMAGE_MODELS}
                                    selected={imageModel}
                                    onSelect={setImageModel}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 mb-2 block font-medium">Format</label>
                                <div className="flex gap-2">
                                    {(['9:16', '1:1', '16:9'] as AspectRatio[]).map((ratio) => (
                                        <button
                                            key={ratio}
                                            onClick={() => setImageAspect(ratio)}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${imageAspect === ratio
                                                    ? 'bg-violet-600 text-white'
                                                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                                }`}
                                        >
                                            {ratio}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-gray-400 mb-2 block font-medium">Modèle</label>
                                <ModelPicker models={VIDEO_MODELS} selected={videoModel} onSelect={setVideoModel} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-gray-400 mb-2 block font-medium">Format</label>
                                    <div className="flex flex-col gap-1">
                                        {(['9:16', '1:1'] as AspectRatio[]).map((ratio) => (
                                            <button
                                                key={ratio}
                                                onClick={() => setVideoAspect(ratio)}
                                                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${videoAspect === ratio
                                                        ? 'bg-violet-600 text-white'
                                                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                                    }`}
                                            >
                                                {ratio}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 mb-2 block font-medium">Durée</label>
                                    <div className="flex flex-col gap-1">
                                        {[5, 8, 12, 16].map((d) => (
                                            <button
                                                key={d}
                                                onClick={() => setVideoDuration(d)}
                                                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${videoDuration === d
                                                        ? 'bg-violet-600 text-white'
                                                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                                    }`}
                                            >
                                                {d}s
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 mb-2 block font-medium">Résolution</label>
                                <div className="flex gap-2">
                                    {['720p', '1080p'].map((r) => (
                                        <button
                                            key={r}
                                            onClick={() => setVideoResolution(r)}
                                            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${videoResolution === r
                                                    ? 'bg-violet-600 text-white'
                                                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                                }`}
                                        >
                                            {r}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 mb-2 block font-medium">Image de référence (optionnel)</label>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => setReferenceImageFile(e.target.files?.[0] || null)}
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-3 py-2 rounded-lg text-sm bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors w-full text-left"
                                >
                                    {referenceImageFile ? referenceImageFile.name : '+ Ajouter une image'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Preprompts dropdown */}
            {showPreprompts && (
                <div className="absolute bottom-full mb-3 left-4 glass rounded-xl p-2 min-w-48 animate-slide-up z-20">
                    <p className="text-xs text-gray-500 px-2 mb-1">Pré-prompt</p>
                    <button
                        onClick={() => { setSelectedPreprompt(null); setShowPreprompts(false); }}
                        className={`w-full text-left px-2 py-1.5 rounded-lg text-sm transition-colors ${!selectedPreprompt ? 'text-violet-400' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        Aucun
                    </button>
                    {preprompts.map((p) => (
                        <button
                            key={p.id}
                            onClick={() => { setSelectedPreprompt(p.id); setShowPreprompts(false); }}
                            className={`w-full text-left px-2 py-1.5 rounded-lg text-sm transition-colors ${selectedPreprompt === p.id ? 'text-violet-400' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            {p.name}
                        </button>
                    ))}
                </div>
            )}

            {/* Actors dropdown */}
            {showActors && (
                <div className="absolute bottom-full mb-3 left-24 glass rounded-xl p-2 min-w-48 animate-slide-up z-20">
                    <p className="text-xs text-gray-500 px-2 mb-1">Acteur</p>
                    <button
                        onClick={() => { setSelectedActor(null); setShowActors(false); }}
                        className={`w-full text-left px-2 py-1.5 rounded-lg text-sm transition-colors ${!selectedActor ? 'text-violet-400' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        Aucun
                    </button>
                    {actors.map((a) => (
                        <div
                            key={a.id}
                            onClick={() => { setSelectedActor(a.id); setShowActors(false); }}
                            className={`flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-lg text-sm cursor-pointer transition-colors ${selectedActor === a.id ? 'text-violet-400' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            {a.image_url && (
                                <img src={a.image_url} alt={a.name} className="w-6 h-6 rounded-full object-cover" />
                            )}
                            {a.name}
                        </div>
                    ))}
                </div>
            )}

            {/* Main bar */}
            <div className="glass rounded-2xl overflow-hidden">
                {/* Tabs */}
                <div className="flex items-center px-4 pt-3 gap-1">
                    <button
                        onClick={() => setTab('image')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === 'image' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        <Image className="w-3.5 h-3.5" />
                        Image
                    </button>
                    <button
                        onClick={() => setTab('video')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === 'video' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'
                            }`}
                    >
                        <Video className="w-3.5 h-3.5" />
                        Vidéo
                    </button>

                    <div className="flex-1" />

                    {/* Model badge */}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="text-violet-400 font-medium">{currentModel.name}</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-medium">${estimatedCost}</span>
                        {tab === 'image' && <span>/ {count} img</span>}
                        {tab === 'video' && <span>/ {videoDuration * count}s</span>}
                    </div>
                </div>

                {/* Error message */}
                {error && (
                    <div className="mx-4 mt-2 flex items-center gap-2 text-red-400 text-xs bg-red-500/10 rounded-lg px-3 py-2">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        {error}
                    </div>
                )}

                {/* Textarea */}
                <div className="px-4 py-2">
                    <textarea
                        ref={textareaRef}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate();
                        }}
                        placeholder={
                            tab === 'image'
                                ? 'Décrivez l\'image à générer...'
                                : 'Décrivez la vidéo à générer...'
                        }
                        rows={2}
                        className="w-full bg-transparent text-white placeholder-gray-600 text-sm resize-none outline-none"
                    />
                </div>

                {/* Bottom controls */}
                <div className="flex items-center gap-2 px-4 pb-3">
                    {/* Preprompt button */}
                    <button
                        onClick={() => { setShowPreprompts(!showPreprompts); setShowActors(false); }}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${selectedPreprompt ? 'bg-violet-600/30 text-violet-300' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                            }`}
                    >
                        <Wand2 className="w-3.5 h-3.5" />
                        {selectedPreprompt ? preprompts.find((p) => p.id === selectedPreprompt)?.name || 'Pré-prompt' : 'Pré-prompt'}
                    </button>

                    {/* Actor button */}
                    <button
                        onClick={() => { setShowActors(!showActors); setShowPreprompts(false); }}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${selectedActor ? 'bg-violet-600/30 text-violet-300' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                            }`}
                    >
                        <User className="w-3.5 h-3.5" />
                        {selectedActor ? actors.find((a) => a.id === selectedActor)?.name || 'Acteur' : 'Acteur'}
                    </button>

                    <div className="flex-1" />

                    {/* Count */}
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setCount(Math.max(1, count - 1))}
                            className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                        >
                            <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm text-white font-medium w-4 text-center">{count}</span>
                        <button
                            onClick={() => setCount(Math.min(tab === 'image' ? 4 : 4, count + 1))}
                            className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                        >
                            <Plus className="w-3 h-3" />
                        </button>
                    </div>

                    {/* Settings */}
                    <button
                        onClick={() => { setShowSettings(!showSettings); setShowPreprompts(false); setShowActors(false); }}
                        className={`p-1.5 rounded-lg transition-colors ${showSettings ? 'bg-violet-600/30 text-violet-300' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
                    >
                        <Settings className="w-4 h-4" />
                    </button>

                    {/* Generate button */}
                    <button
                        onClick={handleGenerate}
                        disabled={loading || !prompt.trim()}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${loading || !prompt.trim()
                                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                : 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/30'
                            }`}
                    >
                        {loading ? (
                            <>
                                <div className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin" />
                                Génération...
                            </>
                        ) : (
                            <>
                                <Send className="w-3.5 h-3.5" />
                                Générer
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
