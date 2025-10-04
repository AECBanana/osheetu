import NextAuth, { NextAuthOptions, Session } from 'next-auth';
import { type JWT } from 'next-auth/jwt';
import { type User } from '../../../../utils/auth';
import CredentialsProvider, { CredentialsConfig } from 'next-auth/providers/credentials';
import axios from 'axios';
import { saveOrUpdateUser, fetchOsuUserInfo } from '../../../../utils/auth-server';

// 创建自定义OSU提供者
const OsuProvider = CredentialsProvider({
  id: 'osu',
  name: 'osu!',
  credentials: {
    code: {
      label: '授权码',
      type: 'text',
    },
  },
  async authorize(credentials) {
    try {
      if (!credentials?.code) {
        throw new Error('授权码缺失');
      }

      // 使用授权码获取访问令牌
      const tokenResponse = await axios.post(
        'https://osu.ppy.sh/oauth/token',
        new URLSearchParams({
          client_id: process.env.OSU_CLIENT_ID || '',
          client_secret: process.env.OSU_CLIENT_SECRET || '',
          code: credentials.code,
          grant_type: 'authorization_code',
          redirect_uri: process.env.OSU_REDIRECT_URI || 'http://localhost:3000/api/auth/callback',
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const { access_token, refresh_token, expires_in } = tokenResponse.data;

      // 使用访问令牌获取用户信息
      const osuUser = await fetchOsuUserInfo(access_token);
      if (!osuUser) {
        throw new Error('无法获取用户信息');
      }

      // 保存或更新用户到数据库
      const user = await saveOrUpdateUser(
        osuUser,
        { access_token, refresh_token, expires_in }
      );

      // 返回用户对象
      return {
        id: String(user.id),
        osu_id: user.osu_id,
        username: user.username,
        avatar_url: user.avatar_url,
        is_admin: user.is_admin,
        groups: user.groups,
        access_token,
        refresh_token,
      };
    } catch (error) {
      console.error('OSU认证失败:', error);
      return null;
    }
  },
});

// 扩展NextAuth的类型
declare module 'next-auth' {
  interface User {
    id: string;
    osu_id: string;
    username: string;
    avatar_url: string;
    is_admin: boolean;
    groups?: string[];
    access_token?: string;
    refresh_token?: string;
  }

  interface Session {
    user: User;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    username: string;
    osu_id: string;
    avatar_url: string;
    is_admin: boolean;
    groups?: string[];
    access_token?: string;
    refresh_token?: string;
  }
}

// 检测当前环境是否为生产环境
const isProduction = process.env.NODE_ENV === 'production';

// 为Vercel环境提供智能配置
export const authOptions: NextAuthOptions = {
  providers: [OsuProvider],
  // 在Vercel环境中，NEXTAUTH_SECRET是必需的
  // 在开发环境中，如果没有设置，NextAuth会自动生成一个临时密钥
  secret: isProduction ? process.env.NEXTAUTH_SECRET : process.env.NEXTAUTH_SECRET || undefined,
  session: {
    strategy: 'jwt' as const,
  },
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: any }) {
      // 检查认证所需的环境变量是否配置
      if (isProduction && !process.env.NEXTAUTH_SECRET) {
        console.error('⚠️ 警告: 在生产环境中未设置NEXTAUTH_SECRET!');
        console.error('请在Vercel项目设置中添加NEXTAUTH_SECRET环境变量');
      }
      
      if (user) {
        token.id = user.id;
        token.osu_id = user.osu_id;
        token.username = user.username;
        token.avatar_url = user.avatar_url;
        token.is_admin = user.is_admin;
        token.groups = user.groups;
        token.access_token = user.access_token;
        token.refresh_token = user.refresh_token;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token) {
        session.user = {
          id: token.id as string,
          osu_id: token.osu_id,
          username: token.username as string,
          avatar_url: token.avatar_url,
          is_admin: token.is_admin,
          groups: token.groups,
        };
      }
      return session;
    },
  },
};

// 创建并导出NextAuth处理器
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };