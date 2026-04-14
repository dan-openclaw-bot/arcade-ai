/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '*.supabase.co',
                port: '',
                pathname: '/storage/v1/object/**',
            },
        ],
        // Grid cards ~200-400px, expanded ~1200px
        deviceSizes: [640, 828, 1080, 1200, 1920],
        imageSizes: [128, 256, 384, 512],
        // Serve modern formats automatically
        formats: ['image/avif', 'image/webp'],
    },
};

module.exports = nextConfig;
