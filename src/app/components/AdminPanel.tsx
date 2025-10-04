"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Avatar,
    Badge,
    Body1,
    Button,
    Card,
    CardHeader,
    DataGrid,
    DataGridBody,
    DataGridCell,
    DataGridHeader,
    DataGridHeaderCell,
    DataGridRow,
    MessageBar,
    MessageBarBody,
    MessageBarTitle,
    SelectTabData,
    SelectTabEvent,
    Spinner,
    Tab,
    TabList,
    TableColumnDefinition,
    Text,
    Title2,
    Title3,
    createTableColumn,
    makeStyles,
} from "@fluentui/react-components";
import { ArrowClockwise24Regular } from "@fluentui/react-icons";
import { type User } from "../../utils/auth";
import { CreateTournament } from "./admin/CreateTournament";
import { ManageTournament, type TournamentSummary } from "./admin/ManageTournament";

const useStyles = makeStyles({
    container: {
        display: "flex",
        flexDirection: "column",
        gap: "24px",
    },
    tabContainer: {
        marginBottom: "24px",
    },
    actionButtons: {
        display: "flex",
        gap: "12px",
        marginBottom: "16px",
    },
    toolbar: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "12px",
        marginBottom: "16px",
    },
    messageBar: {
        marginBottom: "16px",
    },
    envGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        gap: "16px",
        padding: "16px",
    },
    envCard: {
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        padding: "12px",
        borderRadius: "12px",
        backgroundColor: "var(--colorNeutralBackground3)",
    },
    gridTitle: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "8px",
    },
});

interface AdminPanelProps {
    user: User;
}

interface AdminUser {
    id: number;
    osu_id: string;
    username: string;
    avatar_url: string | null;
    is_admin: boolean;
    groups: string[];
    created_at: string;
}

interface SystemInfo {
    timestamp: string;
    environment: {
        isProduction: boolean;
        isVercel: boolean;
    };
    environmentVariables: Record<string, string | boolean>;
    featureChecks: {
        osuLogin: { isConfigured: boolean; issues: string[] };
        nextAuth: { isConfigured: boolean; issues: string[] };
    };
    recommendations: string[];
}

export function AdminPanel({ user }: AdminPanelProps) {
    const styles = useStyles();
    const [selectedTab, setSelectedTab] = useState("tournaments");
    const [tournaments, setTournaments] = useState<TournamentSummary[]>([]);
    const [tournamentLoading, setTournamentLoading] = useState(true);
    const [tournamentError, setTournamentError] = useState<string | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [selectedTournamentId, setSelectedTournamentId] = useState<number | null>(null);
    const [globalMessage, setGlobalMessage] = useState<{ intent: "success" | "error"; text: string } | null>(null);

    const [users, setUsers] = useState<AdminUser[]>([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [usersError, setUsersError] = useState<string | null>(null);
    const [usersLoaded, setUsersLoaded] = useState(false);

    const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
    const [systemLoading, setSystemLoading] = useState(false);
    const [systemError, setSystemError] = useState<string | null>(null);
    const [systemLoaded, setSystemLoaded] = useState(false);

    const onTabSelect = (event: SelectTabEvent, data: SelectTabData) => {
        setSelectedTab(data.value as string);
        setGlobalMessage(null);
    };

    const fetchTournaments = useCallback(async () => {
        setTournamentLoading(true);
        setTournamentError(null);
        try {
            const response = await fetch("/api/admin/tournaments");
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "获取比赛列表失败");
            }
            setTournaments(data.tournaments);
        } catch (error: any) {
            setTournamentError(error.message || "获取比赛列表失败");
        } finally {
            setTournamentLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTournaments();
    }, [fetchTournaments]);

    const fetchUsers = useCallback(async () => {
        setUsersLoading(true);
        setUsersError(null);
        try {
            const response = await fetch("/api/admin/users");
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "获取用户列表失败");
            }
            setUsers(data.users);
            setUsersLoaded(true);
        } catch (error: any) {
            setUsersError(error.message || "获取用户列表失败");
        } finally {
            setUsersLoading(false);
        }
    }, []);

    const fetchSystemInfo = useCallback(async () => {
        setSystemLoading(true);
        setSystemError(null);
        try {
            const response = await fetch("/api/check-env");
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "获取系统信息失败");
            }
            setSystemInfo(data);
            setSystemLoaded(true);
        } catch (error: any) {
            setSystemError(error.message || "获取系统信息失败");
        } finally {
            setSystemLoading(false);
        }
    }, []);

    useEffect(() => {
        if (selectedTab === "users" && !usersLoaded && !usersLoading) {
            fetchUsers();
        }
    }, [fetchUsers, selectedTab, usersLoaded, usersLoading]);

    useEffect(() => {
        if (selectedTab === "system" && !systemLoaded && !systemLoading) {
            fetchSystemInfo();
        }
    }, [fetchSystemInfo, selectedTab, systemLoaded, systemLoading]);

    const handleTournamentCreated = useCallback((tournament: TournamentSummary) => {
        setShowCreateForm(false);
        setGlobalMessage({ intent: "success", text: `比赛 “${tournament.name}” 创建成功` });
        fetchTournaments();
    }, [fetchTournaments]);

    const handleTournamentUpdated = useCallback((updated: TournamentSummary) => {
        setTournaments((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        setGlobalMessage({ intent: "success", text: "比赛信息已更新" });
    }, []);

    const handleTournamentDeleted = useCallback((id: number) => {
        setTournaments((prev) => prev.filter((t) => t.id !== id));
        setGlobalMessage({ intent: "success", text: "比赛已删除" });
    }, []);

    const handleToggleAdmin = useCallback(async (userId: number, isAdmin: boolean) => {
        try {
            const response = await fetch("/api/admin/users", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ userId, isAdmin: !isAdmin }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "更新用户权限失败");
            }
            setUsers(data.users);
            setGlobalMessage({ intent: "success", text: "用户权限已更新" });
        } catch (error: any) {
            setGlobalMessage({ intent: "error", text: error.message || "更新用户权限失败" });
        }
    }, []);

    const tournamentColumns = useMemo<TableColumnDefinition<TournamentSummary>[]>(() => [
        createTableColumn<TournamentSummary>({
            columnId: "name",
            renderHeaderCell: () => "比赛名称",
            renderCell: (item) => (
                <div style={{ display: "flex", flexDirection: "column" }}>
                    <Text weight="semibold">{item.name}</Text>
                    <Text size={200} style={{ color: "var(--colorNeutralForeground3)" }}>
                        创建时间: {new Date(item.created_at).toLocaleString()}
                    </Text>
                </div>
            ),
        }),
        createTableColumn<TournamentSummary>({
            columnId: "mode",
            renderHeaderCell: () => "模式",
            renderCell: (item) => item.mode.toUpperCase(),
        }),
        createTableColumn<TournamentSummary>({
            columnId: "type",
            renderHeaderCell: () => "类型",
            renderCell: (item) => (item.type === "team" ? "团队赛" : "个人赛"),
        }),
        createTableColumn<TournamentSummary>({
            columnId: "status",
            renderHeaderCell: () => "状态",
            renderCell: (item) => {
                const map: Record<string, { text: string; color: "success" | "warning" | "brand" }> = {
                    active: { text: "进行中", color: "success" },
                    upcoming: { text: "即将开始", color: "warning" },
                    completed: { text: "已完成", color: "brand" },
                };
                const statusInfo = map[item.status] ?? { text: item.status, color: "brand" };
                return <Badge appearance="filled" color={statusInfo.color}>{statusInfo.text}</Badge>;
            },
        }),
        createTableColumn<TournamentSummary>({
            columnId: "participants",
            renderHeaderCell: () => "参与者",
            renderCell: (item) => item.participants,
        }),
        createTableColumn<TournamentSummary>({
            columnId: "actions",
            renderHeaderCell: () => "操作",
            renderCell: (item) => (
                <Button appearance="outline" size="small" onClick={() => setSelectedTournamentId(item.id)}>
                    管理
                </Button>
            ),
        }),
    ], []);

    const userColumns = useMemo<TableColumnDefinition<AdminUser>[]>(() => [
        createTableColumn<AdminUser>({
            columnId: "user",
            renderHeaderCell: () => "用户",
            renderCell: (item) => (
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <Avatar name={item.username} image={{ src: item.avatar_url ?? undefined }} size={32} />
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        <Text weight="semibold">{item.username}</Text>
                        <Text size={200} style={{ color: "var(--colorNeutralForeground3)" }}>
                            osu! ID: {item.osu_id}
                        </Text>
                    </div>
                </div>
            ),
        }),
        createTableColumn<AdminUser>({
            columnId: "groups",
            renderHeaderCell: () => "分组",
            renderCell: (item) => (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {item.groups.length === 0 ? (
                        <Text size={200} style={{ color: "var(--colorNeutralForeground3)" }}>未分组</Text>
                    ) : (
                        item.groups.map((group) => (
                            <Badge key={group} appearance="tint">{group}</Badge>
                        ))
                    )}
                </div>
            ),
        }),
        createTableColumn<AdminUser>({
            columnId: "is_admin",
            renderHeaderCell: () => "管理员",
            renderCell: (item) => (
                <Badge appearance="filled" color={item.is_admin ? "success" : "brand"}>
                    {item.is_admin ? "是" : "否"}
                </Badge>
            ),
        }),
        createTableColumn<AdminUser>({
            columnId: "created",
            renderHeaderCell: () => "加入时间",
            renderCell: (item) => new Date(item.created_at).toLocaleString(),
        }),
        createTableColumn<AdminUser>({
            columnId: "actions",
            renderHeaderCell: () => "操作",
            renderCell: (item) => (
                <Button appearance="outline" size="small" onClick={() => handleToggleAdmin(item.id, item.is_admin)}>
                    {item.is_admin ? "取消管理员" : "设为管理员"}
                </Button>
            ),
        }),
    ], [handleToggleAdmin]);

    const selectedTournament = useMemo(
        () => (selectedTournamentId ? tournaments.find((t) => t.id === selectedTournamentId) ?? null : null),
        [selectedTournamentId, tournaments]
    );

    if (!user.is_admin) {
        return (
            <Card style={{ padding: "32px", textAlign: "center" }}>
                <CardHeader
                    header={<Title2>访问被拒绝</Title2>}
                    description="您没有管理员权限访问此页面。"
                />
            </Card>
        );
    }

    if (showCreateForm) {
        return (
            <div className={styles.container}>
                <div className={styles.actionButtons}>
                    <Button
                        appearance="secondary"
                        onClick={() => setShowCreateForm(false)}
                    >
                        返回列表
                    </Button>
                </div>
                <CreateTournament
                    onCancel={() => setShowCreateForm(false)}
                    onSuccess={handleTournamentCreated}
                />
            </div>
        );
    }

    if (selectedTournament && selectedTournamentId !== null) {
        return (
            <div className={styles.container}>
                <div className={styles.actionButtons}>
                    <Button
                        appearance="secondary"
                        onClick={() => setSelectedTournamentId(null)}
                    >
                        返回列表
                    </Button>
                </div>
                <ManageTournament
                    tournamentId={selectedTournamentId}
                    onBack={() => setSelectedTournamentId(null)}
                    onUpdated={handleTournamentUpdated}
                    onDeleted={(id) => {
                        handleTournamentDeleted(id);
                        setSelectedTournamentId(null);
                    }}
                />
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {globalMessage && (
                <MessageBar className={styles.messageBar} intent={globalMessage.intent}>
                    <MessageBarBody>
                        <MessageBarTitle>{globalMessage.intent === "success" ? "操作成功" : "提示"}</MessageBarTitle>
                        {globalMessage.text}
                        <Button
                            appearance="subtle"
                            size="small"
                            style={{ marginLeft: "12px" }}
                            onClick={() => setGlobalMessage(null)}
                        >
                            关闭
                        </Button>
                    </MessageBarBody>
                </MessageBar>
            )}

            {/* 功能标签页 */}
            <div className={styles.tabContainer}>
                <TabList selectedValue={selectedTab} onTabSelect={onTabSelect}>
                    <Tab value="tournaments">比赛管理</Tab>
                    <Tab value="users">用户管理</Tab>
                    <Tab value="system">系统设置</Tab>
                </TabList>
            </div>

            {selectedTab === "tournaments" && (
                <div>
                    <div className={styles.toolbar}>
                        <div style={{ display: "flex", gap: "12px" }}>
                        <Button
                            appearance="primary"
                            onClick={() => setShowCreateForm(true)}
                        >
                            创建新比赛
                        </Button>
                        </div>
                        <Button
                            appearance="subtle"
                            icon={<ArrowClockwise24Regular />}
                            onClick={fetchTournaments}
                            disabled={tournamentLoading}
                        >
                            刷新
                        </Button>
                    </div>

                    <Card>
                        <CardHeader header={<Title3>比赛列表</Title3>} />
                        {tournamentError && (
                            <MessageBar intent="error" className={styles.messageBar}>
                                <MessageBarBody>
                                    <MessageBarTitle>加载失败</MessageBarTitle>
                                    {tournamentError}
                                </MessageBarBody>
                            </MessageBar>
                        )}
                        {tournamentLoading ? (
                            <div style={{ display: "flex", justifyContent: "center", padding: "24px" }}>
                                <Spinner size="large" label="加载比赛列表" />
                            </div>
                        ) : (
                            <DataGrid
                                items={tournaments}
                                columns={tournamentColumns}
                                getRowId={(item) => item.id}
                            >
                                <DataGridHeader>
                                    <DataGridRow>
                                        {({ renderHeaderCell }) => (
                                            <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                                        )}
                                    </DataGridRow>
                                </DataGridHeader>
                                <DataGridBody<TournamentSummary>>
                                    {({ item, rowId }) => (
                                        <DataGridRow<TournamentSummary> key={rowId}>
                                            {({ renderCell }) => (
                                                <DataGridCell>{renderCell(item)}</DataGridCell>
                                            )}
                                        </DataGridRow>
                                    )}
                                </DataGridBody>
                            </DataGrid>
                        )}
                    </Card>
                </div>
            )}

            {selectedTab === "users" && (
                <Card>
                    <CardHeader
                        header={<Title3>用户管理</Title3>}
                        description="管理用户权限和比赛分组"
                    />
                    {usersError && (
                        <MessageBar intent="error" className={styles.messageBar}>
                            <MessageBarBody>
                                <MessageBarTitle>加载失败</MessageBarTitle>
                                {usersError}
                            </MessageBarBody>
                        </MessageBar>
                    )}
                    <div className={styles.actionButtons}>
                        <Button
                            appearance="subtle"
                            icon={<ArrowClockwise24Regular />}
                            onClick={fetchUsers}
                            disabled={usersLoading}
                        >
                            刷新
                        </Button>
                    </div>
                    {usersLoading ? (
                        <div style={{ display: "flex", justifyContent: "center", padding: "24px" }}>
                            <Spinner size="large" label="加载用户列表" />
                        </div>
                    ) : (
                        <DataGrid
                            items={users}
                            columns={userColumns}
                            getRowId={(item) => item.id}
                        >
                            <DataGridHeader>
                                <DataGridRow>
                                    {({ renderHeaderCell }) => (
                                        <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                                    )}
                                </DataGridRow>
                            </DataGridHeader>
                            <DataGridBody<AdminUser>>
                                {({ item, rowId }) => (
                                    <DataGridRow<AdminUser> key={rowId}>
                                        {({ renderCell }) => (
                                            <DataGridCell>{renderCell(item)}</DataGridCell>
                                        )}
                                    </DataGridRow>
                                )}
                            </DataGridBody>
                        </DataGrid>
                    )}
                </Card>
            )}

            {selectedTab === "system" && (
                <Card>
                    <CardHeader
                        header={<Title3>系统设置</Title3>}
                        description="配置系统参数和 OSU API 设置"
                    />
                    {systemError && (
                        <MessageBar intent="error" className={styles.messageBar}>
                            <MessageBarBody>
                                <MessageBarTitle>加载失败</MessageBarTitle>
                                {systemError}
                            </MessageBarBody>
                        </MessageBar>
                    )}
                    <div className={styles.actionButtons}>
                        <Button
                            appearance="subtle"
                            icon={<ArrowClockwise24Regular />}
                            onClick={fetchSystemInfo}
                            disabled={systemLoading}
                        >
                            刷新
                        </Button>
                    </div>
                    {systemLoading ? (
                        <div style={{ display: "flex", justifyContent: "center", padding: "24px" }}>
                            <Spinner size="large" label="加载系统信息" />
                        </div>
                    ) : systemInfo ? (
                        <div>
                            <div className={styles.envGrid}>
                                <div className={styles.envCard}>
                                    <div className={styles.gridTitle}>
                                        <Text weight="semibold">运行环境</Text>
                                        <Badge appearance="filled" color={systemInfo.environment.isProduction ? "brand" : "success"}>
                                            {systemInfo.environment.isProduction ? "Production" : "Development"}
                                        </Badge>
                                    </div>
                                    <Text size={200} style={{ color: "var(--colorNeutralForeground3)" }}>
                                        部署平台: {systemInfo.environment.isVercel ? "Vercel" : "自托管"}
                                    </Text>
                                    <Text size={200} style={{ color: "var(--colorNeutralForeground3)" }}>
                                        更新时间: {new Date(systemInfo.timestamp).toLocaleString()}
                                    </Text>
                                </div>
                                <div className={styles.envCard}>
                                    <Text weight="semibold">OSU 登录配置</Text>
                                    <Badge appearance="filled" color={systemInfo.featureChecks.osuLogin.isConfigured ? "success" : "danger"}>
                                        {systemInfo.featureChecks.osuLogin.isConfigured ? "已配置" : "缺失配置"}
                                    </Badge>
                                    {systemInfo.featureChecks.osuLogin.issues.map((issue: string) => (
                                        <Text key={issue} size={200} style={{ color: "var(--colorPaletteRedForeground2)" }}>
                                            • {issue}
                                        </Text>
                                    ))}
                                </div>
                                <div className={styles.envCard}>
                                    <Text weight="semibold">NextAuth 配置</Text>
                                    <Badge appearance="filled" color={systemInfo.featureChecks.nextAuth.isConfigured ? "success" : "danger"}>
                                        {systemInfo.featureChecks.nextAuth.isConfigured ? "已配置" : "缺失配置"}
                                    </Badge>
                                    {systemInfo.featureChecks.nextAuth.issues.map((issue: string) => (
                                        <Text key={issue} size={200} style={{ color: "var(--colorPaletteRedForeground2)" }}>
                                            • {issue}
                                        </Text>
                                    ))}
                                </div>
                            </div>
                            <div style={{ padding: "16px" }}>
                                <Title3>建议</Title3>
                                <ul>
                                    {systemInfo.recommendations.map((item: string) => (
                                        <li key={item}>
                                            <Text size={200}>{item}</Text>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ) : (
                        <Body1 style={{ padding: "16px" }}>暂无系统信息，请刷新重试。</Body1>
                    )}
                </Card>
            )}
        </div>
    );
}