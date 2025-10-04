import { useState, useEffect, useCallback } from 'react';
import { getCurrentUser, type User } from './auth';

export type TournamentMode = 'osu' | 'taiko' | 'mania' | 'catch';
export type TournamentType = 'team' | 'player';
export type TournamentStatus = 'active' | 'completed' | 'upcoming';
export type ParticipantRole = 'player' | 'captain' | 'referee' | 'staff';
export type ParticipantStatus = 'active' | 'pending' | 'banned';

export interface TournamentParticipantInfo {
  role: ParticipantRole;
  status: ParticipantStatus;
  joined_at: string;
}

export interface AuthorizedTournament {
  id: string;
  name: string;
  mode: TournamentMode;
  type: TournamentType;
  stages: string[];
  current_stage: string;
  status: TournamentStatus;
  include_qualifier: boolean;
  allow_custom_mods: boolean;
  participant: TournamentParticipantInfo;
  can_manage_map_pool: boolean;
}

const ensureTournamentMode = (value: unknown): TournamentMode => {
  return value === 'osu' || value === 'taiko' || value === 'mania' || value === 'catch' ? value : 'osu';
};

const ensureTournamentType = (value: unknown): TournamentType => {
  return value === 'team' || value === 'player' ? value : 'team';
};

const ensureTournamentStatus = (value: unknown): TournamentStatus => {
  return value === 'active' || value === 'completed' || value === 'upcoming' ? value : 'active';
};

const ensureParticipantRole = (value: unknown): ParticipantRole => {
  return value === 'captain' || value === 'referee' || value === 'staff' ? value : 'player';
};

const ensureParticipantStatus = (value: unknown): ParticipantStatus => {
  return value === 'pending' || value === 'banned' ? value : 'active';
};

const parseStages = (raw: unknown): string[] => {
  let source: unknown = raw;

  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      source = parsed;
    } catch {
      return [];
    }
  }

  if (!Array.isArray(source)) {
    return [];
  }

  return (source as unknown[])
    .filter((item) => typeof item === 'string' && item.trim().length > 0)
    .map((item) => (item as string).trim());
};

const normalizeTournamentsPayload = (payload: any): AuthorizedTournament[] => {
  const source = Array.isArray(payload?.tournaments)
    ? payload.tournaments
    : Array.isArray(payload)
      ? payload
      : [];

  return source.reduce((acc: AuthorizedTournament[], rawItem: any) => {
    const numericId = Number(rawItem?.id);
    if (!Number.isFinite(numericId) || numericId <= 0) {
      return acc;
    }

    const stages = parseStages(rawItem?.stages);
    const participant = rawItem?.participant ?? {};

    acc.push({
      id: String(numericId),
      name: String(rawItem?.name ?? '未命名比赛'),
      mode: ensureTournamentMode(rawItem?.mode),
      type: ensureTournamentType(rawItem?.type),
      stages,
      current_stage: String(rawItem?.current_stage ?? (stages[0] ?? '')),
      status: ensureTournamentStatus(rawItem?.status),
      include_qualifier: Boolean(rawItem?.include_qualifier),
      allow_custom_mods: Boolean(rawItem?.allow_custom_mods),
      participant: {
        role: ensureParticipantRole(participant?.role),
        status: ensureParticipantStatus(participant?.status),
        joined_at: String(participant?.joined_at ?? new Date().toISOString()),
      },
      can_manage_map_pool: Boolean(rawItem?.can_manage_map_pool),
    });

    return acc;
  }, [] as AuthorizedTournament[]);
};

const fetchAuthorizedTournaments = async (): Promise<AuthorizedTournament[]> => {
  const response = await fetch('/api/tournaments/my', {
    cache: 'no-store',
    credentials: 'include',
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || '获取比赛数据失败');
  }

  return normalizeTournamentsPayload(data);
};

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

export const useAuthorizedTournaments = (user: User | null | undefined) => {
  const [tournaments, setTournaments] = useState<AuthorizedTournament[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = user?.id;

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!userId) {
        setTournaments([]);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await fetchAuthorizedTournaments();
        if (!cancelled) {
          setTournaments(result);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('获取比赛数据失败:', err);
          setError(err instanceof Error ? err.message : '获取比赛数据失败');
          setTournaments([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const refresh = useCallback(async () => {
    if (!userId) {
      setTournaments([]);
      setError(null);
      return false;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await fetchAuthorizedTournaments();
      setTournaments(result);
      return true;
    } catch (err) {
      console.error('刷新比赛数据失败:', err);
      setError(err instanceof Error ? err.message : '刷新比赛数据失败');
      setTournaments([]);
      return false;
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return {
    tournaments,
    loading,
    error,
    refresh,
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