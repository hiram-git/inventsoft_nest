import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@inventsoft/shared'],

  experimental: {
    turbo: {},
    typedRoutes: true,
  },

  typescript: {
    ignoreBuildErrors: false,
  },

  eslint: {
    ignoreDuringBuilds: false,
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
    ],
  },
};

export default nextConfig;
