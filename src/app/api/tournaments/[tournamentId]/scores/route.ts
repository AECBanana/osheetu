import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { query } from "@/utils/db";

export async function GET(
    request: NextRequest,
    context: { params: { tournamentId: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tournamentId } = context.params;

    try {
        const sql = `
            SELECT 
                s.id,
                s.score,
                s.timestamp,
                u.username as player,
                mp.title as mapTitle,
                mp.mod_value as mod
            FROM scores s
            JOIN users u ON s.user_id = u.id
            JOIN map_pools mp ON s.map_pool_id = mp.id
            WHERE mp.tournament_id = ?
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
    context: { params: { tournamentId: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { mapId, score } = await request.json();

    if (!mapId || !score) {
        return NextResponse.json({ error: "Map ID and score are required" }, { status: 400 });
    }

    const scoreValue = parseInt(score, 10);
    if (isNaN(scoreValue) || scoreValue <= 0) {
        return NextResponse.json({ error: "Invalid score value" }, { status: 400 });
    }

    try {
        const insertSql = `
            INSERT INTO scores (user_id, map_pool_id, score, accuracy, combo, mod_used)
            VALUES (?, ?, ?, ?, ?, ?);
        `;

        // Placeholder values for accuracy, combo, and mod_used as they are not in the new form
        const accuracy = 100.0;
        const combo = 0;
        const mod_used = 'N/A';

        const result = await query(insertSql, [session.user.id, mapId, scoreValue, accuracy, combo, mod_used]);

        return NextResponse.json({ message: "Score submitted successfully", result }, { status: 201 });
    } catch (error) {
        console.error("Failed to save score:", error);
        return NextResponse.json({ error: "Failed to save score" }, { status: 500 });
    }
}
