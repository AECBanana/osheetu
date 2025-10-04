import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { ResultSetHeader } from "mysql2";

import { authOptions } from "../../../../auth/[...nextauth]/route";
import { query } from "@/utils/db";

interface ParticipantRow {
  role: "player" | "captain" | "referee" | "staff";
  status: "active" | "pending" | "banned";
}

const getParticipantRecord = async (tournamentId: number, userId: number) => {
  const rows = (await query(
    `SELECT role, status FROM tournament_participants WHERE tournament_id = ? AND user_id = ? LIMIT 1`,
    [tournamentId, userId]
  )) as ParticipantRow[];
  return rows[0] ?? null;
};

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ tournamentId: string; mapId: string }> }
) {
  const { tournamentId, mapId } = await context.params;
  const numericTournamentId = Number(tournamentId);
  const numericMapId = Number(mapId);

  if (!Number.isFinite(numericTournamentId) || numericTournamentId <= 0 || !Number.isFinite(numericMapId) || numericMapId <= 0) {
    return NextResponse.json({ error: "无效的参数" }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const userId = Number(session.user.id);
  const isAdmin = Boolean(session.user.is_admin);
  if (!Number.isFinite(userId) || userId <= 0) {
    return NextResponse.json({ error: "无效的用户ID" }, { status: 400 });
  }

  const participant = await getParticipantRecord(numericTournamentId, userId);
  const canManage = isAdmin || participant?.role === "captain";

  if (!canManage) {
    return NextResponse.json({ error: "您没有权限删除图池" }, { status: 403 });
  }

  try {
    const result = (await query(
      `DELETE FROM map_pools WHERE id = ? AND tournament_id = ?`,
      [numericMapId, numericTournamentId]
    )) as ResultSetHeader;

    if (result.affectedRows === 0) {
      return NextResponse.json({ error: "图池记录不存在" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除图池记录失败:", error);
    return NextResponse.json({ error: "删除图池记录失败" }, { status: 500 });
  }
}
