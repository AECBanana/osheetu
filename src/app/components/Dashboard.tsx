"use client";

import { useMemo, useEffect } from "react";
import {
    Title2,
    Title3,
    Card,
    CardHeader,
    Button,
    Badge,
    Text,
    Body1,
    Caption1,
    makeStyles,
    MessageBar,
} from "@fluentui/react-components";
import { Overview } from "./tournament/Overview";
import { MapPool } from "./tournament/MapPool";
import { ScoreSubmission } from "./tournament/ScoreSubmission";
import { PracticeChart } from "./tournament/PracticeChart";
import { OpponentAnalysis } from "./tournament/OpponentAnalysis";
import { BanPickBoard } from "./tournament/BanPickBoard";
import { useUserSession, type AuthorizedTournament } from "../../utils/hooks";

const useStyles = makeStyles({
    container: {
        display: "flex",
        flexDirection: "column",
        gap: "24px",
    },
    noAccessCard: {
        padding: "32px",
        textAlign: "center",
    },
    userInfo: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        marginBottom: "16px",
    },
    avatar: {
        width: "48px",
        height: "48px",
        borderRadius: "50%",
    },
});

interface DashboardProps {
    user: any;
    selectedTab: string;
    tournaments: AuthorizedTournament[];
    tournamentsLoading: boolean;
    tournamentsError: string | null;
    onRetryTournaments: () => void | Promise<unknown>;
    selectedTournamentId: string | null;
    onSelectTournament: (id: string) => void;
}

export function Dashboard({
    user: propUser,
    selectedTab,
    tournaments,
    tournamentsLoading,
    tournamentsError,
    onRetryTournaments,
    selectedTournamentId,
    onSelectTournament,
}: DashboardProps) {
    const styles = useStyles();
    
    // 使用自定义会话钩子获取用户信息
    const { user: sessionUser, loading, error, refreshSession } = useUserSession();
    const user = sessionUser || propUser; // 优先使用session中的用户信息

    const selectedTournament = useMemo(() => {
        if (!tournaments || tournaments.length === 0) {
            return null;
        }
        if (selectedTournamentId) {
            const matched = tournaments.find((item) => item.id === selectedTournamentId);
            if (matched) {
                return matched;
            }
        }
        return tournaments[0];
    }, [tournaments, selectedTournamentId]);

    useEffect(() => {
        if (tournaments.length === 0) {
            return;
        }

        if (!selectedTournament) {
            onSelectTournament(tournaments[0].id);
            return;
        }

        if (selectedTournamentId !== selectedTournament.id) {
            onSelectTournament(selectedTournament.id);
        }
    }, [selectedTournament, selectedTournamentId, tournaments, onSelectTournament]);

    // 处理用户会话加载状态
    if (loading) {
        return (
            <div className={styles.container}>
                <Card>
                    <CardHeader header={<Title3>加载用户信息中...</Title3>} />
                </Card>
            </div>
        );
    }

    // 处理用户会话错误
    if (error) {
        return (
            <div className={styles.container}>
                <Card>
                    <CardHeader header={<Title3>会话错误</Title3>} />
                    <MessageBar intent="error">{error}</MessageBar>
                    <Button onClick={refreshSession} style={{ marginTop: "12px" }}>重新加载</Button>
                </Card>
            </div>
        );
    }

    // 处理比赛数据加载状态
    if (tournamentsLoading) {
        return (
            <div className={styles.container}>
                <Card>
                    <CardHeader header={<Title3>加载比赛数据中...</Title3>} />
                </Card>
            </div>
        );
    }

    if (tournamentsError) {
        return (
            <div className={styles.container}>
                <Card className={styles.noAccessCard}>
                    <CardHeader
                        header={<Title2>无法加载比赛</Title2>}
                        description="拉取您可访问的比赛时发生错误。"
                    />
                    <MessageBar intent="error" style={{ marginTop: "16px" }}>
                        {tournamentsError}
                    </MessageBar>
                    <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "16px" }}>
                        <Button appearance="primary" onClick={() => { void onRetryTournaments(); }}>
                            重试
                        </Button>
                        <Button onClick={refreshSession}>刷新会话</Button>
                    </div>
                </Card>
            </div>
        );
    }

    // 检查用户是否存在
    if (!user) {
        return (
            <div className={styles.container}>
                <Card className={styles.noAccessCard}>
                    <CardHeader
                        header={<Title2>请先登录</Title2>}
                        description="您需要登录后才能访问比赛数据。"
                    />
                </Card>
            </div>
        );
    }

    // 检查用户是否属于任何比赛组（仅在没有匹配的比赛时提醒）
    if ((!user.groups || user.groups.length === 0) && tournaments.length === 0) {
        return (
            <div className={styles.container}>
                <Card className={styles.noAccessCard}>
                    <CardHeader
                        header={<Title2>暂无访问权限</Title2>}
                        description="您目前没有参与任何比赛分组，请联系管理员添加权限。"
                    />
                    <MessageBar intent="info" style={{ marginTop: "16px" }}>
                        如果您应该有访问权限，请联系比赛管理员。
                    </MessageBar>
                </Card>
            </div>
        );
    }

    if (tournaments.length === 0) {
        return (
            <div className={styles.container}>
                <Card className={styles.noAccessCard}>
                    <CardHeader
                        header={<Title2>暂无活跃比赛</Title2>}
                        description="当前没有正在进行的比赛。"
                    />
                </Card>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* 用户信息 */}
            <div className={styles.userInfo}>
                <img src={user.avatar_url} alt={user.username} className={styles.avatar} />
                <div>
                    <Text weight="semibold">{user.username}</Text>
                    <Caption1 style={{ display: "block" }}>
                        参与比赛: {tournaments.length} 个
                    </Caption1>
                </div>
            </div>

            {/* 比赛选择 */}
            {tournaments.length > 1 && (
                <Card>
                    <CardHeader header={<Title3>选择比赛</Title3>} />
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", padding: "0 16px 16px" }}>
                        {tournaments.map((tournament) => (
                            <Button
                                key={tournament.id}
                                appearance={selectedTournament?.id === tournament.id ? "primary" : "outline"}
                                onClick={() => onSelectTournament(tournament.id)}
                            >
                                {tournament.name}
                                <Badge
                                    appearance="filled"
                                    color={tournament.status === "active" ? "success" : "warning"}
                                    style={{ marginLeft: "8px" }}
                                >
                                    {tournament.current_stage}
                                </Badge>
                            </Button>
                        ))}
                    </div>
                </Card>
            )}

            {selectedTournament && (
                <>
                    {/* 比赛信息 */}
                    <Card>
                        <CardHeader
                            header={<Title2>{selectedTournament.name}</Title2>}
                            description={`模式: ${selectedTournament.mode.toUpperCase()} | 类型: ${selectedTournament.type === 'team' ? '团队赛' : '个人赛'} | 当前阶段: ${selectedTournament.current_stage.toUpperCase()}`}
                        />
                    </Card>

                    {/* 标签页内容 */}
                    <div>
                        {selectedTab === "overview" && <Overview tournament={selectedTournament} user={user} />}
                        {selectedTab === "mappool" && <MapPool tournament={selectedTournament} user={user} />}
                        {selectedTab === "scores" && <ScoreSubmission tournament={selectedTournament} user={user} />}
                        {selectedTab === "practice" && <PracticeChart tournament={selectedTournament} user={user} />}
                        {selectedTab === "analysis" && <OpponentAnalysis tournament={selectedTournament} user={user} />}
                        {selectedTab === "banpick" && <BanPickBoard tournament={selectedTournament} user={user} />}
                    </div>
                </>
            )}
        </div>
    );
}