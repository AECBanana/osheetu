"use client";

import React, { useState, useEffect } from "react";
import {
    Card,
    CardHeader,
    Title3,
    Button,
    Text,
    Badge,
    makeStyles,
    tokens,
    ToggleButton,
    Tooltip,
} from "@fluentui/react-components";

const useStyles = makeStyles({
    container: {
        display: "flex",
        flexDirection: "column",
        gap: "24px",
    },
    mapPoolSection: {
        display: "flex",
        flexDirection: "column",
        gap: "16px",
    },
    modSection: {
        padding: "16px",
        border: `1px solid ${tokens.colorNeutralStroke2}`,
        borderRadius: "8px",
    },
    modHeader: {
        marginBottom: "12px",
        fontWeight: "bold",
        color: tokens.colorBrandForeground1,
    },
    mapsGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: "8px",
    },
    mapCard: {
        padding: "8px",
        border: `1px solid ${tokens.colorNeutralStroke2}`,
        borderRadius: "6px",
        cursor: "pointer",
        transition: "all 0.2s ease",
        backgroundColor: tokens.colorNeutralBackground1,
        position: "relative",
        minHeight: "120px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
    },
    mapCardHover: {
        border: "1px solid #0078d4",
        backgroundColor: "#f3f2f1",
    },
    mapCardSelected: {
        border: "1px solid #0078d4",
        backgroundColor: "#f3f2f1",
    },
    mapCardBanned: {
        border: "1px solid #d13438",
        backgroundColor: "#fef0f1",
        opacity: 0.7,
    },
    mapCardPicked: {
        border: "1px solid #107c10",
        backgroundColor: "#f1f8f1",
    },
    mapCover: {
        width: "100%",
        height: "60px",
        objectFit: "cover",
        borderRadius: "4px",
        marginBottom: "4px",
    },
    mapMod: {
        position: "absolute",
        top: "4px",
        left: "4px",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        color: "white",
        padding: "2px 6px",
        borderRadius: "3px",
        fontSize: "10px",
        fontWeight: "bold",
    },
    mapTitle: {
        fontWeight: "semibold",
        fontSize: "11px",
        textAlign: "center",
        lineHeight: "1.2",
        wordBreak: "break-word",
        padding: "0 4px",
    },
    controlPanel: {
        padding: "16px",
        border: `1px solid ${tokens.colorNeutralStroke2}`,
        borderRadius: "8px",
        backgroundColor: tokens.colorNeutralBackground2,
    },
    actionButtons: {
        display: "flex",
        gap: "8px",
        flexWrap: "wrap",
        marginBottom: "16px",
    },
    actionButton: {
        minWidth: "120px",
    },
    statusBadge: {
        position: "absolute",
        top: "4px",
        right: "4px",
        fontSize: "10px",
    },
    mapCardContent: {
        position: "relative",
        width: "100%",
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

interface MapPoolItem {
    id: number;
    title: string;
    artist: string;
    difficulty: string;
    mod_value: string;
    stars: number;
    cover_url: string;
}

interface BPRecord {
    id: number;
    map_pool_id: number;
    team_color: 'red' | 'blue';
    action: 'ban' | 'pick';
    created_by: number;
}

interface BPData {
    mapsByMod: Record<string, MapPoolItem[]>;
    bpRecords: Record<number, BPRecord>;
}

type ActionType = 'red-ban' | 'red-pick' | 'blue-ban' | 'blue-pick' | null;

interface BanPickBoardProps {
    tournament: Tournament;
    user: User;
}

export function BanPickBoard({ tournament, user }: BanPickBoardProps) {
    const styles = useStyles();
    const [bpData, setBpData] = useState<BPData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedAction, setSelectedAction] = useState<ActionType>(null);
    const [hoveredMap, setHoveredMap] = useState<number | null>(null);

    useEffect(() => {
        fetchBPData();
    }, [tournament.id, tournament.current_stage]);

    const fetchBPData = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/tournaments/${tournament.id}/ban-pick?stage=${tournament.current_stage}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch BP data: ${response.status}`);
            }

            const data = await response.json();
            setBpData(data);
        } catch (err) {
            console.error("Error fetching BP data:", err);
            setError(err instanceof Error ? err.message : "Failed to load BP data");
        } finally {
            setLoading(false);
        }
    };

    const handleMapClick = async (map: MapPoolItem) => {
        if (!selectedAction) {
            return;
        }

        const [teamColor, action] = selectedAction.split('-') as ['red' | 'blue', 'ban' | 'pick'];

        try {
            const response = await fetch(`/api/tournaments/${tournament.id}/ban-pick`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    mapPoolId: map.id,
                    teamColor,
                    action,
                    stage: tournament.current_stage,
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to save BP record: ${response.status}`);
            }

            // 重新获取数据
            await fetchBPData();
        } catch (err) {
            console.error("Error saving BP record:", err);
            setError(err instanceof Error ? err.message : "Failed to save BP record");
        }
    };

    const handleClearMap = async (mapId: number) => {
        try {
            const response = await fetch(
                `/api/tournaments/${tournament.id}/ban-pick?mapPoolId=${mapId}&stage=${tournament.current_stage}`,
                { method: 'DELETE' }
            );

            if (!response.ok) {
                throw new Error(`Failed to clear BP record: ${response.status}`);
            }

            await fetchBPData();
        } catch (err) {
            console.error("Error clearing BP record:", err);
            setError(err instanceof Error ? err.message : "Failed to clear BP record");
        }
    };

    const getMapStatus = (map: MapPoolItem) => {
        if (!bpData?.bpRecords[map.id]) {
            return null;
        }

        const record = bpData.bpRecords[map.id];
        return {
            teamColor: record.team_color,
            action: record.action,
        };
    };

    const getMapCardClass = (map: MapPoolItem) => {
        const status = getMapStatus(map);
        let baseClass = styles.mapCard;

        if (status) {
            if (status.action === 'ban') {
                baseClass = styles.mapCardBanned;
            } else {
                baseClass = styles.mapCardPicked;
            }
        } else if (selectedAction) {
            baseClass = styles.mapCardSelected;
        } else if (hoveredMap === map.id) {
            baseClass = styles.mapCardHover;
        }

        return baseClass;
    };

    const getActionButtonColor = (action: ActionType) => {
        if (selectedAction === action) {
            return "primary";
        }
        return "secondary";
    };

    const renderModSection = (mod: string, maps: MapPoolItem[]) => {
        return (
            <div key={mod} className={styles.modSection}>
                <div className={styles.modHeader}>
                    {mod.toUpperCase()} ({maps.length} 张图)
                </div>
                <div className={styles.mapsGrid}>
                    {maps.map((map) => {
                        const status = getMapStatus(map);
                        return (
                            <div
                                key={map.id}
                                className={getMapCardClass(map)}
                                onClick={() => status ? handleClearMap(map.id) : handleMapClick(map)}
                                onMouseEnter={() => setHoveredMap(map.id)}
                                onMouseLeave={() => setHoveredMap(null)}
                            >
                                <div className={styles.mapCardContent}>
                                    {status && (
                                        <div className={styles.statusBadge}>
                                            <Badge
                                                appearance="filled"
                                                color={status.teamColor === 'red' ? 'danger' : 'brand'}
                                                size="small"
                                            >
                                                {status.teamColor === 'red' ? '🔴' : '🔵'}
                                            </Badge>
                                        </div>
                                    )}
                                    <div className={styles.mapMod}>
                                        {map.mod_value}
                                    </div>
                                    {map.cover_url && (
                                        <img
                                            src={map.cover_url}
                                            alt={map.title}
                                            className={styles.mapCover}
                                        />
                                    )}
                                    <div className={styles.mapTitle}>
                                        {map.title}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <Card>
                    <CardHeader header={<Title3>加载BP数据中...</Title3>} />
                </Card>
            </div>
        );
    }

    if (error || !bpData) {
        return (
            <div className={styles.container}>
                <Card>
                    <CardHeader header={<Title3>BP记分板</Title3>} />
                    <Text>加载失败：{error || "无法获取数据"}</Text>
                    <Button onClick={fetchBPData} style={{ marginTop: "12px" }}>
                        重试
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* 操作面板 */}
            <Card className={styles.controlPanel}>
                <CardHeader
                    header={<Title3>BP操作面板</Title3>}
                    description="选择操作类型后点击图谱进行标记"
                />
                <div className={styles.actionButtons}>
                    <ToggleButton
                        appearance={getActionButtonColor('red-ban')}
                        checked={selectedAction === 'red-ban'}
                        onClick={() => setSelectedAction(selectedAction === 'red-ban' ? null : 'red-ban')}
                        className={styles.actionButton}
                    >
                        🔴 红队禁用
                    </ToggleButton>
                    <ToggleButton
                        appearance={getActionButtonColor('red-pick')}
                        checked={selectedAction === 'red-pick'}
                        onClick={() => setSelectedAction(selectedAction === 'red-pick' ? null : 'red-pick')}
                        className={styles.actionButton}
                    >
                        🔴 红队选择
                    </ToggleButton>
                    <ToggleButton
                        appearance={getActionButtonColor('blue-ban')}
                        checked={selectedAction === 'blue-ban'}
                        onClick={() => setSelectedAction(selectedAction === 'blue-ban' ? null : 'blue-ban')}
                        className={styles.actionButton}
                    >
                        🔵 蓝队禁用
                    </ToggleButton>
                    <ToggleButton
                        appearance={getActionButtonColor('blue-pick')}
                        checked={selectedAction === 'blue-pick'}
                        onClick={() => setSelectedAction(selectedAction === 'blue-pick' ? null : 'blue-pick')}
                        className={styles.actionButton}
                    >
                        🔵 蓝队选择
                    </ToggleButton>
                </div>
                {selectedAction && (
                    <Text style={{ color: tokens.colorBrandForeground1 }}>
                        当前选择：{selectedAction === 'red-ban' ? '🔴 红队禁用' :
                            selectedAction === 'red-pick' ? '🔴 红队选择' :
                                selectedAction === 'blue-ban' ? '🔵 蓝队禁用' :
                                    '🔵 蓝队选择'}
                        （点击图谱标记，点击已标记的图谱清除标记）
                    </Text>
                )}
            </Card>

            {/* 图池展示区 */}
            <Card>
                <CardHeader
                    header={<Title3>图池展示</Title3>}
                    description={`当前阶段: ${tournament.current_stage.toUpperCase()}`}
                />
                <div className={styles.mapPoolSection}>
                    {Object.keys(bpData.mapsByMod).length > 0 ? (
                        Object.entries(bpData.mapsByMod)
                            .sort(([a], [b]) => a.localeCompare(b))
                            .map(([mod, maps]) => renderModSection(mod, maps))
                    ) : (
                        <Text style={{ textAlign: "center", padding: "40px" }}>
                            当前阶段暂无图池数据
                        </Text>
                    )}
                </div>
            </Card>
        </div>
    );
}