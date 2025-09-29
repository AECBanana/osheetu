"use client";

import {
    Card,
    CardHeader,
    Title3,
    Text,
    ProgressBar,
    Badge,
    makeStyles,
    tokens,
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
        color: tokens.colorBrandForeground1,
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

interface PracticeData {
    mod: string;
    averageScore: number;
    progress: number;
    mapsPlayed: number;
    totalMaps: number;
}

interface PracticeChartProps {
    tournament: Tournament;
    user: User;
}

const mockPracticeData: PracticeData[] = [
    {
        mod: "NM",
        averageScore: 875432,
        progress: 85,
        mapsPlayed: 6,
        totalMaps: 7,
    },
    {
        mod: "HD",
        averageScore: 692847,
        progress: 60,
        mapsPlayed: 3,
        totalMaps: 5,
    },
    {
        mod: "HR",
        averageScore: 758291,
        progress: 75,
        mapsPlayed: 3,
        totalMaps: 4,
    },
    {
        mod: "DT",
        averageScore: 612485,
        progress: 50,
        mapsPlayed: 2,
        totalMaps: 4,
    },
    {
        mod: "FM",
        averageScore: 541203,
        progress: 33,
        mapsPlayed: 1,
        totalMaps: 3,
    },
    {
        mod: "TB",
        averageScore: 0,
        progress: 0,
        mapsPlayed: 0,
        totalMaps: 1,
    },
];

export function PracticeChart({ tournament, user }: PracticeChartProps) {
    const styles = useStyles();

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

    const getTotalProgress = () => {
        const totalMaps = mockPracticeData.reduce((sum, data) => sum + data.totalMaps, 0);
        const playedMaps = mockPracticeData.reduce((sum, data) => sum + data.mapsPlayed, 0);
        return Math.round((playedMaps / totalMaps) * 100);
    };

    const getOverallAverage = () => {
        const validScores = mockPracticeData.filter(data => data.averageScore > 0);
        if (validScores.length === 0) return 0;

        const totalScore = validScores.reduce((sum, data) => sum + data.averageScore, 0);
        return Math.round(totalScore / validScores.length);
    };

    return (
        <div>
            {/* 总览卡片 */}
            <Card style={{ marginBottom: "24px", padding: "16px" }}>
                <CardHeader
                    header={<Title3>练图表总览</Title3>}
                    description="展示各Mod类型的平均分数和练习进度"
                />

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "24px", marginTop: "16px" }}>
                    <div>
                        <Text weight="semibold">总体进度</Text>
                        <div className={styles.averageScore}>{getTotalProgress()}%</div>
                        <ProgressBar value={getTotalProgress()} />
                    </div>

                    <div>
                        <Text weight="semibold">整体平均分</Text>
                        <div className={styles.averageScore}>
                            {getOverallAverage().toLocaleString()}
                        </div>
                    </div>

                    <div>
                        <Text weight="semibold">已完成图数</Text>
                        <div className={styles.averageScore}>
                            {mockPracticeData.reduce((sum, data) => sum + data.mapsPlayed, 0)} / {mockPracticeData.reduce((sum, data) => sum + data.totalMaps, 0)}
                        </div>
                    </div>
                </div>
            </Card>

            {/* Mod详细进度 */}
            <div className={styles.chartGrid}>
                {mockPracticeData.map((data) => (
                    <Card key={data.mod} className={styles.practiceCard}>
                        <CardHeader
                            header={
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <Badge appearance="filled" color={getModColor(data.mod) as any}>
                                        {data.mod}
                                    </Badge>
                                    <Text weight="semibold">练习进度</Text>
                                </div>
                            }
                        />

                        <div className={styles.averageScore}>
                            {data.averageScore > 0 ? data.averageScore.toLocaleString() : "未开始"}
                        </div>

                        {data.averageScore > 0 && (
                            <Text style={{ display: "block", marginBottom: "12px" }}>
                                平均分数
                            </Text>
                        )}

                        <ProgressBar value={data.progress} />

                        <div className={styles.progressInfo}>
                            <Text size={200}>
                                {data.mapsPlayed} / {data.totalMaps} 图
                            </Text>
                            <Text size={200} weight="semibold">
                                {data.progress}%
                            </Text>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}