import { NextRequest, NextResponse } from "next/server";

import { getValidClientToken } from "@/lib/osu-auth";

interface BeatmapSummary {
  beatmap_id: number | null;
  beatmapset_id: number | null;
  title: string;
  artist: string;
  mapper: string;
  difficulty: string;
  mode: string | null;
  stars: number | null;
  ar: number | null;
  cs: number | null;
  od: number | null;
  hp: number | null;
  bpm: number | null;
  length: string | null;
  cover_url: string | null;
  tags: string[];
}

type OsuBeatmap = {
  id: number;
  beatmapset_id: number;
  version: string;
  difficulty_rating: number;
  ar: number;
  cs: number;
  accuracy: number;
  drain: number;
  bpm: number;
  total_length: number;
  hit_length: number;
  mode: string;
  beatmapset?: OsuBeatmapset;
};

type OsuBeatmapset = {
  id: number;
  title: string;
  artist: string;
  creator: string;
  covers?: {
    cover?: string;
    "cover@2x"?: string;
    card?: string;
    "card@2x"?: string;
    list?: string;
    "list@2x"?: string;
    slimcover?: string;
    "slimcover@2x"?: string;
  };
  tags?: string | null;
  beatmaps?: OsuBeatmap[];
};

const OSU_API_BASE = "https://osu.ppy.sh/api/v2";

const formatDuration = (seconds?: number | null): string | null => {
  if (!seconds || Number.isNaN(seconds) || seconds <= 0) {
    return null;
  }
  const wholeSeconds = Math.round(seconds);
  const minutes = Math.floor(wholeSeconds / 60);
  const remaining = wholeSeconds % 60;
  const padded = remaining.toString().padStart(2, "0");
  return `${minutes}:${padded}`;
};

const normalizeTags = (tags?: string | null): string[] => {
  if (!tags) {
    return [];
  }
  return tags
    .split(/[\s,]+/)
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
};

interface ParsedInput {
  beatmapId?: number;
  beatmapsetId?: number;
}

const parseBeatmapInput = (rawInput: string): ParsedInput => {
  const input = rawInput.trim();
  if (!input) {
    return {};
  }

  try {
    const url = new URL(input);
    if (url.hostname.endsWith("osu.ppy.sh")) {
      const pathSegments = url.pathname.split("/").filter(Boolean);
      if (pathSegments[0] === "beatmapsets" && pathSegments[1]) {
        const setId = Number(pathSegments[1]);
        if (Number.isFinite(setId)) {
          const parsed: ParsedInput = { beatmapsetId: setId };
          const fragment = url.hash || "";
          const beatmapMatch = fragment.match(/\/(\d+)/);
          if (beatmapMatch) {
            const beatmapId = Number(beatmapMatch[1]);
            if (Number.isFinite(beatmapId)) {
              parsed.beatmapId = beatmapId;
            }
          }
          return parsed;
        }
      }
      if (pathSegments[0] === "beatmaps" && pathSegments[1]) {
        const beatmapId = Number(pathSegments[1]);
        if (Number.isFinite(beatmapId)) {
          return { beatmapId };
        }
      }
    }
  } catch {
    // Not a valid URL, fallback to manual parsing
  }

  const cleaned = input.replace(/[^0-9a-z]/gi, "").toLowerCase();
  if (!cleaned) {
    return {};
  }

  const beatmapMatch = cleaned.match(/^(b|beatmap)?(\d+)$/);
  if (beatmapMatch) {
    const beatmapId = Number(beatmapMatch[2] ?? beatmapMatch[1]);
    if (Number.isFinite(beatmapId)) {
      return { beatmapId };
    }
  }

  const setMatch = cleaned.match(/^(s|set|beatmapset)?(\d+)$/);
  if (setMatch) {
    const beatmapsetId = Number(setMatch[2] ?? setMatch[1]);
    if (Number.isFinite(beatmapsetId)) {
      return { beatmapsetId };
    }
  }

  const numeric = Number(cleaned);
  if (Number.isFinite(numeric)) {
    return { beatmapId: numeric, beatmapsetId: numeric };
  }

  return {};
};

const osuApiFetch = async (endpoint: string, token: string) => {
  const response = await fetch(`${OSU_API_BASE}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    next: { revalidate: 0 },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`osu! API error ${response.status}: ${errorText}`);
  }

  return response.json();
};

const resolveBeatmapFromSet = (beatmapset: OsuBeatmapset, preferredId?: number): OsuBeatmap | null => {
  if (!beatmapset.beatmaps || beatmapset.beatmaps.length === 0) {
    return null;
  }

  if (preferredId) {
    const matched = beatmapset.beatmaps.find((beatmap) => beatmap.id === preferredId);
    if (matched) {
      return matched;
    }
  }

  const standard = beatmapset.beatmaps.find((beatmap) => beatmap.mode === "osu");
  if (standard) {
    return standard;
  }

  return beatmapset.beatmaps[0];
};

const buildBeatmapSummary = (beatmap: OsuBeatmap, beatmapset: OsuBeatmapset): BeatmapSummary => {
  const covers = beatmapset.covers ?? {};
  const coverUrl =
    covers["cover@2x"] ?? covers.cover ?? covers["card@2x"] ?? covers.card ?? covers["list@2x"] ?? covers.list ?? null;

  return {
    beatmap_id: beatmap.id ?? null,
    beatmapset_id: beatmap.beatmapset_id ?? beatmapset.id ?? null,
    title: beatmapset.title ?? "",
    artist: beatmapset.artist ?? "",
    mapper: beatmapset.creator ?? "",
    difficulty: beatmap.version ?? "",
    mode: beatmap.mode ?? null,
    stars: beatmap.difficulty_rating ?? null,
    ar: beatmap.ar ?? null,
    cs: beatmap.cs ?? null,
    od: beatmap.accuracy ?? null,
    hp: beatmap.drain ?? null,
    bpm: beatmap.bpm ?? null,
    length: formatDuration(beatmap.total_length ?? beatmap.hit_length ?? null),
    cover_url: coverUrl,
    tags: normalizeTags(beatmapset.tags),
  };
};

export async function POST(request: NextRequest) {
  let payload: any;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });
  }

  const rawInput = typeof payload?.input === "string" ? payload.input.trim() : "";
  if (!rawInput) {
    return NextResponse.json({ error: "请输入 osu! 链接、BID 或 SID" }, { status: 400 });
  }

  const parsed = parseBeatmapInput(rawInput);
  if (!parsed.beatmapId && !parsed.beatmapsetId) {
    return NextResponse.json({ error: "无法从输入解析出有效的 BID 或 SID" }, { status: 400 });
  }

  try {
    const token = await getValidClientToken();

    let beatmap: OsuBeatmap | null = null;
    let beatmapset: OsuBeatmapset | null = null;
    let beatmapsetId = parsed.beatmapsetId;

    if (parsed.beatmapId) {
      const beatmapResponse = await osuApiFetch(`/beatmaps/${parsed.beatmapId}`, token);
      if (beatmapResponse) {
        const beatmapData = beatmapResponse as OsuBeatmap;
        beatmap = beatmapData;
        if (!beatmapsetId && beatmapData.beatmapset_id) {
          beatmapsetId = beatmapData.beatmapset_id;
        }
        if (beatmapData.beatmapset) {
          beatmapset = beatmapData.beatmapset;
        }
      }
    }

    if (!beatmapset && beatmapsetId) {
      const beatmapsetResponse = await osuApiFetch(`/beatmapsets/${beatmapsetId}`, token);
      if (beatmapsetResponse) {
        beatmapset = beatmapsetResponse as OsuBeatmapset;
        if (!beatmap) {
          beatmap = resolveBeatmapFromSet(beatmapset, parsed.beatmapId);
        }
      }
    }

    if (!beatmap || !beatmapset) {
      return NextResponse.json({ error: "未找到对应的图谱，请确认输入是否正确" }, { status: 404 });
    }

    const summary = buildBeatmapSummary(beatmap, beatmapset);

    return NextResponse.json({ beatmap: summary });
  } catch (error) {
    console.error("解析 osu! 图谱失败:", error);
    const message = error instanceof Error ? error.message : "解析 osu! 图谱失败";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
