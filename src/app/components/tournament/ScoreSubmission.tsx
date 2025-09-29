"use client";

import { useState } from "react";
import {
    Card,
    CardHeader,
    Title3,
    Button,
    Input,
    Field,
    Dropdown,
    Option,
    Text,
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
} from "@fluentui/react-components";

const useStyles = makeStyles({
    formGrid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr auto",
        gap: "12px",
        alignItems: "end",
        marginBottom: "16px",
    },
    scoreHistory: {
        marginTop: "24px",
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

interface ScoreEntry {
    id: string;
    player: string;
    mapTitle: string;
    score: number;
    mod: string;
    accuracy: number;
    combo: number;
    timestamp: string;
}

interface ScoreSubmissionProps {
    tournament: Tournament;
    user: User;
}

const mockScores: ScoreEntry[] = [
    {
        id: "1",
        player: "Player1",
        mapTitle: "Sidetracked Day",
        score: 875432,
        mod: "NM",
        accuracy: 98.45,
        combo: 1247,
        timestamp: "2025-09-29 14:30",
    },
    {
        id: "2",
        player: "Player2",
        mapTitle: "GHOST",
        score: 692847,
        mod: "HD",
        accuracy: 96.12,
        combo: 985,
        timestamp: "2025-09-29 15:15",
    },
];

export function ScoreSubmission({ tournament, user }: ScoreSubmissionProps) {
    const styles = useStyles();
    const [scores, setScores] = useState<ScoreEntry[]>(mockScores);
    const [newScore, setNewScore] = useState({
        player: "",
        mapTitle: "",
        score: "",
        mod: "NM",
    });
    const [showMessage, setShowMessage] = useState(false);

    const handleSubmit = () => {
        if (!newScore.player || !newScore.mapTitle || !newScore.score) {
            alert("请填写所有必填字段");
            return;
        }

        const scoreEntry: ScoreEntry = {
            id: Date.now().toString(),
            player: newScore.player,
            mapTitle: newScore.mapTitle,
            score: parseInt(newScore.score),
            mod: newScore.mod,
            accuracy: 0, // 这里需要从API获取
            combo: 0, // 这里需要从API获取
            timestamp: new Date().toLocaleString(),
        };

        setScores([scoreEntry, ...scores]);
        setNewScore({ player: "", mapTitle: "", score: "", mod: "NM" });
        setShowMessage(true);
        setTimeout(() => setShowMessage(false), 3000);
    };

    const columns: TableColumnDefinition<ScoreEntry>[] = [
        createTableColumn<ScoreEntry>({
            columnId: "player",
            renderHeaderCell: () => "玩家",
            renderCell: (item) => item.player,
        }),
        createTableColumn<ScoreEntry>({
            columnId: "map",
            renderHeaderCell: () => "图谱",
            renderCell: (item) => item.mapTitle,
        }),
        createTableColumn<ScoreEntry>({
            columnId: "score",
            renderHeaderCell: () => "分数",
            renderCell: (item) => item.score.toLocaleString(),
        }),
        createTableColumn<ScoreEntry>({
            columnId: "mod",
            renderHeaderCell: () => "Mod",
            renderCell: (item) => (
                <Badge appearance="filled" color="brand">
                    {item.mod}
                </Badge>
            ),
        }),
        createTableColumn<ScoreEntry>({
            columnId: "accuracy",
            renderHeaderCell: () => "准确率",
            renderCell: (item) => `${item.accuracy}%`,
        }),
        createTableColumn<ScoreEntry>({
            columnId: "timestamp",
            renderHeaderCell: () => "提交时间",
            renderCell: (item) => item.timestamp,
        }),
    ];

    return (
        <div>
            <Card>
                <CardHeader
                    header={<Title3>分数提交</Title3>}
                    description="提交队友的练习分数和使用的Mod"
                />

                {showMessage && (
                    <MessageBar intent="success" style={{ margin: "16px" }}>
                        分数提交成功！
                    </MessageBar>
                )}

                <div className={styles.formGrid} style={{ padding: "16px" }}>
                    <Field label="玩家名称" required>
                        <Input
                            value={newScore.player}
                            onChange={(e) => setNewScore({ ...newScore, player: e.target.value })}
                            placeholder="输入玩家OSU用户名"
                        />
                    </Field>

                    <Field label="图谱" required>
                        <Input
                            value={newScore.mapTitle}
                            onChange={(e) => setNewScore({ ...newScore, mapTitle: e.target.value })}
                            placeholder="图谱名称或BID"
                        />
                    </Field>

                    <Field label="分数" required>
                        <Input
                            type="number"
                            value={newScore.score}
                            onChange={(e) => setNewScore({ ...newScore, score: e.target.value })}
                            placeholder="分数"
                        />
                    </Field>

                    <Field label="Mod">
                        <Dropdown
                            value={newScore.mod}
                            onOptionSelect={(_, data) => setNewScore({ ...newScore, mod: data.optionValue || "NM" })}
                        >
                            <Option value="NM">NM</Option>
                            <Option value="HD">HD</Option>
                            <Option value="HR">HR</Option>
                            <Option value="DT">DT</Option>
                            <Option value="FM">FM</Option>
                        </Dropdown>
                    </Field>

                    <Button appearance="primary" onClick={handleSubmit}>
                        提交分数
                    </Button>
                </div>
            </Card>

            <div className={styles.scoreHistory}>
                <Card>
                    <CardHeader
                        header={<Title3>分数历史</Title3>}
                        description="最近提交的分数记录"
                    />

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
                        <DataGridBody<ScoreEntry>>
                            {({ item, rowId }) => (
                                <DataGridRow<ScoreEntry> key={rowId}>
                                    {({ renderCell }) => (
                                        <DataGridCell>{renderCell(item)}</DataGridCell>
                                    )}
                                </DataGridRow>
                            )}
                        </DataGridBody>
                    </DataGrid>
                </Card>
            </div>
        </div>
    );
}