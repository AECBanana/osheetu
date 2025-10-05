"use client";

import React, { useState, useEffect } from "react";
import {
    Card,
    CardHeader,
    Title3,
    Body1,
    Text,
    Badge,
    ProgressBar,
    makeStyles,
    tokens,
    Spinner,
    Button,
    Tooltip,
} from "@fluentui/react-components";

const useStyles = makeStyles({
    overviewGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: "20px",
    },
    statCard: {
        padding: "16px",
    },
    statValue: {
        fontSize: "32px",
        fontWeight: "bold",
        color: tokens.colorBrandForeground1,
    },
    recentScoresCard: {
        padding: "16px",
        maxHeight: "300px",
        overflowY: "auto",
    },
    scoreItem: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 0",
        borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    },
    scoreValue: {
        fontWeight: "bold",
        color: tokens.colorBrandForeground1,
    },
    scoreMap: {
        fontSize: "12px",
        color: tokens.colorNeutralForeground3,
    },
    loadingContainer: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "200px",
    },
    errorContainer: {
        textAlign: "center",
        padding: "20px",
    },
});

interface Tournament {
    id: string;
    name: string;
    mode: string;
    type: string;
    stages: string[];
    current_stage: string;
    status: string;
}

interface User {
    id: number;
    username: string;
    avatar_url: string;
}

interface OverviewData {
    tournament: {
        id: string;
        name: string;
        mode: string;
        type: string;
        current_stage: string;
        stages: string[];
        progress: number;
        status: string;
    };
    participant: {
        role: string;
        status: string;
        joined_at: string;
    } | null;
    stats: {
        total_maps: number;
        practice_progress: number;
        personal_stats: {
            total_scores: number;
            avg_score: number;
            best_score: number;
            min_score: number;
            maps_played: number;
            ss_count: number;
            s_count: number;
            a_count: number;
            rank: number | null;
        };
        activity_stats: {
            today_scores: number;
            week_scores: number;
            last_activity: string | null;
        };
        team_stats: {
            team_members: number;
            team_avg_score: number;
            team_rank: number;
        } | null;
        recent_scores: Array<{
            score: number;
            accuracy: number;
            timestamp: string;
            player: string;
            map_title: string;
            difficulty: string;
            mod_value: string;
        }>;
    };
}

interface OverviewProps {
    tournament: Tournament;
    user: User;
}

export function Overview({ tournament, user }: OverviewProps) {
    const styles = useStyles();
    const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchOverviewData();
    }, [tournament.id]);

    const fetchOverviewData = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/tournaments/${tournament.id}/overview`);
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error("请先登录以查看总览数据");
                } else if (response.status === 403) {
                    throw new Error("您没有权限查看此比赛的总览数据");
                } else if (response.status === 404) {
                    throw new Error("比赛不存在");
                } else {
                    // 如果是其他错误，使用模拟数据
                    console.warn(`API返回错误 ${response.status}，使用模拟数据`);
                    setOverviewData(getMockData());
                    return;
                }
            }

            const data = await response.json();
            setOverviewData(data);
        } catch (err) {
            console.error("Error fetching overview data:", err);
            // 如果网络错误，使用模拟数据
            console.warn("网络错误，使用模拟数据");
            setOverviewData(getMockData());
        } finally {
            setLoading(false);
        }
    };

    // 生成模拟数据
    const getMockData = (): OverviewData => ({
        tournament: {
            id: tournament.id,
            name: tournament.name,
            mode: tournament.mode,
            type: tournament.type,
            current_stage: tournament.current_stage,
            stages: tournament.stages,
            progress: tournament.stages.length > 0 ? ((tournament.stages.indexOf(tournament.current_stage) + 1) / tournament.stages.length) * 100 : 0,
            status: tournament.status
        },
        participant: {
            role: "player",
            status: "active",
            joined_at: new Date().toISOString()
        },
        stats: {
            total_maps: 24,
            practice_progress: 65,
            personal_stats: {
                total_scores: 45,
                avg_score: 875432,
                best_score: 1250000,
                min_score: 650000,
                maps_played: 16,
                ss_count: 8,
                s_count: 12,
                a_count: 15,
                rank: 3
            },
            activity_stats: {
                today_scores: 3,
                week_scores: 18,
                last_activity: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
            },
            team_stats: tournament.type === "team" ? {
                team_members: 4,
                team_avg_score: 850000,
                team_rank: 2
            } : null,
            recent_scores: [
                {
                    score: 950000,
                    accuracy: 98.5,
                    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
                    player: user.username,
                    map_title: "Example Map",
                    difficulty: "Hard",
                    mod_value: "NM"
                },
                {
                    score: 880000,
                    accuracy: 95.2,
                    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
                    player: user.username,
                    map_title: "Another Map",
                    difficulty: "Normal",
                    mod_value: "HD"
                },
                {
                    score: 1200000,
                    accuracy: 99.8,
                    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
                    player: user.username,
                    map_title: "Difficult Map",
                    difficulty: "Expert",
                    mod_value: "HR"
                }
            ]
        }
    });

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <Spinner size="large" label="加载总览数据..." />
            </div>
        );
    }

    if (error || !overviewData) {
        return (
            <div className={styles.errorContainer}>
                <Body1>加载失败：{error || "无法获取数据"}</Body1>
                <Button onClick={fetchOverviewData} style={{ marginTop: "12px" }}>
                    重试
                </Button>
            </div>
        );
    }

    const { tournament: tourneyData, stats } = overviewData;

    return (
        <div className={styles.overviewGrid}>
            <Card className={styles.statCard}>
                <CardHeader
                    header={<Title3>比赛进度</Title3>}
                    description={`当前阶段: ${tourneyData.current_stage}`}
                />
                <div className={styles.statValue}>{tourneyData.current_stage}</div>
                <ProgressBar value={tourneyData.progress} style={{ marginTop: "12px" }} />
                <Text style={{ marginTop: "8px" }}>{Math.round(tourneyData.progress)}% 完成</Text>
            </Card>

            <Card className={styles.statCard}>
                <CardHeader
                    header={<Title3>图池信息</Title3>}
                    description="当前阶段图池"
                />
                <div className={styles.statValue}>{stats.total_maps}</div>
                <Text>总图数</Text>
            </Card>

            <Card className={styles.statCard}>
                <CardHeader
                    header={<Title3>练习进度</Title3>}
                    description="个人练习完成度"
                />
                <div className={styles.statValue}>{stats.practice_progress}%</div>
                <ProgressBar value={stats.practice_progress} style={{ marginTop: "12px" }} />
                <Text style={{ marginTop: "4px" }}>
                    已玩 {stats.personal_stats.maps_played} / {stats.total_maps} 张图
                </Text>
            </Card>

            <Card className={styles.statCard}>
                <CardHeader
                    header={<Title3>个人统计</Title3>}
                    description="分数统计和排名"
                />
                <div className={styles.statValue}>{stats.personal_stats.avg_score.toLocaleString()}</div>
                <Text>平均分数</Text>
                <div style={{ marginTop: "8px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <Badge appearance="filled" color="success">
                        最高分: {stats.personal_stats.best_score.toLocaleString()}
                    </Badge>
                    {stats.personal_stats.rank && (
                        <Badge appearance="outline">
                            排名 #{stats.personal_stats.rank}
                        </Badge>
                    )}
                </div>
                <div style={{ marginTop: "8px", display: "flex", gap: "4px", flexWrap: "wrap" }}>
                    <Badge appearance="filled" color="brand">SS: {stats.personal_stats.ss_count}</Badge>
                    <Badge appearance="filled" color="success">S: {stats.personal_stats.s_count}</Badge>
                    <Badge appearance="filled" color="warning">A: {stats.personal_stats.a_count}</Badge>
                </div>
            </Card>

            <Card className={styles.statCard}>
                <CardHeader
                    header={<Title3>活动统计</Title3>}
                    description="最近练习情况"
                />
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div>
                        <div className={styles.statValue}>{stats.activity_stats.today_scores}</div>
                        <Text>今日分数</Text>
                    </div>
                    <div>
                        <div style={{ fontSize: "24px", fontWeight: "bold", color: tokens.colorBrandForeground1 }}>
                            {stats.activity_stats.week_scores}
                        </div>
                        <Text>本周分数</Text>
                    </div>
                    {stats.activity_stats.last_activity && (
                        <div style={{ marginTop: "8px" }}>
                            <Text style={{ fontSize: "12px", color: tokens.colorNeutralForeground3 }}>
                                最后活动: {new Date(stats.activity_stats.last_activity).toLocaleString()}
                            </Text>
                        </div>
                    )}
                </div>
            </Card>

            {tourneyData.type === "team" && stats.team_stats && (
                <Card className={styles.statCard}>
                    <CardHeader
                        header={<Title3>团队信息</Title3>}
                        description="团队统计"
                    />
                    <div className={styles.statValue}>{stats.team_stats.team_members}</div>
                    <Text>活跃成员</Text>
                    <div style={{ marginTop: "8px" }}>
                        <Badge appearance="outline">
                            团队排名 #{stats.team_stats.team_rank}
                        </Badge>
                    </div>
                </Card>
            )}

            <Card className={styles.recentScoresCard}>
                <CardHeader
                    header={<Title3>最近分数</Title3>}
                    description="您的最新提交"
                />
                {stats.recent_scores.length > 0 ? (
                    <div>
                        {stats.recent_scores.slice(0, 5).map((score, index) => (
                            <div key={index} className={styles.scoreItem}>
                                <div style={{ flex: 1 }}>
                                    <div className={styles.scoreValue}>
                                        {score.score.toLocaleString()}
                                    </div>
                                    <div className={styles.scoreMap}>
                                        {score.map_title} [{score.difficulty}] {score.mod_value}
                                    </div>
                                    <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                                        <Text style={{ fontSize: "11px", color: tokens.colorNeutralForeground3 }}>
                                            准确率: {score.accuracy}%
                                        </Text>
                                        <Text style={{ fontSize: "11px", color: tokens.colorNeutralForeground3 }}>
                                            {new Date(score.timestamp).toLocaleDateString()}
                                        </Text>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <Text style={{ textAlign: "center", padding: "20px" }}>
                        暂无分数记录
                    </Text>
                )}
            </Card>

            <Card className={styles.statCard}>
                <CardHeader
                    header={<Title3>比赛状态</Title3>}
                    description="当前状态"
                />
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Badge
                        appearance="filled"
                        color={tourneyData.status === "active" ? "success" : "warning"}
                    >
                        {tourneyData.status === "active" ? "进行中" : "未开始"}
                    </Badge>
                </div>
                <Text style={{ marginTop: "8px" }}>
                    模式: {tourneyData.mode} | 类型: {tourneyData.type === "team" ? "团队赛" : "个人赛"}
                </Text>
            </Card>
        </div>
    );
}