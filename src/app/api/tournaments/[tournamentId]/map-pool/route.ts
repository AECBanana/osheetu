import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

import { authOptions } from "../../../auth/[...nextauth]/route";
import { ensureMapPoolColumns, query } from "@/utils/db";

interface ParticipantRow extends RowDataPacket {
  role: "player" | "captain" | "referee" | "staff";
  status: "active" | "pending" | "banned";
}

interface MapPoolRow extends RowDataPacket {
  id: number;
  tournament_id: number;
  stage: string;
  beatmapset_id: number | null;
  beatmap_id: number;
  cover_url: string | null;
  title: string;
  artist: string;
  mapper: string;
  difficulty: string;
  mod_value: string;
  stars: string | number | null;
  ar: string | number | null;
  cs: string | number | null;
  od: string | number | null;
  hp: string | number | null;
  bpm: string | number | null;
  length: string;
  tags: string | null;
  added_by: number | null;
  added_at: Date | string;
  added_by_username: string | null;
}

const parseTags = (value: string | null) => {
  if (!value) {
    return [] as string[];
  }
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter((item) => item.length > 0);
    }
  } catch {
    // ignore JSON parse error and fallback to comma split
  }
  return value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};

const mapRowToPayload = (row: MapPoolRow) => ({
  id: row.id,
  tournament_id: row.tournament_id,
  stage: row.stage,
  beatmapset_id: row.beatmapset_id,
  beatmap_id: row.beatmap_id,
  cover_url: row.cover_url,
  title: row.title,
  artist: row.artist,
  mapper: row.mapper,
  difficulty: row.difficulty,
  mod_value: row.mod_value,
  stars: row.stars === null ? null : Number(row.stars),
  ar: row.ar === null ? null : Number(row.ar),
  cs: row.cs === null ? null : Number(row.cs),
  od: row.od === null ? null : Number(row.od),
  hp: row.hp === null ? null : Number(row.hp),
  bpm: row.bpm === null ? null : Number(row.bpm),
  length: row.length,
  tags: parseTags(row.tags),
  added_by: row.added_by
    ? {
      id: row.added_by,
      username: row.added_by_username,
    }
    : null,
  added_at:
    row.added_at instanceof Date
      ? row.added_at.toISOString()
      : typeof row.added_at === "string"
        ? new Date(row.added_at).toISOString()
        : new Date().toISOString(),
});

const getParticipantRecord = async (tournamentId: number, userId: number) => {
  const rows = (await query(
    `SELECT role, status FROM tournament_participants WHERE tournament_id = ? AND user_id = ? LIMIT 1`,
    [tournamentId, userId]
  )) as ParticipantRow[];
  return rows[0] ?? null;
};

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ tournamentId: string }> }
) {
  const { tournamentId } = await context.params;
  const numericTournamentId = Number(tournamentId);

  if (!Number.isFinite(numericTournamentId) || numericTournamentId <= 0) {
    return NextResponse.json({ error: "无效的比赛ID" }, { status: 400 });
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

  if (!participant && !isAdmin) {
    return NextResponse.json({ error: "您不在该比赛中" }, { status: 403 });
  }

  if (participant && participant.status === "banned") {
    return NextResponse.json({ error: "您已被禁止访问该比赛" }, { status: 403 });
  }

  await ensureMapPoolColumns();

  // 获取当前比赛的阶段信息
  const tournamentRows = (await query(
    `SELECT current_stage FROM tournaments WHERE id = ? LIMIT 1`,
    [numericTournamentId]
  )) as Array<{ current_stage: string }>;

  if (tournamentRows.length === 0) {
    return NextResponse.json({ error: "比赛不存在" }, { status: 404 });
  }

  const currentStage = tournamentRows[0].current_stage;

  const rows = (await query(
    `SELECT mp.*, u.username AS added_by_username
       FROM map_pools mp
  LEFT JOIN users u ON mp.added_by = u.id
      WHERE mp.tournament_id = ? AND (mp.stage = ? OR mp.stage = '')
   ORDER BY mp.mod_value, mp.id`,
    [numericTournamentId, currentStage]
  )) as MapPoolRow[];

  const canManage = isAdmin || participant?.role === "captain";

  return NextResponse.json({
    maps: rows.map(mapRowToPayload),
    participant_role: participant?.role ?? null,
    can_manage_map_pool: canManage,
  });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ tournamentId: string }> }
) {
  const { tournamentId } = await context.params;
  const numericTournamentId = Number(tournamentId);

  if (!Number.isFinite(numericTournamentId) || numericTournamentId <= 0) {
    return NextResponse.json({ error: "无效的比赛ID" }, { status: 400 });
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
    return NextResponse.json({ error: "您没有权限管理图池" }, { status: 403 });
  }

  // 获取当前比赛的阶段信息
  const tournamentRows = (await query(
    `SELECT current_stage FROM tournaments WHERE id = ? LIMIT 1`,
    [numericTournamentId]
  )) as Array<{ current_stage: string }>;

  if (tournamentRows.length === 0) {
    return NextResponse.json({ error: "比赛不存在" }, { status: 404 });
  }

  const currentStage = tournamentRows[0].current_stage;

  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });
  }

  const {
    beatmap_id,
    beatmapset_id,
    cover_url,
    title,
    artist,
    mapper,
    difficulty,
    mod_value,
    stars,
    ar,
    cs,
    od,
    hp,
    bpm,
    length,
    tags,
    stage,
  } = payload ?? {};

  if (!beatmap_id || !title || !artist || !difficulty || !mod_value || !bpm || !length) {
    return NextResponse.json({ error: "缺少必要字段" }, { status: 400 });
  }

  const numericBeatmapId = Number(beatmap_id);
  if (!Number.isFinite(numericBeatmapId) || numericBeatmapId <= 0) {
    return NextResponse.json({ error: "无效的 BID" }, { status: 400 });
  }

  const numericBeatmapsetId = beatmapset_id ? Number(beatmapset_id) : null;
  if (numericBeatmapsetId !== null && (!Number.isFinite(numericBeatmapsetId) || numericBeatmapsetId <= 0)) {
    return NextResponse.json({ error: "无效的 Set ID" }, { status: 400 });
  }

  const numericStars = stars === undefined || stars === null ? null : Number(stars);
  const numericAr = ar === undefined || ar === null ? null : Number(ar);
  const numericCs = cs === undefined || cs === null ? null : Number(cs);
  const numericOd = od === undefined || od === null ? null : Number(od);
  const numericHp = hp === undefined || hp === null ? null : Number(hp);
  const numericBpm = Number(bpm);
  if (!Number.isFinite(numericBpm) || numericBpm <= 0) {
    return NextResponse.json({ error: "无效的 BPM" }, { status: 400 });
  }

  const normalizedTags = Array.isArray(tags)
    ? (tags as unknown[])
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter((item) => item.length > 0)
    : typeof tags === "string"
      ? tags
        .split(/[,\n]/)
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
      : [];

  const storedTags = normalizedTags.length > 0 ? JSON.stringify(normalizedTags) : null;

  await ensureMapPoolColumns();

  try {
    const result = (await query(
      `INSERT INTO map_pools (
        tournament_id,
        stage,
        beatmapset_id,
        beatmap_id,
        cover_url,
        title,
        artist,
        mapper,
        difficulty,
        mod_value,
        stars,
        ar,
        cs,
        od,
        hp,
        bpm,
        length,
        tags,
        added_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        numericTournamentId,
        stage || currentStage, // 如果没有指定stage，使用当前阶段
        numericBeatmapsetId,
        numericBeatmapId,
        cover_url ?? null,
        String(title),
        String(artist),
        mapper ? String(mapper) : "",
        String(difficulty),
        String(mod_value),
        numericStars,
        numericAr,
        numericCs,
        numericOd,
        numericHp,
        numericBpm,
        String(length),
        storedTags,
        userId,
      ]
    )) as ResultSetHeader;

    const insertedId = result.insertId;
    const [insertedRow] = (await query(
      `SELECT mp.*, u.username AS added_by_username
         FROM map_pools mp
    LEFT JOIN users u ON mp.added_by = u.id
        WHERE mp.id = ?
        LIMIT 1`,
      [insertedId]
    )) as MapPoolRow[];

    if (!insertedRow) {
      return NextResponse.json({ error: "图池创建成功，但读取失败" }, { status: 500 });
    }

    return NextResponse.json({ map: mapRowToPayload(insertedRow) }, { status: 201 });
  } catch (error) {
    console.error("创建图池数据失败:", error);
    return NextResponse.json({ error: "创建图池数据失败" }, { status: 500 });
  }
}
