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
import { getSession, logout, type User } from '../utils/auth';

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

export default function Home() {
  const styles = useStyles();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  useEffect(() => {
    // 使用NextAuth获取用户会话信息
    const fetchUserSession = async () => {
      try {
        setLoading(true);
        const session = await getSession();
        if (session?.user) {
          // 确保返回的是符合客户端User接口的对象
          const { id, osu_id, username, avatar_url, is_admin, groups } = session.user;
          setUser({
            id: id as string,
            osu_id: osu_id as string,
            username: username as string,
            avatar_url: avatar_url as string,
            is_admin: is_admin as boolean,
            groups: groups as string[] | undefined
          });
        } else {
          // 确保用户状态被正确重置
          setUser(null);
        }
      } catch (error) {
        console.error('获取用户会话失败:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    // 初始加载时获取一次
    fetchUserSession();
    
    // 监听页面加载完成事件，确保在登录重定向后重新获取会话
    const handleLoad = () => {
      fetchUserSession();
    };
    
    window.addEventListener('load', handleLoad);
    
    // 清理事件监听
    return () => {
      window.removeEventListener('load', handleLoad);
    };
  }, []);

  const handleLogin = (userData: User) => {
    // NextAuth会自动处理用户会话，这里可以添加额外的处理逻辑
    setUser(userData);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setShowAdminPanel(false);
    } catch (error) {
      console.error('登出失败:', error);
    }
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
