"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AppItem,
  Body1,
  Button,
  Caption1,
  NavDivider,
  NavDrawer,
  NavDrawerBody,
  NavDrawerHeader,
  NavItem,
  NavSectionHeader,
  Text,
  Title2,
  Tooltip,
  makeStyles,
  mergeClasses,
  Select,
} from "@fluentui/react-components";
import { Hamburger } from "@fluentui/react-components";
import { useSession } from "next-auth/react";
import { LoginComponent } from "./components/LoginComponent";
import { Dashboard } from "./components/Dashboard";
import { AdminPanel } from "./components/AdminPanel";
import { Settings } from "./components/Settings";
import { loginWithOsu, logout, type User } from "../utils/auth";
import { AuthHandler } from "./components/AuthHandler";
import { useAuthorizedTournaments } from "../utils/hooks";
import {
  Board20Filled,
  Board20Regular,
  BoxMultiple20Filled,
  BoxMultiple20Regular,
  DataArea20Filled,
  DataArea20Regular,
  DocumentBulletListMultiple20Filled,
  DocumentBulletListMultiple20Regular,
  MegaphoneLoud20Filled,
  MegaphoneLoud20Regular,
  PeopleStar20Filled,
  PeopleStar20Regular,
  PersonCircle32Regular,
  PersonSearch20Filled,
  PersonSearch20Regular,
  Settings20Filled,
  Settings20Regular,
  bundleIcon,
} from "@fluentui/react-icons";

const useStyles = makeStyles({
  shell: {
    display: "flex",
    width: "100vw",
    height: "100vh",
    overflow: "hidden",
    backgroundColor: "var(--colorNeutralBackground2)",
  },
  drawer: {
    flex: "0 0 auto",
    height: "100%",
    borderRight: "1px solid var(--colorNeutralStroke2)",
    display: "flex",
    flexDirection: "column",
  },
  shellCollapsed: {
    flexDirection: "column",
    [`@media (min-width: 768px)`]: {
      flexDirection: "row",
    },
  },
  drawerBody: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    paddingBottom: "24px",
    flexGrow: 1,
    overflow: "hidden",
  },
  drawerHeaderArea: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    padding: "0 4px",
  },
  drawerScroll: {
    flexGrow: 1,
    overflowY: "auto",
    padding: "0 4px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  userSummary: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "0 4px",
  },
  avatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    objectFit: "cover",
  },
  userInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  navGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  navActions: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    padding: "0 4px",
  },
  navFooter: {
    marginTop: "auto",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    padding: "0 4px 24px",
  },
  tournamentSelect: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  mainBase: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
    padding: "32px 40px",
    flex: 1,
    height: "100%",
    minWidth: 0,
    overflow: "hidden",
  },
  mainConstrained: {
    maxWidth: "1200px",
    margin: "0 auto",
  },
  mainExpanded: {
    maxWidth: "none",
    margin: "0",
  },
  mainHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
  },
  mainHeaderLeft: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  mainTitleGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  mainContent: {
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    paddingRight: "8px",
  },
  navPlaceholder: {
    padding: "0 4px",
  },
});

const OverviewIcon = bundleIcon(Board20Filled, Board20Regular);
const ScoresIcon = bundleIcon(DocumentBulletListMultiple20Filled, DocumentBulletListMultiple20Regular);
const MapPoolIcon = bundleIcon(BoxMultiple20Filled, BoxMultiple20Regular);
const PracticeIcon = bundleIcon(DataArea20Filled, DataArea20Regular);
const AnalysisIcon = bundleIcon(PersonSearch20Filled, PersonSearch20Regular);
const BanPickIcon = bundleIcon(PeopleStar20Filled, PeopleStar20Regular);
const AdminIcon = bundleIcon(MegaphoneLoud20Filled, MegaphoneLoud20Regular);
const SettingsIcon = bundleIcon(Settings20Filled, Settings20Regular);

export default function Home() {
  const styles = useStyles();
  const { data: session, status } = useSession();
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedTab, setSelectedTab] = useState("overview");
  const [isNavOpen, setIsNavOpen] = useState(true);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
  const loading = status === "loading";
  const mainClassName = mergeClasses(
    styles.mainBase,
    isNavOpen ? styles.mainConstrained : styles.mainExpanded
  );

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

  const {
    tournaments,
    loading: tournamentsLoading,
    error: tournamentsError,
    refresh: refreshTournaments,
  } = useAuthorizedTournaments(user);

  useEffect(() => {
    if (!user) {
      setSelectedTournamentId(null);
      return;
    }

    if (tournaments.length === 0) {
      setSelectedTournamentId(null);
      return;
    }

    setSelectedTournamentId((prev) => {
      if (prev && tournaments.some((item) => item.id === prev)) {
        return prev;
      }
      return tournaments[0].id;
    });
  }, [user, tournaments]);

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
        setShowSettings(false);
      } else if (data.value === "settings") {
        setShowSettings(true);
        setShowAdminPanel(false);
      } else {
        setShowAdminPanel(false);
        setShowSettings(false);
        setSelectedTab(data.value);
      }
    },
    []
  );

  const handleNavToggle = useCallback(() => {
    setIsNavOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    if (!user) {
      setShowAdminPanel(false);
      setShowSettings(false);
      setSelectedTab("overview");
    } else {
      if (!user.is_admin && showAdminPanel) {
        setShowAdminPanel(false);
      }
    }
  }, [user, showAdminPanel]);

  const navSelectedValue = showAdminPanel ? "admin" : showSettings ? "settings" : selectedTab;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  if (loading) {
    return (
      <div className={mergeClasses(styles.shell, !isNavOpen && styles.shellCollapsed)}>
        <NavDrawer
          open={isNavOpen}
          type="inline"
          className={styles.drawer}
        >
          <NavDrawerHeader>
            <Tooltip content={isNavOpen ? "收起导航" : "展开导航"} relationship="label">
              <Hamburger onClick={handleNavToggle} aria-label="导航切换" aria-expanded={isNavOpen} />
            </Tooltip>
          </NavDrawerHeader>
          <NavDrawerBody className={styles.drawerBody}>
            <AppItem icon={<PersonCircle32Regular />}>OSheetu</AppItem>
            <Body1 className={styles.navPlaceholder}>加载中...</Body1>
          </NavDrawerBody>
        </NavDrawer>
        <div className={mainClassName}>
          <div className={styles.mainHeader}>
            <div className={styles.mainHeaderLeft}>
              <Tooltip content={isNavOpen ? "收起导航" : "展开导航"} relationship="label">
                <Hamburger onClick={handleNavToggle} aria-label="导航切换" aria-expanded={isNavOpen} />
              </Tooltip>
              <div className={styles.mainTitleGroup}>
                <Title2>OSheetu 控制台</Title2>
                <Body1>请稍候，正在获取会话信息...</Body1>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <AuthHandler />
      <div className={mergeClasses(styles.shell, !isNavOpen && styles.shellCollapsed)}>
        <NavDrawer
          open={isNavOpen}
          onOpenChange={(_, data) => setIsNavOpen(!!data.open)}
          onNavItemSelect={handleNavSelect}
          selectedValue={user ? navSelectedValue : undefined}
          type="inline"
          className={styles.drawer}
        >
          <NavDrawerHeader>
            {/* The Hamburger button was here, now removed. */}
            <div className={styles.drawerHeaderArea}>
              {user ? (
                <div className={styles.userSummary}>
                  <img src={user.avatar_url} alt={user.username} className={styles.avatar} />
                  <div className={styles.userInfo}>
                    <Text weight="semibold">{user.username}</Text>
                    <Caption1>{user.is_admin ? "管理员" : "参赛选手"}</Caption1>
                  </div>
                </div>
              ) : (
                <Body1 className={styles.navPlaceholder}>登录后可访问功能导航</Body1>
              )}
            </div>
          </NavDrawerHeader>
          <NavDrawerBody className={styles.drawerBody}>
            <div className={styles.drawerScroll}>
              {user ? (
                <div className={styles.navGroup}>
                  <NavSectionHeader>基础功能</NavSectionHeader>
                  <NavItem value="overview" icon={<OverviewIcon />}>
                    总览
                  </NavItem>
                  <NavItem value="scores" icon={<ScoresIcon />}>
                    分数提交
                  </NavItem>

                  <NavSectionHeader>对局工具</NavSectionHeader>
                  <NavItem value="mappool" icon={<MapPoolIcon />}>
                    图池
                  </NavItem>
                  <NavItem value="practice" icon={<PracticeIcon />}>
                    练图表总览
                  </NavItem>
                  <NavItem value="analysis" icon={<AnalysisIcon />}>
                    对手分析
                  </NavItem>
                  <NavItem value="banpick" icon={<BanPickIcon />}>
                    BP记分板
                  </NavItem>

                  {user.is_admin && (
                    <>
                      <NavSectionHeader>管理</NavSectionHeader>
                      <NavItem value="admin" icon={<AdminIcon />}>
                        管理面板
                      </NavItem>
                    </>
                  )}
                </div>
              ) : (
                <Body1 className={styles.navPlaceholder}>登录后可浏览功能菜单</Body1>
              )}
            </div>

            <div className={styles.navFooter}>
              {user && (
                <div className={styles.tournamentSelect}>
                  <Caption1>切换比赛</Caption1>
                  <Select
                    value={selectedTournamentId ?? ""}
                    onChange={(event) => {
                      const value = event.target.value;
                      setSelectedTournamentId(value || null);
                    }}
                    disabled={tournamentsLoading || tournaments.length === 0}
                  >
                    {tournaments.length === 0 ? (
                      <option value="">
                        {tournamentsError ? `加载失败：${tournamentsError}` : "暂无可用比赛"}
                      </option>
                    ) : (
                      tournaments.map((tournament) => (
                        <option key={tournament.id} value={tournament.id}>
                          {tournament.name}
                        </option>
                      ))
                    )}
                  </Select>
                </div>
              )}
              <NavDivider />
              <div className={styles.navActions}>
                {user ? (
                  <NavItem value="settings" icon={<SettingsIcon />}>
                    设置
                  </NavItem>
                ) : null}
              </div>
            </div>
          </NavDrawerBody>
        </NavDrawer>
        <div className={mainClassName}>
          <div className={styles.mainHeader}>
            <div className={styles.mainHeaderLeft}>
              <Tooltip content={isNavOpen ? "收起导航" : "展开导航"} relationship="label">
                <Hamburger onClick={handleNavToggle} aria-label="导航切换" aria-expanded={isNavOpen} />
              </Tooltip>
              <div className={styles.mainTitleGroup}>
                <Body1>
                  {user
                    ? `欢迎回来，${user.username}`
                    : "欢迎使用 OSheetu"}
                </Body1>
              </div>
            </div>
            {!user && (
              <Button appearance="primary" onClick={handleLogin}>
                使用 OSU! 账号登录
              </Button>
            )}
          </div>
          <div className={styles.mainContent}>
            {!user ? (
              <Body1>请点击右上角按钮登录以使用全部功能。</Body1>
            ) : showAdminPanel && user.is_admin ? (
              <AdminPanel user={user} />
            ) : showSettings ? (
              <Settings />
            ) : (
              <Dashboard
                user={user}
                selectedTab={selectedTab}
                tournaments={tournaments}
                tournamentsLoading={tournamentsLoading}
                tournamentsError={tournamentsError}
                onRetryTournaments={refreshTournaments}
                selectedTournamentId={selectedTournamentId}
                onSelectTournament={setSelectedTournamentId}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
