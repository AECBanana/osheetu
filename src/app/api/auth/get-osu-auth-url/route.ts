import { NextResponse } from 'next/server';

/**
 * 生成OSU认证URL的API端点
 * 这个端点在服务器端安全地读取环境变量并生成认证URL，避免客户端直接访问敏感配置
 */
export async function GET() {
  try {
    // 在服务器端安全地获取环境变量
    const clientId = process.env.OSU_CLIENT_ID;
    const redirectUri = process.env.OSU_REDIRECT_URI || 'http://localhost:3000/api/auth/callback';
    const scope = 'identify';

    // 检查客户端ID是否有效
    if (!clientId || clientId === 'your_client_id_here') {
      return NextResponse.json(
        { error: 'OSU客户端ID未正确配置，请在服务器端设置实际的客户端ID' },
        { status: 500 }
      );
    }

    // 构建有效的认证URL
    const authUrl = new URL('https://osu.ppy.sh/oauth/authorize');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', scope);

    // 返回认证URL给客户端
    return NextResponse.json({
      authUrl: authUrl.toString(),
      success: true
    });
  } catch (error) {
    console.error('生成OSU认证URL失败:', error);
    return NextResponse.json(
      { 
        error: '生成OSU认证URL失败',
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}