"use client";

import { useState } from "react";
import {
    Card,
    CardHeader,
    Title3,
    Button,
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
    makeStyles,
} from "@fluentui/react-components";

const useStyles = makeStyles({
    actionButtons: {
        display: "flex",
        gap: "8px",
        marginBottom: "16px",
        padding: "16px",
    },
    phaseHeader: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        marginBottom: "12px",
    },
});

interface Tournament {
    id: string;
    name: string;
    current_stage: string;
}

interface User {
    id: number;
    username: string;
}

interface BanPickRecord {
    id: string;
    phase: string;
    team: string;
    action: "ban" | "pick";
    mapTitle: string;
    mod: string;
    timestamp: string;
}

interface BanPickBoardProps {
    tournament: Tournament;
    user: User;
}

const mockBanPickData: BanPickRecord[] = [
    {
        id: "1",
        phase: "RO16",
        team: "Team Alpha",
        action: "ban",
        mapTitle: "Sidetracked Day",
        mod: "NM1",
        timestamp: "2025-09-29 20:15",
    },
    {
        id: "2",
        phase: "RO16",
        team: "Team Beta",
        action: "ban",
        mapTitle: "GHOST",
        mod: "HD2",
        timestamp: "2025-09-29 20:16",
    },
    {
        id: "3",
        phase: "RO16",
        team: "Team Alpha",
        action: "pick",
        mapTitle: "Blue Zenith",
        mod: "HR1",
        timestamp: "2025-09-29 20:17",
    },
];

export function BanPickBoard({ tournament, user }: BanPickBoardProps) {
    const styles = useStyles();
    const [records] = useState<BanPickRecord[]>(mockBanPickData);
    const [currentPhase, setCurrentPhase] = useState(tournament.current_stage);

    const getActionColor = (action: "ban" | "pick") => {
        return action === "ban" ? "danger" : "success";
    };

    const columns: TableColumnDefinition<BanPickRecord>[] = [
        createTableColumn<BanPickRecord>({
            columnId: "timestamp",
            renderHeaderCell: () => "时间",
            renderCell: (item) => item.timestamp.split(" ")[1],
        }),
        createTableColumn<BanPickRecord>({
            columnId: "team",
            renderHeaderCell: () => "队伍",
            renderCell: (item) => item.team,
        }),
        createTableColumn<BanPickRecord>({
            columnId: "action",
            renderHeaderCell: () => "操作",
            renderCell: (item) => (
                <Badge appearance="filled" color={getActionColor(item.action)}>
                    {item.action === "ban" ? "禁用" : "选择"}
                </Badge>
            ),
        }),
        createTableColumn<BanPickRecord>({
            columnId: "map",
            renderHeaderCell: () => "图谱",
            renderCell: (item) => item.mapTitle,
        }),
        createTableColumn<BanPickRecord>({
            columnId: "mod",
            renderHeaderCell: () => "Mod",
            renderCell: (item) => (
                <Badge appearance="outline">
                    {item.mod}
                </Badge>
            ),
        }),
    ];

    const getPhaseRecords = () => {
        return records.filter(record => record.phase === currentPhase);
    };

    return (
        <div>
            <Card>
                <CardHeader
                    header={<Title3>BP记分板</Title3>}
                    description="比赛时的Ban Pick记录"
                />

                <div className={styles.phaseHeader} style={{ padding: "16px" }}>
                    <Text weight="semibold">当前阶段:</Text>
                    <Badge appearance="filled" color="brand">
                        {currentPhase.toUpperCase()}
                    </Badge>
                    <Text size={200} style={{ marginLeft: "auto" }}>
                        记录总数: {getPhaseRecords().length}
                    </Text>
                </div>

                <DataGrid
                    items={getPhaseRecords()}
                    columns={columns}
                    getRowId={(item) => item.id}
                >
                    <DataGridHeader>
                        <DataGridRow>
                            {({ renderHeaderCell }) => (
                                <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                            )}
                        </DataGridRow>
                    </DataGridHeader>
                    <DataGridBody<BanPickRecord>>
                        {({ item, rowId }) => (
                            <DataGridRow<BanPickRecord> key={rowId}>
                                {({ renderCell }) => (
                                    <DataGridCell>{renderCell(item)}</DataGridCell>
                                )}
                            </DataGridRow>
                        )}
                    </DataGridBody>
                </DataGrid>
            </Card>

            {/* 统计信息 */}
            <Card style={{ marginTop: "24px", padding: "16px" }}>
                <CardHeader
                    header={<Title3>BP统计</Title3>}
                    description="当前阶段的Ban Pick统计信息"
                />

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginTop: "16px" }}>
                    <div style={{ textAlign: "center" }}>
                        <Text weight="semibold" style={{ display: "block", fontSize: "24px" }}>
                            {getPhaseRecords().filter(r => r.action === "ban").length}
                        </Text>
                        <Text size={200}>总禁用数</Text>
                    </div>

                    <div style={{ textAlign: "center" }}>
                        <Text weight="semibold" style={{ display: "block", fontSize: "24px" }}>
                            {getPhaseRecords().filter(r => r.action === "pick").length}
                        </Text>
                        <Text size={200}>总选择数</Text>
                    </div>

                    <div style={{ textAlign: "center" }}>
                        <Text weight="semibold" style={{ display: "block", fontSize: "24px" }}>
                            {new Set(getPhaseRecords().map(r => r.team)).size}
                        </Text>
                        <Text size={200}>参与队伍</Text>
                    </div>
                </div>
            </Card>
        </div>
    );
}