"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Avatar,
    Badge,
    Button,
    Card,
    CardHeader,
    DataGrid,
    DataGridBody,
    DataGridCell,
    DataGridHeader,
    DataGridHeaderCell,
    DataGridRow,
    Dialog,
    DialogActions,
    DialogBody,
    DialogContent,
    DialogSurface,
    DialogTitle,
    Field,
    Input,
    MessageBar,
    MessageBarBody,
    MessageBarTitle,
    Select,
    Spinner,
    Switch,
    TableColumnDefinition,
    Text,
    Title2,
    Title3,
    createTableColumn,
    makeStyles,
    useId,
} from "@fluentui/react-components";
import { Delete24Regular } from "@fluentui/react-icons";

const useStyles = makeStyles({
    container: {
        display: "flex",
        flexDirection: "column",
        gap: "24px",
    },
    infoGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "16px",
    },
    switchesRow: {
        display: "flex",
        flexWrap: "wrap",
        gap: "16px",
        marginTop: "16px",
    },
    actionsRow: {
        display: "flex",
        flexWrap: "wrap",
        gap: "12px",
        marginTop: "16px",
    },
    statsRow: {
        display: "flex",
        flexWrap: "wrap",
        gap: "24px",
        marginTop: "16px",
    },
    statCard: {
        display: "flex",
        flexDirection: "column",
        gap: "4px",
    },
    participantsForm: {
        display: "flex",
        flexWrap: "wrap",
        gap: "12px",
        alignItems: "flex-end",
        marginBottom: "16px",
        "@media (max-width: 600px)": {
            flexDirection: "column",
            alignItems: "stretch",
        },
    },
    formField: {
        flex: "1 1 240px",
        minWidth: "220px",
        "@media (max-width: 600px)": {
            width: "100%",
        },
    },
    actionWrapper: {
        display: "flex",
        alignItems: "flex-end",
        minWidth: "160px",
        "@media (max-width: 600px)": {
            width: "100%",
        },
    },
    addParticipantButton: {
        width: "100%",
    },
    participantCell: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
    },
    participantMeta: {
        display: "flex",
        flexDirection: "column",
        gap: "2px",
    },
    participantSelector: {
        display: "flex",
        flexDirection: "column",
        gap: "8px",
    },
    selectedUserCard: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        padding: "12px",
        borderRadius: "8px",
        backgroundColor: "var(--colorNeutralBackground3)",
    },
    selectedUserInfo: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
    },
    selectedUserMeta: {
        display: "flex",
        flexDirection: "column",
        gap: "2px",
    },
    userSearchRow: {
        display: "flex",
        gap: "12px",
        flexWrap: "wrap",
        alignItems: "flex-end",
        marginBottom: "16px",
    },
    userList: {
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        maxHeight: "360px",
        overflowY: "auto",
    },
    userListItem: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 12px",
        borderRadius: "8px",
        backgroundColor: "var(--colorNeutralBackground3)",
    },
    userListInfo: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
    },
    modalActions: {
        display: "flex",
        justifyContent: "flex-end",
        gap: "8px",
    },
    emptyState: {
        padding: "24px 0",
        textAlign: "center",
        color: "var(--colorNeutralForeground3)",
    },
});

type TournamentStatus = "active" | "completed" | "upcoming";
type TournamentMode = "osu" | "taiko" | "mania" | "catch";
type TournamentType = "team" | "player";
type ParticipantRole = "player" | "captain" | "referee" | "staff";
type ParticipantStatus = "active" | "pending" | "banned";

interface TournamentDetail {
    id: number;
    name: string;
    mode: TournamentMode;
    type: TournamentType;
    stages: string[];
    current_stage: string;
    status: TournamentStatus;
    include_qualifier: boolean;
    allow_custom_mods: boolean;
    settings: Record<string, any>;
    created_at: string;
    updated_at: string;
}

interface Participant {
    id: number;
    user_id: number;
    osu_id: string;
    username: string;
    avatar_url: string | null;
    role: ParticipantRole;
    status: ParticipantStatus;
    joined_at: string;
}

export interface TournamentSummary {
    id: number;
    name: string;
    mode: TournamentMode;
    type: TournamentType;
    status: TournamentStatus;
    current_stage: string;
    stages: string[];
    include_qualifier: boolean;
    allow_custom_mods: boolean;
    participants: number;
    created_at: string;
}

interface ManageTournamentProps {
    tournamentId: number;
    onBack: () => void;
    onUpdated: (tournament: TournamentSummary) => void;
    onDeleted: (id: number) => void;
}

interface FormState {
    name: string;
    status: TournamentStatus;
    currentStage: string;
    includeQualifier: boolean;
    allowCustomMods: boolean;
}

export function ManageTournament({ tournamentId, onBack, onUpdated, onDeleted }: ManageTournamentProps) {
    const styles = useStyles();

    const [detail, setDetail] = useState<TournamentDetail | null>(null);
    const [formState, setFormState] = useState<FormState | null>(null);
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [stats, setStats] = useState<{ map_count: number }>({ map_count: 0 });
    const [feedback, setFeedback] = useState<{ intent: "success" | "error"; text: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [participantBusy, setParticipantBusy] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [participantForm, setParticipantForm] = useState<{ user: SelectableUser | null; role: ParticipantRole; status: ParticipantStatus }>(() => ({
        user: null,
        role: "player",
        status: "active",
    }));
    const [userPickerOpen, setUserPickerOpen] = useState(false);
    const [availableUsers, setAvailableUsers] = useState<SelectableUser[]>([]);
    const [usersLoading, setUsersLoading] = useState(false);
    const [usersError, setUsersError] = useState<string | null>(null);
    const [userSearch, setUserSearch] = useState("");
    const [manualOsuId, setManualOsuId] = useState("");
    const [manualLoading, setManualLoading] = useState(false);
    const [manualError, setManualError] = useState<string | null>(null);
    const [manualResult, setManualResult] = useState<SelectableUser | null>(null);

    const stageSelectId = useId("stage-select-");
    const statusSelectId = useId("status-select-");
    const roleSelectId = useId("role-select-");
    const participantStatusSelectId = useId("participant-status-select-");

    const emitSummaryUpdate = useCallback((detailData: TournamentDetail, participantCount: number) => {
        onUpdated({
            id: detailData.id,
            name: detailData.name,
            mode: detailData.mode,
            type: detailData.type,
            status: detailData.status,
            current_stage: detailData.current_stage,
            stages: detailData.stages,
            include_qualifier: detailData.include_qualifier,
            allow_custom_mods: detailData.allow_custom_mods,
            participants: participantCount,
            created_at: detailData.created_at,
        });
    }, [onUpdated]);

    const fetchDetail = useCallback(async () => {
        setLoading(true);
        setFeedback(null);
        try {
            const response = await fetch(`/api/admin/tournaments/${tournamentId}`);
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "加载比赛信息失败");
            }
            setDetail(data.tournament);
            setParticipants(data.participants);
            setStats(data.stats);
            setFormState({
                name: data.tournament.name,
                status: data.tournament.status,
                currentStage: data.tournament.current_stage,
                includeQualifier: data.tournament.include_qualifier,
                allowCustomMods: data.tournament.allow_custom_mods,
            });
            emitSummaryUpdate(data.tournament, data.participants.length);
        } catch (error: any) {
            setFeedback({ intent: "error", text: error.message || "加载比赛信息失败" });
        } finally {
            setLoading(false);
        }
    }, [emitSummaryUpdate, tournamentId]);

    useEffect(() => {
        fetchDetail();
    }, [fetchDetail]);

    const handleSave = useCallback(async () => {
        if (!formState) {
            return;
        }
        setSaving(true);
        setFeedback(null);
        try {
            const response = await fetch(`/api/admin/tournaments/${tournamentId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: formState.name,
                    status: formState.status,
                    currentStage: formState.currentStage,
                    includeQualifier: formState.includeQualifier,
                    allowCustomMods: formState.allowCustomMods,
                }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "保存失败");
            }
            setDetail(data.tournament);
            setFormState({
                name: data.tournament.name,
                status: data.tournament.status,
                currentStage: data.tournament.current_stage,
                includeQualifier: data.tournament.include_qualifier,
                allowCustomMods: data.tournament.allow_custom_mods,
            });
            setFeedback({ intent: "success", text: "比赛信息已更新" });
            emitSummaryUpdate(data.tournament, participants.length);
        } catch (error: any) {
            setFeedback({ intent: "error", text: error.message || "保存失败" });
        } finally {
            setSaving(false);
        }
    }, [emitSummaryUpdate, formState, participants.length, tournamentId]);

    const handleAddParticipant = useCallback(async () => {
        if (!participantForm.user) {
            setFeedback({ intent: "error", text: "请先选择一个用户" });
            return;
        }
        setParticipantBusy(true);
        setFeedback(null);
        try {
            const response = await fetch(`/api/admin/tournaments/${tournamentId}/participants`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    osuId: participantForm.user.osu_id,
                    role: participantForm.role,
                    status: participantForm.status,
                }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "添加参与者失败");
            }
            setParticipants(data.participants);
            setParticipantForm((prev) => ({
                ...prev,
                user: null,
            }));
            if (detail) {
                emitSummaryUpdate(detail, data.participants.length);
            }
            setFeedback({ intent: "success", text: "已添加参与者" });
        } catch (error: any) {
            setFeedback({ intent: "error", text: error.message || "添加参与者失败" });
        } finally {
            setParticipantBusy(false);
        }
    }, [detail, emitSummaryUpdate, participantForm, tournamentId]);

    const handleRemoveParticipant = useCallback(async (participantId: number) => {
        if (!detail) {
            return;
        }
        setParticipantBusy(true);
        setFeedback(null);
        try {
            const response = await fetch(`/api/admin/tournaments/${tournamentId}/participants?participantId=${participantId}`, {
                method: "DELETE",
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "移除参与者失败");
            }
            setParticipants(data.participants);
            emitSummaryUpdate(detail, data.participants.length);
            setFeedback({ intent: "success", text: "已移除参与者" });
        } catch (error: any) {
            setFeedback({ intent: "error", text: error.message || "移除参与者失败" });
        } finally {
            setParticipantBusy(false);
        }
    }, [detail, emitSummaryUpdate, tournamentId]);

    const handleDeleteTournament = useCallback(async () => {
        if (!detail) {
            return;
        }
        const confirmed = window.confirm(`确认删除比赛 “${detail.name}” 吗？删除后不可恢复。`);
        if (!confirmed) {
            return;
        }
        setDeleting(true);
        setFeedback(null);
        try {
            const response = await fetch(`/api/admin/tournaments/${tournamentId}`, {
                method: "DELETE",
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "删除比赛失败");
            }
            onDeleted(detail.id);
            onBack();
        } catch (error: any) {
            setFeedback({ intent: "error", text: error.message || "删除比赛失败" });
        } finally {
            setDeleting(false);
        }
    }, [detail, onBack, onDeleted, tournamentId]);

    const loadUsers = useCallback(async (searchTerm?: string) => {
        setUsersLoading(true);
        setUsersError(null);
        try {
            const params = new URLSearchParams({ limit: "50" });
            if (searchTerm?.trim()) {
                params.set("q", searchTerm.trim());
            }
            const response = await fetch(`/api/admin/users?${params.toString()}`);
            const rawText = await response.text();
            let data: any = {};
            if (rawText.trim().length > 0) {
                try {
                    data = JSON.parse(rawText);
                } catch (error) {
                    throw new Error("获取用户列表失败：返回数据格式无效");
                }
            }
            if (!response.ok) {
                const errorMessage =
                    data && typeof data === "object" && "error" in data
                        ? String((data as { error?: unknown }).error ?? "")
                        : "";
                throw new Error(errorMessage || "获取用户列表失败");
            }
            const normalized: SelectableUser[] = Array.isArray(data.users)
                ? data.users.map((user: any) => {
                      const rawId = user.id;
                      const parsedId =
                          typeof rawId === "number" && Number.isFinite(rawId)
                              ? rawId
                              : typeof rawId === "string" && rawId.trim() !== "" && !Number.isNaN(Number(rawId))
                              ? Number(rawId)
                              : null;

                      return {
                          id: parsedId,
                          osu_id: String(user.osu_id ?? ""),
                          username: String(user.username ?? ""),
                          avatar_url: user.avatar_url ?? null,
                          is_admin: Boolean(user.is_admin),
                          groups: Array.isArray(user.groups) ? user.groups : [],
                          source: user.source === "external" ? "external" : "registered",
                          profile: user.profile ?? undefined,
                      } satisfies SelectableUser;
                  })
                : [];
            setAvailableUsers(normalized);
        } catch (error: any) {
            setUsersError(error.message || "获取用户列表失败");
        } finally {
            setUsersLoading(false);
        }
    }, []);

    useEffect(() => {
        if (userPickerOpen) {
            setUserSearch("");
            setManualOsuId("");
            setManualError(null);
            setManualResult(null);
            void loadUsers();
        }
    }, [loadUsers, userPickerOpen]);

    const existingOsuIds = useMemo(() => new Set(participants.map((p) => p.osu_id)), [participants]);

    const filteredUsers = useMemo(() => {
        const keyword = userSearch.trim().toLowerCase();
        return availableUsers
            .filter((user) => !existingOsuIds.has(user.osu_id))
            .filter((user) => {
                if (!keyword) {
                    return true;
                }
                return (
                    user.username.toLowerCase().includes(keyword) ||
                    user.osu_id.toLowerCase().includes(keyword) ||
                    user.groups.some((group) => group.toLowerCase().includes(keyword))
                );
            })
            .sort((a, b) => a.username.localeCompare(b.username));
    }, [availableUsers, existingOsuIds, userSearch]);

    const handleManualLookup = useCallback(async () => {
        const trimmed = manualOsuId.trim();
        if (!trimmed) {
            setManualError("请输入 osu! UID");
            setManualResult(null);
            return;
        }

        setManualLoading(true);
        setManualError(null);
        setManualResult(null);

        try {
            const response = await fetch(`/api/admin/users?osuId=${encodeURIComponent(trimmed)}`);
            const rawText = await response.text();
            let data: any = {};
            if (rawText.trim().length > 0) {
                try {
                    data = JSON.parse(rawText);
                } catch (error) {
                    throw new Error("解析 osu! UID 失败：返回数据格式无效");
                }
            }
            if (!response.ok) {
                const errorMessage =
                    data && typeof data === "object" && "error" in data
                        ? String((data as { error?: unknown }).error ?? "")
                        : "";
                throw new Error(errorMessage || "未找到对应的用户");
            }

            const rawUser = data.user;
            if (!rawUser) {
                throw new Error("未找到对应的用户");
            }

            const rawId = rawUser.id;
            const parsedId =
                typeof rawId === "number" && Number.isFinite(rawId)
                    ? rawId
                    : typeof rawId === "string" && rawId.trim() !== "" && !Number.isNaN(Number(rawId))
                    ? Number(rawId)
                    : null;

            const candidate: SelectableUser = {
                id: parsedId,
                osu_id: String(rawUser.osu_id ?? ""),
                username: String(rawUser.username ?? ""),
                avatar_url: rawUser.avatar_url ?? null,
                is_admin: Boolean(rawUser.is_admin),
                groups: Array.isArray(rawUser.groups) ? rawUser.groups : [],
                source: rawUser.source === "registered" ? "registered" : "external",
                profile: rawUser.profile ?? undefined,
            };

            if (existingOsuIds.has(candidate.osu_id)) {
                setManualError("该用户已在比赛名单中");
                setManualResult(null);
                return;
            }

            setManualResult(candidate);
        } catch (error: any) {
            setManualError(error.message || "解析 osu! UID 失败");
            setManualResult(null);
        } finally {
            setManualLoading(false);
        }
    }, [existingOsuIds, manualOsuId]);

    const handleUserPick = useCallback((user: SelectableUser) => {
        setParticipantForm((prev) => ({
            ...prev,
            user,
        }));
        setManualResult(null);
        setManualError(null);
        setManualOsuId("");
        setUserPickerOpen(false);
    }, []);

    const participantColumns: TableColumnDefinition<Participant>[] = useMemo(() => [
        createTableColumn<Participant>({
            columnId: "user",
            renderHeaderCell: () => "用户",
            renderCell: (item) => (
                <div className={styles.participantCell}>
                    <Avatar name={item.username} image={{ src: item.avatar_url ?? undefined }} size={32} />
                    <div className={styles.participantMeta}>
                        <Text weight="semibold">{item.username}</Text>
                        <Text size={200} style={{ color: "var(--colorNeutralForeground3)" }}>
                            osu! ID: {item.osu_id}
                        </Text>
                    </div>
                </div>
            ),
        }),
        createTableColumn<Participant>({
            columnId: "role",
            renderHeaderCell: () => "角色",
            renderCell: (item) => {
                const labelMap: Record<ParticipantRole, string> = {
                    player: "选手",
                    captain: "队长",
                    referee: "裁判",
                    staff: "工作人员",
                };
                return <Badge appearance="tint">{labelMap[item.role]}</Badge>;
            },
        }),
        createTableColumn<Participant>({
            columnId: "status",
            renderHeaderCell: () => "状态",
            renderCell: (item) => {
                const statusLabel: Record<ParticipantStatus, { text: string; color: "success" | "warning" | "danger" }> = {
                    active: { text: "生效", color: "success" },
                    pending: { text: "待确认", color: "warning" },
                    banned: { text: "禁赛", color: "danger" },
                };
                const info = statusLabel[item.status];
                return (
                    <Badge appearance="filled" color={info.color}>
                        {info.text}
                    </Badge>
                );
            },
        }),
        createTableColumn<Participant>({
            columnId: "joined",
            renderHeaderCell: () => "加入时间",
            renderCell: (item) => new Date(item.joined_at).toLocaleString(),
        }),
        createTableColumn<Participant>({
            columnId: "actions",
            renderHeaderCell: () => "操作",
            renderCell: (item) => (
                <Button
                    appearance="subtle"
                    icon={<Delete24Regular />}
                    disabled={participantBusy}
                    onClick={() => handleRemoveParticipant(item.id)}
                >
                    移除
                </Button>
            ),
        }),
    ], [handleRemoveParticipant, participantBusy, styles.participantCell, styles.participantMeta]);

    return (
        <div className={styles.container}>
            <Card style={{ padding: "20px" }}>
                <CardHeader
                    header={<Title2>管理比赛</Title2>}
                    description={detail ? `比赛 ID: ${detail.id}` : "加载中..."}
                />

                {feedback && (
                    <MessageBar intent={feedback.intent} style={{ marginBottom: "16px" }}>
                        <MessageBarBody>
                            <MessageBarTitle>{feedback.intent === "success" ? "操作成功" : "提示"}</MessageBarTitle>
                            {feedback.text}
                        </MessageBarBody>
                    </MessageBar>
                )}

                {loading || !formState ? (
                    <div style={{ display: "flex", justifyContent: "center", padding: "24px" }}>
                        <Spinner size="large" label="加载中" />
                    </div>
                ) : (
                    <>
                        <div className={styles.infoGrid}>
                            <Field label="比赛名称">
                                <Input
                                    value={formState.name}
                                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                                    disabled={saving || deleting}
                                />
                            </Field>
                            <Field label="比赛模式">
                                <Text>{detail?.mode.toUpperCase()}</Text>
                            </Field>
                            <Field label="比赛类型">
                                <Text>{detail?.type === "team" ? "团队赛" : "个人赛"}</Text>
                            </Field>
                            <Field label={{ children: "当前阶段", htmlFor: stageSelectId }}>
                                <Select
                                    id={stageSelectId}
                                    value={formState.currentStage || ""}
                                    onChange={(event) => {
                                        const value = event.target.value;
                                        setFormState((prev) =>
                                            prev
                                                ? {
                                                      ...prev,
                                                      currentStage: value,
                                                  }
                                                : prev
                                        );
                                    }}
                                    disabled={saving || deleting || (detail?.stages.length ?? 0) === 0}
                                >
                                    {(detail?.stages ?? []).length === 0 ? (
                                        <option value="">暂无阶段</option>
                                    ) : (
                                        detail!.stages.map((stage) => (
                                            <option key={stage} value={stage}>
                                                {stage.toUpperCase()}
                                            </option>
                                        ))
                                    )}
                                </Select>
                            </Field>
                            <Field label={{ children: "比赛状态", htmlFor: statusSelectId }}>
                                <Select
                                    id={statusSelectId}
                                    value={formState.status}
                                    onChange={(event) => {
                                        const value = event.target.value as TournamentStatus;
                                        setFormState((prev) =>
                                            prev
                                                ? {
                                                      ...prev,
                                                      status: value,
                                                  }
                                                : prev
                                        );
                                    }}
                                    disabled={saving || deleting}
                                >
                                    <option value="upcoming">即将开始</option>
                                    <option value="active">进行中</option>
                                    <option value="completed">已完成</option>
                                </Select>
                            </Field>
                        </div>

                        <div className={styles.switchesRow}>
                            <Switch
                                checked={formState.includeQualifier}
                                onChange={(_, data) =>
                                    setFormState((prev) =>
                                        prev
                                            ? {
                                                  ...prev,
                                                  includeQualifier: !!data.checked,
                                              }
                                            : prev
                                    )
                                }
                                label="包含资格赛阶段"
                                disabled={saving || deleting}
                            />
                            <Switch
                                checked={formState.allowCustomMods}
                                onChange={(_, data) =>
                                    setFormState((prev) =>
                                        prev
                                            ? {
                                                  ...prev,
                                                  allowCustomMods: !!data.checked,
                                              }
                                            : prev
                                    )
                                }
                                label="允许自定义 Mod"
                                disabled={saving || deleting}
                            />
                        </div>

                        <div className={styles.statsRow}>
                            <div className={styles.statCard}>
                                <Text weight="semibold">参与者数量</Text>
                                <Title3>{participants.length}</Title3>
                            </div>
                            <div className={styles.statCard}>
                                <Text weight="semibold">总图池数量</Text>
                                <Title3>{stats.map_count}</Title3>
                            </div>
                            <div className={styles.statCard}>
                                <Text weight="semibold">创建时间</Text>
                                <Text>{new Date(detail!.created_at).toLocaleString()}</Text>
                            </div>
                        </div>

                        <div className={styles.actionsRow}>
                            <Button
                                appearance="primary"
                                onClick={handleSave}
                                disabled={saving || deleting}
                            >
                                {saving ? "保存中..." : "保存变更"}
                            </Button>
                            <Button appearance="secondary" onClick={onBack} disabled={saving || deleting}>
                                返回列表
                            </Button>
                            <Button
                                appearance="transparent"
                                onClick={fetchDetail}
                                disabled={saving || deleting || loading}
                            >
                                重新加载
                            </Button>
                            <Button
                                appearance="outline"
                                onClick={handleDeleteTournament}
                                disabled={deleting || saving}
                            >
                                {deleting ? "删除中..." : "删除比赛"}
                            </Button>
                        </div>
                    </>
                )}
            </Card>

            <Card style={{ padding: "20px" }}>
                <CardHeader
                    header={<Title3>参与者管理</Title3>}
                    description="添加或移除比赛中的参与者"
                />

                <div className={styles.participantsForm}>
                    <Field label="参与者" className={styles.formField}>
                        <div className={styles.participantSelector}>
                            {participantForm.user ? (
                                <div className={styles.selectedUserCard}>
                                    <div className={styles.selectedUserInfo}>
                                        <Avatar
                                            name={participantForm.user.username}
                                            image={{ src: participantForm.user.avatar_url ?? undefined }}
                                            size={32}
                                        />
                                        <div className={styles.selectedUserMeta}>
                                            <Text weight="semibold">{participantForm.user.username}</Text>
                                            <Text size={200} style={{ color: "var(--colorNeutralForeground3)" }}>
                                                osu! ID: {participantForm.user.osu_id}
                                            </Text>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", gap: "8px" }}>
                                        <Button
                                            appearance="secondary"
                                            size="small"
                                            onClick={() => setUserPickerOpen(true)}
                                            disabled={participantBusy || deleting}
                                        >
                                            更换
                                        </Button>
                                        <Button
                                            appearance="subtle"
                                            size="small"
                                            onClick={() =>
                                                setParticipantForm((prev) => ({
                                                    ...prev,
                                                    user: null,
                                                }))
                                            }
                                            disabled={participantBusy || deleting}
                                        >
                                            清除
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <Button
                                    appearance="primary"
                                    onClick={() => setUserPickerOpen(true)}
                                    disabled={participantBusy || deleting}
                                >
                                    选择用户
                                </Button>
                            )}
                        </div>
                    </Field>
                    <Field label={{ children: "角色", htmlFor: roleSelectId }} className={styles.formField}>
                        <Select
                            id={roleSelectId}
                            value={participantForm.role}
                            onChange={(event) => {
                                const value = event.target.value as ParticipantRole;
                                setParticipantForm((prev) => ({
                                    ...prev,
                                    role: value,
                                }));
                            }}
                            disabled={participantBusy || deleting}
                        >
                            <option value="player">选手</option>
                            <option value="captain">队长</option>
                            <option value="referee">裁判</option>
                            <option value="staff">工作人员</option>
                        </Select>
                    </Field>
                    <Field label={{ children: "状态", htmlFor: participantStatusSelectId }} className={styles.formField}>
                        <Select
                            id={participantStatusSelectId}
                            value={participantForm.status}
                            onChange={(event) => {
                                const value = event.target.value as ParticipantStatus;
                                setParticipantForm((prev) => ({
                                    ...prev,
                                    status: value,
                                }));
                            }}
                            disabled={participantBusy || deleting}
                        >
                            <option value="active">生效</option>
                            <option value="pending">待确认</option>
                            <option value="banned">禁赛</option>
                        </Select>
                    </Field>
                    <div className={styles.actionWrapper}>
                        <Button
                            appearance="primary"
                            className={styles.addParticipantButton}
                            onClick={handleAddParticipant}
                            disabled={participantBusy || deleting}
                        >
                            {participantBusy ? "处理中..." : "添加参与者"}
                        </Button>
                    </div>
                </div>

                <Dialog open={userPickerOpen} onOpenChange={(_, data) => setUserPickerOpen(!!data.open)}>
                    <DialogSurface>
                        <DialogBody>
                            <DialogTitle>选择参与者</DialogTitle>
                            <DialogContent>
                                <div className={styles.userSearchRow}>
                                    <Field
                                        label="搜索注册用户"
                                        style={{ flex: "1 1 260px", minWidth: "240px" }}
                                    >
                                        <Input
                                            value={userSearch}
                                            onChange={(e) => setUserSearch(e.target.value)}
                                            placeholder="输入用户名、osu! ID 或分组关键词"
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    void loadUsers(userSearch);
                                                }
                                            }}
                                        />
                                    </Field>
                                    <Button
                                        appearance="primary"
                                        onClick={() => void loadUsers(userSearch)}
                                        disabled={usersLoading}
                                    >
                                        {usersLoading ? "搜索中..." : "搜索"}
                                    </Button>
                                    <Button
                                        appearance="secondary"
                                        onClick={() => {
                                            setUserSearch("");
                                            void loadUsers();
                                        }}
                                        disabled={usersLoading}
                                    >
                                        重置
                                    </Button>
                                </div>
                                <div className={styles.userSearchRow}>
                                    <Field
                                        label="手动输入 osu! UID"
                                        style={{ flex: "1 1 260px", minWidth: "240px" }}
                                    >
                                        <Input
                                            value={manualOsuId}
                                            onChange={(e) => setManualOsuId(e.target.value)}
                                            placeholder="输入 osu! UID 解析未注册用户"
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    void handleManualLookup();
                                                }
                                            }}
                                        />
                                    </Field>
                                    <Button
                                        appearance="primary"
                                        onClick={() => void handleManualLookup()}
                                        disabled={manualLoading}
                                    >
                                        {manualLoading ? "解析中..." : "解析"}
                                    </Button>
                                </div>
                                {manualError && (
                                    <MessageBar intent="warning" style={{ marginBottom: "12px" }}>
                                        <MessageBarBody>
                                            <MessageBarTitle>提示</MessageBarTitle>
                                            {manualError}
                                        </MessageBarBody>
                                    </MessageBar>
                                )}
                                {manualResult && (
                                    <div className={styles.selectedUserCard} style={{ marginBottom: "16px" }}>
                                        <div className={styles.selectedUserInfo}>
                                            <Avatar
                                                name={manualResult.username}
                                                image={{ src: manualResult.avatar_url ?? undefined }}
                                                size={32}
                                            />
                                            <div className={styles.selectedUserMeta}>
                                                <Text weight="semibold">{manualResult.username}</Text>
                                                <Text size={200} style={{ color: "var(--colorNeutralForeground3)" }}>
                                                    osu! ID: {manualResult.osu_id}
                                                </Text>
                                                {manualResult.profile && (
                                                    <Text size={200} style={{ color: "var(--colorNeutralForeground3)" }}>
                                                        PP: {manualResult.profile.pp ?? "-"} | 世界排名: {manualResult.profile.global_rank ?? "-"}
                                                    </Text>
                                                )}
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                            <Badge appearance="outline" color={manualResult.source === "registered" ? "brand" : "warning"}>
                                                {manualResult.source === "registered" ? "已注册用户" : "外部查询"}
                                            </Badge>
                                            <Button appearance="primary" size="small" onClick={() => handleUserPick(manualResult)}>
                                                选择
                                            </Button>
                                        </div>
                                    </div>
                                )}
                                {usersError && (
                                    <MessageBar intent="error" style={{ marginBottom: "12px" }}>
                                        <MessageBarBody>
                                            <MessageBarTitle>加载失败</MessageBarTitle>
                                            {usersError}
                                        </MessageBarBody>
                                    </MessageBar>
                                )}
                                {usersLoading ? (
                                    <div style={{ display: "flex", justifyContent: "center", padding: "24px 0" }}>
                                        <Spinner label="获取用户列表..." />
                                    </div>
                                ) : filteredUsers.length > 0 ? (
                                    <div className={styles.userList}>
                                        {filteredUsers.map((user) => (
                                            <div key={user.osu_id} className={styles.userListItem}>
                                                <div className={styles.userListInfo}>
                                                    <Avatar
                                                        name={user.username}
                                                        image={{ src: user.avatar_url ?? undefined }}
                                                        size={32}
                                                    />
                                                    <div className={styles.selectedUserMeta}>
                                                        <Text weight="semibold">{user.username}</Text>
                                                        <Text size={200} style={{ color: "var(--colorNeutralForeground3)" }}>
                                                            osu! ID: {user.osu_id}
                                                        </Text>
                                                        {user.groups.length > 0 && (
                                                            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                                                                {user.groups.map((group) => (
                                                                    <Badge key={group} appearance="tint">
                                                                        {group}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <Button appearance="primary" size="small" onClick={() => handleUserPick(user)}>
                                                    选择
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className={styles.emptyState}>
                                        没有可选择的用户，可能已经全部加入或没有匹配搜索条件。
                                    </div>
                                )}
                            </DialogContent>
                            <DialogActions className={styles.modalActions}>
                                <Button appearance="secondary" onClick={() => setUserPickerOpen(false)}>
                                    关闭
                                </Button>
                            </DialogActions>
                        </DialogBody>
                    </DialogSurface>
                </Dialog>

                <DataGrid
                    items={participants}
                    columns={participantColumns}
                    getRowId={(item) => item.id}
                    style={{ marginTop: "12px" }}
                    resizableColumns
                >
                    <DataGridHeader>
                        <DataGridRow>
                            {({ renderHeaderCell }) => (
                                <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                            )}
                        </DataGridRow>
                    </DataGridHeader>
                    <DataGridBody<Participant>>
                        {({ item, rowId }) => (
                            <DataGridRow<Participant> key={rowId}>
                                {({ renderCell }) => (
                                    <DataGridCell>{renderCell(item)}</DataGridCell>
                                )}
                            </DataGridRow>
                        )}
                    </DataGridBody>
                </DataGrid>
            </Card>
        </div>
    );
}

interface SelectableUser {
    id: number | null;
    osu_id: string;
    username: string;
    avatar_url: string | null;
    is_admin: boolean;
    groups: string[];
    source: "registered" | "external";
    profile?: {
        country_code: string | null;
        global_rank: number | null;
        country_rank: number | null;
        pp: number | null;
    };
}