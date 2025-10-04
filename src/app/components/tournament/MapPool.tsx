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
    Popover,
    PopoverSurface,
    PopoverTrigger,
    Spinner,
    TableColumnDefinition,
    Text,
    Title3,
    Tooltip,
    createTableColumn,
    makeStyles,
} from "@fluentui/react-components";
import { AddRegular, ArrowDownloadRegular, CopyRegular, Delete24Regular } from "@fluentui/react-icons";

import { useDownloadManager } from "@/app/providers/DownloadManagerProvider";

const useStyles = makeStyles({
        root: {
            width: "100%",
            overflow: "hidden",
        },
        dataGridWrapper: {
            overflowX: "auto",
        },
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
        headerActions: {
            display: "flex",
            alignItems: "center",
            gap: "12px",
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
            width: "100%",
            overflow: "hidden",
            justifyContent: "center",
        },
        tagList: {
            display: "flex",
            flexWrap: "nowrap",
            gap: "4px",
            alignItems: "center",
            maxHeight: "40px",
            overflow: "hidden",
        },
        coverWrapper: {
            width: "64px",
            height: "40px",
            borderRadius: "4px",
            overflow: "hidden",
            backgroundColor: "var(--colorNeutralBackground4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
        },
        coverImage: {
            width: "100%",
            height: "100%",
            objectFit: "cover",
        },
        coverFallback: {
            fontSize: "12px",
            color: "var(--colorNeutralForeground3)",
        },
        dialogGrid: {
            display: "grid",
            gap: "12px",
        },
        dialogColumns: {
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        },
        emptyState: {
            textAlign: "center",
            padding: "32px 16px",
            color: "var(--colorNeutralForeground3)",
        },
        fullWidthField: {
            gridColumn: "1 / -1",
        },
        bidCell: {
            display: "flex",
            alignItems: "center",
            gap: "8px",
        },
        mapInfoColumn: {
            minWidth: "280px",
            height: "40px",
            display: "flex",
            alignItems: "center",
            overflow: "hidden",
        },
        tagPopover: {
            display: "flex",
            flexWrap: "wrap",
            gap: "4px",
            maxWidth: "240px",
        },
        addMapButton: {
            minWidth: "136px",
        },
        dataRow: {
            height: "40px",
        },
        compactCell: {
            display: "flex",
            alignItems: "center",
            height: "40px",
            padding: "0 12px",
        },
        headerCell: {
            display: "flex",
            alignItems: "center",
            height: "40px",
            padding: "0 12px",
        },
        ellipsis: {
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            display: "block",
            width: "100%",
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
        const [dialogOpen, setDialogOpen] = useState(false);
        const [dialogLoading, setDialogLoading] = useState(false);
        const [dialogError, setDialogError] = useState<string | null>(null);
        const [canManageFromServer, setCanManageFromServer] = useState<boolean | null>(null);
        const [parseInputValue, setParseInputValue] = useState("");
        const [parseError, setParseError] = useState<string | null>(null);
        const [parsing, setParsing] = useState(false);
        const { startBatch } = useDownloadManager();

        const tournamentId = tournament?.id;
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

        const toStringValue = useCallback((value: unknown) => {
            if (value === null || value === undefined) {
                return "";
            }
            if (typeof value === "number") {
                if (!Number.isFinite(value)) {
                    return "";
                }
                return value.toString();
            }
            return String(value);
        }, []);

        const applyParsedBeatmap = useCallback(
            (beatmap: {
                beatmap_id?: number | null;
                beatmapset_id?: number | null;
                title?: string;
                artist?: string;
                mapper?: string;
                difficulty?: string;
                stars?: number | null;
                ar?: number | null;
                cs?: number | null;
                od?: number | null;
                hp?: number | null;
                bpm?: number | null;
                length?: string | null;
                cover_url?: string | null;
                tags?: string[];
            }) => {
                if (!beatmap) {
                    return;
                }

                setFormState((prev) => ({
                    ...prev,
                    beatmapId: toStringValue(beatmap.beatmap_id),
                    beatmapsetId: toStringValue(beatmap.beatmapset_id),
                    title: beatmap.title ?? "",
                    artist: beatmap.artist ?? "",
                    mapper: beatmap.mapper ?? "",
                    difficulty: beatmap.difficulty ?? "",
                    stars: toStringValue(beatmap.stars),
                    ar: toStringValue(beatmap.ar),
                    cs: toStringValue(beatmap.cs),
                    od: toStringValue(beatmap.od),
                    hp: toStringValue(beatmap.hp),
                    bpm: toStringValue(beatmap.bpm),
                    length: beatmap.length ?? "",
                    tags: Array.isArray(beatmap.tags) ? beatmap.tags.join(", ") : "",
                    coverUrl: beatmap.cover_url ?? "",
                }));
            },
            [toStringValue]
        );

        const canManage = useMemo(
            () => Boolean(tournament?.can_manage_map_pool ?? canManageFromServer ?? false),
            [tournament?.can_manage_map_pool, canManageFromServer]
        );

        const handleParseBeatmap = useCallback(async () => {
            const trimmed = parseInputValue.trim();
            if (!trimmed) {
                setParseError("请输入 osu! 链接、BID 或 SID");
                return;
            }

            setParsing(true);
            setParseError(null);

            try {
                const response = await fetch("/api/osu/resolve-beatmap", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ input: trimmed }),
                });

                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data?.error || "解析失败");
                }

                if (!data?.beatmap) {
                    throw new Error("未获取到图谱数据");
                }

                setParseInputValue(trimmed);
                applyParsedBeatmap(data.beatmap);
                setFeedback({ intent: "success", text: "已根据输入填充图谱信息" });
            } catch (err) {
                console.error("解析图谱失败:", err);
                setParseError(err instanceof Error ? err.message : "解析 osu! 图谱失败");
            } finally {
                setParsing(false);
            }
    }, [applyParsedBeatmap, parseInputValue, setFeedback]);

        const loadMaps = useCallback(async () => {
            if (!tournamentId) {
                setMaps([]);
                return;
            }

            setLoading(true);
            setError(null);
            setFeedback(null);

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
            setParseInputValue("");
            setParseError(null);
            setParsing(false);
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

        const downloadSelected = useCallback(() => {
            if (!tournamentId) {
                setFeedback({ intent: "error", text: "缺少比赛信息，无法下载" });
                return;
            }

            const selected = maps.filter((map) => selectedMaps.includes(String(map.id)));
            if (selected.length === 0) {
                setFeedback({ intent: "error", text: "请先选择需要下载的图谱" });
                return;
            }

            const items = selected.map((map) => ({
                mapId: map.id,
                beatmapId: map.beatmap_id,
                beatmapsetId: map.beatmapset_id,
                title: map.title,
                difficulty: map.difficulty,
                modValue: map.mod_value,
                tournamentId,
            }));

            const { added } = startBatch({ items, replaceExisting: true });

            if (added > 0) {
                setFeedback({ intent: "success", text: `已加入 ${added} 张图谱到下载队列` });
            } else {
                setFeedback({ intent: "error", text: "下载队列未发生变化" });
            }
        }, [maps, selectedMaps, startBatch, tournamentId]);

        const handleToggleSelectAll = useCallback(() => {
            if (selectedMaps.length === maps.length) {
                setSelectedMaps([]);
            } else {
                setSelectedMaps(maps.map((map) => String(map.id)));
            }
        }, [maps, selectedMaps]);

        const handleCopyBid = useCallback(async (bid: number) => {
            try {
                await navigator.clipboard.writeText(String(bid));
                setFeedback({ intent: "success", text: `已复制 BID ${bid}` });
            } catch (err) {
                console.error("复制 BID 失败:", err);
                setFeedback({ intent: "error", text: "复制失败，请稍后再试" });
            }
        }, []);

        const handleDeleteSelected = useCallback(async () => {
            if (!tournamentId || selectedMaps.length === 0) {
                return;
            }

            const ids = [...selectedMaps];
            const confirmed = window.confirm(`确认从图池移除已选的 ${ids.length} 张图谱吗？`);
            if (!confirmed) {
                return;
            }

            try {
                for (const id of ids) {
                    const numericId = Number(id);
                    if (!Number.isFinite(numericId) || numericId <= 0) {
                        continue;
                    }
                    const response = await fetch(
                        `/api/tournaments/${encodeURIComponent(tournamentId)}/map-pool/${numericId}`,
                        {
                            method: "DELETE",
                        }
                    );
                    const data = await response.json();
                    if (!response.ok) {
                        throw new Error(data?.error || "删除图谱失败");
                    }
                }

                const idSet = new Set(ids);
                setMaps((prev) => prev.filter((item) => !idSet.has(String(item.id))));
                setSelectedMaps([]);
                setFeedback({ intent: "success", text: `已移除 ${ids.length} 张图谱` });
            } catch (err) {
                console.error("删除图谱失败:", err);
                setFeedback({ intent: "error", text: err instanceof Error ? err.message : "删除图谱失败" });
            }
        }, [selectedMaps, tournamentId]);

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

        const columns = useMemo<TableColumnDefinition<MapEntry>[]>(
            () => [
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
                    columnId: "bid",
                    renderHeaderCell: () => "BID",
                    renderCell: (item) => (
                        <div className={styles.bidCell}>
                            <Text>{item.beatmap_id}</Text>
                            <Tooltip content="复制 BID" relationship="label">
                                <Button
                                    appearance="subtle"
                                    size="small"
                                    icon={<CopyRegular />}
                                    onClick={() => {
                                        void handleCopyBid(item.beatmap_id);
                                    }}
                                />
                            </Tooltip>
                        </div>
                    ),
                }),
                createTableColumn<MapEntry>({
                    columnId: "cover",
                    renderHeaderCell: () => "封面",
                    renderCell: (item) => (
                        <div className={styles.coverWrapper}>
                            {item.cover_url ? (
                                <img
                                    src={item.cover_url}
                                    alt={`${item.title} 封面`}
                                    className={styles.coverImage}
                                    loading="lazy"
                                />
                            ) : (
                                <span className={styles.coverFallback}>无封面</span>
                            )}
                        </div>
                    ),
                }),
                createTableColumn<MapEntry>({
                    columnId: "info",
                    renderHeaderCell: () => "图谱信息",
                    renderCell: (item) => (
                        <div className={styles.mapInfoColumn}>
                            <div className={styles.mapInfo}>
                                <Text weight="semibold" className={styles.ellipsis}>
                                    {item.title}
                                </Text>
                                <Text size={200} className={styles.ellipsis}>
                                    {item.artist} - {item.mapper}
                                </Text>
                                <Text size={100} className={styles.ellipsis}>
                                    [{item.difficulty}]
                                </Text>
                            </div>
                        </div>
                    ),
                }),
                createTableColumn<MapEntry>({
                    columnId: "ar",
                    renderHeaderCell: () => "AR",
                    renderCell: (item) => <Text>{item.ar === null ? "--" : Number(item.ar).toFixed(2)}</Text>,
                }),
                createTableColumn<MapEntry>({
                    columnId: "cs",
                    renderHeaderCell: () => "CS",
                    renderCell: (item) => <Text>{item.cs === null ? "--" : Number(item.cs).toFixed(2)}</Text>,
                }),
                createTableColumn<MapEntry>({
                    columnId: "od",
                    renderHeaderCell: () => "OD",
                    renderCell: (item) => <Text>{item.od === null ? "--" : Number(item.od).toFixed(2)}</Text>,
                }),
                createTableColumn<MapEntry>({
                    columnId: "bpm",
                    renderHeaderCell: () => "BPM",
                    renderCell: (item) => <Text>{item.bpm === null ? "--" : item.bpm}</Text>,
                }),
                createTableColumn<MapEntry>({
                    columnId: "length",
                    renderHeaderCell: () => "时长",
                    renderCell: (item) => <Text>{item.length || "--"}</Text>,
                }),
                createTableColumn<MapEntry>({
                    columnId: "tags",
                    renderHeaderCell: () => "标签",
                    renderCell: (item) => (
                        <div className={styles.tagList}>
                            {item.tags.length === 0 ? (
                                <Text size={200} style={{ color: "var(--colorNeutralForeground3)" }}>暂无</Text>
                            ) : (
                                <>
                                    {item.tags.slice(0, 2).map((tag) => (
                                        <Badge key={tag} appearance="outline" size="small">
                                            {tag}
                                        </Badge>
                                    ))}
                                    {item.tags.length > 2 && (
                                        <Popover>
                                            <PopoverTrigger disableButtonEnhancement>
                                                <Badge appearance="outline" size="small">
                                                    +{item.tags.length - 2}
                                                </Badge>
                                            </PopoverTrigger>
                                            <PopoverSurface>
                                                <div className={styles.tagPopover}>
                                                    {item.tags.slice(2).map((tag) => (
                                                        <Badge key={tag} appearance="outline" size="small">
                                                            {tag}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </PopoverSurface>
                                        </Popover>
                                    )}
                                </>
                            )}
                        </div>
                    ),
                }),
            ],
            [
                handleCopyBid,
                selectedMaps,
                styles.bidCell,
                styles.coverFallback,
                styles.coverImage,
                styles.coverWrapper,
                styles.mapInfo,
                styles.mapInfoColumn,
                styles.tagList,
                styles.tagPopover,
            ]
        );

        return (
            <Card className={styles.root}>
                <CardHeader
                    header={<Title3>{tournament.current_stage.toUpperCase()} 图池</Title3>}
                    description="当前阶段的比赛图池"
                    action={
                        <div className={styles.headerActions}>
                            <Button appearance="transparent" onClick={() => void loadMaps()} disabled={loading}>
                                刷新
                            </Button>
                            {canManage && (
                                <Button
                                    appearance="primary"
                                    icon={<AddRegular />}
                                    onClick={() => setDialogOpen(true)}
                                    className={styles.addMapButton}
                                >
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
                        {canManage && (
                            <Button
                                appearance="outline"
                                icon={<Delete24Regular />}
                                onClick={handleDeleteSelected}
                                disabled={selectedMaps.length === 0}
                            >
                                移除所选 ({selectedMaps.length})
                            </Button>
                        )}
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
                        <div className={styles.dataGridWrapper}>
                        <DataGrid
                            items={maps}
                            columns={columns}
                            getRowId={(item) => String(item.id)}
                            style={{ minWidth: "1600px" }}
                        >
                            <DataGridHeader>
                                <DataGridRow className={styles.dataRow}>
                                    {({ renderHeaderCell }) => (
                                        <DataGridHeaderCell className={styles.headerCell}>
                                            {renderHeaderCell()}
                                        </DataGridHeaderCell>
                                    )}
                                </DataGridRow>
                            </DataGridHeader>
                            <DataGridBody<MapEntry>>
                                {({ item, rowId }) => (
                                    <DataGridRow<MapEntry> key={rowId} className={styles.dataRow}>
                                        {({ renderCell }) => (
                                            <DataGridCell className={styles.compactCell}>
                                                {renderCell(item)}
                                            </DataGridCell>
                                        )}
                                    </DataGridRow>
                                )}
                            </DataGridBody>
                        </DataGrid>
                        </div>
                    )}
                </div>
                <Dialog
                    open={dialogOpen}
                    onOpenChange={(_, data) => {
                        if (dialogLoading) {
                            return;
                        }
                        if (data.open) {
                            setDialogOpen(true);
                        } else {
                            handleDialogClose();
                        }
                    }}
                >
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
                                    <Field label="OSU 链接 / BID / SID" className={styles.fullWidthField}>
                                        <Input
                                            value={parseInputValue}
                                            onChange={(e) => {
                                                setParseInputValue(e.target.value);
                                                if (parseError) {
                                                    setParseError(null);
                                                }
                                            }}
                                            placeholder="粘贴 osu! 图谱链接或输入 BID / SID"
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    if (!parsing && parseInputValue.trim()) {
                                                        void handleParseBeatmap();
                                                    }
                                                }
                                            }}
                                            contentAfter={
                                                <Button
                                                    appearance="primary"
                                                    size="small"
                                                    type="button"
                                                    onClick={() => {
                                                        void handleParseBeatmap();
                                                    }}
                                                    disabled={parsing || !parseInputValue.trim()}
                                                    style={{ whiteSpace: "nowrap" }}
                                                >
                                                    {parsing ? "解析中..." : "解析"}
                                                </Button>
                                            }
                                        />
                                    </Field>
                                    {parseError && (
                                        <div className={styles.fullWidthField}>
                                            <MessageBar intent="error">{parseError}</MessageBar>
                                        </div>
                                    )}
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