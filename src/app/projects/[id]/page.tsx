'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import GenerationsGrid from '@/components/projects/GenerationsGrid';
import PromptBar from '@/components/projects/PromptBar';
import ExpandedView from '@/components/projects/ExpandedView';
import { Generation, Project, Preprompt, Actor, AspectRatio, GenerateImageFormatVariantsRequest, GenerateImageRequest } from '@/lib/types';
import { Download, Trash2, X, CheckSquare, AlertCircle } from 'lucide-react';

function isGenerationInFlight(generation: Generation): boolean {
    return generation.status === 'generating' || generation.status === 'pending';
}

function getClientRequestKey(generation: Generation): string | null {
    const requestId = generation.metadata?.client_request_id;
    const requestIndex = generation.metadata?.client_request_index;

    if (typeof requestId !== 'string') return null;

    if (typeof requestIndex === 'number') {
        return `${requestId}:${requestIndex}`;
    }

    if (typeof requestIndex === 'string' && requestIndex.trim() !== '' && !Number.isNaN(Number(requestIndex))) {
        return `${requestId}:${Number(requestIndex)}`;
    }

    return null;
}

function createClientRequestId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    return `req-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createOptimisticImageGeneration(
    projectId: string,
    sourceGeneration: Generation,
    aspectRatio: AspectRatio,
    clientRequestId: string,
): Generation {
    const requestTimestamp = new Date().toISOString();

    return {
        id: `optimistic-${clientRequestId}`,
        project_id: projectId,
        type: 'image',
        prompt: sourceGeneration.prompt,
        preprompt_id: sourceGeneration.preprompt_id,
        actor_id: sourceGeneration.actor_id,
        model: sourceGeneration.model,
        aspect_ratio: aspectRatio,
        duration_seconds: null,
        resolution: null,
        status: 'generating',
        output_url: null,
        error_message: null,
        metadata: {
            ...(sourceGeneration.metadata || {}),
            client_request_id: clientRequestId,
            client_request_index: 0,
            optimistic: true,
            source_generation_id: sourceGeneration.id,
        },
        created_at: requestTimestamp,
        updated_at: requestTimestamp,
        preprompt: sourceGeneration.preprompt,
        actor: sourceGeneration.actor,
    };
}

interface ToastNotice {
    id: string;
    message: string;
}

export default function ProjectPage() {
    const { id } = useParams<{ id: string }>();
    const [project, setProject] = useState<Project | null>(null);
    const [generations, setGenerations] = useState<Generation[]>([]);
    const [optimisticGenerations, setOptimisticGenerations] = useState<Generation[]>([]);
    const [preprompts, setPreprompts] = useState<Preprompt[]>([]);
    const [actors, setActors] = useState<Actor[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedGen, setExpandedGen] = useState<Generation | null>(null);
    const [editRefUrl, setEditRefUrl] = useState<string | null>(null);
    const [toastNotices, setToastNotices] = useState<ToastNotice[]>([]);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const pollGraceUntilRef = useRef(0);
    const optimisticGenerationsRef = useRef<Generation[]>([]);
    const seenImageErrorIdsRef = useRef<Set<string>>(new Set());
    const hasTrackedInitialErrorsRef = useRef(false);

    // Multi-select state
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const pushToast = useCallback((message: string) => {
        const toastId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

        setToastNotices((prev) => [...prev, { id: toastId, message }].slice(-3));

        setTimeout(() => {
            setToastNotices((prev) => prev.filter((notice) => notice.id !== toastId));
        }, 4500);
    }, []);

    const loadGenerations = useCallback(async () => {
        const res = await fetch(`/api/generations?project_id=${id}`);
        if (!res.ok) {
            throw new Error('Failed to load generations');
        }
        const data: Generation[] = await res.json();
        const imageErrors = data.filter((generation) => generation.type === 'image' && generation.status === 'error');
        const imageErrorIds = new Set(imageErrors.map((generation) => generation.id));

        if (!hasTrackedInitialErrorsRef.current) {
            seenImageErrorIdsRef.current = imageErrorIds;
            hasTrackedInitialErrorsRef.current = true;
        } else {
            const newImageErrors = imageErrors.filter((generation) => !seenImageErrorIdsRef.current.has(generation.id));

            if (newImageErrors.length > 0) {
                newImageErrors.forEach((generation) => {
                    seenImageErrorIdsRef.current.add(generation.id);
                });

                pushToast(
                    newImageErrors.length === 1
                        ? 'Une image n’a pas pu être générée.'
                        : `${newImageErrors.length} images n’ont pas pu être générées.`
                );
            }

            seenImageErrorIdsRef.current = new Set([
                ...seenImageErrorIdsRef.current,
                ...imageErrorIds,
            ]);
        }

        const persistedRequestKeys = new Set(
            data
                .map(getClientRequestKey)
                .filter((key): key is string => key !== null)
        );
        setGenerations(data);
        setOptimisticGenerations((prev) =>
            prev.filter((generation) => {
                const requestKey = getClientRequestKey(generation);
                return !requestKey || !persistedRequestKeys.has(requestKey);
            })
        );
        return data;
    }, [id, pushToast]);

    const stopPolling = useCallback(() => {
        if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
    }, []);

    const startPolling = useCallback(() => {
        if (pollRef.current) return;

        pollRef.current = setInterval(async () => {
            try {
                const pollHeaders: Record<string, string> = {};
                const openaiKey = typeof window !== 'undefined' ? localStorage.getItem('openai_key') : null;
                const googleKey = typeof window !== 'undefined' ? localStorage.getItem('google_key') : null;
                if (openaiKey) pollHeaders['x-openai-key'] = openaiKey;
                if (googleKey) pollHeaders['x-google-key'] = googleKey;

                await fetch('/api/generate/video/poll', { headers: pollHeaders }).catch(() => { });

                const data = await loadGenerations();
                const hasPersistedInFlight = data.some(isGenerationInFlight);
                const hasOptimisticInFlight = optimisticGenerationsRef.current.length > 0;
                const withinGraceWindow = Date.now() < pollGraceUntilRef.current;

                if (!hasPersistedInFlight && !hasOptimisticInFlight && !withinGraceWindow) {
                    stopPolling();
                }
            } catch (error) {
                console.error('Failed to poll generations:', error);
            }
        }, 4000);
    }, [loadGenerations, stopPolling]);

    // Fetch global data (preprompts, actors) ONCE — not on every project switch
    const globalLoadedRef = useRef(false);
    useEffect(() => {
        if (globalLoadedRef.current) return;
        globalLoadedRef.current = true;
        Promise.all([fetch('/api/preprompts'), fetch('/api/actors')])
            .then(async ([ppRes, aRes]) => {
                setPreprompts(await ppRes.json());
                setActors(await aRes.json());
            });
    }, []);

    // Fetch project-specific data when switching projects
    useEffect(() => {
        async function init() {
            setLoading(true);
            hasTrackedInitialErrorsRef.current = false;
            const pRes = await fetch(`/api/projects/${id}`);
            setProject(await pRes.json());
            await loadGenerations();
            setLoading(false);
        }
        init();
    }, [id, loadGenerations]);

    useEffect(() => {
        optimisticGenerationsRef.current = optimisticGenerations;
    }, [optimisticGenerations]);

    useEffect(() => {
        const hasPersistedInFlight = generations.some(isGenerationInFlight);
        const hasOptimisticInFlight = optimisticGenerations.length > 0;
        const withinGraceWindow = Date.now() < pollGraceUntilRef.current;

        if (hasPersistedInFlight || hasOptimisticInFlight || withinGraceWindow) {
            startPolling();
        } else {
            stopPolling();
        }
    }, [generations, optimisticGenerations.length, startPolling, stopPolling]);

    useEffect(() => stopPolling, [stopPolling]);

    function handleGenerationStarted(newOptimisticGenerations: Generation[] = []) {
        pollGraceUntilRef.current = Date.now() + 15000;

        if (newOptimisticGenerations.length > 0) {
            setOptimisticGenerations((prev) => [...newOptimisticGenerations, ...prev]);
        }

        startPolling();
        void loadGenerations().catch(() => { });
    }

    function handleGenerationFailed(clientRequestId: string) {
        setOptimisticGenerations((prev) =>
            prev.filter((generation) => generation.metadata?.client_request_id !== clientRequestId)
        );
        void loadGenerations().catch(() => { });
    }

    function notifyImageGenerationError(message: string = 'Une image n’a pas pu être générée.') {
        pushToast(message);
    }

    function handleGenerateFormatVariants(sourceGeneration: Generation, request: GenerateImageFormatVariantsRequest) {
        if (!sourceGeneration.output_url || request.aspectRatios.length === 0) return;

        const requests = request.aspectRatios.map((aspectRatio) => {
            const clientRequestId = createClientRequestId();
            return {
                aspectRatio,
                clientRequestId,
                optimisticGeneration: createOptimisticImageGeneration(id, sourceGeneration, aspectRatio, clientRequestId),
            };
        });

        handleGenerationStarted(requests.map((item) => item.optimisticGeneration));

        void (async () => {
            for (const [index, item] of requests.entries()) {
                if (index > 0) {
                    await new Promise((resolve) => setTimeout(resolve, 450));
                }

                try {
                    const body: GenerateImageRequest = {
                        project_id: id,
                        prompt: sourceGeneration.prompt,
                        model: sourceGeneration.model,
                        aspect_ratio: item.aspectRatio,
                        count: 1,
                        client_request_id: item.clientRequestId,
                        preprompt_id: request.prepromptId || undefined,
                        preprompt_override: request.prepromptOverride,
                        actor_id: sourceGeneration.actor_id || undefined,
                        reference_image_urls: [sourceGeneration.output_url!],
                    };

                    const apiHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
                    const openaiKey = typeof window !== 'undefined' ? localStorage.getItem('openai_key') : null;
                    const googleKey = typeof window !== 'undefined' ? localStorage.getItem('google_key') : null;
                    const byteplusKey = typeof window !== 'undefined' ? localStorage.getItem('byteplus_key') : null;
                    if (openaiKey) apiHeaders['x-openai-key'] = openaiKey;
                    if (googleKey) apiHeaders['x-google-key'] = googleKey;
                    if (byteplusKey) apiHeaders['x-byteplus-key'] = byteplusKey;

                    const res = await fetch('/api/generate/image', {
                        method: 'POST',
                        headers: apiHeaders,
                        body: JSON.stringify(body),
                    });

                    if (!res.ok) {
                        handleGenerationFailed(item.clientRequestId);
                        notifyImageGenerationError();
                    }
                } catch {
                    handleGenerationFailed(item.clientRequestId);
                    notifyImageGenerationError();
                }
            }
        })();
    }

    function handleDeleted(deletedId: string) {
        setGenerations((prev) => prev.filter((g) => g.id !== deletedId));
        setOptimisticGenerations((prev) => prev.filter((g) => g.id !== deletedId));
        seenImageErrorIdsRef.current.delete(deletedId);
        setSelectedIds((prev) => {
            const next = new Set(Array.from(prev));
            next.delete(deletedId);
            return next;
        });
        if (expandedGen?.id === deletedId) setExpandedGen(null);
    }

    function handleEdit(imageUrl: string) {
        setEditRefUrl(imageUrl);
    }

    function handleToggleSelect(genId: string) {
        setSelectedIds((prev) => {
            const next = new Set(Array.from(prev));
            if (next.has(genId)) {
                next.delete(genId);
            } else {
                next.add(genId);
            }
            return next;
        });
    }

    function handleSelectAll() {
        const doneGens = displayGenerations.filter((g) => g.status === 'done');
        if (selectedIds.size === doneGens.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(doneGens.map((g) => g.id)));
        }
    }

    async function handleDownloadSelected() {
        const selectedGens = displayGenerations.filter((g) => selectedIds.has(g.id) && g.output_url);
        for (const gen of selectedGens) {
            const res = await fetch(gen.output_url!);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `aura-${gen.id}.${gen.type === 'video' ? 'mp4' : 'jpg'}`;
            a.click();
            URL.revokeObjectURL(url);
            // Small delay between downloads
            await new Promise((r) => setTimeout(r, 300));
        }
    }

    async function handleDeleteSelected() {
        if (!confirm(`Delete ${selectedIds.size} selected generation${selectedIds.size > 1 ? 's' : ''}?`)) return;
        const ids = Array.from(selectedIds);
        await Promise.all(ids.map((gid) => fetch(`/api/generations/${gid}`, { method: 'DELETE' })));
        setGenerations((prev) => prev.filter((g) => !selectedIds.has(g.id)));
        setOptimisticGenerations((prev) => prev.filter((g) => !selectedIds.has(g.id)));
        if (expandedGen && selectedIds.has(expandedGen.id)) setExpandedGen(null);
        setSelectedIds(new Set());
    }

    const hasSelection = selectedIds.size > 0;
    const persistedRequestKeys = new Set(
        generations
            .map(getClientRequestKey)
            .filter((key): key is string => key !== null)
    );
    const visibleGenerations = generations.filter((generation) => generation.status !== 'error');
    const displayGenerations = [
        ...optimisticGenerations.filter((generation) => {
            const requestKey = getClientRequestKey(generation);
            return !requestKey || !persistedRequestKeys.has(requestKey);
        }),
        ...visibleGenerations,
    ];

    return (
        <div className="flex h-screen overflow-hidden" style={{ background: '#F9FAFB' }}>
            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top bar — white, like Arcade */}
                <div
                    className="flex items-center gap-3 px-5 py-3 shrink-0"
                    style={{ background: '#F9FAFB' }}
                >
                    <h1 className="text-gray-900 font-semibold text-sm flex-1 truncate">
                        {project?.name || ''}
                    </h1>
                    {/* Top right icons — like Arcade */}
                    <div className="flex items-center gap-2">
                        <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="History">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="9" /><path d="M12 6v6l4 2" /></svg>
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Share">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" /></svg>
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="Add">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="9" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="More">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="5" cy="12" r="1.5" fill="currentColor" /><circle cx="12" cy="12" r="1.5" fill="currentColor" /><circle cx="19" cy="12" r="1.5" fill="currentColor" /></svg>
                        </button>
                    </div>
                </div>

                {/* Main grid area + floating prompt bar */}
                <div
                    className="flex-1 overflow-y-auto relative"
                    style={{ background: '#F9FAFB' }}
                >
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="w-7 h-7 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div style={{ paddingBottom: 120 }}>
                            <GenerationsGrid
                                generations={displayGenerations}
                                onCardClick={setExpandedGen}
                                onDeleted={handleDeleted}
                                selectedIds={selectedIds}
                                onToggleSelect={handleToggleSelect}
                                onEdit={handleEdit}
                            />
                        </div>
                    )}

                    {/* Floating bottom bar — overlays on top of grid */}
                    <div style={{ position: 'sticky', bottom: 0, left: 0, right: 0, pointerEvents: 'none', zIndex: 20 }}>
                        <div style={{ pointerEvents: 'auto' }}>
                            {hasSelection ? (
                                /* Selection action bar */
                                <div className="flex justify-center px-6 pb-6">
                                    <div className="selection-bar w-full max-w-2xl flex items-center gap-3 px-5 py-3.5">
                                        {/* Count */}
                                        <span className="text-sm font-semibold text-gray-900">
                                            {selectedIds.size} sélectionné{selectedIds.size > 1 ? 's' : ''}
                                        </span>

                                        {/* Select all */}
                                        <button
                                            onClick={handleSelectAll}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
                                        >
                                            <CheckSquare className="w-3.5 h-3.5" />
                                            {selectedIds.size === displayGenerations.filter((g) => g.status === 'done').length ? 'Tout désélectionner' : 'Tout sélectionner'}
                                        </button>

                                        <div className="flex-1" />

                                        {/* Download selected */}
                                        <button
                                            onClick={handleDownloadSelected}
                                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                                        >
                                            <Download className="w-4 h-4" />
                                            Télécharger
                                        </button>

                                        {/* Delete selected */}
                                        <button
                                            onClick={handleDeleteSelected}
                                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Supprimer
                                        </button>

                                        {/* Cancel */}
                                        <button
                                            onClick={() => setSelectedIds(new Set())}
                                            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                                            title="Annuler la sélection"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* Normal prompt bar */
                                <PromptBar
                                    projectId={id}
                                    preprompts={preprompts}
                                    actors={actors}
                                    onGenerationStarted={handleGenerationStarted}
                                    onGenerationFailed={handleGenerationFailed}
                                    editReferenceUrl={editRefUrl}
                                    onEditReferenceHandled={() => setEditRefUrl(null)}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {toastNotices.length > 0 && (
                <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
                    {toastNotices.map((notice) => (
                        <div
                            key={notice.id}
                            className="flex items-start gap-2 rounded-xl border border-red-100 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm"
                            style={{ minWidth: 260, maxWidth: 340 }}
                        >
                            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                            <p className="text-sm text-gray-700 leading-snug">{notice.message}</p>
                        </div>
                    ))}
                </div>
            )}

            {expandedGen && (
                <ExpandedView
                    generation={expandedGen}
                    allGenerations={displayGenerations.filter((g) => g.status === 'done')}
                    preprompts={preprompts}
                    onClose={() => setExpandedGen(null)}
                    onNavigate={setExpandedGen}
                    onDeleted={handleDeleted}
                    onEdit={handleEdit}
                    onGenerateFormats={handleGenerateFormatVariants}
                />
            )}
        </div>
    );
}
