'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import GenerationsGrid from '@/components/projects/GenerationsGrid';
import PromptBar from '@/components/projects/PromptBar';
import ExpandedView from '@/components/projects/ExpandedView';
import { Generation, Project, Preprompt, Actor } from '@/lib/types';
import { RefreshCw } from 'lucide-react';

export default function ProjectPage() {
    const { id } = useParams<{ id: string }>();
    const [project, setProject] = useState<Project | null>(null);
    const [generations, setGenerations] = useState<Generation[]>([]);
    const [preprompts, setPreprompts] = useState<Preprompt[]>([]);
    const [actors, setActors] = useState<Actor[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedGen, setExpandedGen] = useState<Generation | null>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

    // Poll for generating items
    useEffect(() => {
        function startPoll() {
            if (pollRef.current) clearInterval(pollRef.current);
            pollRef.current = setInterval(async () => {
                const data = await loadGenerations();
                const stillGenerating = data.some(
                    (g) => g.status === 'generating' || g.status === 'pending'
                );
                if (!stillGenerating && pollRef.current) {
                    clearInterval(pollRef.current);
                    pollRef.current = null;
                }
            }, 4000);
        }

        const hasGenerating = generations.some(
            (g) => g.status === 'generating' || g.status === 'pending'
        );
        if (hasGenerating) startPoll();

        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [generations, loadGenerations]);

    function handleGenerationStarted() {
        setTimeout(loadGenerations, 500);
        // Also start polling
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = setInterval(async () => {
            const data = await loadGenerations();
            const stillGenerating = data.some(
                (g) => g.status === 'generating' || g.status === 'pending'
            );
            if (!stillGenerating && pollRef.current) {
                clearInterval(pollRef.current);
                pollRef.current = null;
            }
        }, 4000);
    }

    function handleDeleted(deletedId: string) {
        setGenerations((prev) => prev.filter((g) => g.id !== deletedId));
    }

    return (
        <div className="flex h-screen bg-[#0e0e0e] overflow-hidden">
            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top bar */}
                <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5">
                    <h1 className="text-white font-semibold text-base flex-1 truncate">
                        {project?.name || ''}
                    </h1>
                    <button
                        onClick={loadGenerations}
                        className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors"
                        title="Actualiser"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <span className="text-xs text-gray-600">
                        {generations.length} génération{generations.length !== 1 ? 's' : ''}
                    </span>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <GenerationsGrid
                            generations={generations}
                            onCardClick={setExpandedGen}
                            onDeleted={handleDeleted}
                        />
                    )}
                </div>

                {/* Prompt bar */}
                <div className="p-4 border-t border-white/5">
                    <PromptBar
                        projectId={id}
                        preprompts={preprompts}
                        actors={actors}
                        onGenerationStarted={handleGenerationStarted}
                    />
                </div>
            </div>

            {/* Expanded view */}
            {expandedGen && (
                <ExpandedView
                    generation={expandedGen}
                    allGenerations={generations.filter((g) => g.status === 'done')}
                    onClose={() => setExpandedGen(null)}
                    onNavigate={setExpandedGen}
                    onDeleted={handleDeleted}
                />
            )}
        </div>
    );
}
