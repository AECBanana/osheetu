import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { query } from "@/utils/db";
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

const ensureAdminSession = async () => {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.is_admin) {
    return null;
  }
  return session;
};

const fetchUsers = async () => {
  const rows = (await query(
    `SELECT id, osu_id, username, avatar_url, is_admin, created_at, updated_at
     FROM users
     ORDER BY created_at DESC`
  )) as UserRow[];

  const userIds = rows.map((row) => row.id);
  let groupsMap = new Map<number, string[]>();

  if (userIds.length > 0) {
    const groupRows = (await query(
      `SELECT user_id, group_name FROM user_groups WHERE user_id IN (${userIds.map(() => "?").join(", ")})`,
      userIds
    )) as (GroupRow & { user_id: number })[];

    groupsMap = groupRows.reduce((map, item) => {
      const list = map.get(item.user_id) ?? [];
      list.push(item.group_name);
      map.set(item.user_id, list);
      return map;
    }, new Map<number, string[]>());
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
  }));
};

export async function GET() {
  const session = await ensureAdminSession();
  if (!session) {
    return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
  }

  const users = await fetchUsers();
  return NextResponse.json({ users });
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
