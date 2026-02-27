'use client';

import { useState, useRef } from 'react';
import { IMAGE_MODELS, VIDEO_MODELS, AspectRatio, ModelInfo, GenerateImageRequest, GenerateVideoRequest } from '@/lib/types';

type Tab = 'actors' | 'video' | 'image';

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

    // Image settings
    const [imageModel, setImageModel] = useState(IMAGE_MODELS[1].id);
    const [imageAspect, setImageAspect] = useState<AspectRatio>('9:16');

    // Video settings
    const [videoModel, setVideoModel] = useState(VIDEO_MODELS[0].id);
    const [videoAspect, setVideoAspect] = useState<AspectRatio>('9:16');
    const [videoDuration, setVideoDuration] = useState(8);
    const [videoResolution, setVideoResolution] = useState('1080p');
    const [referenceImageFile, setReferenceImageFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const currentImageModel = IMAGE_MODELS.find((m) => m.id === imageModel) || IMAGE_MODELS[1];
    const currentVideoModel = VIDEO_MODELS.find((m) => m.id === videoModel) || VIDEO_MODELS[0];

    const activetab = tab === 'image' ? 'image' : tab === 'video' ? 'video' : 'actors';

    const charLimit = tab === 'actors' ? 1500 : tab === 'video' ? 2000 : 5000;
    const charLabel = tab === 'actors' ? '1 500' : tab === 'video' ? '2 000' : '5 000';

    const estimatedCost = tab === 'image'
        ? `$${((currentImageModel.pricePerImage || 0) * count).toFixed(3)}`
        : tab === 'video'
            ? `$${((currentVideoModel.pricePerSecond || 0) * videoDuration * count).toFixed(2)}`
            : '';

    async function handleGenerate() {
        if (!prompt.trim() && tab !== 'actors') return;
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
                    const d = await res.json();
                    throw new Error(d.error || 'Generation failed');
                }
            } else if (tab === 'video') {
                let refImageUrl: string | undefined;
                if (referenceImageFile) {
                    const fd = new FormData();
                    fd.append('file', referenceImageFile);
                    fd.append('bucket', 'generations');
                    const upRes = await fetch('/api/upload', { method: 'POST', body: fd });
                    if (upRes.ok) { const { url } = await upRes.json(); refImageUrl = url; }
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
                    const d = await res.json();
                    throw new Error(d.error || 'Video generation failed');
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
        <div className="relative flex justify-center px-6 pb-6">
            {/* Settings panel — floats above bar */}
            {showSettings && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-full max-w-xl bg-white border border-gray-200 rounded-2xl shadow-2xl p-5 animate-slide-up z-30">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900 text-sm">
                            {tab === 'image' ? 'Image Settings' : tab === 'video' ? 'Video Settings' : 'Actor Settings'}
                        </h3>
                        <button onClick={() => setShowSettings(false)} className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-bold">✕</button>
                    </div>

                    {tab === 'image' && (
                        <div className="space-y-4">
                            {/* Model */}
                            <div>
                                <label className="text-xs text-gray-500 font-medium mb-2 block">Model</label>
                                <div className="space-y-2">
                                    {IMAGE_MODELS.map((m) => (
                                        <div
                                            key={m.id}
                                            onClick={() => m.available && setImageModel(m.id)}
                                            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${imageModel === m.id ? 'border-gray-900 bg-gray-50' : 'border-gray-100 hover:border-gray-300'} ${!m.available ? 'opacity-40 cursor-not-allowed' : ''}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${imageModel === m.id ? 'border-gray-900' : 'border-gray-300'}`}>
                                                    {imageModel === m.id && <div className="w-2 h-2 rounded-full bg-gray-900" />}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium text-gray-900">{m.name}</span>
                                                        {m.badge && <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${m.badge === 'RECOMMANDÉ' ? 'bg-emerald-100 text-emerald-700' : m.badge === 'ULTRA' ? 'bg-violet-100 text-violet-700' : m.badge === 'GRATUIT' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>{m.badge}</span>}
                                                    </div>
                                                    <p className="text-xs text-gray-400">{m.description}</p>
                                                </div>
                                            </div>
                                            <span className="text-sm font-semibold text-gray-700 shrink-0">${m.pricePerImage?.toFixed(3)}<span className="text-xs font-normal text-gray-400">/img</span></span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {/* Aspect ratio */}
                            <div>
                                <label className="text-xs text-gray-500 font-medium mb-2 block">Aspect Ratio</label>
                                <div className="flex gap-2">
                                    {(['9:16', '1:1', '16:9'] as AspectRatio[]).map((r) => (
                                        <button key={r} onClick={() => setImageAspect(r)}
                                            className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${imageAspect === r ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}
                                        >{r}</button>
                                    ))}
                                </div>
                            </div>
                            {/* Count */}
                            <div>
                                <label className="text-xs text-gray-500 font-medium mb-2 block">Number of images</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4].map((n) => (
                                        <button key={n} onClick={() => setCount(n)}
                                            className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${count === n ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}
                                        >{n}</button>
                                    ))}
                                </div>
                            </div>
                            {/* Cost estimate */}
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                <span className="text-sm text-gray-500">Estimated cost</span>
                                <span className="text-sm font-semibold text-gray-900">{estimatedCost} for {count} image{count > 1 ? 's' : ''}</span>
                            </div>
                        </div>
                    )}

                    {tab === 'video' && (
                        <div className="space-y-4">
                            {/* Video model */}
                            <div>
                                <label className="text-xs text-gray-500 font-medium mb-2 block">Model</label>
                                <div className="space-y-2">
                                    {VIDEO_MODELS.map((m) => (
                                        <div
                                            key={m.id}
                                            onClick={() => m.available && setVideoModel(m.id)}
                                            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${videoModel === m.id ? 'border-gray-900 bg-gray-50' : 'border-gray-100 hover:border-gray-300'} ${!m.available ? 'opacity-40 cursor-not-allowed' : ''}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${videoModel === m.id ? 'border-gray-900' : 'border-gray-300'}`}>
                                                    {videoModel === m.id && <div className="w-2 h-2 rounded-full bg-gray-900" />}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium text-gray-900">{m.name}</span>
                                                        {m.badge && <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${m.badge === 'RECOMMANDÉ' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{m.badge}</span>}
                                                    </div>
                                                    <p className="text-xs text-gray-400">{m.description}</p>
                                                </div>
                                            </div>
                                            <span className="text-sm font-semibold text-gray-700 shrink-0">${m.pricePerSecond?.toFixed(2)}<span className="text-xs font-normal text-gray-400">/sec</span></span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-gray-500 font-medium mb-2 block">Aspect Ratio</label>
                                    <div className="flex flex-col gap-1.5">
                                        {(['9:16', '1:1'] as AspectRatio[]).map((r) => (
                                            <button key={r} onClick={() => setVideoAspect(r)}
                                                className={`py-2 rounded-xl text-sm font-medium border transition-all ${videoAspect === r ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}
                                            >{r}</button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 font-medium mb-2 block">Duration</label>
                                    <div className="flex flex-col gap-1.5">
                                        {[5, 8, 12, 16].map((d) => (
                                            <button key={d} onClick={() => setVideoDuration(d)}
                                                className={`py-2 rounded-xl text-sm font-medium border transition-all ${videoDuration === d ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}
                                            >{d}s</button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            {/* Cost */}
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                <span className="text-sm text-gray-500">Estimated cost</span>
                                <span className="text-sm font-semibold text-gray-900">{estimatedCost} for {videoDuration * count}s</span>
                            </div>
                        </div>
                    )}

                    {tab === 'actors' && (
                        <p className="text-sm text-gray-500">Select an actor from the bar below to use them in your generation.</p>
                    )}
                </div>
            )}

            {/* Preprompts dropdown */}
            {showPreprompts && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-white border border-gray-200 rounded-xl shadow-xl p-2 min-w-52 animate-slide-up z-30">
                    <p className="text-xs text-gray-400 px-2 py-1 font-medium">Pre-prompts</p>
                    <button onClick={() => { setSelectedPreprompt(null); setShowPreprompts(false); }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!selectedPreprompt ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}>
                        None
                    </button>
                    {preprompts.map((p) => (
                        <button key={p.id} onClick={() => { setSelectedPreprompt(p.id); setShowPreprompts(false); }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedPreprompt === p.id ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}>
                            {p.name}
                        </button>
                    ))}
                </div>
            )}

            {/* Actors dropdown */}
            {showActors && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-white border border-gray-200 rounded-xl shadow-xl p-2 min-w-52 animate-slide-up z-30">
                    <p className="text-xs text-gray-400 px-2 py-1 font-medium">Actors</p>
                    <button onClick={() => { setSelectedActor(null); setShowActors(false); }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!selectedActor ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}>
                        None
                    </button>
                    {actors.map((a) => (
                        <div key={a.id} onClick={() => { setSelectedActor(a.id); setShowActors(false); }}
                            className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${selectedActor === a.id ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}>
                            {a.image_url && <img src={a.image_url} alt={a.name} className="w-6 h-6 rounded-full object-cover" />}
                            {a.name}
                        </div>
                    ))}
                </div>
            )}

            {/* THE PROMPT BAR — white floating card */}
            <div className="prompt-bar w-full max-w-2xl overflow-hidden">
                {/* Tabs row */}
                <div className="flex items-center gap-1 px-3 pt-3">
                    {/* Talking Actors */}
                    <button
                        onClick={() => setTab('actors')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${tab === 'actors' ? 'tab-active' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>
                        Talking Actors
                    </button>

                    {/* Video */}
                    <button
                        onClick={() => setTab('video')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${tab === 'video' ? 'tab-active' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="13" height="10" rx="2" /><path d="m22 7-5 3.5L22 14V7z" /></svg>
                        Video
                    </button>

                    {/* Image */}
                    <button
                        onClick={() => setTab('image')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${tab === 'image' ? 'tab-active' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-6-6L5 21" /></svg>
                        Image
                    </button>

                    {/* See More */}
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                        See more
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div className="mx-3 mt-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
                        {error}
                    </div>
                )}

                {/* Text input */}
                <div className="px-4 pt-2 pb-1">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
                        placeholder={tab === 'image' ? 'Describe the image...' : tab === 'video' ? 'Describe the video...' : 'Add script...'}
                        rows={2}
                        maxLength={charLimit}
                        className="w-full bg-transparent text-gray-900 placeholder-gray-400 text-sm resize-none outline-none"
                    />
                </div>

                {/* Bottom controls */}
                <div className="flex items-center gap-2 px-3 pb-3">
                    {/* Add actors */}
                    <button
                        onClick={() => { setShowActors(!showActors); setShowPreprompts(false); }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors ${selectedActor ? 'border-gray-900 text-gray-900 bg-gray-50' : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}
                    >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>
                        {selectedActor ? actors.find((a) => a.id === selectedActor)?.name : 'Add actors'}
                    </button>

                    {/* Add pre-prompt */}
                    <button
                        onClick={() => { setShowPreprompts(!showPreprompts); setShowActors(false); }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors ${selectedPreprompt ? 'border-gray-900 text-gray-900 bg-gray-50' : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}
                    >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M7 7h10M7 12h7" /></svg>
                        {selectedPreprompt ? preprompts.find((p) => p.id === selectedPreprompt)?.name : 'Add emotions'}
                    </button>

                    <div className="flex-1" />

                    {/* Char count */}
                    <span className="text-xs text-gray-400 shrink-0">
                        {prompt.length} / {charLabel}
                    </span>

                    {/* Settings (sliders icon) */}
                    <button
                        onClick={() => { setShowSettings(!showSettings); setShowActors(false); setShowPreprompts(false); }}
                        className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" />
                            <circle cx="9" cy="6" r="2" fill="currentColor" stroke="none" /><circle cx="15" cy="12" r="2" fill="currentColor" stroke="none" /><circle cx="9" cy="18" r="2" fill="currentColor" stroke="none" />
                        </svg>
                    </button>

                    {/* Send button — dark circle */}
                    <button
                        onClick={handleGenerate}
                        disabled={loading || (!prompt.trim() && tab !== 'actors')}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${loading || (!prompt.trim() && tab !== 'actors') ? 'bg-gray-200 cursor-not-allowed' : 'bg-gray-900 hover:bg-gray-700 shadow-sm'}`}
                    >
                        {loading ? (
                            <div className="w-3.5 h-3.5 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={loading || !prompt.trim() ? '#999' : 'white'} strokeWidth="2.5">
                                <line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
