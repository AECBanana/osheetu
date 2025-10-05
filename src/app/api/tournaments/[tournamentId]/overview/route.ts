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
            "SELECT role, status, created_at as joined_at FROM tournament_participants WHERE tournament_id = ? AND user_id = ?",
            [tournamentId, userId]
        )) as ParticipantRow[];

        const participant = participantRows.length > 0 ? participantRows[0] : null;

        // 获取图池统计
        const mapPoolRows = (await query(
            "SELECT COUNT(*) as total_maps FROM map_pools WHERE tournament_id = ? AND (stage = ? OR stage = '')",
            [tournamentId, tournament.current_stage]
        )) as RowDataPacket[];

        const totalMaps = mapPoolRows[0].total_maps;

        // 获取个人统计 - 更详细的统计信息
        const personalStatsRows = (await query(`
            SELECT
                COUNT(*) as total_scores,
                AVG(score) as avg_score,
                MAX(score) as best_score,
                MIN(score) as min_score,
                COUNT(DISTINCT map_pool_id) as maps_played,
                SUM(CASE WHEN score >= 900000 THEN 1 ELSE 0 END) as ss_count,
                SUM(CASE WHEN score >= 800000 AND score < 900000 THEN 1 ELSE 0 END) as s_count,
                SUM(CASE WHEN score >= 700000 AND score < 800000 THEN 1 ELSE 0 END) as a_count
            FROM scores s
            JOIN map_pools mp ON s.map_pool_id = mp.id
            WHERE mp.tournament_id = ? AND s.user_id = ? AND (mp.stage = ? OR mp.stage = '')
        `, [tournamentId, userId, tournament.current_stage])) as RowDataPacket[];

        const personalStats = personalStatsRows[0];

        // 获取个人排名（基于平均分数）
        const rankingRows = (await query(`
            SELECT
                user_id,
                AVG(score) as avg_score,
                ROW_NUMBER() OVER (ORDER BY AVG(score) DESC) as rank
            FROM scores s
            JOIN map_pools mp ON s.map_pool_id = mp.id
            WHERE mp.tournament_id = ? AND (mp.stage = ? OR mp.stage = '')
            GROUP BY user_id
            HAVING COUNT(*) >= 3
            ORDER BY avg_score DESC
        `, [tournamentId, tournament.current_stage])) as RowDataPacket[];

        const userRanking = rankingRows.find(row => row.user_id == userId)?.rank || null;

        // 获取最近分数 - 包含更多信息
        const recentScoresRows = (await query(`
            SELECT
                s.score,
                s.accuracy,
                s.timestamp,
                u.username as player,
                mp.title as map_title,
                mp.difficulty,
                mp.mod_value
            FROM scores s
            JOIN users u ON s.user_id = u.id
            JOIN map_pools mp ON s.map_pool_id = mp.id
            WHERE mp.tournament_id = ? AND s.user_id = ?
            ORDER BY s.timestamp DESC
            LIMIT 10
        `, [tournamentId, userId])) as RowDataPacket[];

        // 获取比赛活动统计
        const activityStatsRows = (await query(`
            SELECT
                COUNT(CASE WHEN DATE(s.timestamp) = CURDATE() THEN 1 END) as today_scores,
                COUNT(CASE WHEN DATE(s.timestamp) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 END) as week_scores,
                MAX(s.timestamp) as last_activity
            FROM scores s
            JOIN map_pools mp ON s.map_pool_id = mp.id
            WHERE mp.tournament_id = ? AND s.user_id = ?
        `, [tournamentId, userId])) as RowDataPacket[];

        const activityStats = activityStatsRows[0];

        // 获取团队统计（如果是团队比赛）
        let teamStats = null;
        if (tournament.type === "team") {
            // 获取团队成员统计
            const teamMembersRows = (await query(`
                SELECT
                    COUNT(DISTINCT tp.user_id) as team_size,
                    AVG(team_scores.avg_score) as team_avg_score
                FROM tournament_participants tp
                LEFT JOIN (
                    SELECT
                        s.user_id,
                        AVG(s.score) as avg_score
                    FROM scores s
                    JOIN map_pools mp ON s.map_pool_id = mp.id
                    WHERE mp.tournament_id = ? AND (mp.stage = ? OR mp.stage = '')
                    GROUP BY s.user_id
                ) team_scores ON tp.user_id = team_scores.user_id
                WHERE tp.tournament_id = ? AND tp.status = 'active'
            `, [tournamentId, tournament.current_stage, tournamentId])) as RowDataPacket[];

            if (teamMembersRows.length > 0) {
                teamStats = {
                    team_members: teamMembersRows[0].team_size,
                    team_avg_score: Math.round(teamMembersRows[0].team_avg_score || 0),
                    team_rank: 1 // 暂时设为1，后续可以计算团队排名
                };
            }
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
                    min_score: personalStats.min_score || 0,
                    maps_played: personalStats.maps_played || 0,
                    ss_count: personalStats.ss_count || 0,
                    s_count: personalStats.s_count || 0,
                    a_count: personalStats.a_count || 0,
                    rank: userRanking
                },
                activity_stats: {
                    today_scores: activityStats.today_scores || 0,
                    week_scores: activityStats.week_scores || 0,
                    last_activity: activityStats.last_activity
                },
                team_stats: teamStats,
                recent_scores: recentScoresRows.map(row => ({
                    score: row.score,
                    accuracy: row.accuracy,
                    timestamp: row.timestamp,
                    player: row.player,
                    map_title: row.map_title,
                    difficulty: row.difficulty,
                    mod_value: row.mod_value
                }))
            }
        };

        return NextResponse.json(overviewData);
    } catch (error) {
        console.error("Error fetching overview data:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}