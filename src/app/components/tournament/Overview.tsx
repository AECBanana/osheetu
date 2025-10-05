"use client";

import React from "react";
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
});

interface Tournament {
    id: string;
    name: string;
    mode: string;
    type: string;
    stages: string[];
    current_stage: string;
    status: string;
    participant: {
        role: string;
        status: string;
        joined_at: string;
    };
}

interface User {
    id: number;
    username: string;
    avatar_url: string;
}

interface OverviewProps {
    tournament: Tournament;
    user: User;
}

export function Overview({ tournament, user }: OverviewProps) {
    const styles = useStyles();

    // 模拟统计数据
    const stats = {
        totalMaps: 24,
        practiceProgress: 65,
        averageScore: 875432,
        rank: 8,
        teamMembers: 4,
    };

    return (
        <div className={styles.overviewGrid}>
            <Card className={styles.statCard}>
                <CardHeader
                    header={<Title3>比赛进度</Title3>}
                    description="当前阶段完成情况"
                />
                <div className={styles.statValue}>{tournament.current_stage.toUpperCase()}</div>
                <ProgressBar value={65} style={{ marginTop: "12px" }} />
                <Text style={{ marginTop: "8px" }}>65% 完成</Text>
            </Card>

            <Card className={styles.statCard}>
                <CardHeader
                    header={<Title3>图池信息</Title3>}
                    description="当前阶段图池"
                />
                <div className={styles.statValue}>{stats.totalMaps}</div>
                <Text>总图数</Text>
            </Card>

            <Card className={styles.statCard}>
                <CardHeader
                    header={<Title3>练习进度</Title3>}
                    description="个人练习完成度"
                />
                <div className={styles.statValue}>{stats.practiceProgress}%</div>
                <ProgressBar value={stats.practiceProgress} style={{ marginTop: "12px" }} />
            </Card>

            <Card className={styles.statCard}>
                <CardHeader
                    header={<Title3>平均分数</Title3>}
                    description="最近10局平均"
                />
                <div className={styles.statValue}>{stats.averageScore.toLocaleString()}</div>
                <Badge appearance="filled" color="success">
                    排名 #{stats.rank}
                </Badge>
            </Card>

            {tournament.type === "team" && (
                <Card className={styles.statCard}>
                    <CardHeader
                        header={<Title3>团队信息</Title3>}
                        description="团队成员状态"
                    />
                    <div className={styles.statValue}>{stats.teamMembers}</div>
                    <Text>活跃成员</Text>
                </Card>
            )}

            <Card className={styles.statCard}>
                <CardHeader
                    header={<Title3>下次比赛</Title3>}
                    description="即将进行的比赛"
                />
                <Text weight="semibold">2025-09-30 20:00</Text>
                <Text style={{ display: "block", marginTop: "4px" }}>vs Team Alpha</Text>
            </Card>
        </div>
    );
}