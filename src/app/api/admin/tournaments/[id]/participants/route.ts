import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { query } from "@/utils/db";
import { authOptions } from "../../../../auth/[...nextauth]/route";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

interface ParticipantRow extends RowDataPacket {
  id: number;
  user_id: number;
  osu_id: string;
  username: string;
  avatar_url: string | null;
  role: "player" | "captain" | "referee" | "staff";
  status: "active" | "pending" | "banned";
  created_at: Date;
}

const ensureAdminSession = async () => {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.is_admin) {
    return null;
  }
  return session;
};

const fetchParticipants = async (tournamentId: number) => {
  const rows = (await query(
    `SELECT tp.id, tp.user_id, tp.role, tp.status, tp.created_at, u.osu_id, u.username, u.avatar_url
     FROM tournament_participants tp
     INNER JOIN users u ON u.id = tp.user_id
     WHERE tp.tournament_id = ?
     ORDER BY tp.created_at DESC`,
    [tournamentId]
  )) as ParticipantRow[];

  return rows.map((p) => ({
    id: p.id,
    user_id: p.user_id,
    osu_id: p.osu_id,
    username: p.username,
    avatar_url: p.avatar_url,
    role: p.role,
    status: p.status,
    joined_at: p.created_at,
  }));
};

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await ensureAdminSession();
  if (!session) {
    return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
  }

  const tournamentId = Number(params.id);
  if (!tournamentId) {
    return NextResponse.json({ error: "无效的比赛ID" }, { status: 400 });
  }

  const participants = await fetchParticipants(tournamentId);
  return NextResponse.json({ participants });
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await ensureAdminSession();
  if (!session) {
    return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
  }

  const tournamentId = Number(params.id);
  if (!tournamentId) {
    return NextResponse.json({ error: "无效的比赛ID" }, { status: 400 });
  }

  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });
  }

  const { osuId, userId, role = "player", status = "active" } = payload ?? {};

  if (!osuId && !userId) {
    return NextResponse.json({ error: "需要提供用户ID或osuId" }, { status: 400 });
  }

  if (!["player", "captain", "referee", "staff"].includes(role)) {
    return NextResponse.json({ error: "无效的角色类型" }, { status: 400 });
  }

  if (!["active", "pending", "banned"].includes(status)) {
    return NextResponse.json({ error: "无效的状态" }, { status: 400 });
  }

  const userRows = (await query(
    `SELECT id FROM users WHERE ${osuId ? "osu_id = ?" : "id = ?"} LIMIT 1`,
    [osuId ?? userId]
  )) as RowDataPacket[];

  if (userRows.length === 0) {
    return NextResponse.json({ error: "未找到对应的用户" }, { status: 404 });
  }

  const resolvedUserId = Number(userRows[0].id);

  try {
    await query(
      `INSERT INTO tournament_participants (tournament_id, user_id, role, status)
       VALUES (?, ?, ?, ?)` ,
      [tournamentId, resolvedUserId, role, status]
    );
  } catch (error: any) {
    if (error?.code === "ER_DUP_ENTRY") {
      return NextResponse.json({ error: "该用户已在比赛中" }, { status: 409 });
    }
    throw error;
  }

  const participants = await fetchParticipants(tournamentId);
  return NextResponse.json({ participants }, { status: 201 });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await ensureAdminSession();
  if (!session) {
    return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
  }

  const tournamentId = Number(params.id);
  if (!tournamentId) {
    return NextResponse.json({ error: "无效的比赛ID" }, { status: 400 });
  }

  const participantIdParam = request.nextUrl.searchParams.get("participantId");
  const participantId = participantIdParam ? Number(participantIdParam) : null;

  if (!participantId) {
    return NextResponse.json({ error: "缺少participantId参数" }, { status: 400 });
  }

  const result = (await query(
    `DELETE FROM tournament_participants WHERE id = ? AND tournament_id = ?`,
    [participantId, tournamentId]
  )) as ResultSetHeader;

  if (result.affectedRows === 0) {
    return NextResponse.json({ error: "未找到参与者" }, { status: 404 });
  }

  const participants = await fetchParticipants(tournamentId);
  return NextResponse.json({ participants });
}
