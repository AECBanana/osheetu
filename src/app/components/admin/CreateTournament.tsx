"use client";

import { useState } from "react";
import {
    Card,
    CardHeader,
    Title2,
    Title3,
    Button,
    Input,
    Field,
    Dropdown,
    Option,
    Checkbox,
    Text,
    Body1,
    Divider,
    MessageBar,
    makeStyles,
} from "@fluentui/react-components";

const useStyles = makeStyles({
    formGrid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "16px",
        marginBottom: "16px",
    },
    fullWidth: {
        gridColumn: "1 / -1",
    },
    actionButtons: {
        display: "flex",
        gap: "12px",
        marginTop: "24px",
    },
    sectionCard: {
        marginBottom: "24px",
        padding: "16px",
    },
});

interface CreateTournamentProps {
    onCancel: () => void;
    onSuccess: (tournament: any) => void;
}

export function CreateTournament({ onCancel, onSuccess }: CreateTournamentProps) {
    const styles = useStyles();
    const [formData, setFormData] = useState({
        name: "",
        mode: "osu",
        type: "team",
        stages: [] as string[],
        includeQualifier: false,
        customMods: false,
    });
    const [showMessage, setShowMessage] = useState("");

    const availableStages = ["qua", "ro32", "ro16", "sf", "f", "gf"];
    const defaultMods = ["nm", "hd", "hr", "dt", "fm", "tb"];

    const handleStageToggle = (stage: string, checked: boolean) => {
        if (checked) {
            setFormData({
                ...formData,
                stages: [...formData.stages, stage].sort((a, b) =>
                    availableStages.indexOf(a) - availableStages.indexOf(b)
                ),
            });
        } else {
            setFormData({
                ...formData,
                stages: formData.stages.filter(s => s !== stage),
            });
        }
    };

    const handleSubmit = () => {
        if (!formData.name.trim()) {
            setShowMessage("请输入比赛名称");
            return;
        }

        if (formData.stages.length === 0) {
            setShowMessage("请至少选择一个比赛阶段");
            return;
        }

        // 创建新比赛
        const newTournament = {
            id: `t${Date.now()}`,
            name: formData.name,
            mode: formData.mode,
            type: formData.type,
            stages: formData.stages,
            status: "upcoming",
            created_at: new Date().toISOString().split('T')[0],
            participants: 0,
        };

        onSuccess(newTournament);
    };

    return (
        <div>
            <Card className={styles.sectionCard}>
                <CardHeader
                    header={<Title2>创建新比赛</Title2>}
                    description="配置比赛基本信息和规则"
                />

                {showMessage && (
                    <MessageBar intent="error" style={{ marginBottom: "16px" }}>
                        {showMessage}
                    </MessageBar>
                )}

                {/* 基本信息 */}
                <div className={styles.formGrid}>
                    <Field label="比赛名称" required className={styles.fullWidth}>
                        <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="输入比赛名称"
                        />
                    </Field>

                    <Field label="游戏模式" required>
                        <Dropdown
                            value={formData.mode}
                            onOptionSelect={(_, data) =>
                                setFormData({ ...formData, mode: data.optionValue || "osu" })
                            }
                        >
                            <Option value="osu">osu!</Option>
                            <Option value="taiko">osu!taiko</Option>
                            <Option value="mania">osu!mania</Option>
                            <Option value="catch">osu!catch</Option>
                        </Dropdown>
                    </Field>

                    <Field label="比赛类型" required>
                        <Dropdown
                            value={formData.type}
                            onOptionSelect={(_, data) =>
                                setFormData({ ...formData, type: data.optionValue || "team" })
                            }
                        >
                            <Option value="team">团队赛 (Team vs Team)</Option>
                            <Option value="player">个人赛 (Player vs Player)</Option>
                        </Dropdown>
                    </Field>
                </div>
            </Card>

            {/* 比赛阶段配置 */}
            <Card className={styles.sectionCard}>
                <CardHeader
                    header={<Title3>比赛阶段配置</Title3>}
                    description="选择比赛包含的阶段"
                />

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
                    {availableStages.map((stage) => (
                        <Checkbox
                            key={stage}
                            label={stage.toUpperCase()}
                            checked={formData.stages.includes(stage)}
                            onChange={(_, data) => handleStageToggle(stage, !!data.checked)}
                        />
                    ))}
                </div>

                <Divider style={{ margin: "16px 0" }} />

                <Checkbox
                    label="包含资格赛 (Qualifier)"
                    checked={formData.includeQualifier}
                    onChange={(_, data) =>
                        setFormData({ ...formData, includeQualifier: !!data.checked })
                    }
                />
            </Card>

            {/* Mod配置 */}
            <Card className={styles.sectionCard}>
                <CardHeader
                    header={<Title3>Mod类型配置</Title3>}
                    description="配置比赛使用的Mod类型"
                />

                <div>
                    <Text weight="semibold">默认Mod类型:</Text>
                    <div style={{ display: "flex", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
                        {defaultMods.map((mod) => (
                            <Text key={mod} style={{ padding: "4px 8px", backgroundColor: "#f3f2f1", borderRadius: "4px" }}>
                                {mod.toUpperCase()}
                            </Text>
                        ))}
                    </div>
                </div>

                <Divider style={{ margin: "16px 0" }} />

                <Checkbox
                    label="启用自定义Mod (包含lazer mod)"
                    checked={formData.customMods}
                    onChange={(_, data) =>
                        setFormData({ ...formData, customMods: !!data.checked })
                    }
                />

                {formData.customMods && (
                    <Body1 style={{ marginTop: "8px", fontStyle: "italic" }}>
                        自定义Mod功能将在比赛创建后在管理面板中配置
                    </Body1>
                )}
            </Card>

            {/* 操作按钮 */}
            <div className={styles.actionButtons}>
                <Button appearance="primary" onClick={handleSubmit}>
                    创建比赛
                </Button>
                <Button appearance="secondary" onClick={onCancel}>
                    取消
                </Button>
            </div>
        </div>
    );
}