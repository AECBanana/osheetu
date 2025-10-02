import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    if (error) {
      console.error('OSU认证错误:', error);
      return NextResponse.redirect(new URL(`/?error=${error}`, request.url));
    }

    if (!code) {
      console.error('OSU认证失败：没有获取到授权码');
      return NextResponse.redirect(new URL('/?error=no_code', request.url));
    }

    // 使用NextAuth的凭证认证流程
    // 这里我们将授权码传递给NextAuth的回调
    const nextAuthUrl = new URL('/api/auth/callback/credentials', request.url);
    nextAuthUrl.searchParams.append('code', code);
    
    // 这里需要使用fetch来调用NextAuth的凭证认证流程
    const response = await fetch(nextAuthUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    if (response.ok) {
      // 认证成功，重定向到主页
      return NextResponse.redirect(new URL('/', request.url));
    } else {
      // 认证失败
      console.error('NextAuth认证失败');
      return NextResponse.redirect(new URL('/?error=auth_failed', request.url));
    }
  } catch (error) {
    console.error('回调处理错误:', error);
    return NextResponse.redirect(new URL('/?error=callback_error', request.url));
  }
}