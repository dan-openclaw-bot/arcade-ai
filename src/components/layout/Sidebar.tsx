'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
    Plus,
    ChevronLeft,
    Users,
    FileText,
    Edit2,
    Trash2,
    Menu,
    Settings,
} from 'lucide-react';
import { Project } from '@/lib/types';

export default function Sidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        const pRes = await fetch('/api/projects');
        setProjects(await pRes.json());
        setLoading(false);
    }

    async function createProject() {
        const res = await fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'New Project' }),
        });
        const project = await res.json();
        setProjects((prev) => [project, ...prev]);
        router.push(`/projects/${project.id}`);
        setEditingId(project.id);
        setEditName('New Project');
    }

    async function renameProject(id: string, name: string) {
        if (!name.trim()) return;
        await fetch(`/api/projects/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name }),
        });
        setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
        setEditingId(null);
    }

    async function deleteProject(id: string) {
        if (!confirm('Delete this project?')) return;
        await fetch(`/api/projects/${id}`, { method: 'DELETE' });
        setProjects((prev) => prev.filter((p) => p.id !== id));
        if (pathname === `/projects/${id}`) {
            const remaining = projects.filter((p) => p.id !== id);
            router.push(remaining.length > 0 ? `/projects/${remaining[0].id}` : '/');
        }
    }

    return (
        <div
            className="flex flex-col h-full bg-white select-none sidebar-transition"
            style={{
                width: collapsed ? 56 : 220,
                minWidth: collapsed ? 56 : 220,
                borderRight: '1px solid #e5e7eb',
                overflow: 'hidden',
            }}
        >
            {/* Header with collapse toggle */}
            <div className="flex items-center justify-between px-3 py-3 border-b border-gray-100" style={{ minHeight: 49 }}>
                {!collapsed && (
                    <div className="flex items-center gap-2 px-1">
                        <div className="w-6 h-6 rounded bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shrink-0">
                            <span className="text-white text-[10px] font-bold">A</span>
                        </div>
                        <span className="font-semibold text-gray-900 text-sm truncate">Aura AI</span>
                    </div>
                )}
                <button
                    onClick={() => setCollapsed((c) => !c)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors shrink-0"
                    title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {collapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
            </div>

            {/* New project */}
            <div className={collapsed ? 'px-1.5 py-2' : 'px-3 py-2'}>
                <button
                    onClick={() => createProject()}
                    className={`flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors py-1 w-full ${collapsed ? 'justify-center px-0' : 'px-1'}`}
                    title="New project"
                >
                    <Plus className="w-3.5 h-3.5 shrink-0" />
                    {!collapsed && 'New project'}
                </button>
            </div>

            {/* Scroll — hidden when collapsed */}
            {!collapsed && (
                <div className="flex-1 overflow-y-auto px-2 pb-4">
                    {loading ? (
                        <div className="space-y-1">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-6 rounded shimmer mx-1" />
                            ))}
                        </div>
                    ) : (
                        <div>
                            <div className="flex items-center px-1 py-1 mb-0.5">
                                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Projects</span>
                            </div>
                            {projects.map((p) => (
                                <ProjectRow
                                    key={p.id}
                                    project={p}
                                    active={pathname === `/projects/${p.id}`}
                                    editingId={editingId}
                                    editName={editName}
                                    setEditingId={setEditingId}
                                    setEditName={setEditName}
                                    renameProject={renameProject}
                                    deleteProject={deleteProject}
                                />
                            ))}
                            {projects.length === 0 && (
                                <p className="text-xs text-gray-400 px-2 py-2">No projects yet</p>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Spacer when collapsed to push bottom nav down */}
            {collapsed && <div className="flex-1" />}

            {/* Bottom nav */}
            <div className="border-t border-gray-100 p-2 space-y-0.5">
                <Link
                    href="/actors"
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${pathname === '/actors' ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'} ${collapsed ? 'justify-center' : ''}`}
                    title="Actors"
                >
                    <Users className="w-3.5 h-3.5 shrink-0" />
                    {!collapsed && 'Actors'}
                </Link>
                <Link
                    href="/preprompts"
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${pathname === '/preprompts' ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'} ${collapsed ? 'justify-center' : ''}`}
                    title="Pre-prompts"
                >
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                    {!collapsed && 'Pre-prompts'}
                </Link>
                <Link
                    href="/settings"
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${pathname === '/settings' ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'} ${collapsed ? 'justify-center' : ''}`}
                    title="Settings"
                >
                    <Settings className="w-3.5 h-3.5 shrink-0" />
                    {!collapsed && 'Settings'}
                </Link>
            </div>
        </div>
    );
}

function ProjectRow({
    project, active, editingId, editName, setEditingId, setEditName, renameProject, deleteProject,
}: {
    project: Project; active: boolean; editingId: string | null; editName: string;
    setEditingId: (id: string | null) => void; setEditName: (n: string) => void;
    renameProject: (id: string, name: string) => void; deleteProject: (id: string) => void;
}) {
    const [hover, setHover] = useState(false);

    return (
        <div
            className={`group relative flex items-center px-2 py-1.5 rounded-lg cursor-pointer text-sm transition-colors ${active ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
        >
            <Link href={`/projects/${project.id}`} className="flex-1 min-w-0">
                {editingId === project.id ? (
                    <input
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={() => renameProject(project.id, editName)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') renameProject(project.id, editName);
                            if (e.key === 'Escape') setEditingId(null);
                        }}
                        onClick={(e) => e.preventDefault()}
                        className="w-full bg-transparent border-none outline-none text-sm text-gray-900"
                    />
                ) : (
                    <span className="truncate block">{project.name}</span>
                )}
            </Link>

            {hover && editingId !== project.id && (
                <div className="flex items-center gap-0.5 ml-1 shrink-0">
                    <button
                        onClick={(e) => { e.preventDefault(); setEditingId(project.id); setEditName(project.name); }}
                        className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-700"
                    >
                        <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                        onClick={(e) => { e.preventDefault(); deleteProject(project.id); }}
                        className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                    >
                        <Trash2 className="w-3 h-3" />
                    </button>
                </div>
            )}
        </div>
    );
}
