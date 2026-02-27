'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
    Plus,
    FolderOpen,
    Folder,
    ChevronDown,
    ChevronRight,
    Users,
    FileText,
    Edit2,
    Trash2,
    MoreHorizontal,
} from 'lucide-react';
import { Project, Folder as FolderType } from '@/lib/types';

export default function Sidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const [projects, setProjects] = useState<Project[]>([]);
    const [folders, setFolders] = useState<FolderType[]>([]);
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [hoverProject, setHoverProject] = useState<string | null>(null);

    useEffect(() => { loadData(); }, []);

    async function loadData() {
        const [pRes, fRes] = await Promise.all([fetch('/api/projects'), fetch('/api/folders')]);
        setProjects(await pRes.json());
        setFolders(await fRes.json());
        setLoading(false);
    }

    async function createProject(folderId?: string) {
        const res = await fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'New Project', folder_id: folderId || null }),
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

    async function createFolder() {
        const name = prompt('Folder name:');
        if (!name?.trim()) return;
        const res = await fetch('/api/folders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name }),
        });
        const folder = await res.json();
        setFolders((prev) => [...prev, folder]);
        setExpandedFolders((prev) => new Set([...Array.from(prev), folder.id]));
    }

    const rootProjects = projects.filter((p) => !p.folder_id);
    const folderProjects = (fid: string) => projects.filter((p) => p.folder_id === fid);

    return (
        <div
            className="flex flex-col h-full bg-white select-none"
            style={{
                width: 220,
                minWidth: 220,
                borderRight: '1px solid #e5e7eb',
            }}
        >
            {/* App name + layout toggle */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 text-sm truncate">Aide Senior Arcade</span>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                </div>
                <button className="p-1 rounded hover:bg-gray-100 text-gray-400">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <rect x="1" y="1" width="6" height="6" rx="1" fill="currentColor" opacity="0.4" />
                        <rect x="9" y="1" width="6" height="6" rx="1" fill="currentColor" opacity="0.4" />
                        <rect x="1" y="9" width="6" height="6" rx="1" fill="currentColor" opacity="0.4" />
                        <rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor" opacity="0.4" />
                    </svg>
                </button>
            </div>

            {/* New project */}
            <div className="px-3 py-2">
                <button
                    onClick={() => createProject()}
                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors px-1 py-1 w-full"
                >
                    <Plus className="w-3.5 h-3.5" />
                    New project
                </button>
            </div>

            {/* Scroll */}
            <div className="flex-1 overflow-y-auto px-2 pb-4">
                {loading ? (
                    <div className="space-y-1">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-6 rounded shimmer mx-1" />
                        ))}
                    </div>
                ) : (
                    <>
                        {/* Folders section */}
                        {folders.length > 0 && (
                            <div className="mb-1">
                                <div className="flex items-center justify-between px-1 py-1 mb-0.5">
                                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Folders</span>
                                    <button onClick={createFolder} className="text-gray-400 hover:text-gray-600">
                                        <Plus className="w-3 h-3" />
                                    </button>
                                </div>
                                {folders.map((folder) => {
                                    const isOpen = expandedFolders.has(folder.id);
                                    return (
                                        <div key={folder.id}>
                                            <button
                                                onClick={() => setExpandedFolders((prev) => {
                                                    const next = new Set(Array.from(prev));
                                                    isOpen ? next.delete(folder.id) : next.add(folder.id);
                                                    return next;
                                                })}
                                                className="flex items-center gap-1.5 w-full px-2 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                                            >
                                                {isOpen ? <ChevronDown className="w-3 h-3 text-gray-400" /> : <ChevronRight className="w-3 h-3 text-gray-400" />}
                                                {isOpen ? <FolderOpen className="w-3.5 h-3.5 text-gray-400" /> : <Folder className="w-3.5 h-3.5 text-gray-400" />}
                                                <span className="flex-1 truncate text-left">{folder.name}</span>
                                            </button>
                                            {isOpen && folderProjects(folder.id).map((p) => (
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
                                                    indent
                                                />
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Projects section */}
                        <div>
                            <div className="flex items-center justify-between px-1 py-1 mb-0.5">
                                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Projects</span>
                                <button onClick={() => createFolder()} className="text-gray-400 hover:text-gray-600">
                                    <Plus className="w-3 h-3" />
                                </button>
                            </div>
                            {rootProjects.map((p) => (
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
                            {rootProjects.length === 0 && (
                                <p className="text-xs text-gray-400 px-2 py-2">No projects yet</p>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Bottom nav */}
            <div className="border-t border-gray-100 p-2 space-y-0.5">
                <Link
                    href="/actors"
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${pathname === '/actors' ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}
                >
                    <Users className="w-3.5 h-3.5" />
                    Actors
                </Link>
                <Link
                    href="/preprompts"
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors ${pathname === '/preprompts' ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}
                >
                    <FileText className="w-3.5 h-3.5" />
                    Pre-prompts
                </Link>
            </div>
        </div>
    );
}

function ProjectRow({
    project, active, editingId, editName, setEditingId, setEditName, renameProject, deleteProject, indent,
}: {
    project: Project; active: boolean; editingId: string | null; editName: string;
    setEditingId: (id: string | null) => void; setEditName: (n: string) => void;
    renameProject: (id: string, name: string) => void; deleteProject: (id: string) => void; indent?: boolean;
}) {
    const [hover, setHover] = useState(false);

    return (
        <div
            className={`group relative flex items-center px-2 py-1.5 rounded-lg cursor-pointer text-sm transition-colors ${active ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'} ${indent ? 'ml-5' : ''}`}
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
