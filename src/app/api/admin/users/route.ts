import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { query } from "@/utils/db";
import { getValidClientToken } from "@/lib/osu-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import type { RowDataPacket } from "mysql2";

interface UserRow extends RowDataPacket {
  id: number;
  osu_id: string;
  username: string;
  avatar_url: string | null;
  is_admin: number;
  created_at: Date;
  updated_at: Date;
}

interface GroupRow extends RowDataPacket {
  group_name: string;
}

interface FetchUsersParams {
  search?: string | null;
  limit?: number;
  offset?: number;
  osuId?: string | null;
}

const ensureAdminSession = async () => {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.is_admin) {
    return null;
  }
  return session;
};

const fetchUsers = async ({ search, limit = 50, offset = 0, osuId }: FetchUsersParams = {}) => {
  const safeLimit = Math.max(1, Math.min(100, Math.trunc(limit)));
  const safeOffset = Math.max(0, Math.trunc(offset));

  const conditions: string[] = [];
  const params: Array<string | number> = [];

  if (osuId) {
    conditions.push("osu_id = ?");
    params.push(osuId);
  }

  if (search) {
    const wildcard = `%${search}%`;
    conditions.push("(username LIKE ? OR osu_id LIKE ?)");
    params.push(wildcard, wildcard);
  }

  let sql = `SELECT id, osu_id, username, avatar_url, is_admin, created_at, updated_at FROM users`;
  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(" AND ")}`;
  }
  sql += ` ORDER BY created_at DESC LIMIT ${safeLimit} OFFSET ${safeOffset}`;

  const rows = (await query(sql, params)) as UserRow[];

  const userIds = rows.map((row) => row.id);
  const groupsMap = new Map<number, string[]>();

  if (userIds.length > 0) {
    const placeholders = userIds.map(() => "?").join(", ");
    const groupRows = (await query(
      `SELECT user_id, group_name FROM user_groups WHERE user_id IN (${placeholders})`,
      userIds
    )) as (GroupRow & { user_id: number })[];

    for (const item of groupRows) {
      const list = groupsMap.get(item.user_id) ?? [];
      list.push(item.group_name);
      groupsMap.set(item.user_id, list);
    }
  }

  return rows.map((row) => ({
    id: row.id,
    osu_id: row.osu_id,
    username: row.username,
    avatar_url: row.avatar_url,
    is_admin: Boolean(row.is_admin),
    created_at: row.created_at,
    updated_at: row.updated_at,
    groups: groupsMap.get(row.id) ?? [],
    source: "registered" as const,
  }));
};

const lookupExternalOsuUser = async (osuId: string) => {
  try {
    const token = await getValidClientToken();
  const response = await fetch(`https://osu.ppy.sh/api/v2/users/${encodeURIComponent(osuId)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      const errorText = await response.text();
      console.error("获取 osu! 用户信息失败:", response.status, errorText);
      return null;
    }

    const data = await response.json();

    return {
      id: null,
      osu_id: String(data.id),
      username: data.username,
      avatar_url: data.avatar_url ?? null,
      is_admin: false,
      created_at: null,
      updated_at: null,
      groups: [] as string[],
      source: "external" as const,
      profile: {
        country_code: data.country_code ?? null,
        global_rank: data.statistics?.global_rank ?? null,
        country_rank: data.statistics?.country_rank ?? null,
        pp: data.statistics?.pp ?? null,
      },
    };
  } catch (error) {
    console.error("解析 osu! UID 失败:", error);
    return null;
  }
};

export async function GET(request: NextRequest) {
  const session = await ensureAdminSession();
  if (!session) {
    return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const osuIdParam = searchParams.get("osuId");

  if (osuIdParam) {
    const input = osuIdParam.trim();
    if (!input) {
      return NextResponse.json({ error: "请输入有效的 osu! UID" }, { status: 400 });
    }

    const [registeredUser] = await fetchUsers({ osuId: input, limit: 1 });
    if (registeredUser) {
      return NextResponse.json({ user: registeredUser });
    }

    const externalUser = await lookupExternalOsuUser(input);
    if (!externalUser) {
      return NextResponse.json({ error: "未找到对应的 osu! 用户" }, { status: 404 });
    }

    return NextResponse.json({ user: externalUser });
  }

  const search = searchParams.get("q")?.trim() || undefined;
  const parseOptionalInt = (value: string | null) => {
    if (value === null) {
      return undefined;
    }
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  };

  const limitRaw = parseOptionalInt(searchParams.get("limit"));
  const offsetRaw = parseOptionalInt(searchParams.get("offset"));

  const users = await fetchUsers({ search, limit: limitRaw, offset: offsetRaw });

  const limitForMeta = limitRaw ?? 50;
  const offsetForMeta = offsetRaw ?? 0;
  const metaLimit = Math.max(1, Math.min(100, Math.trunc(limitForMeta)));
  const metaOffset = Math.max(0, Math.trunc(offsetForMeta));

  return NextResponse.json({
    users,
    meta: {
      count: users.length,
      limit: metaLimit,
      offset: metaOffset,
      search: search ?? null,
    },
  });
}

export async function PATCH(request: NextRequest) {
  const session = await ensureAdminSession();
  if (!session) {
    return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
  }

  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });
  }

  const { userId, isAdmin, groups } = payload ?? {};

  if (!userId) {
    return NextResponse.json({ error: "缺少用户ID" }, { status: 400 });
  }

  if (typeof isAdmin === "boolean") {
    await query(`UPDATE users SET is_admin = ? WHERE id = ?`, [isAdmin, userId]);
  }

  if (Array.isArray(groups)) {
    await query(`DELETE FROM user_groups WHERE user_id = ?`, [userId]);
    if (groups.length > 0) {
      const inserts = groups
        .filter((group: string) => typeof group === "string" && group.trim())
        .map((group: string) => query(`INSERT INTO user_groups (user_id, group_name) VALUES (?, ?)`, [userId, group.trim()]));
      await Promise.all(inserts);
    }
  }

  const users = await fetchUsers();
  return NextResponse.json({ users });
}
