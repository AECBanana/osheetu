"use client";

import { useState } from "react";
import {
    Title2,
    Title3,
    Card,
    CardHeader,
    Button,
    Input,
    Field,
    Dropdown,
    Option,
    Checkbox,
    Text,
    Body1,
    Divider,
    Tab,
    TabList,
    SelectTabEvent,
    SelectTabData,
    makeStyles,
    tokens,
    MessageBar,
    DataGrid,
    DataGridHeader,
    DataGridRow,
    DataGridHeaderCell,
    DataGridCell,
    DataGridBody,
    TableColumnDefinition,
    createTableColumn,
} from "@fluentui/react-components";
import { CreateTournament } from "./admin/CreateTournament";
import { ManageTournament } from "./admin/ManageTournament";

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
});

interface User {
    id: number;
    username: string;
    avatar_url: string;
    is_admin?: boolean;
    groups?: string[];
}

interface AdminPanelProps {
    user: User;
}

interface Tournament {
    id: string;
    name: string;
    mode: string;
    type: string;
    status: string;
    created_at: string;
    participants: number;
}

const mockTournaments: Tournament[] = [
    {
        id: "t1",
        name: "OSU! World Cup 2025",
        mode: "osu",
        type: "team",
        status: "active",
        created_at: "2025-01-15",
        participants: 32,
    },
    {
        id: "t2",
        name: "Taiko Championship",
        mode: "taiko",
        type: "player",
        status: "upcoming",
        created_at: "2025-02-01",
        participants: 16,
    },
];

export function AdminPanel({ user }: AdminPanelProps) {
    const styles = useStyles();
    const [selectedTab, setSelectedTab] = useState("tournaments");
    const [tournaments, setTournaments] = useState<Tournament[]>(mockTournaments);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);

    const onTabSelect = (event: SelectTabEvent, data: SelectTabData) => {
        setSelectedTab(data.value as string);
    };

    const columns: TableColumnDefinition<Tournament>[] = [
        createTableColumn<Tournament>({
            columnId: "name",
            compare: (a, b) => a.name.localeCompare(b.name),
            renderHeaderCell: () => "比赛名称",
            renderCell: (item) => item.name,
        }),
        createTableColumn<Tournament>({
            columnId: "mode",
            compare: (a, b) => a.mode.localeCompare(b.mode),
            renderHeaderCell: () => "模式",
            renderCell: (item) => item.mode.toUpperCase(),
        }),
        createTableColumn<Tournament>({
            columnId: "type",
            compare: (a, b) => a.type.localeCompare(b.type),
            renderHeaderCell: () => "类型",
            renderCell: (item) => item.type === "team" ? "团队赛" : "个人赛",
        }),
        createTableColumn<Tournament>({
            columnId: "status",
            compare: (a, b) => a.status.localeCompare(b.status),
            renderHeaderCell: () => "状态",
            renderCell: (item) => {
                const statusMap = {
                    active: "进行中",
                    upcoming: "即将开始",
                    completed: "已完成",
                };
                return statusMap[item.status as keyof typeof statusMap] || item.status;
            },
        }),
        createTableColumn<Tournament>({
            columnId: "participants",
            compare: (a, b) => a.participants - b.participants,
            renderHeaderCell: () => "参与者",
            renderCell: (item) => item.participants.toString(),
        }),
        createTableColumn<Tournament>({
            columnId: "actions",
            renderHeaderCell: () => "操作",
            renderCell: (item) => (
                <Button
                    appearance="outline"
                    size="small"
                    onClick={() => setSelectedTournament(item)}
                >
                    管理
                </Button>
            ),
        }),
    ];

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
                    onSuccess={(tournament: Tournament) => {
                        setTournaments([...tournaments, tournament]);
                        setShowCreateForm(false);
                    }}
                />
            </div>
        );
    }

    if (selectedTournament) {
        return (
            <div className={styles.container}>
                <div className={styles.actionButtons}>
                    <Button
                        appearance="secondary"
                        onClick={() => setSelectedTournament(null)}
                    >
                        返回列表
                    </Button>
                </div>
                <ManageTournament
                    tournament={selectedTournament}
                    onUpdate={(updatedTournament: Tournament) => {
                        setTournaments(tournaments.map(t =>
                            t.id === updatedTournament.id ? updatedTournament : t
                        ));
                    }}
                />
            </div>
        );
    }

    return (
        <div className={styles.container}>
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
                    <div className={styles.actionButtons}>
                        <Button
                            appearance="primary"
                            onClick={() => setShowCreateForm(true)}
                        >
                            创建新比赛
                        </Button>
                    </div>

                    <Card>
                        <CardHeader header={<Title3>比赛列表</Title3>} />
                        <DataGrid
                            items={tournaments}
                            columns={columns}
                            sortable
                            getRowId={(item) => item.id}
                        >
                            <DataGridHeader>
                                <DataGridRow>
                                    {({ renderHeaderCell }) => (
                                        <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                                    )}
                                </DataGridRow>
                            </DataGridHeader>
                            <DataGridBody<Tournament>>
                                {({ item, rowId }) => (
                                    <DataGridRow<Tournament> key={rowId}>
                                        {({ renderCell }) => (
                                            <DataGridCell>{renderCell(item)}</DataGridCell>
                                        )}
                                    </DataGridRow>
                                )}
                            </DataGridBody>
                        </DataGrid>
                    </Card>
                </div>
            )}

            {selectedTab === "users" && (
                <Card>
                    <CardHeader
                        header={<Title3>用户管理</Title3>}
                        description="管理用户权限和比赛分组"
                    />
                    <Body1 style={{ padding: "16px" }}>
                        用户管理功能开发中...
                    </Body1>
                </Card>
            )}

            {selectedTab === "system" && (
                <Card>
                    <CardHeader
                        header={<Title3>系统设置</Title3>}
                        description="配置系统参数和 OSU API 设置"
                    />
                    <Body1 style={{ padding: "16px" }}>
                        系统设置功能开发中...
                    </Body1>
                </Card>
            )}
        </div>
    );
}