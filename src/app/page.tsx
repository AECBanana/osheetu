"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Body1,
  Button,
  Caption1,
  Card,
  Nav,
  NavItem,
  Text,
  Title2,
  makeStyles,
} from "@fluentui/react-components";
import { useSession } from "next-auth/react";
import { LoginComponent } from "./components/LoginComponent";
import { Dashboard } from "./components/Dashboard";
import { AdminPanel } from "./components/AdminPanel";
import { loginWithOsu, logout, type User } from "../utils/auth";
import { AuthHandler } from "./components/AuthHandler";

const useStyles = makeStyles({
  layout: {
    display: "flex",
    gap: "32px",
    padding: "32px 24px",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  sidebar: {
    width: "280px",
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  sidebarCard: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    padding: "20px",
  },
  brand: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  userSummary: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  avatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    objectFit: "cover",
  },
  navSections: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  navSection: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  navSectionTitle: {
    color: "var(--colorNeutralForeground3)",
  },
  actions: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  main: {
    flex: 1,
    minWidth: 0,
  },
  loadingCard: {
    padding: "24px",
  },
});

interface NavSectionConfig {
  title: string;
  items: Array<{ value: string; label: string; description?: string }>;
}

export default function Home() {
  const styles = useStyles();
  const { data: session, status } = useSession();
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [selectedTab, setSelectedTab] = useState("overview");
  const loading = status === "loading";

  const user = useMemo(() => {
    if (!session?.user) {
      return null;
    }

    const { id, osu_id, username, avatar_url, is_admin, groups } = session.user as User;
    return {
      id: id as string,
      osu_id: osu_id as string,
      username: username as string,
      avatar_url: avatar_url as string,
      is_admin: is_admin as boolean,
      groups: groups as string[] | undefined,
    } satisfies User;
  }, [session]);

  const navSections = useMemo<NavSectionConfig[]>(() => {
    const sections: NavSectionConfig[] = [
      {
        title: "基础功能",
        items: [
          { value: "overview", label: "总览" },
          { value: "scores", label: "分数提交" },
        ],
      },
      {
        title: "对局工具",
        items: [
          { value: "mappool", label: "图池" },
          { value: "practice", label: "练图表总览" },
          { value: "analysis", label: "对手分析" },
          { value: "banpick", label: "BP记分板" },
        ],
      },
    ];

    if (user?.is_admin) {
      sections.push({
        title: "管理",
        items: [{ value: "admin", label: "管理面板" }],
      });
    }

    return sections;
  }, [user?.is_admin]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      setShowAdminPanel(false);
      setSelectedTab("overview");
    } catch (error) {
      console.error("登出失败:", error);
    }
  }, []);

  const handleLogin = useCallback(async () => {
    try {
      await loginWithOsu();
    } catch (error) {
      console.error("登录发起失败:", error);
    }
  }, []);

  const handleNavSelect = useCallback(
    (_event: unknown, data: { value?: unknown }) => {
      if (typeof data.value !== "string") {
        return;
      }

      if (data.value === "admin") {
        setShowAdminPanel(true);
      } else {
        setShowAdminPanel(false);
        setSelectedTab(data.value);
      }
    },
    []
  );

  useEffect(() => {
    if (!user) {
      setShowAdminPanel(false);
      setSelectedTab("overview");
    } else if (!user.is_admin && showAdminPanel) {
      setShowAdminPanel(false);
    }
  }, [user, showAdminPanel]);

  const navSelectedValue = showAdminPanel ? "admin" : selectedTab;

  if (loading) {
    return (
      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <Card appearance="filled" className={styles.sidebarCard}>
            <div className={styles.brand}>
              <Title2>OSheetu</Title2>
              <Body1>加载中...</Body1>
            </div>
          </Card>
        </aside>
        <main className={styles.main}>
          <Card className={styles.loadingCard}>
            <Body1>请稍候，正在获取会话信息...</Body1>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <>
      <AuthHandler />
      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <Card appearance="filled" className={styles.sidebarCard}>
            <div className={styles.brand}>
              <Title2>OSheetu</Title2>
              <Body1>osu! 比赛练图助手</Body1>
            </div>
            {user && (
              <div className={styles.userSummary}>
                <img src={user.avatar_url} alt={user.username} className={styles.avatar} />
                <div>
                  <Text weight="semibold">{user.username}</Text>
                  <Caption1>{user.is_admin ? "管理员" : "参赛选手"}</Caption1>
                </div>
              </div>
            )}
            {user && (
              <div className={styles.navSections}>
                {navSections.map((section) => (
                  <div key={section.title} className={styles.navSection}>
                    <Caption1 className={styles.navSectionTitle}>{section.title}</Caption1>
                    <Nav selectedValue={navSelectedValue} onNavItemSelect={handleNavSelect}>
                      {section.items.map((item) => (
                        <NavItem key={item.value} value={item.value}>
                          {item.label}
                        </NavItem>
                      ))}
                    </Nav>
                  </div>
                ))}
              </div>
            )}
            <div className={styles.actions}>
              {user ? (
                <Button appearance="secondary" onClick={handleLogout}>
                  登出
                </Button>
              ) : (
                <Button appearance="primary" onClick={handleLogin}>
                  使用 OSU! 账号登录
                </Button>
              )}
            </div>
          </Card>
        </aside>
        <main className={styles.main}>
          {!user ? (
            <LoginComponent />
          ) : showAdminPanel && user.is_admin ? (
            <AdminPanel user={user} />
          ) : (
            <Dashboard user={user} selectedTab={selectedTab} />
          )}
        </main>
      </div>
    </>
  );
}
