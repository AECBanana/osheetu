import { NextResponse } from 'next/server';

/**
 * 环境变量检查API端点
 * 用于诊断和排查环境变量配置问题
 */
export async function GET() {
  try {
    // 检查所有必要的环境变量
    const envChecks = {
      // 认证相关环境变量
      nextAuthSecret: process.env.NEXTAUTH_SECRET ? '已设置' : '未设置',
      nextAuthUrl: process.env.NEXTAUTH_URL ? '已设置' : '未设置',
      osuClientId: process.env.OSU_CLIENT_ID ? '已设置' : '未设置',
      osuClientSecret: process.env.OSU_CLIENT_SECRET ? '已设置' : '未设置',
      osuRedirectUri: process.env.OSU_REDIRECT_URI ? '已设置' : '未设置',
      
      // 数据库相关环境变量
      dbHost: process.env.DB_HOST ? '已设置' : '未设置',
      dbPort: process.env.DB_PORT ? '已设置' : '未设置',
      dbUser: process.env.DB_USER ? '已设置' : '未设置',
      dbPassword: process.env.DB_PASSWORD ? '已设置' : '未设置',
      dbName: process.env.DB_NAME ? '已设置' : '未设置',
    };

    // 检查OSU登录功能所需的环境变量
    const osuLoginCheck = {
      isConfigured: !!process.env.OSU_CLIENT_ID && 
                   !!process.env.OSU_CLIENT_SECRET && 
                   !!process.env.OSU_REDIRECT_URI,
      issues: [] as string[],
    };

    // 收集OSU登录功能的问题
    if (!process.env.OSU_CLIENT_ID) {
      osuLoginCheck.issues.push('OSU_CLIENT_ID未设置，这是登录功能必须的');
    } else if (process.env.OSU_CLIENT_ID === 'your_client_id_here') {
      osuLoginCheck.issues.push('OSU_CLIENT_ID仍为默认值，需要设置为实际的客户端ID');
    }

    if (!process.env.OSU_CLIENT_SECRET) {
      osuLoginCheck.issues.push('OSU_CLIENT_SECRET未设置，这是服务端认证必须的');
    }

    if (!process.env.OSU_REDIRECT_URI) {
      osuLoginCheck.issues.push('OSU_REDIRECT_URI未设置，将使用默认值: http://localhost:3000/api/auth/callback');
    }

    // 检查NEXTAUTH配置
    const nextAuthCheck = {
      isConfigured: !!process.env.NEXTAUTH_SECRET && !!process.env.NEXTAUTH_URL,
      issues: [] as string[],
    };

    if (!process.env.NEXTAUTH_SECRET) {
      nextAuthCheck.issues.push('NEXTAUTH_SECRET未设置，这是会话加密必须的');
    }

    if (!process.env.NEXTAUTH_URL) {
      nextAuthCheck.issues.push('NEXTAUTH_URL未设置，这是OAuth回调必须的');
    }

    // 提供配置建议
    const recommendations = [
      '确保在.env.local文件中设置了所有必要的环境变量',
      '对于OSU登录功能，主要需要设置OSU_CLIENT_ID',
      '如果使用Vercel部署，请确保在项目设置中正确配置了所有环境变量',
      '环境变量名称区分大小写，请确保拼写完全正确',
    ];

    // 汇总检查结果
    const result = {
      timestamp: new Date().toISOString(),
      environmentVariables: envChecks,
      featureChecks: {
        osuLogin: osuLoginCheck,
        nextAuth: nextAuthCheck,
      },
      recommendations,
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('环境变量检查失败:', error);
    return NextResponse.json(
      { error: '环境变量检查失败', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}