'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { IMAGE_MODELS, VIDEO_MODELS, AspectRatio, GenerateImageRequest, GenerateVideoRequest } from '@/lib/types';
import MissingKeyModal from '@/components/MissingKeyModal';

type Tab = 'video' | 'image';

interface PromptBarProps {
    projectId: string;
    preprompts: { id: string; name: string }[];
    actors: { id: string; name: string; image_url: string }[];
    onGenerationStarted: () => void;
    editReferenceUrl?: string | null;
    onEditReferenceHandled?: () => void;
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
}: {
    tab: Tab; onClose: () => void;
    imageModel: string; setImageModel: (v: string) => void;
    imageAspect: AspectRatio; setImageAspect: (v: AspectRatio) => void;
    videoModel: string; setVideoModel: (v: string) => void;
    videoAspect: AspectRatio; setVideoAspect: (v: AspectRatio) => void;
    videoDuration: number; setVideoDuration: (v: number) => void;
    videoResolution: string; setVideoResolution: (v: string) => void;
    count: number;
}) {
    const imgModel = IMAGE_MODELS.find((m) => m.id === imageModel) || IMAGE_MODELS[1];
    const vidModel = VIDEO_MODELS.find((m) => m.id === videoModel) || VIDEO_MODELS[0];
    const estimatedCost = tab === 'image'
        ? `$${((imgModel.pricePerImage || 0) * count).toFixed(3)}`
        : `$${((vidModel.pricePerSecond || 0) * videoDuration * count).toFixed(2)}`;

    // Compute available duration options based on model max
    const maxDur = vidModel.maxDuration || 16;
    // Sora API: only 4/8/12 valid. Veo: up to 16
    const allDurations = [4, 8, 12, 16];
    const durationOptions = allDurations.filter((d) => d <= maxDur);
    const isSora = videoModel.startsWith('sora-');

    function handleVideoModelChange(newModel: string) {
        setVideoModel(newModel);
        // Clamp duration to new model's max
        const newVidModel = VIDEO_MODELS.find((m) => m.id === newModel);
        const newMax = newVidModel?.maxDuration || 16;
        if (videoDuration > newMax) setVideoDuration(newMax);
    }

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
                    <div className="px-5 py-3 flex items-center justify-between bg-gray-50" style={{ borderRadius: '0 0 16px 16px' }}>
                        <span className="text-xs text-gray-500">Estimated cost</span>
                        <span className="text-xs font-bold text-gray-900">{estimatedCost} for {count} image{count > 1 ? 's' : ''}</span>
                    </div>
                </>
            )}

            {tab === 'video' && (
                <>
                    <Row label="Model">
                        <select value={videoModel} onChange={(e) => handleVideoModelChange(e.target.value)} className="appearance-none bg-transparent text-sm font-semibold text-gray-900 outline-none cursor-pointer pr-1">
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
                    <Row label={`Durée (max ${maxDur}s)`}>
                        <select value={videoDuration} onChange={(e) => setVideoDuration(Number(e.target.value))} className="appearance-none bg-transparent text-sm font-semibold text-gray-900 outline-none cursor-pointer pr-1">
                            {durationOptions.map((d) => <option key={d} value={d}>{d}s</option>)}
                        </select>
                        <SelectArrow />
                    </Row>
                    {!isSora && (
                        <Row label="Résolution">
                            <select value={videoResolution} onChange={(e) => setVideoResolution(e.target.value)} className="appearance-none bg-transparent text-sm font-semibold text-gray-900 outline-none cursor-pointer pr-1">
                                {['720p', '1080p'].map((r) => <option key={r} value={r}>{r}</option>)}
                            </select>
                            <SelectArrow />
                        </Row>
                    )}
                    {isSora && (
                        <Row label="Résolution">
                            <span className="text-sm text-gray-400 italic">Auto (ratio)</span>
                        </Row>
                    )}
                    {/* Price */}
                    <div className="px-5 py-3 flex items-center justify-between bg-gray-50" style={{ borderRadius: '0 0 16px 16px' }}>
                        <span className="text-xs text-gray-500">Estimated cost</span>
                        <span className="text-xs font-bold text-gray-900">{estimatedCost} for {videoDuration * count}s</span>
                    </div>
                </>
            )}
        </div>
    );
}

export default function PromptBar({ projectId, preprompts, actors, onGenerationStarted, editReferenceUrl, onEditReferenceHandled }: PromptBarProps) {
    const [tab, setTab] = useState<Tab>('image');
    const [prompt, setPrompt] = useState('');
    const [count, setCount] = useState(1);
    const [error, setError] = useState<string | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [totalSpent, setTotalSpent] = useState(0);

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        const resetHeight = () => {
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto'; // default row height
            }
        };
        if (!prompt) {
            resetHeight();
            return;
        }
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [prompt, tab]);

    // Image settings
    const [imageModel, setImageModel] = useState('gemini-3.1-flash-image-preview'); // Nano Banana 2
    const [imageAspect, setImageAspect] = useState<AspectRatio>('1:1');

    // Video settings
    const [videoModel, setVideoModel] = useState('sora-2-pro'); // Sora 2 Pro
    const [videoAspect, setVideoAspect] = useState<AspectRatio>('9:16');
    const [videoDuration, setVideoDuration] = useState(12);
    const [videoResolution, setVideoResolution] = useState('1080p');



    // Reference image — used for BOTH image (style reference) and video
    const [refImageFile, setRefImageFile] = useState<File | null>(null);
    const [refImagePreview, setRefImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Preprompt & Actor selection
    const [selectedPrepromptId, setSelectedPrepromptId] = useState<string | null>(null);
    const [selectedActorIds, setSelectedActorIds] = useState<string[]>([]);
    const [showPrepromptPicker, setShowPrepromptPicker] = useState(false);
    const [showActorPicker, setShowActorPicker] = useState(false);

    const selectedPreprompt = preprompts.find((p) => p.id === selectedPrepromptId);
    const selectedActors = actors.filter((a) => selectedActorIds.includes(a.id));

    // Missing key modal state
    const [missingKeyProvider, setMissingKeyProvider] = useState<'openai' | 'google' | null>(null);

    // Load total spent from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('arcade_total_spent');
        if (saved) setTotalSpent(parseFloat(saved));
    }, []);

    // Handle edit reference URL (from ExpandedView "Edit" button)
    useEffect(() => {
        if (!editReferenceUrl) return;
        // Set the URL as reference image preview directly (no File needed for URL-based refs)
        setRefImagePreview(editReferenceUrl);
        setRefImageFile(null); // Will use URL directly instead of file upload
        setTab('image');
        onEditReferenceHandled?.();
    }, [editReferenceUrl, onEditReferenceHandled]);
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
        setError(null);
        // Capture current values before resetting
        const currentPrompt = prompt.trim();
        const currentRefImageFile = refImageFile;
        const currentRefImagePreview = refImagePreview; // URL from Edit button or file preview
        const currentTab = tab;
        const currentImageModel = imageModel;
        const currentImageAspect = imageAspect;
        const currentVideoModel = videoModel;
        const currentVideoAspect = videoAspect;
        const currentVideoDuration = videoDuration;
        const currentVideoResolution = videoResolution;
        const currentCount = count;

        // Reset UI immediately so the user can queue more generations
        setPrompt('');
        setRefImageFile(null);
        setRefImagePreview(null);

        onGenerationStarted(); // Trigger UI polling instantly

        // Fire and forget — the generation grid polls for status independently
        (async () => {
            try {
                if (currentTab === 'image') {
                    // Upload ref image if provided, or use existing URL (from Edit)
                    let refImageUrl: string | undefined;
                    if (currentRefImageFile) {
                        const fd = new FormData();
                        fd.append('file', currentRefImageFile);
                        fd.append('bucket', 'generations');
                        const upRes = await fetch('/api/upload', { method: 'POST', body: fd });
                        if (upRes.ok) { const { url } = await upRes.json(); refImageUrl = url; }
                    } else if (currentRefImagePreview && currentRefImagePreview.startsWith('http')) {
                        // Already a URL (from Edit button)
                        refImageUrl = currentRefImagePreview;
                    }

                    const body: GenerateImageRequest = {
                        project_id: projectId,
                        prompt: currentPrompt,
                        model: currentImageModel,
                        aspect_ratio: currentImageAspect,
                        count: currentCount,
                        // Combine uploaded ref image and all selected actor images into an array
                        reference_image_urls: [
                            refImageUrl,
                            ...selectedActorIds.map(id => actors.find((a) => a.id === id)?.image_url)
                        ].filter(Boolean) as string[],

                        preprompt_id: selectedPrepromptId || undefined,
                        actor_id: selectedActorIds.length > 0 ? selectedActorIds[0] : undefined, // Keep first actor ID for DB tracking
                    };
                    const apiHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
                    const openaiKey = localStorage.getItem('openai_key');
                    const googleKey = localStorage.getItem('google_key');
                    if (openaiKey) apiHeaders['x-openai-key'] = openaiKey;
                    if (googleKey) apiHeaders['x-google-key'] = googleKey;
                    const res = await fetch('/api/generate/image', {
                        method: 'POST', headers: apiHeaders, body: JSON.stringify(body),
                    });
                    if (!res.ok) {
                        const d = await res.json();
                        if (d.missingKeyProvider) {
                            setPrompt(currentPrompt); // Recover prompt
                            setMissingKeyProvider(d.missingKeyProvider);
                            return;
                        }
                        throw new Error(d.error || 'Generation failed');
                    }
                    // Track cost
                    const imgModel = IMAGE_MODELS.find((m) => m.id === currentImageModel);
                    if (imgModel?.pricePerImage) addSpent(imgModel.pricePerImage * currentCount);

                } else {
                    // Upload ref image for video
                    let refImageUrl: string | undefined;
                    if (currentRefImageFile) {
                        const fd = new FormData();
                        fd.append('file', currentRefImageFile);
                        fd.append('bucket', 'generations');
                        const upRes = await fetch('/api/upload', { method: 'POST', body: fd });
                        if (upRes.ok) { const { url } = await upRes.json(); refImageUrl = url; }
                    } else if (currentRefImagePreview && currentRefImagePreview.startsWith('http')) {
                        refImageUrl = currentRefImagePreview;
                    }
                    const body: GenerateVideoRequest = {
                        project_id: projectId,
                        prompt: currentPrompt,
                        model: currentVideoModel,
                        aspect_ratio: currentVideoAspect,
                        duration_seconds: currentVideoDuration,
                        resolution: currentVideoResolution,
                        count: currentCount,
                        // Combine uploaded ref image and all selected actor images into an array
                        reference_image_urls: [
                            refImageUrl,
                            ...selectedActorIds.map(id => actors.find((a) => a.id === id)?.image_url)
                        ].filter(Boolean) as string[],
                        preprompt_id: selectedPrepromptId || undefined,
                        actor_id: selectedActorIds.length > 0 ? selectedActorIds[0] : undefined,
                    };
                    const apiHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
                    const openaiKey = localStorage.getItem('openai_key');
                    const googleKey = localStorage.getItem('google_key');
                    if (openaiKey) apiHeaders['x-openai-key'] = openaiKey;
                    if (googleKey) apiHeaders['x-google-key'] = googleKey;
                    const res = await fetch('/api/generate/video', {
                        method: 'POST', headers: apiHeaders, body: JSON.stringify(body),
                    });
                    if (!res.ok) {
                        const d = await res.json();
                        if (d.missingKeyProvider) {
                            setPrompt(currentPrompt); // Recover prompt
                            setMissingKeyProvider(d.missingKeyProvider);
                            return;
                        }
                        throw new Error(d.error || 'Generation failed');
                    }
                    // Track cost (estimate)
                    const vidModel = VIDEO_MODELS.find((m) => m.id === currentVideoModel);
                    if (vidModel?.pricePerSecond) addSpent(vidModel.pricePerSecond * currentVideoDuration * currentCount);
                }

            } catch (e: unknown) {
                setError(e instanceof Error ? e.message.replace('Error: ApiError: ', '') : String(e));
            }
        })();
    }

    const canGenerate = prompt.trim().length > 0;

    return (
        // Outer: relative container that holds bar + settings popup
        <div className="flex justify-center px-6 pb-6">
            {/* Missing Key Modal */}
            {missingKeyProvider && (
                <MissingKeyModal
                    provider={missingKeyProvider}
                    onClose={() => setMissingKeyProvider(null)}
                    onKeyConfigured={() => { setMissingKeyProvider(null); handleGenerate(); }}
                />
            )}
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
                    />
                )}

                {/* PREPROMPT PICKER DROPDOWN */}
                {showPrepromptPicker && (
                    <div
                        className="animate-slide-up"
                        style={{
                            position: 'absolute',
                            left: 0,
                            bottom: 'calc(100% + 12px)',
                            background: '#fff',
                            border: '1px solid #e8e8e8',
                            borderRadius: 12,
                            boxShadow: '0 8px 40px rgba(0,0,0,0.13)',
                            width: 260,
                            maxHeight: 280,
                            overflowY: 'auto',
                            zIndex: 50,
                        }}
                    >
                        <div className="px-4 py-3 font-semibold text-sm text-gray-900" style={{ borderBottom: '1px solid #f2f2f2' }}>
                            Pré-prompts
                        </div>
                        {preprompts.length === 0 ? (
                            <div className="px-4 py-3 text-xs text-gray-400">Aucun pré-prompt disponible</div>
                        ) : (
                            preprompts.map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => { setSelectedPrepromptId(p.id); setShowPrepromptPicker(false); }}
                                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 ${selectedPrepromptId === p.id ? 'bg-violet-50 text-violet-700 font-medium' : 'text-gray-700'}`}
                                >
                                    {p.name}
                                </button>
                            ))
                        )}
                    </div>
                )}

                {/* ACTOR PICKER DROPDOWN */}
                {showActorPicker && (
                    <div
                        className="animate-slide-up"
                        style={{
                            position: 'absolute',
                            left: 50,
                            bottom: 'calc(100% + 12px)',
                            background: '#fff',
                            border: '1px solid #e8e8e8',
                            borderRadius: 12,
                            boxShadow: '0 8px 40px rgba(0,0,0,0.13)',
                            width: 260,
                            maxHeight: 280,
                            overflowY: 'auto',
                            zIndex: 50,
                        }}
                    >
                        <div className="px-4 py-3 font-semibold text-sm text-gray-900" style={{ borderBottom: '1px solid #f2f2f2' }}>
                            Acteurs
                        </div>
                        {actors.length === 0 ? (
                            <div className="px-4 py-3 text-xs text-gray-400">Aucun acteur disponible</div>
                        ) : (
                            actors.map((a) => (
                                <button
                                    key={a.id}
                                    onClick={() => {
                                        setSelectedActorIds(prev => {
                                            if (prev.includes(a.id)) return prev.filter(id => id !== a.id);
                                            if (prev.length >= 2) return prev; // Max 2 actors
                                            return [...prev, a.id];
                                        });
                                    }}
                                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 flex items-center gap-2.5 ${selectedActorIds.includes(a.id) ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                                >
                                    <img src={a.image_url} alt={a.name} className="w-6 h-6 rounded-full object-cover shrink-0" />
                                    {a.name}
                                    {selectedActorIds.includes(a.id) && <span className="ml-auto text-blue-600 text-xs font-bold">✓</span>}
                                </button>
                            ))
                        )}
                    </div>
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
                            onClick={() => { setTab('video'); setShowSettings(false); setShowPrepromptPicker(false); setShowActorPicker(false); }}
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${tab === 'video' ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}
                        >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="13" height="10" rx="2" /><path d="m22 7-5 3.5L22 14V7z" /></svg>
                            Video
                        </button>
                        <button
                            onClick={() => { setTab('image'); setShowSettings(false); setShowPrepromptPicker(false); setShowActorPicker(false); }}
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
                            ref={textareaRef}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
                            placeholder={tab === 'image' ? 'Describe image' : 'Describe video'}
                            rows={2}
                            maxLength={5000}
                            style={{ maxHeight: '50vh' }}
                            className="w-full bg-transparent text-gray-900 placeholder-gray-400 text-sm resize-none outline-none leading-relaxed overflow-y-auto"
                        />
                    </div>

                    {/* Chips strip — reference image, preprompt, actor */}
                    {(refImagePreview || selectedPreprompt || selectedActors.length > 0) && (
                        <div className="flex items-center gap-2 px-4 pb-2 flex-wrap">
                            {/* Reference image chip */}
                            {refImagePreview && (
                                <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1">
                                    <div className="relative w-7 h-7 rounded overflow-hidden shrink-0">
                                        <img src={refImagePreview} alt="ref" className="w-full h-full object-cover" />
                                    </div>
                                    <span className="text-xs text-gray-500">Ref image</span>
                                    <button
                                        onClick={() => { setRefImageFile(null); setRefImagePreview(null); }}
                                        className="text-gray-400 hover:text-gray-700 ml-0.5"
                                    >
                                        <svg width="10" height="10" viewBox="0 0 10 10"><path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                                    </button>
                                </div>
                            )}
                            {/* Preprompt chip */}
                            {selectedPreprompt && (
                                <div className="flex items-center gap-1.5 bg-violet-50 border border-violet-200 rounded-lg px-2.5 py-1">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-violet-500 shrink-0">
                                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
                                    </svg>
                                    <span className="text-xs text-violet-700 font-medium">{selectedPreprompt.name}</span>
                                    <button
                                        onClick={() => setSelectedPrepromptId(null)}
                                        className="text-violet-400 hover:text-violet-700 ml-0.5"
                                    >
                                        <svg width="10" height="10" viewBox="0 0 10 10"><path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                                    </button>
                                </div>
                            )}
                            {/* Actor chips */}
                            {selectedActors.map(actor => (
                                <div key={actor.id} className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 rounded-lg px-2.5 py-1">
                                    <img src={actor.image_url} alt={actor.name} className="w-5 h-5 rounded-full object-cover shrink-0" />
                                    <span className="text-xs text-blue-700 font-medium">{actor.name}</span>
                                    <button
                                        onClick={() => setSelectedActorIds(prev => prev.filter(id => id !== actor.id))}
                                        className="text-blue-400 hover:text-blue-700 ml-0.5"
                                    >
                                        <svg width="10" height="10" viewBox="0 0 10 10"><path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
                                    </button>
                                </div>
                            ))}
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
                            onClick={() => { fileInputRef.current?.click(); setShowPrepromptPicker(false); setShowActorPicker(false); }}
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

                        {/* Preprompt button */}
                        <button
                            title="Ajouter un pré-prompt"
                            onClick={() => { setShowPrepromptPicker((s) => !s); setShowActorPicker(false); setShowSettings(false); }}
                            className={`relative p-2 rounded-lg transition-colors ${selectedPrepromptId ? 'text-violet-700 bg-violet-50' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                            </svg>
                            {selectedPrepromptId && (
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-violet-600 rounded-full border-2 border-white" />
                            )}
                        </button>

                        {/* Actor button */}
                        <button
                            title="Ajouter des acteurs (Max 2)"
                            onClick={() => { setShowActorPicker((s) => !s); setShowPrepromptPicker(false); setShowSettings(false); }}
                            className={`relative p-2 rounded-lg transition-colors ${selectedActorIds.length > 0 ? 'text-blue-700 bg-blue-50' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                            {selectedActorIds.length > 0 && (
                                <div className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 bg-blue-600 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold text-white">
                                    {selectedActorIds.length}
                                </div>
                            )}
                        </button>

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
                            onClick={() => { setShowSettings((s) => !s); setShowPrepromptPicker(false); setShowActorPicker(false); }}
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
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                                <line x1="12" y1="19" x2="12" y2="5" />
                                <polyline points="5 12 12 5 19 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
