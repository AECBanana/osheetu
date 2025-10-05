import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { RowDataPacket } from "mysql2";

import { query, ensureMapPoolColumns } from "@/utils/db";
import { authOptions } from "../../../../auth/[...nextauth]/route";

interface ParticipantRow extends RowDataPacket {
  role: "player" | "captain" | "referee" | "staff";
  status: "active" | "pending" | "banned";
}

interface MapPoolRow extends RowDataPacket {
  id: number;
  tournament_id: number;
  beatmapset_id: number | null;
  beatmap_id: number;
  title: string;
  artist: string;
  difficulty: string;
  mod_value: string;
}

const sanitizeFilename = (input: string) => {
  return input
    .replace(/[^a-zA-Z0-9\u4e00-\u9fa5\-_.\s\[\]\(\)]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120) || "beatmap.osz";
};

const getParticipantRecord = async (tournamentId: number, userId: number) => {
  const rows = (await query(
    `SELECT role, status FROM tournament_participants WHERE tournament_id = ? AND user_id = ? LIMIT 1`,
    [tournamentId, userId]
  )) as ParticipantRow[];
  return rows[0] ?? null;
};

export const runtime = "nodejs";

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

  if (!participant && !isAdmin) {
    return NextResponse.json({ error: "您不在该比赛中" }, { status: 403 });
  }

  if (participant?.status === "banned") {
    return NextResponse.json({ error: "您已被禁止访问该比赛" }, { status: 403 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });
  }

  const mapId = (payload as { mapId?: unknown })?.mapId;
  const numericMapId = Number(mapId);

  if (!Number.isFinite(numericMapId) || numericMapId <= 0) {
    return NextResponse.json({ error: "缺少或无效的图谱ID" }, { status: 400 });
  }

  await ensureMapPoolColumns();

  const rows = (await query(
    `SELECT id, tournament_id, beatmapset_id, beatmap_id, title, artist, difficulty, mod_value
       FROM map_pools
      WHERE id = ? AND tournament_id = ?
      LIMIT 1`,
    [numericMapId, numericTournamentId]
  )) as MapPoolRow[];

  const map = rows[0];

  if (!map) {
    return NextResponse.json({ error: "未找到对应的图谱" }, { status: 404 });
  }

  const targetId = map.beatmapset_id ?? map.beatmap_id;

  if (!targetId) {
    return NextResponse.json({ error: "该图谱缺少可下载的 beatmapset_id" }, { status: 400 });
  }

  const userAgent = request.headers.get("user-agent") ?? "Mozilla/5.0";

  // Multiple download sources with fallback
  const downloadSources = [
    {
      name: "nerinyan",
      url: `https://api.nerinyan.moe/d/${targetId}`,
      headers: {
        "User-Agent": userAgent,
        Accept: "*/*",
      } as Record<string, string>,
    },
    {
      name: "chimu",
      url: `https://catboy.best/d/${targetId}`,
      headers: {
        "User-Agent": userAgent,
        Accept: "application/x-osu-beatmap-archive",
      } as Record<string, string>,
    },
    {
      name: "sayobot",
      url: `https://dl.sayobot.cn/beatmaps/download/full/${targetId}`,
      headers: {
        Referer: "https://sheet.rino.ink/",
        "User-Agent": userAgent,
        Accept: "*/*",
      } as Record<string, string>,
    },
  ];

  let lastError: string = "";
  let upstreamResponse: Response | null = null;

  // Try each download source
  for (const source of downloadSources) {
    try {
      console.log(`尝试从 ${source.name} 下载: ${source.url}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30-second timeout

      try {
        const response = await fetch(source.url, {
          headers: source.headers,
          signal: controller.signal,
        });

        if (response.ok && response.body) {
          upstreamResponse = response;
          console.log(`成功从 ${source.name} 获取下载`);
          break;
        } else {
          lastError = `${source.name}: ${response.status} ${response.statusText}`;
          console.warn(`从 ${source.name} 下载失败:`, lastError);
        }
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      lastError = `${source.name}: ${error instanceof Error ? error.message : '未知错误'}`;
      console.warn(`从 ${source.name} 下载出错:`, error);
    }
  }

  if (!upstreamResponse || !upstreamResponse.body) {
    console.error("所有下载源都失败了，最后的错误:", lastError);
    return NextResponse.json({
      error: "获取图谱下载失败，所有下载源都不可用",
      details: lastError
    }, { status: 502 });
  }

  const upstreamDisposition = upstreamResponse.headers.get("content-disposition");
  const fallbackName = sanitizeFilename(
    `${map.mod_value || "MAP"}_${map.title || "beatmap"}_${map.difficulty || "diff"}_${targetId}.osz`
  );

  const responseHeaders = new Headers();
  responseHeaders.set("Cache-Control", "no-store, max-age=0");
  responseHeaders.set("Content-Type", upstreamResponse.headers.get("content-type") ?? "application/octet-stream");
  const upstreamLength = upstreamResponse.headers.get("content-length");
  if (upstreamLength) {
    responseHeaders.set("Content-Length", upstreamLength);
  }
  responseHeaders.set(
    "Content-Disposition",
    upstreamDisposition ?? `attachment; filename="${fallbackName}"`
  );

  return new Response(upstreamResponse.body, {
    status: 200,
    headers: responseHeaders,
  });
}
