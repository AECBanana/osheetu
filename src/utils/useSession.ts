import { useState, useEffect } from 'react';
import { getSession, type User } from './auth';

interface Session {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

// 自定义会话钩子，用于客户端组件
export const useSession = (): Session => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 刷新会话信息
  const refresh = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const session = await getSession();
      if (session?.user) {
        // 确保返回的是符合客户端User接口的对象
        const { id, osu_id, username, avatar_url, is_admin, groups } = session.user;
        setUser({
          id: id as string,
          osu_id: osu_id as string,
          username: username as string,
          avatar_url: avatar_url as string,
          is_admin: is_admin as boolean,
          groups: groups as string[] | undefined
        });
      } else {
        setUser(null);
      }
    } catch (err) {
      setError('获取会话信息失败');
      console.error('会话刷新失败:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 初始加载和监听会话变化
  useEffect(() => {
    refresh();

    // 定期刷新会话（每5分钟）
    const intervalId = setInterval(() => {
      refresh();
    }, 5 * 60 * 1000);

    // 清理定时器
    return () => clearInterval(intervalId);
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    refresh,
  };
};