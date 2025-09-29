"use client";

import { useState } from "react";
import {
    Card,
    CardHeader,
    Title3,
    Button,
    Input,
    Field,
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
    Tooltip,
    makeStyles,
} from "@fluentui/react-components";
import { CopyRegular, ArrowDownloadRegular } from "@fluentui/react-icons";

const useStyles = makeStyles({
    actionButtons: {
        display: "flex",
        gap: "8px",
        marginBottom: "16px",
    },
    mapInfo: {
        display: "flex",
        flexDirection: "column",
        gap: "4px",
    },
    modBadges: {
        display: "flex",
        gap: "4px",
        flexWrap: "wrap",
    },
});

interface Tournament {
    id: string;
    name: string;
    current_stage: string;
}

interface User {
    id: number;
    username: string;
}

interface Beatmap {
    id: string;
    bid: number;
    title: string;
    artist: string;
    mapper: string;
    difficulty: string;
    mod: string;
    stars: number;
    bpm: number;
    length: string;
    tags: string[];
}

interface MapPoolProps {
    tournament: Tournament;
    user: User;
}

const mockMaps: Beatmap[] = [
    {
        id: "1",
        bid: 3057123,
        title: "Sidetracked Day",
        artist: "Vinxis",
        mapper: "ScubDomino",
        difficulty: "Extra",
        mod: "NM",
        stars: 6.12,
        bpm: 180,
        length: "3:45",
        tags: ["jump", "stream"],
    },
    {
        id: "2",
        bid: 2867851,
        title: "GHOST",
        artist: "Camellia",
        mapper: "Mir",
        difficulty: "Extra",
        mod: "HD",
        stars: 6.35,
        bpm: 200,
        length: "4:12",
        tags: ["tech", "flow"],
    },
    {
        id: "3",
        bid: 3125847,
        title: "Blue Zenith",
        artist: "xi",
        mapper: "Asphyxia",
        difficulty: "FOUR DIMENSIONS",
        mod: "HR",
        stars: 7.23,
        bpm: 200,
        length: "5:32",
        tags: ["stream", "aim"],
    },
    {
        id: "4",
        bid: 2952847,
        title: "Time Freeze",
        artist: "TheFatRat",
        mapper: "PoNo",
        difficulty: "Insane",
        mod: "DT",
        stars: 6.89,
        bpm: 256,
        length: "2:45",
        tags: ["speed", "jump"],
    },
];

export function MapPool({ tournament, user }: MapPoolProps) {
    const styles = useStyles();
    const [maps] = useState<Beatmap[]>(mockMaps);
    const [selectedMaps, setSelectedMaps] = useState<string[]>([]);
    const [showMessage, setShowMessage] = useState(false);

    const getModColor = (mod: string) => {
        const colors = {
            NM: "brand",
            HD: "warning",
            HR: "danger",
            DT: "success",
            FM: "severe",
            TB: "important",
        };
        return colors[mod as keyof typeof colors] || "brand";
    };

    const copyBeatmapIds = () => {
        const selectedBids = maps
            .filter(map => selectedMaps.includes(map.id))
            .map(map => map.bid)
            .join(" ");

        navigator.clipboard.writeText(selectedBids);
        setShowMessage(true);
        setTimeout(() => setShowMessage(false), 3000);
    };

    const downloadSelected = () => {
        const selectedBids = maps
            .filter(map => selectedMaps.includes(map.id))
            .map(map => map.bid);

        // 在实际应用中，这里会调用批量下载API
        console.log("下载图谱:", selectedBids);
        alert(`将下载 ${selectedBids.length} 个图谱`);
    };

    const columns: TableColumnDefinition<Beatmap>[] = [
        createTableColumn<Beatmap>({
            columnId: "select",
            renderHeaderCell: () => "选择",
            renderCell: (item) => (
                <input
                    type="checkbox"
                    checked={selectedMaps.includes(item.id)}
                    onChange={(e) => {
                        if (e.target.checked) {
                            setSelectedMaps([...selectedMaps, item.id]);
                        } else {
                            setSelectedMaps(selectedMaps.filter(id => id !== item.id));
                        }
                    }}
                />
            ),
        }),
        createTableColumn<Beatmap>({
            columnId: "mod",
            renderHeaderCell: () => "Mod",
            renderCell: (item) => (
                <Badge appearance="filled" color={getModColor(item.mod) as any}>
                    {item.mod}
                </Badge>
            ),
        }),
        createTableColumn<Beatmap>({
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
        createTableColumn<Beatmap>({
            columnId: "stats",
            renderHeaderCell: () => "统计",
            renderCell: (item) => (
                <div>
                    <Text>★{item.stars}</Text>
                    <Text style={{ display: "block" }}>{item.bpm} BPM</Text>
                    <Text style={{ display: "block" }}>{item.length}</Text>
                </div>
            ),
        }),
        createTableColumn<Beatmap>({
            columnId: "tags",
            renderHeaderCell: () => "标签",
            renderCell: (item) => (
                <div className={styles.modBadges}>
                    {item.tags.map(tag => (
                        <Badge key={tag} appearance="outline" size="small">
                            {tag}
                        </Badge>
                    ))}
                </div>
            ),
        }),
        createTableColumn<Beatmap>({
            columnId: "bid",
            renderHeaderCell: () => "BID",
            renderCell: (item) => (
                <Tooltip content="点击复制" relationship="label">
                    <Button
                        appearance="subtle"
                        size="small"
                        icon={<CopyRegular />}
                        onClick={() => {
                            navigator.clipboard.writeText(item.bid.toString());
                            setShowMessage(true);
                            setTimeout(() => setShowMessage(false), 2000);
                        }}
                    >
                        {item.bid}
                    </Button>
                </Tooltip>
            ),
        }),
    ];

    return (
        <Card>
            <CardHeader
                header={<Title3>{tournament.current_stage.toUpperCase()} 图池</Title3>}
                description="当前阶段的比赛图池"
            />

            {showMessage && (
                <MessageBar intent="success" style={{ margin: "16px" }}>
                    已复制到剪贴板
                </MessageBar>
            )}

            <div className={styles.actionButtons} style={{ padding: "0 16px" }}>
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
                    复制BID ({selectedMaps.length})
                </Button>
                <Button
                    appearance="subtle"
                    onClick={() => {
                        if (selectedMaps.length === maps.length) {
                            setSelectedMaps([]);
                        } else {
                            setSelectedMaps(maps.map(m => m.id));
                        }
                    }}
                >
                    {selectedMaps.length === maps.length ? "取消全选" : "全选"}
                </Button>
            </div>

            <DataGrid
                items={maps}
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
                <DataGridBody<Beatmap>>
                    {({ item, rowId }) => (
                        <DataGridRow<Beatmap> key={rowId}>
                            {({ renderCell }) => (
                                <DataGridCell>{renderCell(item)}</DataGridCell>
                            )}
                        </DataGridRow>
                    )}
                </DataGridBody>
            </DataGrid>
        </Card>
    );
}