"use client";

import {
  Button,
  Field,
  Switch,
  makeStyles,
  Title3,
  Card,
  CardHeader,
  Select,
  MessageBar,
  tokens,
} from "@fluentui/react-components";
import { useCallback, useState } from "react";
import { logout } from "@/utils/auth";
import { useTheme } from "@/app/providers/AppThemeProvider";
import { useAuthorizedTournaments } from "@/utils/hooks";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    maxWidth: "600px",
  },
  card: {
    padding: "16px",
  },
  field: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stageSelector: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    alignItems: "flex-start",
  },
  stageSelect: {
    minWidth: "200px",
  },
  stageActions: {
    display: "flex",
    justifyContent: "flex-end",
    width: "100%",
  },
});

export function Settings() {
  const styles = useStyles();
  const { theme, toggleTheme } = useTheme();
  const { tournaments } = useAuthorizedTournaments(null); // 获取所有比赛数据

  const [selectedTournament, setSelectedTournament] = useState<string>('');
  const [selectedStage, setSelectedStage] = useState<string>('');
  const [isUpdatingStage, setIsUpdatingStage] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<string>('');

  // 找到当前选中的比赛
  const currentTournament = tournaments.find(t => t.id === selectedTournament);

  const handleTournamentChange = (tournamentId: string) => {
    setSelectedTournament(tournamentId);
    const tournament = tournaments.find(t => t.id === tournamentId);
    if (tournament) {
      setSelectedStage(tournament.current_stage);
    }
    setUpdateMessage('');
  };

  const handleStageUpdate = async () => {
    if (!currentTournament || selectedStage === currentTournament.current_stage) return;

    setIsUpdatingStage(true);
    setUpdateMessage('');

    try {
      const response = await fetch(`/api/tournaments/${currentTournament.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current_stage: selectedStage,
        }),
      });

      if (response.ok) {
        setUpdateMessage('阶段更新成功！');
        // 刷新页面以更新所有相关数据
        window.location.reload();
      } else {
        setUpdateMessage('阶段更新失败，请重试。');
      }
    } catch (error) {
      setUpdateMessage('网络错误，请重试。');
    } finally {
      setIsUpdatingStage(false);
    }
  };

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch (error) {
      console.error("登出失败:", error);
    }
  }, []);

  return (
    <div className={styles.root}>
      <Card className={styles.card}>
        <CardHeader header={<Title3>外观设置</Title3>} />

        <Field
          label="夜间模式"
          className={styles.field}
        >
          <Switch
            checked={theme === "dark"}
            onChange={toggleTheme}
          />
        </Field>

      </Card>

      {/* 比赛阶段管理 - 只对队长显示 */}
      {tournaments.some(t => t.participant.role === 'captain') && (
        <Card className={styles.card}>
          <CardHeader header={<Title3>比赛阶段管理</Title3>} />

          <div className={styles.stageSelector}>
            <Field label="选择比赛">
              <Select
                value={selectedTournament}
                onChange={(e, data) => handleTournamentChange(data.value)}
              >
                {tournaments
                  .filter(t => t.participant.role === 'captain')
                  .map((tournament) => (
                    <option key={tournament.id} value={tournament.id}>
                      {tournament.name}
                    </option>
                  ))}
              </Select>
            </Field>

            {currentTournament && (
              <Field label="当前阶段">
                <Select
                  className={styles.stageSelect}
                  value={selectedStage}
                  onChange={(e, data) => setSelectedStage(data.value)}
                >
                  {currentTournament.stages.map((stage) => (
                    <option key={stage} value={stage}>
                      {stage.toUpperCase()}
                    </option>
                  ))}
                </Select>
              </Field>
            )}

            <div className={styles.stageActions}>
              <Button
                appearance="primary"
                onClick={handleStageUpdate}
                disabled={isUpdatingStage || !currentTournament || selectedStage === currentTournament.current_stage}
              >
                {isUpdatingStage ? '更新中...' : '更新阶段'}
              </Button>
            </div>
          </div>

          {updateMessage && (
            <MessageBar
              intent={updateMessage.includes('成功') ? 'success' : 'error'}
              style={{ marginTop: "12px" }}
            >
              {updateMessage}
            </MessageBar>
          )}
        </Card>
      )}

      <Card className={styles.card}>
        <CardHeader header={<Title3>账户操作</Title3>} />

        <Field
          label="退出当前账户"
          className={styles.field}
        >
          <Button appearance="primary" onClick={handleLogout}>
            登出
          </Button>
        </Field>

      </Card>
    </div>
  );
}
