"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Card,
    CardHeader,
    Title3,
    Text,
    Badge,
    makeStyles,
    TabList,
    Tab,
    TabValue,
    DataGrid,
    DataGridHeader,
    DataGridRow,
    DataGridHeaderCell,
    DataGridCell,
    DataGridBody,
    TableColumnDefinition,
    createTableColumn,
    Avatar,
} from "@fluentui/react-components";

const useStyles = makeStyles({
    chartGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "20px",
    },
    practiceCard: {
        padding: "16px",
    },
    averageScore: {
        fontSize: "24px",
        fontWeight: "bold",
        color: "#0078d4",
        marginBottom: "8px",
    },
    progressInfo: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: "8px",
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

interface Participant {
    id: number;
    user_id: number;
    username: string;
    role: string;
    status: string;
    avatar_url?: string;
}

interface ScoreData {
    id: number;
    score: number;
    timestamp: string;
    player: string;
    mapTitle: string;
    mods: string;
}

interface MapPoolEntry {
    id: number;
    mod_value: string;
    title: string;
}

interface PracticeChartProps {
    tournament: Tournament;
    user: User;
}

export function PracticeChart({ tournament, user }: PracticeChartProps) {
    const styles = useStyles();
    const [selectedTab, setSelectedTab] = useState<TabValue>("overview");
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [scores, setScores] = useState<ScoreData[]>([]);
    const [mapPool, setMapPool] = useState<MapPoolEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        if (!tournament.id) return;
        setLoading(true);
        try {
            // Fetch participants
            const participantsResponse = await fetch(`/api/admin/tournaments/${tournament.id}/participants`);
            if (participantsResponse.ok) {
                const participantsData = await participantsResponse.json();
                setParticipants(participantsData.participants || []);
            }

            // Fetch scores
            const scoresResponse = await fetch(`/api/tournaments/${tournament.id}/scores`);
            const scoresData = await scoresResponse.json();
            if (scoresResponse.ok) {
                setScores(scoresData.scores || []);
            }

            // Fetch map pool
            const mapPoolResponse = await fetch(`/api/tournaments/${tournament.id}/map-pool`);
            const mapPoolData = await mapPoolResponse.json();
            if (mapPoolResponse.ok) {
                setMapPool(mapPoolData.maps || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [tournament.id]);

    useEffect(() => {
        void loadData();
    }, [loadData]);

    const getModColor = (mod: string) => {
        const colors = {
            NM: "brand",
            HD: "warning",
            HR: "danger",
            DT: "success",
            FM: "severe",
            TB: "important",
        };
        return colors[mod as keyof typeof colors] || "brand";
    };

    // Calculate team overview data
    const getTeamOverviewData = () => {
        const modGroups = new Map<string, { scores: number[], players: string[], totalMaps: number }>();

        // Group scores by mod
        scores.forEach(score => {
            if (!modGroups.has(score.mods)) {
                modGroups.set(score.mods, { scores: [], players: [], totalMaps: 0 });
            }
            const group = modGroups.get(score.mods)!;
            group.scores.push(score.score);
            if (!group.players.includes(score.player)) {
                group.players.push(score.player);
            }
        });

        // Add map pool data
        mapPool.forEach(map => {
            if (!modGroups.has(map.mod_value)) {
                modGroups.set(map.mod_value, { scores: [], players: [], totalMaps: 0 });
            }
            modGroups.get(map.mod_value)!.totalMaps++;
        });

        return Array.from(modGroups.entries()).map(([mod, data]) => ({
            mod,
            averageScore: data.scores.length > 0 ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length) : 0,
            highestScore: data.scores.length > 0 ? Math.max(...data.scores) : 0,
            topPlayers: data.players.slice(0, 4), // Top 4 players
            completionRate: data.totalMaps > 0 ? Math.round((data.scores.length / (data.totalMaps * participants.length)) * 100) : 0,
            totalScores: data.scores.length,
            totalMaps: data.totalMaps,
        }));
    };

    // Calculate individual player data
    const getPlayerData = (playerId: number) => {
        const playerScores = scores.filter(score => {
            const participant = participants.find(p => p.username === score.player);
            return participant?.user_id === playerId;
        });

        const modGroups = new Map<string, { scores: number[], mapsPlayed: number }>();

        playerScores.forEach(score => {
            if (!modGroups.has(score.mods)) {
                modGroups.set(score.mods, { scores: [], mapsPlayed: 0 });
            }
            const group = modGroups.get(score.mods)!;
            group.scores.push(score.score);
            group.mapsPlayed++;
        });

        return Array.from(modGroups.entries()).map(([mod, data]) => ({
            mod,
            averageScore: data.scores.length > 0 ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length) : 0,
            mapsPlayed: data.mapsPlayed,
            totalMaps: mapPool.filter(map => map.mod_value === mod).length,
        }));
    };

    const teamOverviewData = getTeamOverviewData();
    const activeParticipants = participants.filter(p => p.status === 'active');

    const playerColumns: TableColumnDefinition<any>[] = [
        createTableColumn<any>({
            columnId: "mod",
            renderHeaderCell: () => "Mod",
            renderCell: (item) => (
                <Badge appearance="filled" color={getModColor(item.mod) as any}>
                    {item.mod}
                </Badge>
            ),
        }),
        createTableColumn<any>({
            columnId: "averageScore",
            renderHeaderCell: () => "平均分",
            renderCell: (item) => item.averageScore.toLocaleString(),
        }),
        createTableColumn<any>({
            columnId: "progress",
            renderHeaderCell: () => "进度",
            renderCell: (item) => `${item.mapsPlayed}/${item.totalMaps} (${Math.round((item.mapsPlayed / item.totalMaps) * 100)}%)`,
        }),
    ];

    if (loading) {
        return <div>加载中...</div>;
    }

    return (
        <div>
            <TabList selectedValue={selectedTab} onTabSelect={(_, data) => setSelectedTab(data.value)}>
                <Tab value="overview">总览</Tab>
                {activeParticipants.map(participant => (
                    <Tab key={participant.user_id} value={participant.user_id.toString()}>
                        {participant.username}
                    </Tab>
                ))}
            </TabList>

            <div style={{ marginTop: "20px" }}>
                {selectedTab === "overview" && (
                    <div>
                        <Card style={{ marginBottom: "24px", padding: "16px" }}>
                            <CardHeader
                                header={<Title3>队伍练图总览</Title3>}
                                description="展示各Mod类型的队伍平均分数和完成情况"
                            />
                        </Card>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "20px" }}>
                            {teamOverviewData.map((data) => (
                                <Card key={data.mod} style={{ padding: "16px" }}>
                                    <CardHeader
                                        header={
                                            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                                                <Badge appearance="filled" color={getModColor(data.mod) as any} size="large">
                                                    {data.mod}
                                                </Badge>
                                                <Text weight="semibold" style={{ fontSize: "18px" }}>Mod 统计</Text>
                                            </div>
                                        }
                                    />

                                    <div style={{ display: "grid", gap: "12px" }}>
                                        <div>
                                            <Text weight="semibold" style={{ display: "block", marginBottom: "4px" }}>平均分</Text>
                                            <Text style={{ fontSize: "24px", fontWeight: "bold", color: "#0078d4" }}>
                                                {data.averageScore.toLocaleString()}
                                            </Text>
                                        </div>

                                        <div>
                                            <Text weight="semibold" style={{ display: "block", marginBottom: "4px" }}>最高分</Text>
                                            <Text style={{ fontSize: "20px", fontWeight: "bold" }}>
                                                {data.highestScore.toLocaleString()}
                                            </Text>
                                        </div>

                                        <div>
                                            <Text weight="semibold" style={{ display: "block", marginBottom: "8px" }}>最高分成员</Text>
                                            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                                {data.topPlayers.map((playerName) => {
                                                    const participant = participants.find(p => p.username === playerName);
                                                    return (
                                                        <div key={playerName} style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "#f3f2f1", padding: "4px 8px", borderRadius: "4px" }}>
                                                            <Avatar
                                                                size={24}
                                                                name={playerName}
                                                                image={{ src: participant?.avatar_url || undefined }}
                                                            />
                                                            <Text size={200}>{playerName}</Text>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div>
                                            <Text weight="semibold" style={{ display: "block", marginBottom: "4px" }}>完成情况</Text>
                                            <Text>
                                                {data.completionRate}% ({data.totalScores}/{data.totalMaps * activeParticipants.length})
                                            </Text>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {typeof selectedTab === "string" && selectedTab !== "overview" && (
                    <div>
                        <Card style={{ marginBottom: "24px", padding: "16px" }}>
                            <CardHeader
                                header={<Title3>{participants.find(p => p.user_id.toString() === selectedTab)?.username} 的练图表</Title3>}
                                description="个人各Mod类型的平均分数和练习进度"
                            />
                        </Card>

                        <DataGrid
                            items={getPlayerData(parseInt(selectedTab))}
                            columns={playerColumns}
                            getRowId={(item) => item.mod}
                        >
                            <DataGridHeader>
                                <DataGridRow>
                                    {({ renderHeaderCell }) => (
                                        <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                                    )}
                                </DataGridRow>
                            </DataGridHeader>
                            <DataGridBody<any>>
                                {({ item, rowId }) => (
                                    <DataGridRow<any> key={rowId}>
                                        {({ renderCell }) => (
                                            <DataGridCell>{renderCell(item)}</DataGridCell>
                                        )}
                                    </DataGridRow>
                                )}
                            </DataGridBody>
                        </DataGrid>
                    </div>
                )}
            </div>
        </div>
    );
}