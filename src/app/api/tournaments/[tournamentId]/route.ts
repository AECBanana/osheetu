import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { RowDataPacket } from "mysql2";

import { authOptions } from "../../auth/[...nextauth]/route";
import { query } from "@/utils/db";

interface ParticipantRow extends RowDataPacket {
    role: "player" | "captain" | "referee" | "staff";
    status: "active" | "pending" | "banned";
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ tournamentId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { tournamentId } = await params;
        const body = await request.json();
        const { current_stage } = body;

        if (!current_stage) {
            return NextResponse.json({ error: "current_stage is required" }, { status: 400 });
        }

        // 检查用户是否是队长
        const participantRows = (await query(
            "SELECT role FROM tournament_participants WHERE tournament_id = ? AND user_id = ?",
            [tournamentId, session.user.id]
        )) as ParticipantRow[];

        if (participantRows.length === 0 || participantRows[0].role !== "captain") {
            return NextResponse.json({ error: "Only captains can update tournament stage" }, { status: 403 });
        }

        // 检查阶段是否存在于tournament的stages中
        const tournamentRows = (await query(
            "SELECT stages FROM tournaments WHERE id = ?",
            [tournamentId]
        )) as RowDataPacket[];

        if (tournamentRows.length === 0) {
            return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
        }

        const stages = JSON.parse(tournamentRows[0].stages as string);
        if (!stages.includes(current_stage)) {
            return NextResponse.json({ error: "Invalid stage" }, { status: 400 });
        }

        // 更新tournament的current_stage
        await query(
            "UPDATE tournaments SET current_stage = ? WHERE id = ?",
            [current_stage, tournamentId]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating tournament stage:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}