import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { RowDataPacket } from "mysql2";

import { authOptions } from "../../../auth/[...nextauth]/route";
import { query } from "@/utils/db";

interface MapPoolRow extends RowDataPacket {
    id: number;
    title: string;
    artist: string;
    difficulty: string;
    mod_value: string;
    stars: string | number;
    cover_url: string;
}

interface BPRecordRow extends RowDataPacket {
    id: number;
    map_pool_id: number;
    team_color: 'red' | 'blue';
    action: 'ban' | 'pick';
    created_by: number;
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
        const { searchParams } = new URL(request.url);
        const stage = searchParams.get('stage');

        if (!stage) {
            return NextResponse.json({ error: "Stage parameter is required" }, { status: 400 });
        }

        // 获取当前阶段的图池，按mod分组
        const mapPoolRows = (await query(`
      SELECT id, title, artist, difficulty, mod_value, stars, cover_url
      FROM map_pools
      WHERE tournament_id = ? AND (stage = ? OR stage = '')
      ORDER BY mod_value, id
    `, [tournamentId, stage])) as MapPoolRow[];

        // 获取已有的BP记录
        const bpRecordsRows = (await query(`
      SELECT id, map_pool_id, team_color, action, created_by
      FROM ban_pick_records
      WHERE tournament_id = ? AND stage = ?
    `, [tournamentId, stage])) as BPRecordRow[];

        // 按mod分组图池
        const mapsByMod: Record<string, any[]> = {};
        mapPoolRows.forEach(map => {
            if (!mapsByMod[map.mod_value]) {
                mapsByMod[map.mod_value] = [];
            }
            // 确保stars是数字类型
            mapsByMod[map.mod_value].push({
                ...map,
                stars: typeof map.stars === 'string' ? parseFloat(map.stars) || 0 : map.stars
            });
        });

        // 创建BP记录映射
        const bpRecordsMap: Record<number, BPRecordRow> = {};
        bpRecordsRows.forEach(record => {
            bpRecordsMap[record.map_pool_id] = record;
        });

        return NextResponse.json({
            mapsByMod,
            bpRecords: bpRecordsMap
        });
    } catch (error) {
        console.error("Error fetching BP data:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ tournamentId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { tournamentId } = await params;
        const { mapPoolId, teamColor, action, stage } = await request.json();

        if (!mapPoolId || !teamColor || !action || !stage) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        if (!['red', 'blue'].includes(teamColor) || !['ban', 'pick'].includes(action)) {
            return NextResponse.json({ error: "Invalid team color or action" }, { status: 400 });
        }

        // 检查权限（暂时允许所有参赛者操作，后续可以根据角色限制）
        const participantRows = (await query(
            "SELECT role FROM tournament_participants WHERE tournament_id = ? AND user_id = ?",
            [tournamentId, session.user.id]
        )) as RowDataPacket[];

        if (participantRows.length === 0 && !session.user.is_admin) {
            return NextResponse.json({ error: "You are not a participant in this tournament" }, { status: 403 });
        }

        // 检查是否已存在记录
        const existingRows = (await query(
            "SELECT id FROM ban_pick_records WHERE tournament_id = ? AND stage = ? AND map_pool_id = ?",
            [tournamentId, stage, mapPoolId]
        )) as RowDataPacket[];

        if (existingRows.length > 0) {
            // 更新现有记录
            await query(
                "UPDATE ban_pick_records SET team_color = ?, action = ?, created_by = ? WHERE tournament_id = ? AND stage = ? AND map_pool_id = ?",
                [teamColor, action, session.user.id, tournamentId, stage, mapPoolId]
            );
        } else {
            // 创建新记录
            await query(
                "INSERT INTO ban_pick_records (tournament_id, stage, map_pool_id, team_color, action, created_by) VALUES (?, ?, ?, ?, ?, ?)",
                [tournamentId, stage, mapPoolId, teamColor, action, session.user.id]
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error saving BP record:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ tournamentId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { tournamentId } = await params;
        const { searchParams } = new URL(request.url);
        const mapPoolId = searchParams.get('mapPoolId');
        const stage = searchParams.get('stage');

        if (!mapPoolId || !stage) {
            return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
        }

        // 删除BP记录
        await query(
            "DELETE FROM ban_pick_records WHERE tournament_id = ? AND stage = ? AND map_pool_id = ?",
            [tournamentId, stage, mapPoolId]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting BP record:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}