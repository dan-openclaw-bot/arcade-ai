'use client';

import { Generation } from '@/lib/types';
import GenerationCard from './GenerationCard';

interface GenerationsGridProps {
    generations: Generation[];
    onCardClick: (gen: Generation) => void;
    onDeleted: (id: string) => void;
}

export default function GenerationsGrid({ generations, onCardClick, onDeleted }: GenerationsGridProps) {
    if (generations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="text-6xl mb-4">✨</div>
                <p className="text-white font-semibold text-lg mb-2">Prêt à créer</p>
                <p className="text-gray-500 text-sm max-w-xs">
                    Écrivez un prompt dans la barre ci-dessous et choisissez de générer une image ou une vidéo.
                </p>
            </div>
        );
    }

    return (
        <div
            className="grid gap-3 p-6"
            style={{
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                alignItems: 'start',
            }}
        >
            {generations.map((gen) => (
                <GenerationCard
                    key={gen.id}
                    generation={gen}
                    onClick={() => onCardClick(gen)}
                    onDeleted={onDeleted}
                />
            ))}
        </div>
    );
}
