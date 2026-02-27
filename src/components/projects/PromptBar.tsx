'use client';

import { useState, useRef } from 'react';
import { IMAGE_MODELS, VIDEO_MODELS, AspectRatio, GenerateImageRequest, GenerateVideoRequest } from '@/lib/types';

type Tab = 'video' | 'image';

interface PromptBarProps {
    projectId: string;
    preprompts: { id: string; name: string }[];
    actors: { id: string; name: string; image_url: string }[];
    onGenerationStarted: () => void;
}

// Settings panel opens to the right
function SettingsPanel({
    tab,
    onClose,
    imageModel, setImageModel,
    imageAspect, setImageAspect,
    videoModel, setVideoModel,
    videoAspect, setVideoAspect,
    videoDuration, setVideoDuration,
    videoResolution, setVideoResolution,
}: {
    tab: Tab; onClose: () => void;
    imageModel: string; setImageModel: (v: string) => void;
    imageAspect: AspectRatio; setImageAspect: (v: AspectRatio) => void;
    videoModel: string; setVideoModel: (v: string) => void;
    videoAspect: AspectRatio; setVideoAspect: (v: AspectRatio) => void;
    videoDuration: number; setVideoDuration: (v: number) => void;
    videoResolution: string; setVideoResolution: (v: string) => void;
}) {
    const imageModelObj = IMAGE_MODELS.find((m) => m.id === imageModel) || IMAGE_MODELS[1];
    const videoModelObj = VIDEO_MODELS.find((m) => m.id === videoModel) || VIDEO_MODELS[0];

    return (
        <div
            className="absolute bottom-full right-0 mb-3 animate-slide-up z-30"
            style={{
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: 16,
                boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
                width: 280,
                padding: 20,
            }}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4" style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: 12 }}>
                <span className="font-semibold text-gray-900 text-sm">{tab === 'image' ? 'Image Settings' : 'Video Settings'}</span>
                <button
                    onClick={onClose}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
                    style={{ border: '1px solid #e5e7eb', fontSize: 12 }}
                >
                    ✕
                </button>
            </div>

            {tab === 'image' && (
                <div className="space-y-0">
                    {/* Model row */}
                    <div className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid #f5f5f5' }}>
                        <span className="text-sm text-gray-700">Model</span>
                        <div className="relative">
                            <select
                                value={imageModel}
                                onChange={(e) => setImageModel(e.target.value)}
                                className="appearance-none text-sm text-gray-900 font-medium pr-5 bg-transparent border-none outline-none cursor-pointer"
                            >
                                {IMAGE_MODELS.filter((m) => m.available).map((m) => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                            <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-gray-400" style={{ fontSize: 10 }}>⇅</span>
                        </div>
                    </div>
                    {/* Aspect ratio row */}
                    <div className="flex items-center justify-between py-3">
                        <span className="text-sm text-gray-700">Aspect ratio</span>
                        <div className="relative">
                            <select
                                value={imageAspect}
                                onChange={(e) => setImageAspect(e.target.value as AspectRatio)}
                                className="appearance-none text-sm text-gray-900 font-medium pr-5 bg-transparent border-none outline-none cursor-pointer"
                            >
                                {['9:16', '1:1', '16:9'].map((r) => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>
                            <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-gray-400" style={{ fontSize: 10 }}>⇅</span>
                        </div>
                    </div>
                </div>
            )}

            {tab === 'video' && (
                <div className="space-y-0">
                    {/* Model */}
                    <div className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid #f5f5f5' }}>
                        <span className="text-sm text-gray-700">Model</span>
                        <div className="relative">
                            <select
                                value={videoModel}
                                onChange={(e) => setVideoModel(e.target.value)}
                                className="appearance-none text-sm text-gray-900 font-medium pr-5 bg-transparent border-none outline-none cursor-pointer"
                            >
                                {VIDEO_MODELS.filter((m) => m.available).map((m) => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                            <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-gray-400" style={{ fontSize: 10 }}>⇅</span>
                        </div>
                    </div>
                    {/* Aspect ratio */}
                    <div className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid #f5f5f5' }}>
                        <span className="text-sm text-gray-700">Aspect ratio</span>
                        <div className="relative">
                            <select
                                value={videoAspect}
                                onChange={(e) => setVideoAspect(e.target.value as AspectRatio)}
                                className="appearance-none text-sm text-gray-900 font-medium pr-5 bg-transparent border-none outline-none cursor-pointer"
                            >
                                {['9:16', '1:1', '16:9'].map((r) => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>
                            <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-gray-400" style={{ fontSize: 10 }}>⇅</span>
                        </div>
                    </div>
                    {/* Length */}
                    <div className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid #f5f5f5' }}>
                        <span className="text-sm text-gray-700">Length</span>
                        <div className="relative">
                            <select
                                value={videoDuration}
                                onChange={(e) => setVideoDuration(Number(e.target.value))}
                                className="appearance-none text-sm text-gray-900 font-medium pr-5 bg-transparent border-none outline-none cursor-pointer"
                            >
                                {[5, 8, 12, 16].map((d) => (
                                    <option key={d} value={d}>{d}s</option>
                                ))}
                            </select>
                            <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-gray-400" style={{ fontSize: 10 }}>⇅</span>
                        </div>
                    </div>
                    {/* Resolution */}
                    <div className="flex items-center justify-between py-3">
                        <span className="text-sm text-gray-700">Resolution</span>
                        <div className="relative">
                            <select
                                value={videoResolution}
                                onChange={(e) => setVideoResolution(e.target.value)}
                                className="appearance-none text-sm text-gray-900 font-medium pr-5 bg-transparent border-none outline-none cursor-pointer"
                            >
                                {['720p', '1080p'].map((r) => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>
                            <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-gray-400" style={{ fontSize: 10 }}>⇅</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function PromptBar({ projectId, preprompts, actors, onGenerationStarted }: PromptBarProps) {
    const [tab, setTab] = useState<Tab>('image');
    const [prompt, setPrompt] = useState('');
    const [count, setCount] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [showActors, setShowActors] = useState(false);

    const [selectedActor, setSelectedActor] = useState<string | null>(null);

    // Image settings
    const [imageModel, setImageModel] = useState(IMAGE_MODELS[1].id);
    const [imageAspect, setImageAspect] = useState<AspectRatio>('9:16');

    // Video settings
    const [videoModel, setVideoModel] = useState(VIDEO_MODELS[0].id);
    const [videoAspect, setVideoAspect] = useState<AspectRatio>('9:16');
    const [videoDuration, setVideoDuration] = useState(12);
    const [videoResolution, setVideoResolution] = useState('1080p');
    const [refImageFile, setRefImageFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const charLimit = tab === 'video' ? 5000 : 5000;
    const charLimitLabel = tab === 'video' ? '5 000' : '5 000';

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
                    actor_id: selectedActor || undefined,
                };
                const res = await fetch('/api/generate/image', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
                });
                if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
            } else {
                let refImageUrl: string | undefined;
                if (refImageFile) {
                    const fd = new FormData();
                    fd.append('file', refImageFile);
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
                    actor_id: selectedActor || undefined,
                    reference_image_url: refImageUrl,
                };
                const res = await fetch('/api/generate/video', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
                });
                if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
            }
            setPrompt('');
            onGenerationStarted();
        } catch (e: unknown) {
            setError(String(e));
        } finally {
            setLoading(false);
        }
    }

    const canGenerate = prompt.trim().length > 0 && !loading;

    return (
        <div className="relative flex justify-center px-6 pb-6">
            {/* Actors dropdown */}
            {showActors && (
                <div
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 animate-slide-up z-30"
                    style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, boxShadow: '0 8px 30px rgba(0,0,0,0.1)', minWidth: 200, padding: 8 }}
                >
                    <p className="text-xs text-gray-400 px-2 py-1 font-medium">Actors</p>
                    <button onClick={() => { setSelectedActor(null); setShowActors(false); }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!selectedActor ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                        None
                    </button>
                    {actors.map((a) => (
                        <div key={a.id} onClick={() => { setSelectedActor(a.id); setShowActors(false); }}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${selectedActor === a.id ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                            {a.image_url && <img src={a.image_url} alt={a.name} className="w-6 h-6 rounded-full object-cover" />}
                            {a.name}
                        </div>
                    ))}
                </div>
            )}

            {/* THE PROMPT BAR */}
            <div
                className="w-full max-w-2xl"
                style={{
                    background: '#fff',
                    borderRadius: 16,
                    boxShadow: '0 4px 28px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06)',
                }}
            >
                {/* Tabs */}
                <div className="flex items-center gap-1 px-3 pt-3">
                    <button
                        onClick={() => { setTab('video'); setShowSettings(false); }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${tab === 'video' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}
                    >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="13" height="10" rx="2" /><path d="m22 7-5 3.5L22 14V7z" /></svg>
                        Video
                    </button>
                    <button
                        onClick={() => { setTab('image'); setShowSettings(false); }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${tab === 'image' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}
                    >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-6-6L5 21" /></svg>
                        Image
                    </button>
                </div>

                {/* Error */}
                {error && <div className="mx-3 mt-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>}

                {/* Textarea */}
                <div className="px-4 pt-3 pb-1">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
                        placeholder={tab === 'image' ? 'Describe image' : 'Describe video'}
                        rows={2}
                        maxLength={charLimit}
                        className="w-full bg-transparent text-gray-900 placeholder-gray-400 text-sm resize-none outline-none"
                    />
                </div>

                {/* Bottom bar */}
                <div className="flex items-center gap-2 px-3 pb-3">
                    {/* Left: image upload or presets */}
                    {tab === 'video' && (
                        <button
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors border border-gray-200"
                            onClick={() => { }}
                        >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-6-6L5 21" /></svg>
                            Presets
                        </button>
                    )}

                    {/* Ref image upload */}
                    <button
                        title="Reference image"
                        onClick={() => fileInputRef.current?.click()}
                        className={`p-2 rounded-lg transition-colors ${refImageFile ? 'text-gray-900 bg-gray-100' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}
                    >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-6-6L5 21" /></svg>
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                        onChange={(e) => setRefImageFile(e.target.files?.[0] || null)} />

                    {/* Char count */}
                    <span className="text-xs text-gray-400">
                        {prompt.length} / {charLimitLabel}
                    </span>

                    <div className="flex-1" />

                    {/* Count — - N + (Image only) */}
                    {tab === 'image' && (
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setCount((c) => Math.max(1, c - 1))}
                                className="w-6 h-6 rounded flex items-center justify-center text-gray-500 hover:bg-gray-100 text-sm font-medium transition-colors"
                            >−</button>
                            <span className="text-sm text-gray-900 font-medium w-4 text-center">{count}</span>
                            <button
                                onClick={() => setCount((c) => Math.min(4, c + 1))}
                                className="w-6 h-6 rounded flex items-center justify-center text-gray-500 hover:bg-gray-100 text-sm font-medium transition-colors"
                            >+</button>
                        </div>
                    )}

                    {/* Video count */}
                    {tab === 'video' && (
                        <div className="flex items-center gap-1">
                            <button onClick={() => setCount((c) => Math.max(1, c - 1))} className="w-6 h-6 rounded flex items-center justify-center text-gray-500 hover:bg-gray-100 text-sm font-medium">−</button>
                            <span className="text-sm text-gray-900 font-medium w-4 text-center">{count}</span>
                            <button onClick={() => setCount((c) => Math.min(4, c + 1))} className="w-6 h-6 rounded flex items-center justify-center text-gray-500 hover:bg-gray-100 text-sm font-medium">+</button>
                        </div>
                    )}

                    {/* Settings — opens panel to right */}
                    <div className="relative">
                        {showSettings && (
                            <SettingsPanel
                                tab={tab}
                                onClose={() => setShowSettings(false)}
                                imageModel={imageModel} setImageModel={setImageModel}
                                imageAspect={imageAspect} setImageAspect={setImageAspect}
                                videoModel={videoModel} setVideoModel={setVideoModel}
                                videoAspect={videoAspect} setVideoAspect={setVideoAspect}
                                videoDuration={videoDuration} setVideoDuration={setVideoDuration}
                                videoResolution={videoResolution} setVideoResolution={setVideoResolution}
                            />
                        )}
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}
                        >
                            {/* Sliders icon */}
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="4" y1="6" x2="20" y2="6" />
                                <line x1="4" y1="12" x2="20" y2="12" />
                                <line x1="4" y1="18" x2="20" y2="18" />
                                <circle cx="9" cy="6" r="2.5" fill="white" stroke="currentColor" />
                                <circle cx="15" cy="12" r="2.5" fill="white" stroke="currentColor" />
                                <circle cx="9" cy="18" r="2.5" fill="white" stroke="currentColor" />
                            </svg>
                        </button>
                    </div>

                    {/* Send */}
                    <button
                        onClick={handleGenerate}
                        disabled={!canGenerate}
                        className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                        style={{ background: canGenerate ? '#111' : '#d1d5db' }}
                    >
                        {loading ? (
                            <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                                <line x1="12" y1="19" x2="12" y2="5" />
                                <polyline points="5 12 12 5 19 12" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
