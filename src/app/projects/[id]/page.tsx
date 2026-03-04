'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import GenerationsGrid from '@/components/projects/GenerationsGrid';
import PromptBar from '@/components/projects/PromptBar';
import ExpandedView from '@/components/projects/ExpandedView';
import { Generation, Project, Preprompt, Actor } from '@/lib/types';
import { Download, Trash2, X, CheckSquare } from 'lucide-react';

export default function ProjectPage() {
    const { id } = useParams<{ id: string }>();
    const [project, setProject] = useState<Project | null>(null);
    const [generations, setGenerations] = useState<Generation[]>([]);
    const [preprompts, setPreprompts] = useState<Preprompt[]>([]);
    const [actors, setActors] = useState<Actor[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedGen, setExpandedGen] = useState<Generation | null>(null);
    const [editRefUrl, setEditRefUrl] = useState<string | null>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Multi-select state
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const loadGenerations = useCallback(async () => {
        const res = await fetch(`/api/generations?project_id=${id}`);
        const data: Generation[] = await res.json();
        setGenerations(data);
        return data;
    }, [id]);

    useEffect(() => {
        async function init() {
            setLoading(true);
            const [pRes, ppRes, aRes] = await Promise.all([
                fetch(`/api/projects/${id}`),
                fetch('/api/preprompts'),
                fetch('/api/actors'),
            ]);
            setProject(await pRes.json());
            setPreprompts(await ppRes.json());
            setActors(await aRes.json());
            await loadGenerations();
            setLoading(false);
        }
        init();
    }, [id, loadGenerations]);

    useEffect(() => {
        function startPoll() {
            if (pollRef.current) clearInterval(pollRef.current);
            pollRef.current = setInterval(async () => {
                // Trigger server-side video poll (updates generating → done)
                await fetch('/api/generate/video/poll').catch(() => { });
                const data = await loadGenerations();
                const stillGenerating = data.some((g) => g.status === 'generating' || g.status === 'pending');
                if (!stillGenerating && pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
            }, 4000);
        }
        const hasGenerating = generations.some((g) => g.status === 'generating' || g.status === 'pending');
        if (hasGenerating) startPoll();
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, [generations, loadGenerations]);

    function handleGenerationStarted() {
        setTimeout(loadGenerations, 500);
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = setInterval(async () => {
            const data = await loadGenerations();
            const still = data.some((g) => g.status === 'generating' || g.status === 'pending');
            if (!still && pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
        }, 4000);
    }

    function handleDeleted(deletedId: string) {
        setGenerations((prev) => prev.filter((g) => g.id !== deletedId));
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
        const doneGens = generations.filter((g) => g.status === 'done');
        if (selectedIds.size === doneGens.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(doneGens.map((g) => g.id)));
        }
    }

    async function handleDownloadSelected() {
        const selectedGens = generations.filter((g) => selectedIds.has(g.id) && g.output_url);
        for (const gen of selectedGens) {
            const res = await fetch(gen.output_url!);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `arcade-${gen.id}.${gen.type === 'video' ? 'mp4' : 'jpg'}`;
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
        if (expandedGen && selectedIds.has(expandedGen.id)) setExpandedGen(null);
        setSelectedIds(new Set());
    }

    const hasSelection = selectedIds.size > 0;

    return (
        <div className="flex h-screen overflow-hidden" style={{ background: '#F9FAFB' }}>
            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top bar — white, like Arcade */}
                <div
                    className="flex items-center gap-3 px-5 py-3 shrink-0"
                    style={{ background: '#F9FAFB', borderBottom: '1px solid #e5e7eb' }}
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

                {/* Main grid area — light gray like Arcade */}
                <div
                    className="flex-1 overflow-y-auto"
                    style={{ background: '#F9FAFB' }}
                >
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="w-7 h-7 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <GenerationsGrid
                            generations={generations}
                            onCardClick={setExpandedGen}
                            onDeleted={handleDeleted}
                            selectedIds={selectedIds}
                            onToggleSelect={handleToggleSelect}
                            onEdit={handleEdit}
                        />
                    )}
                </div>

                {/* Bottom area: Selection bar OR Prompt bar */}
                <div style={{ background: 'transparent' }}>
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
                                    {selectedIds.size === generations.filter((g) => g.status === 'done').length ? 'Tout désélectionner' : 'Tout sélectionner'}
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
                            editReferenceUrl={editRefUrl}
                            onEditReferenceHandled={() => setEditRefUrl(null)}
                        />
                    )}
                </div>
            </div>

            {expandedGen && (
                <ExpandedView
                    generation={expandedGen}
                    allGenerations={generations.filter((g) => g.status === 'done')}
                    onClose={() => setExpandedGen(null)}
                    onNavigate={setExpandedGen}
                    onDeleted={handleDeleted}
                    onEdit={handleEdit}
                />
            )}
        </div>
    );
}
