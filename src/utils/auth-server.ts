import { getServerSession } from 'next-auth';
import { query } from './db';
import axios from 'axios';
import type { ServerUser } from './auth';

// 获取服务器端会话
export const getServerSessionData = async () => {
  return getServerSession();
};

// 从数据库获取用户信息
export const getUserFromDatabase = async (osuId: string): Promise<ServerUser | null> => {
  try {
    const results = await query('SELECT * FROM users WHERE osu_id = ?', [osuId]);
    const users = results as ServerUser[];
    return users.length > 0 ? users[0] : null;
  } catch (error) {
    console.error('从数据库获取用户信息失败:', error);
    return null;
  }
};

// 从OSU API获取用户信息
export const fetchOsuUserInfo = async (accessToken: string): Promise<{ id: string; username: string; avatar_url: string } | null> => {
  try {
    const response = await axios.get('https://osu.ppy.sh/api/v2/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    return {
      id: response.data.id.toString(),
      username: response.data.username,
      avatar_url: response.data.avatar_url,
    };
  } catch (error) {
    console.error('从OSU API获取用户信息失败:', error);
    return null;
  }
};

// 保存或更新用户到数据库
export const saveOrUpdateUser = async (
  osuUser: { id: string; username: string; avatar_url: string },
  tokens: { access_token: string; refresh_token: string; expires_in: number }
): Promise<ServerUser> => {
  try {
    const existingUser = await getUserFromDatabase(osuUser.id);
    const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);
    
    if (existingUser) {
      // 更新现有用户
      await query(
        'UPDATE users SET username = ?, avatar_url = ?, access_token = ?, refresh_token = ?, token_expires_at = ?, updated_at = CURRENT_TIMESTAMP WHERE osu_id = ?',
        [
          osuUser.username,
          osuUser.avatar_url,
          tokens.access_token,
          tokens.refresh_token,
          tokenExpiresAt,
          osuUser.id,
        ]
      );
      
      // 获取用户组
      const groupsResult = await query('SELECT group_name FROM user_groups WHERE user_id = ?', [existingUser.id]);
      // 正确处理query返回的结果
      const groups = Array.isArray(groupsResult) ? 
        groupsResult.map((row: any) => row.group_name) : 
        [];
      
      return {
        ...existingUser,
        ...osuUser,
        id: Number(existingUser.id), // 确保id是number类型
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: tokenExpiresAt,
        updated_at: new Date(),
        groups,
      };
    } else {
      // 创建新用户
      await query(
        'INSERT INTO users (osu_id, username, avatar_url, access_token, refresh_token, token_expires_at, is_admin) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          osuUser.id,
          osuUser.username,
          osuUser.avatar_url,
          tokens.access_token,
          tokens.refresh_token,
          tokenExpiresAt,
          false, // 默认不是管理员
        ]
      );
      
      // 获取新创建的用户
      const newUser = await getUserFromDatabase(osuUser.id);
      if (!newUser) {
        throw new Error('创建用户后无法获取用户信息');
      }
      
      return {
        ...newUser,
        groups: [],
      };
    }
  } catch (error) {
    console.error('保存或更新用户失败:', error);
    throw error;
  }
};

// 刷新访问令牌
export const refreshAccessToken = async (refreshToken: string): Promise<{ access_token: string; refresh_token: string; expires_in: number } | null> => {
  try {
    const response = await axios.post(
      'https://osu.ppy.sh/oauth/token',
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: process.env.OSU_CLIENT_ID || '',
        client_secret: process.env.OSU_CLIENT_SECRET || '',
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('刷新令牌失败:', error);
    return null;
  }
};

// 检查用户令牌是否过期
export const isTokenExpired = (expiresAt?: Date): boolean => {
  if (!expiresAt) return true;
  return new Date() >= expiresAt;
};