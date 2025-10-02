import { useState, useEffect } from 'react';
import { getCurrentUser, type User } from './auth';

/**
 * 自定义Hook：用于管理用户会话状态
 * 在客户端组件中使用
 */
export const useUserSession = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUserSession = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const currentUser = await getCurrentUser();
        setUser(currentUser as User | null);
      } catch (err) {
        setError('无法加载用户会话');
        console.error('加载用户会话时出错:', err);
      } finally {
        setLoading(false);
      }
    };

    // 初始加载
    loadUserSession();

    // 可以在这里设置定时器定期刷新用户会话
    const interval = setInterval(loadUserSession, 60000); // 每分钟刷新一次

    return () => clearInterval(interval);
  }, []);

  // 手动刷新会话
  const refreshSession = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const currentUser = await getCurrentUser();
      setUser(currentUser as User | null);
      return true;
    } catch (err) {
      setError('刷新会话失败');
      console.error('刷新会话时出错:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    refreshSession,
  };
};

/**
 * 自定义Hook：用于检查用户是否已登录
 */
export const useIsLoggedIn = () => {
  const { user, loading } = useUserSession();
  return { isLoggedIn: !!user, loading };
};

/**
 * 自定义Hook：用于检查用户是否为管理员
 */
export const useIsAdmin = () => {
  const { user, loading } = useUserSession();
  return { isAdmin: !!user?.is_admin, loading };
};