"use client";

import { useState, useEffect } from "react";
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
import { useUserSession } from '../../utils/hooks';

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

type TournamentMode = 'osu' | 'taiko' | 'mania' | 'catch';
type TournamentType = 'team' | 'player';
type TournamentStatus = 'active' | 'completed' | 'upcoming';
type ParticipantRole = 'player' | 'captain' | 'referee' | 'staff';
type ParticipantStatus = 'active' | 'pending' | 'banned';

interface TournamentParticipantInfo {
    role: ParticipantRole;
    status: ParticipantStatus;
    joined_at: string;
}

interface Tournament {
    id: string;
    name: string;
    mode: TournamentMode;
    type: TournamentType;
    stages: string[];
    current_stage: string;
    status: TournamentStatus;
    include_qualifier: boolean;
    allow_custom_mods: boolean;
    participant: TournamentParticipantInfo;
    can_manage_map_pool: boolean;
}

const ensureTournamentMode = (value: any): TournamentMode => {
    return value === "osu" || value === "taiko" || value === "mania" || value === "catch" ? value : "osu";
};

const ensureTournamentType = (value: any): TournamentType => {
    return value === "team" || value === "player" ? value : "team";
};

const ensureTournamentStatus = (value: any): TournamentStatus => {
    return value === "active" || value === "completed" || value === "upcoming" ? value : "active";
};

const ensureParticipantRole = (value: any): ParticipantRole => {
    return value === "captain" || value === "referee" || value === "staff" ? value : "player";
};

const ensureParticipantStatus = (value: any): ParticipantStatus => {
    return value === "pending" || value === "banned" ? value : "active";
};

interface DashboardProps {
    user: any; // 保持兼容性，但内部会使用useSession
    selectedTab: string;
}

export function Dashboard({ user: propUser, selectedTab }: DashboardProps) {
    const styles = useStyles();
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
    const [tournamentLoading, setTournamentLoading] = useState(true);
    const [tournamentError, setTournamentError] = useState<string | null>(null);
    
    // 使用自定义会话钩子获取用户信息
    const { user: sessionUser, loading, error, refreshSession } = useUserSession();
    const user = sessionUser || propUser; // 优先使用session中的用户信息

    useEffect(() => {
        if (!user) {
            setTournaments([]);
            setSelectedTournament(null);
            return;
        }

        let cancelled = false;

        const fetchAuthorizedTournaments = async () => {
            setTournamentLoading(true);
            setTournamentError(null);
            try {
                const response = await fetch("/api/tournaments/my", { cache: "no-store" });
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || "获取比赛数据失败");
                }

                const normalized = (Array.isArray(data.tournaments) ? data.tournaments : []).reduce(
                    (acc: Tournament[], rawItem: any) => {
                        const numericId = Number(rawItem?.id);
                        if (!Number.isFinite(numericId) || numericId <= 0) {
                            return acc;
                        }

                        const rawStages = Array.isArray(rawItem?.stages) ? rawItem.stages : [];
                        const stages = rawStages
                            .filter((stage: any) => typeof stage === "string" && stage.trim().length > 0)
                            .map((stage: string) => stage.trim());

                        const participant = rawItem?.participant ?? {};

                        const tournament: Tournament = {
                            id: String(numericId),
                            name: String(rawItem?.name ?? "未命名比赛"),
                            mode: ensureTournamentMode(rawItem?.mode),
                            type: ensureTournamentType(rawItem?.type),
                            stages,
                            current_stage: String(rawItem?.current_stage ?? (stages[0] ?? "")),
                            status: ensureTournamentStatus(rawItem?.status),
                            include_qualifier: Boolean(rawItem?.include_qualifier),
                            allow_custom_mods: Boolean(rawItem?.allow_custom_mods),
                            participant: {
                                role: ensureParticipantRole(participant?.role),
                                status: ensureParticipantStatus(participant?.status),
                                joined_at: String(participant?.joined_at ?? new Date().toISOString()),
                            },
                            can_manage_map_pool: Boolean(rawItem?.can_manage_map_pool),
                        };

                        acc.push(tournament);
                        return acc;
                    },
                    [] as Tournament[]
                );

                if (cancelled) {
                    return;
                }

                setTournaments(normalized);
                setSelectedTournament((prev) => {
                    if (normalized.length === 0) {
                        return null;
                    }
                    if (prev) {
                        const matched = normalized.find((t: Tournament) => t.id === prev.id);
                        if (matched) {
                            return matched;
                        }
                    }
                    return normalized[0];
                });
            } catch (error: any) {
                if (!cancelled) {
                    console.error("获取比赛数据失败:", error);
                    setTournamentError(error.message || "获取比赛数据失败");
                    setTournaments([]);
                    setSelectedTournament(null);
                }
            } finally {
                if (!cancelled) {
                    setTournamentLoading(false);
                }
            }
        };

        void fetchAuthorizedTournaments();

        return () => {
            cancelled = true;
        };
    }, [user]);

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
    if (tournamentLoading) {
        return (
            <div className={styles.container}>
                <Card>
                    <CardHeader header={<Title3>加载比赛数据中...</Title3>} />
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

    // 检查用户是否属于任何比赛组
    if (!user.groups || user.groups.length === 0) {
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
                                onClick={() => setSelectedTournament(tournament)}
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