import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { RowDataPacket } from "mysql2";

import { query } from "@/utils/db";
import { authOptions } from "../../auth/[...nextauth]/route";

interface TournamentRow extends RowDataPacket {
  id: number;
  name: string;
  mode: "osu" | "taiko" | "mania" | "catch";
  type: "team" | "player";
  stages: string | null;
  current_stage: string;
  status: "active" | "completed" | "upcoming";
  include_qualifier: number | null;
  allow_custom_mods: number | null;
  participant_role: "player" | "captain" | "referee" | "staff";
  participant_status: "active" | "pending" | "banned";
  joined_at: Date;
}

const parseStages = (value: string | null) => {
  if (!value) return [] as string[];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter((item) => typeof item === "string" && item.trim().length > 0);
    }
  } catch {
    // ignore parse errors
  }
  return [] as string[];
};

export async function GET(_request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const userId = Number(session.user.id);
  if (!Number.isFinite(userId) || userId <= 0) {
    return NextResponse.json({ error: "无效的用户ID" }, { status: 400 });
  }

  const rows = (await query(
    `SELECT t.id, t.name, t.mode, t.type, t.stages, t.current_stage, t.status,
            t.include_qualifier, t.allow_custom_mods,
            tp.role AS participant_role, tp.status AS participant_status, tp.created_at AS joined_at
       FROM tournament_participants tp
       INNER JOIN tournaments t ON t.id = tp.tournament_id
      WHERE tp.user_id = ? AND tp.status <> 'banned'
      ORDER BY t.created_at DESC`,
    [userId]
  )) as TournamentRow[];

  const tournaments = rows.map((row) => ({
    id: row.id,
    name: row.name,
    mode: row.mode,
    type: row.type,
    stages: parseStages(row.stages),
    current_stage: row.current_stage,
    status: row.status,
    include_qualifier: Boolean(row.include_qualifier),
    allow_custom_mods: Boolean(row.allow_custom_mods),
    participant: {
      role: row.participant_role,
      status: row.participant_status,
      joined_at: row.joined_at,
    },
    can_manage_map_pool: row.participant_role === "captain",
  }));

  return NextResponse.json({ tournaments });
}
