'use client';

import { ModelInfo } from '@/lib/types';
import { Zap, Star, Diamond } from 'lucide-react';

interface ModelPickerProps {
    models: ModelInfo[];
    selected: string;
    onSelect: (id: string) => void;
}

const speedIcon = {
    fast: <Zap className="w-3 h-3 text-yellow-400" />,
    standard: <Star className="w-3 h-3 text-blue-400" />,
    slow: <Diamond className="w-3 h-3 text-violet-400" />,
};

const qualityLabel = {
    draft: 'Rapide',
    standard: 'Standard',
    ultra: 'Ultra',
};

export default function ModelPicker({ models, selected, onSelect }: ModelPickerProps) {
    return (
        <div className="space-y-2">
            {models.map((model) => {
                const isSelected = model.id === selected;
                const isUnavailable = !model.available;

                return (
                    <div
                        key={model.id}
                        onClick={() => !isUnavailable && onSelect(model.id)}
                        className={`relative flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isSelected
                                ? 'border-violet-500 bg-violet-600/10'
                                : isUnavailable
                                    ? 'border-white/5 bg-white/2 opacity-50 cursor-not-allowed'
                                    : 'border-white/8 bg-white/3 hover:border-white/20 hover:bg-white/5'
                            }`}
                    >
                        {/* Radio */}
                        <div className={`w-4 h-4 rounded-full border shrink-0 mt-0.5 flex items-center justify-center ${isSelected ? 'border-violet-500' : 'border-white/20'}`}>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-violet-500" />}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-sm font-semibold text-white">{model.name}</span>
                                {model.badge && (
                                    <span
                                        className={`text-xs px-1.5 py-0.5 rounded font-medium ${model.badge === 'RECOMMANDÉ'
                                                ? 'bg-emerald-500/20 text-emerald-400'
                                                : model.badge === 'ULTRA'
                                                    ? 'bg-violet-500/20 text-violet-300'
                                                    : model.badge === 'GRATUIT'
                                                        ? 'bg-yellow-500/20 text-yellow-400'
                                                        : model.badge === 'BIENTÔT'
                                                            ? 'bg-gray-500/20 text-gray-400'
                                                            : 'bg-white/10 text-gray-300'
                                            }`}
                                    >
                                        {model.badge}
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 mb-2">{model.description}</p>
                            <div className="flex items-center gap-3 text-xs">
                                <div className="flex items-center gap-1">
                                    {speedIcon[model.speed]}
                                    <span className="text-gray-400">{qualityLabel[model.quality]}</span>
                                </div>
                                {model.pricePerImage !== undefined && (
                                    <div className="flex items-center gap-1">
                                        <span className="text-emerald-400 font-semibold">${model.pricePerImage.toFixed(3)}</span>
                                        <span className="text-gray-500">/ image</span>
                                    </div>
                                )}
                                {model.pricePerSecond !== undefined && (
                                    <div className="flex items-center gap-1">
                                        <span className="text-emerald-400 font-semibold">${model.pricePerSecond.toFixed(2)}</span>
                                        <span className="text-gray-500">/ seconde</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
