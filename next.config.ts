import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
