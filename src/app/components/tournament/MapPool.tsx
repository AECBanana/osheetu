"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
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
    Spinner,
    TableColumnDefinition,
    Text,
    Title3,
    Tooltip,
    createTableColumn,
    makeStyles,
} from "@fluentui/react-components";
import { AddRegular, ArrowDownloadRegular, CopyRegular, Delete24Regular } from "@fluentui/react-icons";

const useStyles = makeStyles({
        container: {
            display: "flex",
            flexDirection: "column",
            gap: "12px",
        },
        toolbar: {
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            padding: "0 16px",
        },
        managementNotice: {
            margin: "0 16px",
        },
        messageBar: {
            margin: "0 16px",
        },
        mapInfo: {
            display: "flex",
            flexDirection: "column",
            gap: "4px",
        },
        tagList: {
            display: "flex",
            flexWrap: "wrap",
            gap: "4px",
        },
        statsColumn: {
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "4px",
        },
        dialogGrid: {
            display: "grid",
            gap: "12px",
        },
        dialogColumns: {
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        },
        emptyState: {
            textAlign: "center",
            padding: "32px 16px",
            color: "var(--colorNeutralForeground3)",
        },
    });

    interface Tournament {
        id: string;
        name: string;
        current_stage: string;
        can_manage_map_pool?: boolean;
    }

    interface User {
        id: number | string;
        username: string;
    }

    interface MapEntry {
        id: number;
        tournament_id: number;
        beatmapset_id: number | null;
        beatmap_id: number;
        cover_url: string | null;
        title: string;
        artist: string;
        mapper: string;
        difficulty: string;
        mod_value: string;
        stars: number | null;
        ar: number | null;
        cs: number | null;
        od: number | null;
        hp: number | null;
        bpm: number | null;
        length: string;
        tags: string[];
        added_by: { id: number; username: string | null } | null;
        added_at: string;
    }

    interface MapPoolProps {
        tournament: Tournament;
        user: User;
    }

    const getModColor = (mod: string) => {
        const colors = {
            NM: "brand",
            HD: "warning",
            HR: "danger",
            DT: "success",
            FM: "severe",
            TB: "important",
        } as const;
        return colors[mod as keyof typeof colors] ?? "brand";
    };

    const sortMaps = (maps: MapEntry[]) => {
        return [...maps].sort((a, b) => {
            const modCompare = a.mod_value.localeCompare(b.mod_value);
            if (modCompare !== 0) {
                return modCompare;
            }
            return a.id - b.id;
        });
    };

    export function MapPool({ tournament, user }: MapPoolProps) {
        const styles = useStyles();
        const [maps, setMaps] = useState<MapEntry[]>([]);
        const [selectedMaps, setSelectedMaps] = useState<string[]>([]);
        const [loading, setLoading] = useState(true);
        const [error, setError] = useState<string | null>(null);
        const [feedback, setFeedback] = useState<{ intent: "success" | "error"; text: string } | null>(null);
        const [copySuccess, setCopySuccess] = useState(false);
        const [dialogOpen, setDialogOpen] = useState(false);
        const [dialogLoading, setDialogLoading] = useState(false);
        const [dialogError, setDialogError] = useState<string | null>(null);
        const [canManageFromServer, setCanManageFromServer] = useState<boolean | null>(null);

        const [formState, setFormState] = useState({
            beatmapId: "",
            beatmapsetId: "",
            title: "",
            artist: "",
            mapper: "",
            difficulty: "",
            modValue: "",
            stars: "",
            ar: "",
            cs: "",
            od: "",
            hp: "",
            bpm: "",
            length: "",
            tags: "",
            coverUrl: "",
        });

        const tournamentId = tournament?.id;

        const canManage = useMemo(
            () => Boolean(tournament?.can_manage_map_pool ?? canManageFromServer ?? false),
            [tournament?.can_manage_map_pool, canManageFromServer]
        );

        const loadMaps = useCallback(async () => {
            if (!tournamentId) {
                setMaps([]);
                return;
            }

            setLoading(true);
            setError(null);
            setFeedback(null);
            setCopySuccess(false);

            try {
                const response = await fetch(`/api/tournaments/${encodeURIComponent(tournamentId)}/map-pool`, {
                    cache: "no-store",
                });
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data?.error || "加载图池失败");
                }

                const payload = Array.isArray(data?.maps) ? (data.maps as MapEntry[]) : [];
                setMaps(sortMaps(payload));
                setCanManageFromServer(Boolean(data?.can_manage_map_pool));
                setSelectedMaps([]);
            } catch (err) {
                console.error("加载图池失败:", err);
                setMaps([]);
                setError(err instanceof Error ? err.message : "加载图池失败");
            } finally {
                setLoading(false);
            }
        }, [tournamentId]);

        useEffect(() => {
            void loadMaps();
        }, [loadMaps]);

        const handleDialogClose = () => {
            if (dialogLoading) {
                return;
            }
            setDialogOpen(false);
            setDialogError(null);
            setFormState({
                beatmapId: "",
                beatmapsetId: "",
                title: "",
                artist: "",
                mapper: "",
                difficulty: "",
                modValue: "",
                stars: "",
                ar: "",
                cs: "",
                od: "",
                hp: "",
                bpm: "",
                length: "",
                tags: "",
                coverUrl: "",
            });
        };

        const copyBeatmapIds = useCallback(() => {
            const selected = maps.filter((map) => selectedMaps.includes(String(map.id)));
            if (selected.length === 0) {
                return;
            }
            const text = selected.map((map) => map.beatmap_id).join(" ");
            navigator.clipboard
                .writeText(text)
                .then(() => {
                    setCopySuccess(true);
                    setTimeout(() => setCopySuccess(false), 3000);
                })
                .catch(() => {
                    setFeedback({ intent: "error", text: "复制失败，请稍后再试" });
                });
        }, [maps, selectedMaps]);

        const downloadSelected = useCallback(() => {
            const selected = maps.filter((map) => selectedMaps.includes(String(map.id)));
            setFeedback({ intent: "success", text: `即将下载 ${selected.length} 张图谱（功能待实现）` });
        }, [maps, selectedMaps]);

        const handleToggleSelectAll = useCallback(() => {
            if (selectedMaps.length === maps.length) {
                setSelectedMaps([]);
            } else {
                setSelectedMaps(maps.map((map) => String(map.id)));
            }
        }, [maps, selectedMaps]);

        const handleDeleteMap = useCallback(
            async (mapId: number) => {
                if (!tournamentId) {
                    return;
                }

                const confirmed = window.confirm("确认从图池移除该图谱吗？");
                if (!confirmed) {
                    return;
                }

                try {
                    const response = await fetch(
                        `/api/tournaments/${encodeURIComponent(tournamentId)}/map-pool/${mapId}`,
                        {
                            method: "DELETE",
                        }
                    );
                    const data = await response.json();
                    if (!response.ok) {
                        throw new Error(data?.error || "删除图谱失败");
                    }

                    setMaps((prev) => prev.filter((item) => item.id !== mapId));
                    setSelectedMaps((prev) => prev.filter((id) => Number(id) !== mapId));
                    setFeedback({ intent: "success", text: "已移除图谱" });
                } catch (err) {
                    console.error("删除图谱失败:", err);
                    setFeedback({ intent: "error", text: err instanceof Error ? err.message : "删除图谱失败" });
                }
            },
            [tournamentId]
        );

        const handleSubmitNewMap = async () => {
            if (!tournamentId) {
                return;
            }

            setDialogLoading(true);
            setDialogError(null);

            try {
                const payload = {
                    beatmap_id: formState.beatmapId,
                    beatmapset_id: formState.beatmapsetId || undefined,
                    cover_url: formState.coverUrl || undefined,
                    title: formState.title,
                    artist: formState.artist,
                    mapper: formState.mapper,
                    difficulty: formState.difficulty,
                    mod_value: formState.modValue,
                    stars: formState.stars || undefined,
                    ar: formState.ar || undefined,
                    cs: formState.cs || undefined,
                    od: formState.od || undefined,
                    hp: formState.hp || undefined,
                    bpm: formState.bpm,
                    length: formState.length,
                    tags: formState.tags,
                };

                const response = await fetch(`/api/tournaments/${encodeURIComponent(tournamentId)}/map-pool`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                });

                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data?.error || "添加图谱失败");
                }

                const newMap = data?.map as MapEntry | undefined;
                if (newMap) {
                    setMaps((prev) => sortMaps([...prev, newMap]));
                    setFeedback({ intent: "success", text: "已添加新的图谱" });
                } else {
                    await loadMaps();
                }

                handleDialogClose();
            } catch (err) {
                console.error("添加图谱失败:", err);
                setDialogError(err instanceof Error ? err.message : "添加图谱失败");
            } finally {
                setDialogLoading(false);
            }
        };

        const columns = useMemo<TableColumnDefinition<MapEntry>[]>(() => {
            const base: TableColumnDefinition<MapEntry>[] = [
                createTableColumn<MapEntry>({
                    columnId: "select",
                    renderHeaderCell: () => "选择",
                    renderCell: (item) => (
                        <input
                            type="checkbox"
                            checked={selectedMaps.includes(String(item.id))}
                            onChange={(e) => {
                                if (e.target.checked) {
                                    setSelectedMaps((prev) => [...prev, String(item.id)]);
                                } else {
                                    setSelectedMaps((prev) => prev.filter((id) => id !== String(item.id)));
                                }
                            }}
                        />
                    ),
                }),
                createTableColumn<MapEntry>({
                    columnId: "mod",
                    renderHeaderCell: () => "Mod",
                    renderCell: (item) => (
                        <Badge appearance="filled" color={getModColor(item.mod_value) as any}>
                            {item.mod_value}
                        </Badge>
                    ),
                }),
                createTableColumn<MapEntry>({
                    columnId: "map",
                    renderHeaderCell: () => "图谱信息",
                    renderCell: (item) => (
                        <div className={styles.mapInfo}>
                            <Text weight="semibold">{item.title}</Text>
                            <Text size={200}>{item.artist} - {item.mapper}</Text>
                            <Text size={100}>[{item.difficulty}]</Text>
                        </div>
                    ),
                }),
                createTableColumn<MapEntry>({
                    columnId: "stats",
                    renderHeaderCell: () => "参数",
                    renderCell: (item) => (
                        <div className={styles.statsColumn}>
                            {item.stars !== null && <Text size={200}>★ {item.stars.toFixed(2)}</Text>}
                            {item.bpm !== null && <Text size={200}>{item.bpm} BPM</Text>}
                            {item.length && <Text size={200}>{item.length}</Text>}
                            {item.ar !== null && <Text size={200}>AR {item.ar}</Text>}
                            {item.cs !== null && <Text size={200}>CS {item.cs}</Text>}
                            {item.od !== null && <Text size={200}>OD {item.od}</Text>}
                            {item.hp !== null && <Text size={200}>HP {item.hp}</Text>}
                        </div>
                    ),
                }),
                createTableColumn<MapEntry>({
                    columnId: "tags",
                    renderHeaderCell: () => "标签",
                    renderCell: (item) => (
                        <div className={styles.tagList}>
                            {item.tags.length === 0 ? (
                                <Text size={200} style={{ color: "var(--colorNeutralForeground3)" }}>暂无</Text>
                            ) : (
                                item.tags.map((tag) => (
                                    <Badge key={tag} appearance="outline" size="small">
                                        {tag}
                                    </Badge>
                                ))
                            )}
                        </div>
                    ),
                }),
                createTableColumn<MapEntry>({
                    columnId: "bid",
                    renderHeaderCell: () => "BID",
                    renderCell: (item) => (
                        <Tooltip content="复制 BID" relationship="label">
                            <Button
                                appearance="subtle"
                                size="small"
                                icon={<CopyRegular />}
                                onClick={() => {
                                    navigator.clipboard.writeText(String(item.beatmap_id));
                                    setCopySuccess(true);
                                    setTimeout(() => setCopySuccess(false), 2000);
                                }}
                            >
                                {item.beatmap_id}
                            </Button>
                        </Tooltip>
                    ),
                }),
            ];

            if (canManage) {
                base.push(
                    createTableColumn<MapEntry>({
                        columnId: "actions",
                        renderHeaderCell: () => "操作",
                        renderCell: (item) => (
                            <Button
                                appearance="subtle"
                                icon={<Delete24Regular />}
                                onClick={() => handleDeleteMap(item.id)}
                            >
                                移除
                            </Button>
                        ),
                    })
                );
            }

            return base;
        }, [canManage, handleDeleteMap, selectedMaps, styles.mapInfo, styles.statsColumn, styles.tagList]);

        return (
            <Card>
                <CardHeader
                    header={<Title3>{tournament.current_stage.toUpperCase()} 图池</Title3>}
                    description="当前阶段的比赛图池"
                    action={
                        <div className={styles.toolbar}>
                            <Button appearance="transparent" onClick={() => void loadMaps()} disabled={loading}>
                                刷新
                            </Button>
                            {canManage && (
                                <Button appearance="primary" icon={<AddRegular />} onClick={() => setDialogOpen(true)}>
                                    添加图谱
                                </Button>
                            )}
                        </div>
                    }
                />

                <div className={styles.container}>
                    {feedback && (
                        <MessageBar intent={feedback.intent} className={styles.messageBar}>
                            {feedback.text}
                        </MessageBar>
                    )}

                    {copySuccess && (
                        <MessageBar intent="success" className={styles.messageBar}>
                            已复制到剪贴板
                        </MessageBar>
                    )}

                    {!canManage && (
                        <MessageBar intent="warning" className={styles.managementNotice}>
                            仅队长可以管理图池。当前账号 {user.username} 可浏览图池内容，如需调整请联系队长或管理员。
                        </MessageBar>
                    )}

                    <div className={styles.toolbar}>
                        <Button
                            appearance="primary"
                            icon={<ArrowDownloadRegular />}
                            onClick={downloadSelected}
                            disabled={selectedMaps.length === 0}
                        >
                            批量下载 ({selectedMaps.length})
                        </Button>
                        <Button
                            appearance="outline"
                            icon={<CopyRegular />}
                            onClick={copyBeatmapIds}
                            disabled={selectedMaps.length === 0}
                        >
                            复制 BID ({selectedMaps.length})
                        </Button>
                        <Button appearance="subtle" onClick={handleToggleSelectAll} disabled={maps.length === 0}>
                            {selectedMaps.length === maps.length && maps.length > 0 ? "取消全选" : "全选"}
                        </Button>
                    </div>

                    {error && !loading && (
                        <MessageBar intent="error" className={styles.messageBar}>
                            {error}
                        </MessageBar>
                    )}

                    {loading ? (
                        <div style={{ padding: "32px", display: "flex", justifyContent: "center" }}>
                            <Spinner label="加载图池数据中" />
                        </div>
                    ) : maps.length === 0 ? (
                        <div className={styles.emptyState}>当前阶段尚未配置图池。</div>
                    ) : (
                        <DataGrid
                            items={maps}
                            columns={columns}
                            getRowId={(item) => String(item.id)}
                        >
                            <DataGridHeader>
                                <DataGridRow>
                                    {({ renderHeaderCell }) => (
                                        <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                                    )}
                                </DataGridRow>
                            </DataGridHeader>
                            <DataGridBody<MapEntry>>
                                {({ item, rowId }) => (
                                    <DataGridRow<MapEntry> key={rowId}>
                                        {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
                                    </DataGridRow>
                                )}
                            </DataGridBody>
                        </DataGrid>
                    )}
                </div>

                <Dialog open={dialogOpen} onOpenChange={(_, data) => (!dialogLoading ? setDialogOpen(!!data.open) : undefined)}>
                    <DialogSurface>
                        <DialogBody>
                            <DialogTitle>添加图谱</DialogTitle>
                            <DialogContent>
                                {dialogError && (
                                    <MessageBar intent="error" style={{ marginBottom: "12px" }}>
                                        {dialogError}
                                    </MessageBar>
                                )}
                                <div className={`${styles.dialogGrid} ${styles.dialogColumns}`}>
                                    <Field label="BID" required>
                                        <Input
                                            value={formState.beatmapId}
                                            onChange={(e) => setFormState((prev) => ({ ...prev, beatmapId: e.target.value }))}
                                            placeholder="必填，例如 1234567"
                                        />
                                    </Field>
                                    <Field label="Beatmap Set ID">
                                        <Input
                                            value={formState.beatmapsetId}
                                            onChange={(e) => setFormState((prev) => ({ ...prev, beatmapsetId: e.target.value }))}
                                            placeholder="可选"
                                        />
                                    </Field>
                                    <Field label="标题" required>
                                        <Input
                                            value={formState.title}
                                            onChange={(e) => setFormState((prev) => ({ ...prev, title: e.target.value }))}
                                            placeholder="曲目标题"
                                        />
                                    </Field>
                                    <Field label="艺术家" required>
                                        <Input
                                            value={formState.artist}
                                            onChange={(e) => setFormState((prev) => ({ ...prev, artist: e.target.value }))}
                                        />
                                    </Field>
                                    <Field label="谱师">
                                        <Input
                                            value={formState.mapper}
                                            onChange={(e) => setFormState((prev) => ({ ...prev, mapper: e.target.value }))}
                                        />
                                    </Field>
                                    <Field label="难度" required>
                                        <Input
                                            value={formState.difficulty}
                                            onChange={(e) => setFormState((prev) => ({ ...prev, difficulty: e.target.value }))}
                                        />
                                    </Field>
                                    <Field label="Mod" required>
                                        <Input
                                            value={formState.modValue}
                                            onChange={(e) => setFormState((prev) => ({ ...prev, modValue: e.target.value.toUpperCase() }))}
                                            placeholder="例如 NM / HD / HR / DT"
                                        />
                                    </Field>
                                    <Field label="星数">
                                        <Input
                                            value={formState.stars}
                                            onChange={(e) => setFormState((prev) => ({ ...prev, stars: e.target.value }))}
                                            placeholder="可选，例如 6.12"
                                        />
                                    </Field>
                                    <Field label="AR">
                                        <Input
                                            value={formState.ar}
                                            onChange={(e) => setFormState((prev) => ({ ...prev, ar: e.target.value }))}
                                        />
                                    </Field>
                                    <Field label="CS">
                                        <Input
                                            value={formState.cs}
                                            onChange={(e) => setFormState((prev) => ({ ...prev, cs: e.target.value }))}
                                        />
                                    </Field>
                                    <Field label="OD">
                                        <Input
                                            value={formState.od}
                                            onChange={(e) => setFormState((prev) => ({ ...prev, od: e.target.value }))}
                                        />
                                    </Field>
                                    <Field label="HP">
                                        <Input
                                            value={formState.hp}
                                            onChange={(e) => setFormState((prev) => ({ ...prev, hp: e.target.value }))}
                                        />
                                    </Field>
                                    <Field label="BPM" required>
                                        <Input
                                            value={formState.bpm}
                                            onChange={(e) => setFormState((prev) => ({ ...prev, bpm: e.target.value }))}
                                            placeholder="必填"
                                        />
                                    </Field>
                                    <Field label="时长" required>
                                        <Input
                                            value={formState.length}
                                            onChange={(e) => setFormState((prev) => ({ ...prev, length: e.target.value }))}
                                            placeholder="例如 3:45"
                                        />
                                    </Field>
                                    <Field label="封面 URL">
                                        <Input
                                            value={formState.coverUrl}
                                            onChange={(e) => setFormState((prev) => ({ ...prev, coverUrl: e.target.value }))}
                                            placeholder="可选"
                                        />
                                    </Field>
                                    <Field label="标签 (逗号或换行分隔)">
                                        <Input
                                            value={formState.tags}
                                            onChange={(e) => setFormState((prev) => ({ ...prev, tags: e.target.value }))}
                                            placeholder="例如 tech, stream"
                                        />
                                    </Field>
                                </div>
                            </DialogContent>
                            <DialogActions>
                                <Button appearance="secondary" onClick={handleDialogClose} disabled={dialogLoading}>
                                    取消
                                </Button>
                                <Button appearance="primary" onClick={handleSubmitNewMap} disabled={dialogLoading}>
                                    {dialogLoading ? "提交中..." : "确认添加"}
                                </Button>
                            </DialogActions>
                        </DialogBody>
                    </DialogSurface>
                </Dialog>
            </Card>
        );
    }