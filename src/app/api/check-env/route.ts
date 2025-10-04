import { NextResponse } from 'next/server';

/**
 * 环境变量检查API端点
 * 用于诊断和排查环境变量配置问题
 */
export async function GET() {
  try {
    // 检测当前环境
    const isProduction = process.env.NODE_ENV === 'production';
    const isVercel = !!process.env.VERCEL;
    
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
      
      // 环境信息
      environment: isProduction ? 'production' : 'development',
      isVercel: isVercel,
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

    // 检查NEXTAUTH配置 - 针对Vercel环境优化检查逻辑
    const nextAuthCheck = {
      // 在Vercel环境中，NEXTAUTH_URL通常会自动检测，所以只检查SECRET
      isConfigured: isVercel ? !!process.env.NEXTAUTH_SECRET : !!process.env.NEXTAUTH_SECRET && !!process.env.NEXTAUTH_URL,
      issues: [] as string[],
    };

    if (!process.env.NEXTAUTH_SECRET) {
      if (isVercel && isProduction) {
        nextAuthCheck.issues.push('⚠️ 重要: 在Vercel生产环境中必须设置NEXTAUTH_SECRET！');
        nextAuthCheck.issues.push('请在Vercel项目设置 > Environment Variables中添加这个变量');
        nextAuthCheck.issues.push('可以使用命令 openssl rand -base64 32 生成一个安全的密钥');
      } else {
        nextAuthCheck.issues.push('NEXTAUTH_SECRET未设置，这是会话加密必须的');
      }
    }

    // 在非Vercel环境中检查NEXTAUTH_URL
    if (!isVercel && !process.env.NEXTAUTH_URL) {
      nextAuthCheck.issues.push('NEXTAUTH_URL未设置，这是OAuth回调必须的');
    } else if (isVercel && !process.env.NEXTAUTH_URL) {
      // Vercel环境中未设置URL时提供信息而非警告
      nextAuthCheck.issues.push('ℹ️ 在Vercel环境中，NEXTAUTH_URL通常会自动检测');
    }

    // 提供环境特定的配置建议
    const recommendations = [];
    
    if (isVercel) {
      recommendations.push(
        '在Vercel中，环境变量需要在项目设置中配置（不是使用.env.local文件）',
        '访问 https://vercel.com/[your-username]/[your-project]/settings/environment-variables 添加环境变量',
        '确保生产环境(Production)和预览环境(Preview)都配置了相同的环境变量',
        '对于NEXTAUTH_SECRET，建议使用 openssl rand -base64 32 生成安全的密钥',
        '在Vercel环境中，NEXTAUTH_URL通常会自动检测，可以不手动设置'
      );
    } else {
      recommendations.push(
        '确保在.env.local文件中设置了所有必要的环境变量',
        '环境变量名称区分大小写，请确保拼写完全正确',
        'NEXTAUTH_SECRET和NEXTAUTH_URL都是认证功能必须的',
        '对于OSU登录功能，需要设置OSU_CLIENT_ID和OSU_CLIENT_SECRET'
      );
    }
    
    // 通用建议
    recommendations.push(
      'OSU_REDIRECT_URI必须与OSU开发者应用中配置的回调URL完全匹配',
      '如果使用数据库，确保所有数据库相关的环境变量都已正确设置'
    );

    // 汇总检查结果
    const result = {
      timestamp: new Date().toISOString(),
      environment: {
        isProduction,
        isVercel,
      },
      environmentVariables: envChecks,
      featureChecks: {
        osuLogin: osuLoginCheck,
        nextAuth: nextAuthCheck,
      },
      recommendations,
      // 提供Vercel环境的快速设置指南
      quickSetupGuide: isVercel ? {
        step1: '登录Vercel控制台并打开项目设置',
        step2: '导航到Environment Variables部分',
        step3: '添加所有必要的环境变量（NEXTAUTH_SECRET, OSU_CLIENT_ID等）',
        step4: '确保选择正确的环境（Production, Preview等）',
        step5: '点击Save按钮保存设置',
        step6: '重新部署项目以应用新的环境变量'
      } : null,
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