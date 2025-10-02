"use client";

import {
    Card,
    CardHeader,
    Title2,
    Title3,
    Button,
    Text,
    Badge,
    makeStyles,
} from "@fluentui/react-components";

const useStyles = makeStyles({
    infoGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "16px",
        marginBottom: "24px",
    },
    actionButtons: {
        display: "flex",
        gap: "12px",
        marginTop: "16px",
    },
});

interface Tournament {
    id: string;
    name: string;
    mode: string;
    type: string;
    status: string;
    created_at: string;
    participants: number;
}

interface ManageTournamentProps {
    tournament: Tournament;
    onUpdate: (tournament: Tournament) => void;
}

export function ManageTournament({ tournament, onUpdate }: ManageTournamentProps) {
    const styles = useStyles();

    const getStatusColor = (status: string) => {
        switch (status) {
            case "active": return "success";
            case "upcoming": return "warning";
            case "completed": return "brand";
            default: return "brand";
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case "active": return "进行中";
            case "upcoming": return "即将开始";
            case "completed": return "已完成";
            default: return status;
        }
    };

    return (
        <div>
            <Card style={{ padding: "16px", marginBottom: "24px" }}>
                <CardHeader
                    header={<Title2>管理比赛: {tournament.name}</Title2>}
                    description="配置比赛设置和管理参与者"
                />

                <div className={styles.infoGrid}>
                    <div>
                        <Text weight="semibold">比赛ID</Text>
                        <Text style={{ display: "block" }}>{tournament.id}</Text>
                    </div>

                    <div>
                        <Text weight="semibold">游戏模式</Text>
                        <Text style={{ display: "block" }}>{tournament.mode.toUpperCase()}</Text>
                    </div>

                    <div>
                        <Text weight="semibold">比赛类型</Text>
                        <Text style={{ display: "block" }}>
                            {tournament.type === "team" ? "团队赛" : "个人赛"}
                        </Text>
                    </div>

                    <div>
                        <Text weight="semibold">状态</Text>
                        <Badge
                            appearance="filled"
                            color={getStatusColor(tournament.status) as any}
                            style={{ marginTop: "4px" }}
                        >
                            {getStatusText(tournament.status)}
                        </Badge>
                    </div>

                    <div>
                        <Text weight="semibold">参与者数量</Text>
                        <Text style={{ display: "block" }}>{tournament.participants}</Text>
                    </div>
                </div>

                <div className={styles.actionButtons}>
                    <Button appearance="primary">
                        编辑基本信息
                    </Button>
                    <Button appearance="outline">
                        管理图池
                    </Button>
                    <Button appearance="outline">
                        管理参与者
                    </Button>
                    <Button appearance="outline">
                        查看统计
                    </Button>
                </div>
            </Card>

            {/* 功能卡片 */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
                <Card style={{ padding: "16px" }}>
                    <CardHeader
                        header={<Title3>图池管理</Title3>}
                        description="管理各阶段的图池"
                    />
                    <Text>配置各阶段的beatmap和mod类型</Text>
                    <Button appearance="primary" style={{ marginTop: "12px" }}>
                        管理图池
                    </Button>
                </Card>

                <Card style={{ padding: "16px" }}>
                    <CardHeader
                        header={<Title3>参与者管理</Title3>}
                        description="添加和管理参与者"
                    />
                    <Text>添加OSU玩家并分配权限</Text>
                    <Button appearance="primary" style={{ marginTop: "12px" }}>
                        管理参与者
                    </Button>
                </Card>

                <Card style={{ padding: "16px" }}>
                    <CardHeader
                        header={<Title3>赛程安排</Title3>}
                        description="配置比赛时间表"
                    />
                    <Text>设置各阶段的比赛时间</Text>
                    <Button appearance="primary" style={{ marginTop: "12px" }}>
                        设置赛程
                    </Button>
                </Card>

                <Card style={{ padding: "16px" }}>
                    <CardHeader
                        header={<Title3>数据统计</Title3>}
                        description="查看比赛数据和统计"
                    />
                    <Text>分析参与者表现和比赛数据</Text>
                    <Button appearance="primary" style={{ marginTop: "12px" }}>
                        查看统计
                    </Button>
                </Card>
            </div>
        </div>
    );
}