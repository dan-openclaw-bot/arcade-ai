'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Project } from '@/lib/types';
import { Sparkles } from 'lucide-react';

export default function DashboardPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function init() {
            try {
                const res = await fetch('/api/projects');
                if (!res.ok) throw new Error('Failed to fetch projects');
                const projects: Project[] = await res.json();

                if (projects && projects.length > 0) {
                    router.replace(`/projects/${projects[0].id}`);
                } else {
                    // Create default project
                    const createRes = await fetch('/api/projects', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: 'Mon Premier Projet' }),
                    });
                    const project: Project = await createRes.json();
                    router.replace(`/projects/${project.id}`);
                }
            } catch (e) {
                console.error('Error init dashboard:', e);
                setLoading(false);
            }
        }
        init();
    }, [router]);

    return (
        <div className="flex h-screen bg-[#fafafa] items-center justify-center flex-col gap-6">
            {loading && (
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center animate-pulse shadow-xl shadow-violet-200">
                        <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-gray-500 font-semibold tracking-wide">Ouverture du studio...</p>
                </div>
            )}
        </div>
    );
}
