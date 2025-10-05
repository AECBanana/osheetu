"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Card,
    CardHeader,
    Title3,
    Button,
    Input,
    Field,
    Dropdown,
    Option,
    Badge,
    DataGrid,
    DataGridHeader,
    DataGridRow,
    DataGridHeaderCell,
    DataGridCell,
    DataGridBody,
    TableColumnDefinition,
    createTableColumn,
    MessageBar,
    makeStyles,
    Spinner,
} from "@fluentui/react-components";

const useStyles = makeStyles({
    formGrid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr auto",
        gap: "12px",
        alignItems: "end",
        marginBottom: "16px",
    },
    scoreHistory: {
        marginTop: "24px",
    },
    fullWidthField: {
        gridColumn: "1 / -1",
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

interface MapPoolEntry {
    id: number;
    mod_value: string;
    beatmap_id: number;
    title: string;
    difficulty: string;
}

interface ScoreSubmissionProps {
    tournament: Tournament;
    user: User;
}

export function ScoreSubmission({ tournament, user }: ScoreSubmissionProps) {
    const styles = useStyles();
    const [scores, setScores] = useState<any[]>([]);
    const [loadingScores, setLoadingScores] = useState(true);
    const [mapPool, setMapPool] = useState<MapPoolEntry[]>([]);
    const [loadingMapPool, setLoadingMapPool] = useState(true);
    const [selectedMap, setSelectedMap] = useState<string | undefined>(undefined);
    const [score, setScore] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<{ intent: "success" | "error"; text: string } | null>(null);

    const loadData = useCallback(async () => {
        if (!tournament.id) return;
        setLoadingMapPool(true);
        setLoadingScores(true);
        setFeedback(null);
        try {
            // Fetch map pool
            const mapPoolResponse = await fetch(`/api/tournaments/${tournament.id}/map-pool`);
            const mapPoolData = await mapPoolResponse.json();
            if (!mapPoolResponse.ok) {
                throw new Error(mapPoolData.error || "加载图池失败");
            }
            const sortedMaps = (mapPoolData.maps || []).sort((a: MapPoolEntry, b: MapPoolEntry) => {
                const modCompare = a.mod_value.localeCompare(b.mod_value);
                if (modCompare !== 0) return modCompare;
                return a.beatmap_id - b.beatmap_id;
            });
            setMapPool(sortedMaps);

            // Fetch scores
            const scoresResponse = await fetch(`/api/tournaments/${tournament.id}/scores`);
            const scoresData = await scoresResponse.json();
            if (!scoresResponse.ok) {
                throw new Error(scoresData.error || "加载分数历史失败");
            }
            setScores(scoresData.scores || []);

        } catch (err) {
            console.error(err);
            setFeedback({ intent: "error", text: err instanceof Error ? err.message : "加载数据时出错" });
        } finally {
            setLoadingMapPool(false);
            setLoadingScores(false);
        }
    }, [tournament.id]);

    useEffect(() => {
        void loadData();
    }, []);

    const handleSubmit = async () => {
        if (!selectedMap || !score) {
            setFeedback({ intent: "error", text: "请选择图谱并填写分数" });
            return;
        }

        // 解析分数，支持"w"单位
        let parsedScore = score.trim().toLowerCase();
        let scoreValue: number;

        if (parsedScore.endsWith('w')) {
            // 移除'w'并转换为数字，然后乘以10000
            const numPart = parsedScore.slice(0, -1);
            const num = parseFloat(numPart);
            if (isNaN(num)) {
                setFeedback({ intent: "error", text: "分数格式无效，请输入数字或带'w'的数字（如12w）" });
                return;
            }
            scoreValue = num * 10000;
        } else {
            scoreValue = parseFloat(parsedScore);
            if (isNaN(scoreValue)) {
                setFeedback({ intent: "error", text: "分数格式无效，请输入数字或带'w'的数字（如12w）" });
                return;
            }
        }

        if (scoreValue <= 0) {
            setFeedback({ intent: "error", text: "分数必须大于0" });
            return;
        }

        setSubmitting(true);
        setFeedback(null);
        try {
            const response = await fetch(`/api/tournaments/${tournament.id}/scores`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mapId: selectedMap, score: scoreValue }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "提交分数失败");
            }
            setFeedback({ intent: "success", text: "分数提交成功！" });
            setScore("");
            await loadData(); // Refresh scores
        } catch (err) {
            setFeedback({ intent: "error", text: err instanceof Error ? err.message : "提交时发生错误" });
        } finally {
            setSubmitting(false);
        }
    };

    const columns: TableColumnDefinition<any>[] = [
        createTableColumn<any>({
            columnId: "mod",
            renderHeaderCell: () => "Mod",
            renderCell: (item) => (
                <Badge appearance="filled" color="brand">
                    {item.mods}
                </Badge>
            ),
        }),
        createTableColumn<any>({
            columnId: "map",
            renderHeaderCell: () => "曲信息",
            renderCell: (item) => item.mapTitle,
        }),
        createTableColumn<any>({
            columnId: "score",
            renderHeaderCell: () => "分数",
            renderCell: (item) => item.score.toLocaleString(),
        }),
        createTableColumn<any>({
            columnId: "timestamp",
            renderHeaderCell: () => "提交时间",
            renderCell: (item) => new Date(item.timestamp).toLocaleString(),
        }),
    ];

    return (
        <div>
            <Card>
                <CardHeader
                    header={<Title3>分数提交</Title3>}
                    description="选择图池中的地图，然后提交你的练习分数"
                />

                {feedback && (
                    <MessageBar intent={feedback.intent} style={{ margin: "16px" }}>
                        {feedback.text}
                    </MessageBar>
                )}

                <div className={styles.formGrid} style={{ padding: "16px" }}>
                    <Field label="选择图谱" required>
                        <Dropdown
                            placeholder={loadingMapPool ? "加载图池中..." : "选择一个图谱"}
                            disabled={loadingMapPool || mapPool.length === 0}
                            value={selectedMap ? mapPool.find(m => m.id.toString() === selectedMap)?.title : ""}
                            onOptionSelect={(_, data) => {
                                if (data.optionValue) {
                                    setSelectedMap(data.optionValue);
                                    setFeedback(null);
                                }
                            }}
                        >
                            {mapPool.map((map) => (
                                <Option key={map.id} value={map.id.toString()}>
                                    {`${map.mod_value}: ${map.title} [${map.difficulty}]`}
                                </Option>
                            ))}
                        </Dropdown>
                    </Field>

                    <Field label="分数" required>
                        <Input
                            type="text"
                            value={score}
                            onChange={(e) => {
                                setScore(e.target.value);
                                setFeedback(null);
                            }}
                            placeholder="输入分数 (支持数字加w格式，如12w为12万分数)"
                            disabled={submitting}
                        />
                    </Field>

                    <Button appearance="primary" onClick={handleSubmit} disabled={submitting || loadingMapPool}>
                        {submitting ? "提交中..." : "提交分数"}
                    </Button>
                </div>
            </Card>

            <div className={styles.scoreHistory}>
                <Card>
                    <CardHeader
                        header={<Title3>分数历史</Title3>}
                        description="最近提交的分数记录"
                    />

                    {loadingScores ? (
                        <div style={{ display: "flex", justifyContent: "center", padding: "20px" }}>
                            <Spinner label="加载分数历史中..." />
                        </div>
                    ) : (
                        <DataGrid
                            items={scores}
                            columns={columns}
                            getRowId={(item) => item.id}
                        >
                            <DataGridHeader>
                                <DataGridRow>
                                    {({ renderHeaderCell }) => (
                                        <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                                    )}
                                </DataGridRow>
                            </DataGridHeader>
                            <DataGridBody<any>>
                                {({ item, rowId }) => (
                                    <DataGridRow<any> key={rowId}>
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
        </div>
    );
}