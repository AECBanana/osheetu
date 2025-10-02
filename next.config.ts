import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 在构建时验证必要的环境变量
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    if (!dev && isServer) {
      // 服务器端必需的环境变量
      const requiredServerVars = [
        'OSU_CLIENT_ID',
        'OSU_CLIENT_SECRET',
        'DB_HOST',
        'DB_PASSWORD',
        'NEXTAUTH_SECRET',
        'NEXTAUTH_URL'
      ];
      
      requiredServerVars.forEach(varName => {
        if (!process.env[varName]) {
          throw new Error(`环境变量 ${varName} 未设置，请在Vercel控制台中添加`);
        }
      });
    }
    
    if (!dev && !isServer) {
      // 客户端必需的环境变量
      const requiredClientVars = [
        'NEXT_PUBLIC_OSU_CLIENT_ID'
      ];
      
      requiredClientVars.forEach(varName => {
        if (!process.env[varName]) {
          throw new Error(`客户端环境变量 ${varName} 未设置，请在Vercel控制台中添加`);
        }
      });
    }
    
    return config;
  },
};

export default nextConfig;
