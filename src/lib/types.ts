// All TypeScript types for Arcade AI

export type AspectRatio = '9:16' | '1:1' | '16:9';
export type GenerationType = 'image' | 'video';
export type GenerationStatus = 'pending' | 'generating' | 'done' | 'error';
export type PrepromptType = 'image' | 'video' | 'both';

export interface Folder {
    id: string;
    name: string;
    created_at: string;
}

export interface Project {
    id: string;
    folder_id: string | null;
    name: string;
    created_at: string;
    updated_at: string;
    folder?: Folder;
}

export interface Actor {
    id: string;
    name: string;
    description: string;
    image_url: string;
    created_at: string;
}

export interface Preprompt {
    id: string;
    name: string;
    content: string;
    type: PrepromptType;
    created_at: string;
}

export interface Generation {
    id: string;
    project_id: string;
    type: GenerationType;
    prompt: string;
    preprompt_id: string | null;
    actor_id: string | null;
    model: string;
    aspect_ratio: AspectRatio;
    duration_seconds: number | null;
    resolution: string | null;
    status: GenerationStatus;
    output_url: string | null;
    error_message: string | null;
    metadata: Record<string, unknown>;
    created_at: string;
    updated_at: string;
    // Joined
    preprompt?: Preprompt;
    actor?: Actor;
}

// ---- Model definitions ----

export interface ModelInfo {
    id: string;                // API model ID
    name: string;              // Display name
    description: string;       // Short description
    pricePerImage?: number;    // USD per image (for image models)
    pricePerSecond?: number;   // USD per second (for video models)
    speed: 'fast' | 'standard' | 'slow'; // Relative speed
    quality: 'draft' | 'standard' | 'ultra'; // Quality tier
    maxAspectRatios: AspectRatio[];
    type: GenerationType;
    available: boolean;        // Whether it's callable via our API key
    badge?: string;            // Optional badge text e.g. "NEW", "BEST"
}

export const IMAGE_MODELS: ModelInfo[] = [
    {
        id: 'imagen-4.0-flash-preview-05-20',
        name: 'Nano Banana',
        description: 'Fast generation, great for iterations — Gemini 2.5 Flash Image',
        pricePerImage: 0.02,
        speed: 'fast',
        quality: 'draft',
        maxAspectRatios: ['9:16', '1:1', '16:9'],
        type: 'image',
        available: true,
    },
    {
        id: 'imagen-4.0-preview-05-20',
        name: 'Nano Banana Pro',
        description: 'High quality, speed/quality balance — Gemini 3 Pro Image',
        pricePerImage: 0.04,
        speed: 'standard',
        quality: 'standard',
        maxAspectRatios: ['9:16', '1:1', '16:9'],
        type: 'image',
        available: true,
        badge: 'RECOMMENDED',
    },
    {
        id: 'imagen-4.0-ultra-preview-05-20',
        name: 'Nano Banana Ultra',
        description: 'Maximum quality, 2K resolution, precise prompts',
        pricePerImage: 0.06,
        speed: 'slow',
        quality: 'ultra',
        maxAspectRatios: ['9:16', '1:1', '16:9'],
        type: 'image',
        available: true,
        badge: 'ULTRA',
    },
    {
        id: 'gemini-2.0-flash-preview-image-generation',
        name: 'Gemini Flash',
        description: 'Multimodal Gemini model, creative & versatile',
        pricePerImage: 0.039,
        speed: 'fast',
        quality: 'standard',
        maxAspectRatios: ['1:1'],
        type: 'image',
        available: true,
        badge: 'FREE TIER',
    },
];

export const VIDEO_MODELS: ModelInfo[] = [
    {
        id: 'veo-2.0-generate-001',
        name: 'Veo 2',
        description: 'Cinematic 1080p HD videos, smooth movements',
        pricePerSecond: 0.35,
        speed: 'slow',
        quality: 'ultra',
        maxAspectRatios: ['9:16', '1:1', '16:9'],
        type: 'video',
        available: true,
        badge: 'RECOMMENDED',
    },
    {
        id: 'veo-3.0-generate-preview',
        name: 'Veo 3',
        description: 'Next generation, native audio, ultra realistic',
        pricePerSecond: 0.50,
        speed: 'standard',
        quality: 'ultra',
        maxAspectRatios: ['9:16', '1:1', '16:9'],
        type: 'video',
        available: false,
        badge: 'COMING SOON',
    },
];

export const ALL_MODELS = [...IMAGE_MODELS, ...VIDEO_MODELS];

// API Request/Response types

export interface GenerateImageRequest {
    project_id: string;
    prompt: string;
    model: string;
    aspect_ratio: AspectRatio;
    count: number;
    preprompt_id?: string;
    actor_id?: string;
}

export interface GenerateVideoRequest {
    project_id: string;
    prompt: string;
    model: string;
    aspect_ratio: AspectRatio;
    duration_seconds: number;
    resolution: string;
    count: number;
    preprompt_id?: string;
    actor_id?: string;
    reference_image_url?: string;
}
