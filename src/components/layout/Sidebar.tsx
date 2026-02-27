'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
    Plus,
    Folder,
    ChevronDown,
    ChevronRight,
    Users,
    FileText,
    Sparkles,
    MoreHorizontal,
    Trash2,
    Edit2,
} from 'lucide-react';
import { Project, Folder as FolderType } from '@/lib/types';

export default function Sidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const [projects, setProjects] = useState<Project[]>([]);
    const [folders, setFolders] = useState<FolderType[]>([]);
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']));
    const [loading, setLoading] = useState(true);
    const [creatingProject, setCreatingProject] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [contextMenu, setContextMenu] = useState<{ id: string; x: number; y: number } | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        const [pRes, fRes] = await Promise.all([
            fetch('/api/projects'),
            fetch('/api/folders'),
        ]);
        setProjects(await pRes.json());
        setFolders(await fRes.json());
        setLoading(false);
    }

    async function createProject(folderId?: string) {
        setCreatingProject(true);
        const res = await fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Nouveau Projet', folder_id: folderId || null }),
        });
        const project = await res.json();
        setProjects((prev) => [project, ...prev]);
        setCreatingProject(false);
        router.push(`/projects/${project.id}`);
        // Open rename immediately
        setEditingId(project.id);
        setEditName('Nouveau Projet');
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
        await fetch(`/api/projects/${id}`, { method: 'DELETE' });
        setProjects((prev) => prev.filter((p) => p.id !== id));
        if (pathname === `/projects/${id}`) {
            const remaining = projects.filter((p) => p.id !== id);
            if (remaining.length > 0) {
                router.push(`/projects/${remaining[0].id}`);
            } else {
                router.push('/');
            }
        }
        setContextMenu(null);
    }

    async function createFolder() {
        const name = prompt('Nom du dossier :');
        if (!name?.trim()) return;
        const res = await fetch('/api/folders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name }),
        });
        const folder = await res.json();
        setFolders((prev) => [...prev, folder]);
        setExpandedFolders((prev) => new Set([...prev, folder.id]));
    }

    const rootProjects = projects.filter((p) => !p.folder_id);
    const folderProjects = (folderId: string) => projects.filter((p) => p.folder_id === folderId);

    return (
        <div
            className="flex flex-col h-full bg-[#0e0e0e] text-white select-none"
            style={{ width: 240, minWidth: 240, borderRight: '1px solid rgba(255,255,255,0.06)' }}
            onClick={() => setContextMenu(null)}
        >
            {/* Logo */}
            <div className="px-4 py-4 flex items-center gap-2">
                <div className="gradient-border">
                    <div className="bg-[#0e0e0e] rounded-[11px] p-1.5">
                        <Sparkles className="w-4 h-4 text-violet-400" />
                    </div>
                </div>
                <span className="font-bold text-white text-sm tracking-wide">Arcade AI</span>
            </div>

            {/* New project */}
            <div className="px-3 mb-2">
                <button
                    onClick={() => createProject()}
                    disabled={creatingProject}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Nouveau projet
                </button>
            </div>

            {/* Scroll area */}
            <div className="flex-1 overflow-y-auto px-2 pb-4">
                {loading ? (
                    <div className="space-y-1 mt-2">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-7 rounded-md shimmer" />
                        ))}
                    </div>
                ) : (
                    <>
                        {/* Folders */}
                        {folders.map((folder) => (
                            <div key={folder.id}>
                                <button
                                    className="sidebar-item w-full"
                                    onClick={() =>
                                        setExpandedFolders((prev) => {
                                            const next = new Set(prev);
                                            next.has(folder.id) ? next.delete(folder.id) : next.add(folder.id);
                                            return next;
                                        })
                                    }
                                >
                                    {expandedFolders.has(folder.id) ? (
                                        <ChevronDown className="w-3 h-3 shrink-0" />
                                    ) : (
                                        <ChevronRight className="w-3 h-3 shrink-0" />
                                    )}
                                    <Folder className="w-3.5 h-3.5 shrink-0 text-gray-500" />
                                    <span className="flex-1 truncate text-left">{folder.name}</span>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); createProject(folder.id); }}
                                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-white"
                                    >
                                        <Plus className="w-3 h-3" />
                                    </button>
                                </button>

                                {expandedFolders.has(folder.id) &&
                                    folderProjects(folder.id).map((project) => (
                                        <ProjectItem
                                            key={project.id}
                                            project={project}
                                            isActive={pathname === `/projects/${project.id}`}
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
                        ))}

                        {/* Root projects */}
                        {rootProjects.map((project) => (
                            <ProjectItem
                                key={project.id}
                                project={project}
                                isActive={pathname === `/projects/${project.id}`}
                                editingId={editingId}
                                editName={editName}
                                setEditingId={setEditingId}
                                setEditName={setEditName}
                                renameProject={renameProject}
                                deleteProject={deleteProject}
                            />
                        ))}

                        {projects.length === 0 && (
                            <p className="text-xs text-gray-600 text-center mt-4">Aucun projet</p>
                        )}
                    </>
                )}
            </div>

            {/* Bottom nav */}
            <div className="border-t border-white/5 p-2 space-y-0.5">
                <button onClick={createFolder} className="sidebar-item w-full">
                    <Folder className="w-4 h-4" />
                    Nouveau dossier
                </button>
                <Link href="/actors" className={`sidebar-item ${pathname === '/actors' ? 'active' : ''}`}>
                    <Users className="w-4 h-4" />
                    Acteurs
                </Link>
                <Link href="/preprompts" className={`sidebar-item ${pathname === '/preprompts' ? 'active' : ''}`}>
                    <FileText className="w-4 h-4" />
                    Pré-prompts
                </Link>
            </div>
        </div>
    );
}

interface ProjectItemProps {
    project: Project;
    isActive: boolean;
    editingId: string | null;
    editName: string;
    setEditingId: (id: string | null) => void;
    setEditName: (name: string) => void;
    renameProject: (id: string, name: string) => void;
    deleteProject: (id: string) => void;
    indent?: boolean;
}

function ProjectItem({
    project,
    isActive,
    editingId,
    editName,
    setEditingId,
    setEditName,
    renameProject,
    deleteProject,
    indent,
}: ProjectItemProps) {
    const [showActions, setShowActions] = useState(false);

    return (
        <div
            className={`group relative flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer text-sm transition-colors ${isActive ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                } ${indent ? 'ml-4' : ''}`}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
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
                        className="w-full bg-transparent border-none outline-none text-white text-sm"
                    />
                ) : (
                    <span className="truncate block">{project.name}</span>
                )}
            </Link>

            {showActions && editingId !== project.id && (
                <div className="flex items-center gap-0.5 shrink-0">
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            setEditingId(project.id);
                            setEditName(project.name);
                        }}
                        className="p-1 rounded hover:bg-white/10"
                    >
                        <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            if (confirm('Supprimer ce projet ?')) deleteProject(project.id);
                        }}
                        className="p-1 rounded hover:bg-red-500/20 hover:text-red-400"
                    >
                        <Trash2 className="w-3 h-3" />
                    </button>
                </div>
            )}
        </div>
    );
}
