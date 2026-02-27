'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Project } from '@/lib/types';

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      // Fetch projects, redirect to first or create one
      const res = await fetch('/api/projects');
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
    }
    init().catch(() => setLoading(false));
  }, [router]);

  return (
    <div className="flex h-screen bg-[#0e0e0e] items-center justify-center">
      {loading && (
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
          <p className="text-gray-400 text-sm">Chargement du studio...</p>
        </div>
      )}
    </div>
  );
}
