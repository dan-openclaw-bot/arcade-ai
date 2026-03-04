'use client';

import { Generation } from '@/lib/types';
import GenerationCard from './GenerationCard';

interface GenerationsGridProps {
    generations: Generation[];
    onCardClick: (gen: Generation) => void;
    onDeleted: (id: string) => void;
    selectedIds?: Set<string>;
    onToggleSelect?: (id: string) => void;
    onEdit?: (imageUrl: string) => void;
}

export default function GenerationsGrid({ generations, onCardClick, onDeleted, selectedIds, onToggleSelect, onEdit }: GenerationsGridProps) {
    if (generations.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <p className="text-gray-500 text-sm max-w-xs">
                    Describe what you want to create and click generate.
                </p>
            </div>
        );
    }

    return (
        <div
            className="grid gap-2 p-4"
            style={{
                gridTemplateColumns: 'repeat(5, 1fr)',
                alignItems: 'start',
            }}
        >
            {generations.map((gen) => (
                <GenerationCard
                    key={gen.id}
                    generation={gen}
                    onClick={() => onCardClick(gen)}
                    onDeleted={onDeleted}
                    isSelected={selectedIds?.has(gen.id)}
                    onToggleSelect={onToggleSelect}
                    onEdit={onEdit}
                />
            ))}
        </div>
    );
}
