import { NextResponse } from 'next/server';

/**
 * 处理从OSU认证成功后的回调
 * @param request 包含从OSU返回的授权码
 * @returns 重定向到首页，并将授权码作为查询参数
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  // 如果认证过程中出现错误，重定向到首页并附带错误信息
  if (error) {
    console.error('OSU认证错误:', error);
    return NextResponse.redirect(new URL(`/?error=${error}`, request.url));
  }

  // 如果没有获取到授权码，同样重定向并提示错误
  if (!code) {
    console.error('OSU认证失败：没有获取到授权码');
    return NextResponse.redirect(new URL('/?error=no_code', request.url));
  }

  // 成功获取授权码，重定向到首页，并将授权码附加到URL参数中
  // 客户端将处理后续的登录流程
  const redirectUrl = new URL('/', request.url);
  redirectUrl.searchParams.append('code', code);
  
  return NextResponse.redirect(redirectUrl);
}