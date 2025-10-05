import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { query } from "@/utils/db";
import type { RowDataPacket } from 'mysql2';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ tournamentId: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tournamentId } = await params;

    try {
        const sql = `
            SELECT 
                s.id,
                s.score,
                s.timestamp,
                u.username as player,
                mp.title as mapTitle,
                mp.mod_value as mods
            FROM scores s
            JOIN users u ON s.user_id = u.id
            JOIN map_pools mp ON s.map_pool_id = mp.id
            JOIN tournaments t ON mp.tournament_id = t.id
            WHERE mp.tournament_id = ? AND (mp.stage = t.current_stage OR mp.stage = '')
            ORDER BY s.timestamp DESC
            LIMIT 50;
        `;
        const scores = await query(sql, [tournamentId]);
        return NextResponse.json({ scores });
    } catch (error) {
        console.error("Failed to fetch scores:", error);
        return NextResponse.json({ error: "Failed to fetch scores" }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ tournamentId: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tournamentId } = await params;

    const { mapId, score } = await request.json();

    if (!mapId || !score) {
        return NextResponse.json({ error: "Map ID and score are required" }, { status: 400 });
    }

    const scoreValue = parseInt(score, 10);
    if (isNaN(scoreValue) || scoreValue <= 0) {
        return NextResponse.json({ error: "Invalid score value" }, { status: 400 });
    }

    try {
        // Get mod_value from map_pools
        const modQuery = `SELECT mod_value FROM map_pools WHERE id = ?`;
        const modResult = await query(modQuery, [mapId]) as RowDataPacket[];
        if (modResult.length === 0) {
            return NextResponse.json({ error: "Invalid map ID" }, { status: 400 });
        }
        const mod_used = modResult[0].mod_value;

        const insertSql = `
            INSERT INTO scores (user_id, map_pool_id, score, accuracy, combo, mod_used)
            VALUES (?, ?, ?, ?, ?, ?);
        `;

        // Placeholder values for accuracy, combo
        const accuracy = 100.0;
        const combo = 0;

        const result = await query(insertSql, [session.user.id, mapId, scoreValue, accuracy, combo, mod_used]);

        return NextResponse.json({ message: "Score submitted successfully", result }, { status: 201 });
    } catch (error) {
        console.error("Failed to save score:", error);
        return NextResponse.json({ error: "Failed to save score" }, { status: 500 });
    }
}
