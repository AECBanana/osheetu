"use client";

import {
  Button,
  Field,
  Switch,
  makeStyles,
  Title3,
  Card,
  CardHeader,
} from "@fluentui/react-components";
import { useCallback } from "react";
import { logout } from "@/utils/auth";
import { useTheme } from "@/app/providers/AppThemeProvider";

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
});

export function Settings() {
  const styles = useStyles();
  const { theme, toggleTheme } = useTheme();

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
