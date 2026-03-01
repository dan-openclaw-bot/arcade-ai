'use client';

import { useState, useRef, useEffect } from 'react';
import { IMAGE_MODELS, VIDEO_MODELS, AspectRatio, GenerateImageRequest, GenerateVideoRequest } from '@/lib/types';

type Tab = 'video' | 'image';

interface PromptBarProps {
    projectId: string;
    preprompts: { id: string; name: string }[];
    actors: { id: string; name: string; image_url: string }[];
    onGenerationStarted: () => void;
}

// Settings popup to the RIGHT of the bar
function SettingsPopup({
    tab, onClose,
    imageModel, setImageModel,
    imageAspect, setImageAspect,
    videoModel, setVideoModel,
    videoAspect, setVideoAspect,
    videoDuration, setVideoDuration,
    videoResolution, setVideoResolution,
    count,
    qualitySuffix, setQualitySuffix,
    negativePrompt, setNegativePrompt,
}: {
    tab: Tab; onClose: () => void;
    imageModel: string; setImageModel: (v: string) => void;
    imageAspect: AspectRatio; setImageAspect: (v: AspectRatio) => void;
    videoModel: string; setVideoModel: (v: string) => void;
    videoAspect: AspectRatio; setVideoAspect: (v: AspectRatio) => void;
    videoDuration: number; setVideoDuration: (v: number) => void;
    videoResolution: string; setVideoResolution: (v: string) => void;
    count: number;
    qualitySuffix: string; setQualitySuffix: (v: string) => void;
    negativePrompt: string; setNegativePrompt: (v: string) => void;
}) {
    const imgModel = IMAGE_MODELS.find((m) => m.id === imageModel) || IMAGE_MODELS[1];
    const vidModel = VIDEO_MODELS.find((m) => m.id === videoModel) || VIDEO_MODELS[0];
    const estimatedCost = tab === 'image'
        ? `$${((imgModel.pricePerImage || 0) * count).toFixed(3)}`
        : `$${((vidModel.pricePerSecond || 0) * videoDuration * count).toFixed(2)}`;

    const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
        <div className="flex items-center justify-between py-3 px-5" style={{ borderBottom: '1px solid #f2f2f2' }}>
            <span className="text-sm text-gray-600">{label}</span>
            <div className="flex items-center gap-1 text-sm font-semibold text-gray-900">{children}</div>
        </div>
    );

    const SelectArrow = () => (
        <svg width="10" height="14" viewBox="0 0 10 14" fill="none" className="text-gray-400">
            <path d="M5 1L1 5h8L5 1zM5 13l4-4H1l4 4z" fill="currentColor" />
        </svg>
    );

    return (
        <div
            className="animate-slide-up"
            style={{
                position: 'absolute',
                right: 0,
                bottom: 'calc(100% + 12px)',
                background: '#fff',
                border: '1px solid #e8e8e8',
                borderRadius: 16,
                boxShadow: '0 8px 40px rgba(0,0,0,0.13)',
                width: 320,
                maxHeight: '70vh',
                overflowY: 'auto',
                zIndex: 50,
            }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px dashed #e8e8e8' }}>
                <span className="font-bold text-gray-900 text-base">
                    {tab === 'image' ? 'Image Settings' : 'Video Settings'}
                </span>
                <button
                    onClick={onClose}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
                    style={{ border: '1px solid #e5e7eb' }}
                >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                </button>
            </div>

            {tab === 'image' && (
                <>
                    <Row label="Model">
                        <select
                            value={imageModel}
                            onChange={(e) => setImageModel(e.target.value)}
                            className="appearance-none bg-transparent text-sm font-semibold text-gray-900 outline-none cursor-pointer pr-1"
                        >
                            {IMAGE_MODELS.filter((m) => m.available).map((m) => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                        <SelectArrow />
                    </Row>
                    <Row label="Aspect ratio">
                        <select value={imageAspect} onChange={(e) => setImageAspect(e.target.value as AspectRatio)} className="appearance-none bg-transparent text-sm font-semibold text-gray-900 outline-none cursor-pointer pr-1">
                            {['9:16', '1:1', '16:9'].map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <SelectArrow />
                    </Row>
                    {/* Price */}
                    <div className="px-5 py-3 flex items-center justify-between bg-gray-50">
                        <span className="text-xs text-gray-500">Estimated cost</span>
                        <span className="text-xs font-bold text-gray-900">{estimatedCost} for {count} image{count > 1 ? 's' : ''}</span>
                    </div>
                    {/* Quality booster */}
                    <div className="px-5 py-3" style={{ borderTop: '1px dashed #e8e8e8' }}>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">Quality booster</label>
                        <textarea
                            value={qualitySuffix}
                            onChange={(e) => setQualitySuffix(e.target.value)}
                            rows={2}
                            className="w-full text-xs text-gray-800 bg-gray-50 rounded-lg p-2 border border-gray-200 outline-none resize-none focus:border-gray-400"
                            placeholder="e.g. highly detailed, 8k resolution, cinematic lighting..."
                        />
                    </div>
                    {/* Negative prompt */}
                    <div className="px-5 py-3" style={{ borderTop: '1px solid #f2f2f2' }}>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">Negative prompt</label>
                        <textarea
                            value={negativePrompt}
                            onChange={(e) => setNegativePrompt(e.target.value)}
                            rows={2}
                            className="w-full text-xs text-gray-800 bg-gray-50 rounded-lg p-2 border border-gray-200 outline-none resize-none focus:border-gray-400"
                            placeholder="e.g. blurry, low quality, deformed, watermark..."
                        />
                    </div>
                </>
            )}

            {tab === 'video' && (
                <>
                    <Row label="Model">
                        <select value={videoModel} onChange={(e) => setVideoModel(e.target.value)} className="appearance-none bg-transparent text-sm font-semibold text-gray-900 outline-none cursor-pointer pr-1">
                            {VIDEO_MODELS.filter((m) => m.available).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                        <SelectArrow />
                    </Row>
                    <Row label="Aspect ratio">
                        <select value={videoAspect} onChange={(e) => setVideoAspect(e.target.value as AspectRatio)} className="appearance-none bg-transparent text-sm font-semibold text-gray-900 outline-none cursor-pointer pr-1">
                            {['9:16', '1:1', '16:9'].map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <SelectArrow />
                    </Row>
                    <Row label="Length">
                        <select value={videoDuration} onChange={(e) => setVideoDuration(Number(e.target.value))} className="appearance-none bg-transparent text-sm font-semibold text-gray-900 outline-none cursor-pointer pr-1">
                            {[5, 8, 12, 16].map((d) => <option key={d} value={d}>{d}s</option>)}
                        </select>
                        <SelectArrow />
                    </Row>
                    <Row label="Resolution">
                        <select value={videoResolution} onChange={(e) => setVideoResolution(e.target.value)} className="appearance-none bg-transparent text-sm font-semibold text-gray-900 outline-none cursor-pointer pr-1">
                            {['720p', '1080p'].map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <SelectArrow />
                    </Row>
                    {/* Price */}
                    <div className="px-5 py-3 flex items-center justify-between bg-gray-50">
                        <span className="text-xs text-gray-500">Estimated cost</span>
                        <span className="text-xs font-bold text-gray-900">{estimatedCost} for {videoDuration * count}s</span>
                    </div>
                    {/* Quality booster */}
                    <div className="px-5 py-3" style={{ borderTop: '1px dashed #e8e8e8' }}>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">Quality booster</label>
                        <textarea
                            value={qualitySuffix}
                            onChange={(e) => setQualitySuffix(e.target.value)}
                            rows={2}
                            className="w-full text-xs text-gray-800 bg-gray-50 rounded-lg p-2 border border-gray-200 outline-none resize-none focus:border-gray-400"
                            placeholder="e.g. highly detailed, cinematic lighting..."
                        />
                    </div>
                    {/* Negative prompt */}
                    <div className="px-5 py-3" style={{ borderTop: '1px solid #f2f2f2' }}>
                        <label className="text-xs font-semibold text-gray-600 block mb-1">Negative prompt</label>
                        <textarea
                            value={negativePrompt}
                            onChange={(e) => setNegativePrompt(e.target.value)}
                            rows={2}
                            className="w-full text-xs text-gray-800 bg-gray-50 rounded-lg p-2 border border-gray-200 outline-none resize-none focus:border-gray-400"
                            placeholder="e.g. blurry, low quality, deformed, watermark..."
                        />
                    </div>
                </>
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
    const [totalSpent, setTotalSpent] = useState(0);

    const DEFAULT_QUALITY = 'highly detailed, masterpiece, 8k resolution, cinematic lighting, professional photography, photorealistic';
    const DEFAULT_NEGATIVE = 'blurry, low quality, low resolution, pixelated, deformed, bad anatomy, bad proportions, disfigured, ugly, out of focus, text, watermark, signature';

    // Image settings
    const [imageModel, setImageModel] = useState(IMAGE_MODELS[1].id); // Nano Banana Pro
    const [imageAspect, setImageAspect] = useState<AspectRatio>('9:16');

    // Video settings
    const [videoModel, setVideoModel] = useState(VIDEO_MODELS[0].id); // Veo 2
    const [videoAspect, setVideoAspect] = useState<AspectRatio>('9:16');
    const [videoDuration, setVideoDuration] = useState(12);
    const [videoResolution, setVideoResolution] = useState('1080p');

    // Prompt enhancements (editable)
    const [qualitySuffix, setQualitySuffix] = useState(DEFAULT_QUALITY);
    const [negativePrompt, setNegativePrompt] = useState(DEFAULT_NEGATIVE);

    // Reference image — used for BOTH image (style reference) and video
    const [refImageFile, setRefImageFile] = useState<File | null>(null);
    const [refImagePreview, setRefImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load total spent + prompt settings from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('arcade_total_spent');
        if (saved) setTotalSpent(parseFloat(saved));
        const savedQuality = localStorage.getItem('arcade_quality_suffix');
        if (savedQuality !== null) setQualitySuffix(savedQuality);
        const savedNeg = localStorage.getItem('arcade_negative_prompt');
        if (savedNeg !== null) setNegativePrompt(savedNeg);
    }, []);

    // Save prompt settings on change
    useEffect(() => {
        localStorage.setItem('arcade_quality_suffix', qualitySuffix);
    }, [qualitySuffix]);
    useEffect(() => {
        localStorage.setItem('arcade_negative_prompt', negativePrompt);
    }, [negativePrompt]);

    function handleRefImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setRefImageFile(file);
        const reader = new FileReader();
        reader.onload = () => setRefImagePreview(reader.result as string);
        reader.readAsDataURL(file);
    }

    function addSpent(amount: number) {
        setTotalSpent((prev) => {
            const next = parseFloat((prev + amount).toFixed(4));
            localStorage.setItem('arcade_total_spent', String(next));
            return next;
        });
    }

    async function handleGenerate() {
        if (!prompt.trim()) return;
        setLoading(true);
        setError(null);
        try {
            if (tab === 'image') {
                // Upload ref image if provided
                let refImageUrl: string | undefined;
                if (refImageFile) {
                    const fd = new FormData();
                    fd.append('file', refImageFile);
                    fd.append('bucket', 'generations');
                    const upRes = await fetch('/api/upload', { method: 'POST', body: fd });
                    if (upRes.ok) { const { url } = await upRes.json(); refImageUrl = url; }
                }

                const body: GenerateImageRequest = {
                    project_id: projectId,
                    prompt: prompt.trim(),
                    model: imageModel,
                    aspect_ratio: imageAspect,
                    count,
                    reference_image_url: refImageUrl,
                    quality_suffix: qualitySuffix || undefined,
                    negative_prompt: negativePrompt || undefined,
                };
                const res = await fetch('/api/generate/image', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
                });
                if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Generation failed'); }
                // Track cost
                const imgModel = IMAGE_MODELS.find((m) => m.id === imageModel);
                if (imgModel?.pricePerImage) addSpent(imgModel.pricePerImage * count);

            } else {
                // Upload ref image for video
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
                    reference_image_url: refImageUrl,
                };
                const res = await fetch('/api/generate/video', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
                });
                if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Video generation failed'); }
                // Track cost (estimate)
                const vidModel = VIDEO_MODELS.find((m) => m.id === videoModel);
                if (vidModel?.pricePerSecond) addSpent(vidModel.pricePerSecond * videoDuration * count);
            }

            setPrompt('');
            setRefImageFile(null);
            setRefImagePreview(null);
            onGenerationStarted();
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message.replace('Error: ApiError: ', '') : String(e));
        } finally {
            setLoading(false);
        }
    }

    const canGenerate = prompt.trim().length > 0 && !loading;

    return (
        // Outer: relative container that holds bar + settings popup
        <div className="flex justify-center px-6 pb-6">
            <div className="relative w-full max-w-2xl">
                {/* SETTINGS POPUP — positions to the right of the bar */}
                {showSettings && (
                    <SettingsPopup
                        tab={tab}
                        onClose={() => setShowSettings(false)}
                        imageModel={imageModel} setImageModel={setImageModel}
                        imageAspect={imageAspect} setImageAspect={setImageAspect}
                        videoModel={videoModel} setVideoModel={setVideoModel}
                        videoAspect={videoAspect} setVideoAspect={setVideoAspect}
                        videoDuration={videoDuration} setVideoDuration={setVideoDuration}
                        videoResolution={videoResolution} setVideoResolution={setVideoResolution}
                        count={count}
                        qualitySuffix={qualitySuffix} setQualitySuffix={setQualitySuffix}
                        negativePrompt={negativePrompt} setNegativePrompt={setNegativePrompt}
                    />
                )}

                {/* Total spent badge */}
                {totalSpent > 0 && (
                    <div className="absolute -top-8 right-0 text-xs text-gray-400 flex items-center gap-1">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 6v6l4 2" /></svg>
                        Total spent: <span className="font-semibold text-gray-600">${totalSpent.toFixed(4)}</span>
                        <button onClick={() => { setTotalSpent(0); localStorage.removeItem('arcade_total_spent'); }} className="ml-1 text-gray-300 hover:text-gray-500">↺</button>
                    </div>
                )}

                {/* THE WHITE CARD */}
                <div
                    style={{
                        background: '#fff',
                        borderRadius: 16,
                        boxShadow: '0 4px 28px rgba(0,0,0,0.09), 0 1px 4px rgba(0,0,0,0.05)',
                    }}
                >
                    {/* Tabs */}
                    <div className="flex items-center gap-1 px-3 pt-3">
                        <button
                            onClick={() => { setTab('video'); setShowSettings(false); }}
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${tab === 'video' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}
                        >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="13" height="10" rx="2" /><path d="m22 7-5 3.5L22 14V7z" /></svg>
                            Video
                        </button>
                        <button
                            onClick={() => { setTab('image'); setShowSettings(false); }}
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${tab === 'image' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}
                        >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-6-6L5 21" /></svg>
                            Image
                        </button>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mx-3 mt-2 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 leading-relaxed">
                            {error}
                        </div>
                    )}

                    {/* Textarea */}
                    <div className="px-4 pt-3 pb-1">
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
                            placeholder={tab === 'image' ? 'Describe image' : 'Describe video'}
                            rows={2}
                            maxLength={5000}
                            className="w-full bg-transparent text-gray-900 placeholder-gray-400 text-sm resize-none outline-none leading-relaxed"
                        />
                    </div>

                    {/* Reference image preview strip */}
                    {refImagePreview && (
                        <div className="flex items-center gap-2 px-4 pb-2">
                            <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-gray-200">
                                <img src={refImagePreview} alt="ref" className="w-full h-full object-cover" />
                                <button
                                    onClick={() => { setRefImageFile(null); setRefImagePreview(null); }}
                                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-white text-xs"
                                >✕</button>
                            </div>
                            <span className="text-xs text-gray-400">Reference image</span>
                        </div>
                    )}

                    {/* Bottom bar */}
                    <div className="flex items-center gap-2 px-3 pb-3">
                        {/* Video Presets (left) */}
                        {tab === 'video' && (
                            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-6-6L5 21" /></svg>
                                Presets
                            </button>
                        )}

                        {/* Reference image button */}
                        <button
                            title={tab === 'image' ? 'Style reference image' : 'Video reference image'}
                            onClick={() => fileInputRef.current?.click()}
                            className={`relative p-2 rounded-lg transition-colors ${refImageFile ? 'text-gray-900 bg-gray-100' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <path d="m21 15-5-5L5 21" />
                            </svg>
                            {refImageFile && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-gray-900 rounded-full border-2 border-white" />
                            )}
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleRefImageChange}
                        />

                        {/* Char count */}
                        <span className="text-xs text-gray-400">
                            {prompt.length} / 5 000
                        </span>

                        <div className="flex-1" />

                        {/* Count — - N + */}
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() => setCount((c) => Math.max(1, c - 1))}
                                className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-gray-800 font-medium text-base leading-none"
                            >−</button>
                            <span className="text-sm font-semibold text-gray-900 w-4 text-center tabular-nums">{count}</span>
                            <button
                                onClick={() => setCount((c) => Math.min(4, c + 1))}
                                className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-gray-800 font-medium text-base leading-none"
                            >+</button>
                        </div>

                        {/* Settings toggle */}
                        <button
                            onClick={() => setShowSettings((s) => !s)}
                            className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}
                            title="Settings"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                <line x1="4" y1="6" x2="20" y2="6" />
                                <line x1="4" y1="12" x2="20" y2="12" />
                                <line x1="4" y1="18" x2="20" y2="18" />
                                <circle cx="9" cy="6" r="2" fill="white" stroke="currentColor" strokeWidth="1.8" />
                                <circle cx="15" cy="12" r="2" fill="white" stroke="currentColor" strokeWidth="1.8" />
                                <circle cx="9" cy="18" r="2" fill="white" stroke="currentColor" strokeWidth="1.8" />
                            </svg>
                        </button>

                        {/* Send */}
                        <button
                            onClick={handleGenerate}
                            disabled={!canGenerate}
                            className="w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm"
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
        </div>
    );
}
