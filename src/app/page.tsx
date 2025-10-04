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
  Spinner,
} from "@fluentui/react-components";
import { LoginComponent } from "./components/LoginComponent";
import { Dashboard } from "./components/Dashboard";
import { AdminPanel } from "./components/AdminPanel";
import { getSession, logout, type User } from '../utils/auth';
import { signIn } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';

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
  loadingOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
});

function AuthHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      setIsLoggingIn(true);
      // 使用获取到的code进行登录
      signIn('osu', { code, redirect: false })
        .then((result) => {
          if (result?.ok) {
            // 登录成功，移除URL中的code并刷新页面以获取会话
            router.replace('/', undefined);
          } else {
            // 处理登录失败
            console.error('登录失败:', result?.error);
            alert(`登录失败: ${result?.error || '未知错误'}`);
            router.replace('/', undefined);
          }
        })
        .catch(err => {
          console.error('登录过程中发生意外错误:', err);
          alert('登录过程中发生意外错误，请查看控制台');
          router.replace('/', undefined);
        })
        .finally(() => {
          setIsLoggingIn(false);
        });
    }
  }, [searchParams, router]);

  if (isLoggingIn) {
    const styles = useStyles();
    return (
      <div className={styles.loadingOverlay}>
        <Spinner size="huge" />
        <Title1 style={{ marginTop: '20px' }}>正在完成登录...</Title1>
        <Body1>请稍候，正在为您创建会话。</Body1>
      </div>
    );
  }

  return null;
}


export default function Home() {
  const styles = useStyles();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  useEffect(() => {
    const fetchUserSession = async () => {
      try {
        // setLoading(true); // 登录流程处理时，初始加载不再需要
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

    fetchUserSession();
    
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

  return (
    <>
      <AuthHandler />
      <div className={styles.container}>
        {loading ? (
          <div className={styles.header}>
            <Title1>OSU! 比赛管理系统</Title1>
            <Body1 style={{ marginTop: "8px", opacity: 0.9 }}>
              加载中...
            </Body1>
          </div>
        ) : !user ? (
          <>
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
          </>
        ) : showAdminPanel && user.is_admin ? (
          <>
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
          </>
        ) : (
          <>
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
          </>
        )}
      </div>
    </>
  );
}
