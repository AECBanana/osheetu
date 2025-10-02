"use client";

import { useState } from "react";
import {
    Button,
    Card,
    CardHeader,
    Title2,
    Body1,
    Link,
    makeStyles,
    tokens,
    Spinner,
    MessageBar,
} from "@fluentui/react-components";
import { loginWithOsu, type User } from '../../utils/auth';

const useStyles = makeStyles({
    loginCard: {
        padding: "24px",
        maxWidth: "400px",
        margin: "0 auto",
    },
    osuButton: {
        backgroundColor: "#ff66aa",
        color: "white",
        "&:hover": {
            backgroundColor: "#ff4499",
        },
        "&:active": {
            backgroundColor: "#ff3388",
        },
    },
    loadingContainer: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        justifyContent: "center",
        marginTop: "16px",
    },
});

interface LoginComponentProps {
    onLogin: (user: User) => void;
}

export function LoginComponent({ onLogin }: LoginComponentProps) {
    const styles = useStyles();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleOsuLogin = async () => {
        setLoading(true);
        setError(null);

        try {
            // 调用OSU OAuth登录
            loginWithOsu();
        } catch (err) {
            setError('登录失败，请重试');
            setLoading(false);
        }
    };

    return (
        <Card className={styles.loginCard}>
            <CardHeader
                header={<Title2>OSU! 账号登录</Title2>}
                description="使用你的 OSU! 账号登录以访问比赛功能"
            />

            {error && (
                <MessageBar intent="error" style={{ marginBottom: "16px" }}>
                    {error}
                </MessageBar>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <Button
                    appearance="primary"
                    size="large"
                    className={styles.osuButton}
                    onClick={handleOsuLogin}
                    disabled={loading}
                    style={{ width: "100%" }}
                >
                    {loading ? "登录中..." : "使用 OSU! 账号登录"}
                </Button>

                {loading && (
                    <div className={styles.loadingContainer}>
                        <Spinner size="small" />
                        <Body1>正在连接到 OSU! 服务器...</Body1>
                    </div>
                )}

                <Body1 style={{ textAlign: "center", fontSize: "12px", color: tokens.colorNeutralForeground2 }}>
                    登录即表示您同意我们的服务条款和隐私政策
                </Body1>

                <Body1 style={{ textAlign: "center", fontSize: "12px" }}>
                    需要 OSU! 账号？{" "}
                    <Link href="https://osu.ppy.sh/home/account/edit" target="_blank">
                        立即注册
                    </Link>
                </Body1>
            </div>
        </Card>
    );
}