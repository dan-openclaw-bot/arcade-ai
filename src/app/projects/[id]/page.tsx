'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import GenerationsGrid from '@/components/projects/GenerationsGrid';
import PromptBar from '@/components/projects/PromptBar';
import ExpandedView from '@/components/projects/ExpandedView';
import { Generation, Project, Preprompt, Actor } from '@/lib/types';

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

    useEffect(() => {
        function startPoll() {
            if (pollRef.current) clearInterval(pollRef.current);
            pollRef.current = setInterval(async () => {
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
        if (expandedGen?.id === deletedId) setExpandedGen(null);
    }

    return (
        <div className="flex h-screen overflow-hidden" style={{ background: '#f0f0f0' }}>
            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Top bar — white, like Arcade */}
                <div
                    className="flex items-center gap-3 px-5 py-3 shrink-0"
                    style={{ background: '#fff', borderBottom: '1px solid #e5e7eb' }}
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

                {/* Main grid area — dark background like Arcade */}
                <div
                    className="flex-1 overflow-y-auto"
                    style={{ background: '#2c2c2c' }}
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
                        />
                    )}
                </div>

                {/* Prompt bar — floating at bottom */}
                <div style={{ background: '#2c2c2c', padding: '0' }}>
                    <PromptBar
                        projectId={id}
                        preprompts={preprompts}
                        actors={actors}
                        onGenerationStarted={handleGenerationStarted}
                    />
                </div>
            </div>

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
