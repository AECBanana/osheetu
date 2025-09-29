"use client";

import { useState } from "react";
import {
    Card,
    CardHeader,
    Title3,
    Text,
    Badge,
    DataGrid,
    DataGridHeader,
    DataGridRow,
    DataGridHeaderCell,
    DataGridCell,
    DataGridBody,
    TableColumnDefinition,
    createTableColumn,
    Dropdown,
    Option,
    Field,
    makeStyles,
} from "@fluentui/react-components";

const useStyles = makeStyles({
    filterContainer: {
        display: "flex",
        gap: "12px",
        marginBottom: "16px",
        padding: "16px",
    },
    mapAnalysis: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: "16px",
        marginTop: "16px",
    },
});

interface Tournament {
    id: string;
    name: string;
}

interface User {
    id: number;
    username: string;
}

interface DailyScore {
    date: string;
    player: string;
    mapTitle: string;
    score: number;
    accuracy: number;
    tags: string[];
    mapType: string;
}

interface OpponentAnalysisProps {
    tournament: Tournament;
    user: User;
}

const mockDailyScores: DailyScore[] = [
    {
        date: "2025-09-29",
        player: "OpponentA",
        mapTitle: "Sidetracked Day",
        score: 875432,
        accuracy: 98.45,
        tags: ["jump", "stream"],
        mapType: "aim",
    },
];

export function OpponentAnalysis({ tournament, user }: OpponentAnalysisProps) {
    const styles = useStyles();
    const [filteredScores] = useState<DailyScore[]>(mockDailyScores);

    const columns: TableColumnDefinition<DailyScore>[] = [
        createTableColumn<DailyScore>({
            columnId: "date",
            renderHeaderCell: () => "日期",
            renderCell: (item) => item.date,
        }),
        createTableColumn<DailyScore>({
            columnId: "player",
            renderHeaderCell: () => "玩家",
            renderCell: (item) => item.player,
        }),
    ];

    return (
        <Card>
            <CardHeader
                header={<Title3>对手分析</Title3>}
                description="获取队友每日分数和beatmap tags分析图类型"
            />
            <Text>对手分析功能开发中...</Text>
        </Card>
    );
}