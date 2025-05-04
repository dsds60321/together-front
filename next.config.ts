// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: [
            'blogthumb.pstatic.net',
            'pstatic.net',
            'ssl.pstatic.net',
            'blog.pstatic.net',
            'via.placeholder.com',
            'picsum.photos'
        ],
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
            {
                protocol: 'http',
                hostname: '**',
            },
        ],
    },
    trailingSlash: true,
    webpack: (config: never) => {
        return config;
    },
    eslint: {
        ignoreDuringBuilds: true,
    }
};

export default nextConfig;