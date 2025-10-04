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
    Dropdown,
    Field,
    Input,
    MessageBar,
    MessageBarBody,
    MessageBarTitle,
    Option,
    Spinner,
    Switch,
    TableColumnDefinition,
    Text,
    Title2,
    Title3,
    createTableColumn,
    makeStyles,
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
        display: "grid",
        gridTemplateColumns: "minmax(200px, 1fr) 160px 160px 120px",
        gap: "12px",
        alignItems: "end",
        maxWidth: "760px",
        marginBottom: "16px",
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
    const [participantForm, setParticipantForm] = useState<{ osuId: string; role: ParticipantRole; status: ParticipantStatus }>({
        osuId: "",
        role: "player",
        status: "active",
    });

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
        if (!participantForm.osuId.trim()) {
            setFeedback({ intent: "error", text: "请输入参与者的 osu! ID" });
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
                    osuId: participantForm.osuId.trim(),
                    role: participantForm.role,
                    status: participantForm.status,
                }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "添加参与者失败");
            }
            setParticipants(data.participants);
            setParticipantForm({ osuId: "", role: "player", status: "active" });
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
                            <Field label="当前阶段">
                                <Dropdown
                                    selectedOptions={[formState.currentStage]}
                                    onOptionSelect={(_, data) =>
                                        setFormState({ ...formState, currentStage: data.optionValue as string })
                                    }
                                    disabled={saving || deleting || detail?.stages.length === 0}
                                >
                                    {detail?.stages.map((stage) => (
                                        <Option key={stage} value={stage}>
                                            {stage.toUpperCase()}
                                        </Option>
                                    ))}
                                </Dropdown>
                            </Field>
                            <Field label="比赛状态">
                                <Dropdown
                                    selectedOptions={[formState.status]}
                                    onOptionSelect={(_, data) =>
                                        setFormState({ ...formState, status: data.optionValue as TournamentStatus })
                                    }
                                    disabled={saving || deleting}
                                >
                                    <Option value="upcoming">即将开始</Option>
                                    <Option value="active">进行中</Option>
                                    <Option value="completed">已完成</Option>
                                </Dropdown>
                            </Field>
                        </div>

                        <div className={styles.switchesRow}>
                            <Switch
                                checked={formState.includeQualifier}
                                onChange={(_, data) =>
                                    setFormState({ ...formState, includeQualifier: !!data.checked })
                                }
                                label="包含资格赛阶段"
                                disabled={saving || deleting}
                            />
                            <Switch
                                checked={formState.allowCustomMods}
                                onChange={(_, data) =>
                                    setFormState({ ...formState, allowCustomMods: !!data.checked })
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
                    <Field label="osu! ID">
                        <Input
                            value={participantForm.osuId}
                            onChange={(e) => setParticipantForm({ ...participantForm, osuId: e.target.value })}
                            disabled={participantBusy || deleting}
                            placeholder="输入参与者的 osu! ID"
                        />
                    </Field>
                    <Field label="角色">
                        <Dropdown
                            selectedOptions={[participantForm.role]}
                            onOptionSelect={(_, data) =>
                                setParticipantForm({ ...participantForm, role: data.optionValue as ParticipantRole })
                            }
                            disabled={participantBusy || deleting}
                        >
                            <Option value="player">选手</Option>
                            <Option value="captain">队长</Option>
                            <Option value="referee">裁判</Option>
                            <Option value="staff">工作人员</Option>
                        </Dropdown>
                    </Field>
                    <Field label="状态">
                        <Dropdown
                            selectedOptions={[participantForm.status]}
                            onOptionSelect={(_, data) =>
                                setParticipantForm({ ...participantForm, status: data.optionValue as ParticipantStatus })
                            }
                            disabled={participantBusy || deleting}
                        >
                            <Option value="active">生效</Option>
                            <Option value="pending">待确认</Option>
                            <Option value="banned">禁赛</Option>
                        </Dropdown>
                    </Field>
                    <Button
                        appearance="primary"
                        onClick={handleAddParticipant}
                        disabled={participantBusy || deleting}
                    >
                        {participantBusy ? "处理中..." : "添加参与者"}
                    </Button>
                </div>

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