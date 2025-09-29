"use client";

import { useState, useEffect } from "react";
import {
  Title1,
  Body1,
  Button,
  Card,
  CardHeader,
  makeStyles,
  tokens,
  Text,
} from "@fluentui/react-components";
import { LoginComponent } from "./components/LoginComponent";
import { Dashboard } from "./components/Dashboard";
import { AdminPanel } from "./components/AdminPanel";

const useStyles = makeStyles({
  container: {
    padding: "20px",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  header: {
    textAlign: "center",
    marginBottom: "32px",
    background: `linear-gradient(135deg, ${tokens.colorBrandBackground} 0%, ${tokens.colorBrandBackground2} 100%)`,
    padding: "24px",
    borderRadius: "12px",
    color: tokens.colorNeutralForegroundOnBrand,
  },
  welcomeCard: {
    padding: "32px",
    textAlign: "center",
    marginBottom: "24px",
  },
});

interface User {
  id: number;
  username: string;
  avatar_url: string;
  is_admin?: boolean;
  groups?: string[];
}

export default function Home() {
  const styles = useStyles();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  useEffect(() => {
    // 检查本地存储的用户信息
    const savedUser = localStorage.getItem('osu_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('osu_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('osu_user');
    setShowAdminPanel(false);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Title1>OSU! 比赛管理系统</Title1>
          <Body1 style={{ marginTop: "8px", opacity: 0.9 }}>
            加载中...
          </Body1>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Title1>OSU! 比赛管理系统</Title1>
          <Body1 style={{ marginTop: "8px", opacity: 0.9 }}>
            专业的OSU比赛组织和管理平台
          </Body1>
        </div>

        <Card className={styles.welcomeCard}>
          <CardHeader
            header={<Title1>欢迎使用 OSU! 比赛管理系统</Title1>}
            description="请使用 OSU! 账号登录以访问完整功能"
          />
          <LoginComponent onLogin={handleLogin} />
        </Card>
      </div>
    );
  }

  if (showAdminPanel && user.is_admin) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Title1>管理面板</Title1>
          <Body1 style={{ marginTop: "8px", opacity: 0.9 }}>
            欢迎，{user.username}
          </Body1>
          <div style={{ marginTop: "12px", display: "flex", gap: "8px", justifyContent: "center" }}>
            <Button
              appearance="secondary"
              onClick={() => setShowAdminPanel(false)}
            >
              返回主页
            </Button>
            <Button
              appearance="secondary"
              onClick={handleLogout}
            >
              登出
            </Button>
          </div>
        </div>
        <AdminPanel user={user} />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Title1>OSU! 比赛管理系统</Title1>
        <Body1 style={{ marginTop: "8px", opacity: 0.9 }}>
          欢迎，{user.username}
        </Body1>
        <div style={{ marginTop: "12px", display: "flex", gap: "8px", justifyContent: "center" }}>
          {user.is_admin && (
            <Button
              appearance="primary"
              onClick={() => setShowAdminPanel(true)}
            >
              管理面板
            </Button>
          )}
          <Button
            appearance="secondary"
            onClick={handleLogout}
          >
            登出
          </Button>
        </div>
      </div>
      <Dashboard user={user} />
    </div>
  );
}
