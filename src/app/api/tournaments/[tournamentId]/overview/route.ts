import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { RowDataPacket } from "mysql2";

import { authOptions } from "../../../auth/[...nextauth]/route";
import { query } from "@/utils/db";

interface TournamentRow extends RowDataPacket {
    id: string;
    name: string;
    mode: string;
    type: string;
    stages: string;
    current_stage: string;
    status: string;
}

interface ParticipantRow extends RowDataPacket {
    role: string;
    status: string;
    joined_at: string;
}

interface MapPoolRow extends RowDataPacket {
    id: number;
    stage: string;
    mod_value: string;
}

interface ScoreRow extends RowDataPacket {
    id: number;
    score: number;
    timestamp: string;
    player: string;
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ tournamentId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { tournamentId } = await params;
        const userId = session.user.id;

        // 获取比赛基本信息
        const tournamentRows = (await query(
            "SELECT id, name, mode, type, stages, current_stage, status FROM tournaments WHERE id = ?",
            [tournamentId]
        )) as TournamentRow[];

        if (tournamentRows.length === 0) {
            return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
        }

        const tournament = tournamentRows[0];
        const stages = JSON.parse(tournament.stages);
        const currentStageIndex = stages.indexOf(tournament.current_stage);
        const progress = stages.length > 0 ? ((currentStageIndex + 1) / stages.length) * 100 : 0;

        // 获取用户在比赛中的角色
        const participantRows = (await query(
            "SELECT role, status, joined_at FROM tournament_participants WHERE tournament_id = ? AND user_id = ?",
            [tournamentId, userId]
        )) as ParticipantRow[];

        const participant = participantRows.length > 0 ? participantRows[0] : null;

        // 获取图池统计
        const mapPoolRows = (await query(
            "SELECT COUNT(*) as total_maps FROM map_pools WHERE tournament_id = ? AND (stage = ? OR stage = '')",
            [tournamentId, tournament.current_stage]
        )) as RowDataPacket[];

        const totalMaps = mapPoolRows[0].total_maps;

        // 获取个人统计
        const personalStatsRows = (await query(`
            SELECT
                COUNT(*) as total_scores,
                AVG(score) as avg_score,
                MAX(score) as best_score,
                COUNT(DISTINCT map_pool_id) as maps_played
            FROM scores s
            JOIN map_pools mp ON s.map_pool_id = mp.id
            WHERE mp.tournament_id = ? AND s.user_id = ? AND (mp.stage = ? OR mp.stage = '')
        `, [tournamentId, userId, tournament.current_stage])) as RowDataPacket[];

        const personalStats = personalStatsRows[0];

        // 获取最近分数
        const recentScoresRows = (await query(`
            SELECT s.score, s.timestamp, u.username as player, mp.title as map_title
            FROM scores s
            JOIN users u ON s.user_id = u.id
            JOIN map_pools mp ON s.map_pool_id = mp.id
            WHERE mp.tournament_id = ? AND s.user_id = ?
            ORDER BY s.timestamp DESC
            LIMIT 5
        `, [tournamentId, userId])) as RowDataPacket[];

        // 获取团队统计（如果是团队比赛）
        let teamStats = null;
        if (tournament.type === "team" && participant) {
            // 这里需要根据实际的团队数据结构来实现
            // 暂时返回模拟数据
            teamStats = {
                team_members: 4,
                team_avg_score: 850000,
                team_rank: 3
            };
        }

        // 计算练习进度（已玩图数 / 总图数）
        const practiceProgress = totalMaps > 0 ? (personalStats.maps_played / totalMaps) * 100 : 0;

        const overviewData = {
            tournament: {
                id: tournament.id,
                name: tournament.name,
                mode: tournament.mode,
                type: tournament.type,
                current_stage: tournament.current_stage,
                stages: stages,
                progress: progress,
                status: tournament.status
            },
            participant: participant,
            stats: {
                total_maps: totalMaps,
                practice_progress: Math.round(practiceProgress),
                personal_stats: {
                    total_scores: personalStats.total_scores || 0,
                    avg_score: Math.round(personalStats.avg_score || 0),
                    best_score: personalStats.best_score || 0,
                    maps_played: personalStats.maps_played || 0
                },
                team_stats: teamStats,
                recent_scores: recentScoresRows
            }
        };

        return NextResponse.json(overviewData);
    } catch (error) {
        console.error("Error fetching overview data:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}