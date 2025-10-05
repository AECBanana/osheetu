import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply COEP/COOP to beatmap-viewer routes for SharedArrayBuffer support
        source: '/beatmap-viewer/:path*',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
      {
        // Apply COEP/COOP to dist routes for iframe content
        source: '/dist/:path*',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.ppy.sh',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'a.ppy.sh',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'preview.tryz.id.vn',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
