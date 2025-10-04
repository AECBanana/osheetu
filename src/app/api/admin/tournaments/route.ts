import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { query } from "@/utils/db";
import { authOptions } from "../../auth/[...nextauth]/route";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

interface TournamentRow extends RowDataPacket {
  id: number;
  name: string;
  mode: "osu" | "taiko" | "mania" | "catch";
  type: "team" | "player";
  stages: string;
  current_stage: string;
  status: "active" | "completed" | "upcoming";
  include_qualifier: number | null;
  allow_custom_mods: number | null;
  settings: any;
  created_by: number | null;
  created_at: Date;
  updated_at: Date;
  participant_count: number;
}

const ensureAdminSession = async () => {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.is_admin) {
    return null;
  }
  return session;
};

const safeParse = (value: string) => {
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
};

const mapTournamentRow = (row: TournamentRow) => {
  let parsedStages: string[] = [];
  try {
    parsedStages = JSON.parse(row.stages ?? "[]");
    if (!Array.isArray(parsedStages)) {
      parsedStages = [];
    }
  } catch {
    parsedStages = [];
  }

  const settings = typeof row.settings === "string" ? safeParse(row.settings) : row.settings ?? {};

  return {
    id: row.id,
    name: row.name,
    mode: row.mode,
    type: row.type,
    stages: parsedStages,
    current_stage: row.current_stage,
    status: row.status,
    include_qualifier: Boolean(row.include_qualifier),
    allow_custom_mods: Boolean(row.allow_custom_mods),
    settings,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
    participants: row.participant_count,
  };
};

export async function GET() {
  const session = await ensureAdminSession();
  if (!session) {
    return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
  }

  const rows = (await query(
    `SELECT t.*, COALESCE(COUNT(tp.id), 0) AS participant_count
     FROM tournaments t
     LEFT JOIN tournament_participants tp ON tp.tournament_id = t.id
     GROUP BY t.id
     ORDER BY t.created_at DESC`
  )) as TournamentRow[];

  const tournaments = rows.map(mapTournamentRow);
  return NextResponse.json({ tournaments });
}

export async function POST(request: NextRequest) {
  const session = await ensureAdminSession();
  if (!session) {
    return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
  }

  let payload: any;
  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });
  }

  const {
    name,
    mode,
    type,
    stages,
    includeQualifier = false,
    allowCustomMods = false,
    settings = {},
  } = payload ?? {};

  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "缺少比赛名称" }, { status: 400 });
  }

  if (!mode || !["osu", "taiko", "mania", "catch"].includes(mode)) {
    return NextResponse.json({ error: "无效的游戏模式" }, { status: 400 });
  }

  if (!type || !["team", "player"].includes(type)) {
    return NextResponse.json({ error: "无效的比赛类型" }, { status: 400 });
  }

  if (!Array.isArray(stages) || stages.length === 0) {
    return NextResponse.json({ error: "至少选择一个比赛阶段" }, { status: 400 });
  }

  const normalizedStages = stages.map((stage: string) => stage.trim()).filter(Boolean);
  if (normalizedStages.length === 0) {
    return NextResponse.json({ error: "比赛阶段无效" }, { status: 400 });
  }

  const currentStage = normalizedStages[0];
  const settingsToStore = {
    ...settings,
    includeQualifier,
    allowCustomMods,
  };

  const insertResult = (await query(
    `INSERT INTO tournaments
      (name, mode, type, stages, current_stage, status, include_qualifier, allow_custom_mods, settings, created_by)
     VALUES (?, ?, ?, ?, ?, 'upcoming', ?, ?, ?, ?)` ,
    [
      name,
      mode,
      type,
      JSON.stringify(normalizedStages),
      currentStage,
      includeQualifier,
      allowCustomMods,
      JSON.stringify(settingsToStore),
      Number(session.user.id) || null,
    ]
  )) as ResultSetHeader;

  const insertedId = insertResult.insertId;

  const rows = (await query(
    `SELECT t.*, 0 as participant_count FROM tournaments t WHERE t.id = ?`,
    [insertedId]
  )) as TournamentRow[];

  const tournament = rows.length > 0 ? mapTournamentRow(rows[0]) : null;

  return NextResponse.json({ tournament }, { status: 201 });
}
