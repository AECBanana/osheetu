import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { query } from "@/utils/db";
import { authOptions } from "../../../auth/[...nextauth]/route";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

interface TournamentDetailRow extends RowDataPacket {
  id: number;
  name: string;
  mode: "osu" | "taiko" | "mania" | "catch";
  type: "team" | "player";
  stages: string;
  current_stage: string;
  status: "active" | "completed" | "upcoming";
  include_qualifier: number;
  allow_custom_mods: number;
  settings: any;
  created_by: number | null;
  created_at: Date;
  updated_at: Date;
}

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

const safeParse = (value: any) => {
  if (!value) return {};
  if (typeof value === "object") return value;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return {};
    }
  }
  return {};
};

const mapTournamentDetail = (row: TournamentDetailRow) => {
  let stages: string[] = [];
  try {
    stages = JSON.parse(row.stages ?? "[]");
    if (!Array.isArray(stages)) {
      stages = [];
    }
  } catch {
    stages = [];
  }

  return {
    id: row.id,
    name: row.name,
    mode: row.mode,
    type: row.type,
    stages,
    current_stage: row.current_stage,
    status: row.status,
    include_qualifier: Boolean(row.include_qualifier),
    allow_custom_mods: Boolean(row.allow_custom_mods),
    settings: safeParse(row.settings),
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
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

  const tournamentRows = (await query(
    `SELECT * FROM tournaments WHERE id = ?`,
    [tournamentId]
  )) as TournamentDetailRow[];

  if (tournamentRows.length === 0) {
    return NextResponse.json({ error: "未找到比赛" }, { status: 404 });
  }

  const participants = (await query(
    `SELECT tp.id, tp.user_id, tp.role, tp.status, tp.created_at, u.osu_id, u.username, u.avatar_url
     FROM tournament_participants tp
     INNER JOIN users u ON u.id = tp.user_id
     WHERE tp.tournament_id = ?
     ORDER BY tp.created_at DESC`,
    [tournamentId]
  )) as ParticipantRow[];

  const mapStatsRows = (await query(
    `SELECT COUNT(*) AS map_count FROM map_pools WHERE tournament_id = ?`,
    [tournamentId]
  )) as RowDataPacket[];

  const detail = mapTournamentDetail(tournamentRows[0]);
  const mapCount = mapStatsRows.length > 0 ? Number(mapStatsRows[0].map_count ?? 0) : 0;

  return NextResponse.json({
    tournament: detail,
    participants: participants.map((p) => ({
      id: p.id,
      user_id: p.user_id,
      osu_id: p.osu_id,
      username: p.username,
      avatar_url: p.avatar_url,
      role: p.role,
      status: p.status,
      joined_at: p.created_at,
    })),
    stats: {
      map_count: mapCount,
    },
  });
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

  const updates: string[] = [];
  const values: any[] = [];

  if (typeof payload.name === "string" && payload.name.trim()) {
    updates.push("name = ?");
    values.push(payload.name.trim());
  }

  if (payload.status && ["active", "completed", "upcoming"].includes(payload.status)) {
    updates.push("status = ?");
    values.push(payload.status);
  }

  if (typeof payload.currentStage === "string" && payload.currentStage.trim()) {
    updates.push("current_stage = ?");
    values.push(payload.currentStage.trim());
  }

  if (Array.isArray(payload.stages) && payload.stages.length > 0) {
    const stages = payload.stages.map((stage: string) => stage.trim()).filter(Boolean);
    if (stages.length > 0) {
      updates.push("stages = ?");
      values.push(JSON.stringify(stages));
    }
  }

  if (typeof payload.includeQualifier === "boolean") {
    updates.push("include_qualifier = ?");
    values.push(payload.includeQualifier);
  }

  if (typeof payload.allowCustomMods === "boolean") {
    updates.push("allow_custom_mods = ?");
    values.push(payload.allowCustomMods);
  }

  if (payload.settings && typeof payload.settings === "object") {
    updates.push("settings = ?");
    values.push(JSON.stringify(payload.settings));
  }

  if (updates.length === 0) {
    return NextResponse.json({ error: "没有可更新的字段" }, { status: 400 });
  }

  updates.push("updated_at = CURRENT_TIMESTAMP");

  await query(
    `UPDATE tournaments SET ${updates.join(", ")} WHERE id = ?`,
    [...values, tournamentId]
  );

  const updatedRows = (await query(
    `SELECT * FROM tournaments WHERE id = ?`,
    [tournamentId]
  )) as TournamentDetailRow[];

  if (updatedRows.length === 0) {
    return NextResponse.json({ error: "未找到比赛" }, { status: 404 });
  }

  return NextResponse.json({ tournament: mapTournamentDetail(updatedRows[0]) });
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await ensureAdminSession();
  if (!session) {
    return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
  }

  const tournamentId = Number(params.id);
  if (!tournamentId) {
    return NextResponse.json({ error: "无效的比赛ID" }, { status: 400 });
  }

  const result = (await query(
    `DELETE FROM tournaments WHERE id = ?`,
    [tournamentId]
  )) as ResultSetHeader;

  if (result.affectedRows === 0) {
    return NextResponse.json({ error: "未找到比赛" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
