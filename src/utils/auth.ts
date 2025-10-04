import { getSession as nextAuthGetSession, signIn, signOut } from 'next-auth/react';

// 服务器端完整用户类型
export interface ServerUser {
  id: number;
  osu_id: string;
  username: string;
  avatar_url: string;
  access_token?: string;
  refresh_token?: string;
  token_expires_at?: Date;
  is_admin: boolean;
  groups?: string[];
  created_at: Date;
  updated_at: Date;
}

// 客户端会话用户类型（简化版）
export interface User {
  id: string;
  osu_id: string;
  username: string;
  avatar_url: string;
  is_admin: boolean;
  groups?: string[];
}

// 获取当前用户会话
export const getSession = async () => {
  const session = await nextAuthGetSession();
  return session;
};

// OSU登录
export const loginWithOsu = () => {
  // 获取环境变量并添加默认值检查
  const clientId = process.env.OSU_CLIENT_ID || '';
  const redirectUri = process.env.OSU_REDIRECT_URI || 'http://localhost:3000/api/auth/callback';
  const scope = 'identify';

  // 检查客户端ID是否有效
  if (!clientId || clientId === 'your_client_id_here') {
    console.error('OSU客户端ID未正确配置，请在.env.local文件中设置实际的客户端ID');
    alert('OSU客户端ID未正确配置，请联系管理员');
    return;
  }

  try {
    // 构建有效的认证URL
    const authUrl = new URL('https://osu.ppy.sh/oauth/authorize');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', scope);

    window.location.href = authUrl.toString();
  } catch (error) {
    console.error('构建OSU认证URL失败:', error);
    alert('登录失败，请稍后再试');
  }
};

// 登出
export const logout = async () => {
  await signOut();
};

// 检查用户是否已登录
export const isLoggedIn = async () => {
  const session = await getSession();
  return !!session?.user;
};

// 检查用户是否为管理员
export const isAdmin = async () => {
  const session = await getSession();
  // 将session.user转换为User类型
  const user = session?.user as User | undefined;
  return !!user?.is_admin;
};

// 获取当前用户信息
export const getCurrentUser = async (): Promise<User | null> => {
  const session = await getSession();
  // 确保返回的是符合客户端User接口的对象
  if (session?.user) {
    const { id, osu_id, username, avatar_url, is_admin, groups } = session.user;
    return {
      id: id as string,
      osu_id: osu_id as string,
      username: username as string,
      avatar_url: avatar_url as string,
      is_admin: is_admin as boolean,
      groups: groups as string[] | undefined
    };
  }
  return null;
};