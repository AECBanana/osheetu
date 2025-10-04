"use client";

import {
  Badge,
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  ProgressBar,
  Text,
  Title3,
  Tooltip,
  makeStyles,
  tokens,
  shorthands,
  type BadgeProps,
} from "@fluentui/react-components";
import { Dismiss24Regular, PlayCircle24Regular, ArrowClockwise24Regular } from "@fluentui/react-icons";
import { useMemo } from "react";

import { useDownloadManager, type DownloadItemState, type DownloadStatus } from "@/app/providers/DownloadManagerProvider";

const statusLabel: Record<DownloadStatus, string> = {
  pending: "等待中",
  downloading: "下载中",
  success: "已完成",
  error: "失败",
  cancelled: "已取消",
};

const statusColor: Record<DownloadStatus, BadgeProps["color"]> = {
  pending: "informative",
  downloading: "brand",
  success: "success",
  error: "danger",
  cancelled: "warning",
};

const useStyles = makeStyles({
  floatingButton: {
    position: "fixed",
    bottom: "24px",
    right: "24px",
    zIndex: 1000,
  },
  circleButton: {
    position: "relative",
    width: "64px",
    height: "64px",
    padding: 0,
    borderRadius: "8%",
    boxShadow: tokens.shadow16,
  },
  circleContent: {
    ...shorthands.padding("8px"),
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: tokens.spacingVerticalXS,
  },
  circlePercent: {
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: 1,
  },
  badge: {
    position: "absolute",
    top: "-6px",
    right: "-6px",
  },
  dialogSurface: {
    width: "480px",
    maxWidth: "calc(100vw - 32px)",
  },
  dialogContent: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: tokens.spacingHorizontalS,
  },
  statCard: {
    ...shorthands.padding(tokens.spacingHorizontalS),
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground3,
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
  },
  statLabel: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
  statValue: {
    fontSize: tokens.fontSizeBase300,
    fontWeight: tokens.fontWeightSemibold,
  },
  overallProgress: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
  },
  progressMeta: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
  queueList: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalM,
    maxHeight: "420px",
    overflowY: "auto",
  },
  queueItem: {
    ...shorthands.padding(tokens.spacingHorizontalM),
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground2,
    boxShadow: tokens.shadow4,
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
  },
  queueItemHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: tokens.spacingHorizontalM,
  },
  queueItemTitle: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
  },
  queueItemSubtitle: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
  queueItemMeta: {
    display: "flex",
    flexWrap: "wrap",
    gap: tokens.spacingHorizontalS,
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
  queueItemFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: tokens.spacingHorizontalS,
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
  errorText: {
    color: tokens.colorPaletteRedForeground1,
  },
  emptyState: {
    textAlign: "center",
    color: tokens.colorNeutralForeground3,
  },
  footerActions: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: tokens.spacingHorizontalS,
    paddingTop: tokens.spacingVerticalS,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
  },
  actionsRight: {
    display: "flex",
    gap: tokens.spacingHorizontalS,
  },
  zipRow: {
    ...shorthands.padding(tokens.spacingHorizontalS),
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground3,
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXS,
  },
  zipHint: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
});

const formatBytes = (value: number) => {
  if (!value) {
    return "0 B";
  }
  const units = ["B", "KB", "MB", "GB", "TB"];
  let index = 0;
  let bytes = value;
  while (bytes >= 1024 && index < units.length - 1) {
    bytes /= 1024;
    index += 1;
  }
  return `${bytes.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

const getItemStatusDetails = (item: DownloadItemState) => ({
  label: statusLabel[item.status],
  color: statusColor[item.status],
});

const DownloadManager = () => {
  const styles = useStyles();
  const {
    queue,
    stats,
    visible,
    minimized,
    zipDownloadUrl,
    zipDownloadName,
    isProcessing,
    toggleMinimize,
    closeManager,
    retryFailed,
    cancelAll,
  } = useDownloadManager();

  const activeCount = useMemo(
    () => queue.filter((item) => item.status === "pending" || item.status === "downloading").length,
    [queue]
  );

  const hasFailed = useMemo(
    () => queue.some((item) => item.status === "error" || item.status === "cancelled"),
    [queue]
  );

  const showFloatingButton = visible && minimized;
  const hasQueue = queue.length > 0;
  const progressPercent = stats.total > 0 ? Math.round(stats.overallProgress * 100) : 0;

  return (
    <>
      {showFloatingButton && (
        <div className={styles.floatingButton}>
          <Tooltip content="打开下载管理器" relationship="label">
            <Button
              appearance="primary"
              shape="circular"
              className={styles.circleButton}
              onClick={toggleMinimize}
              icon={<PlayCircle24Regular />}
            >
              <div className={styles.circleContent}>
                <Text className={styles.circlePercent}>{progressPercent}%</Text>
                <Text size={200}>{activeCount > 0 ? "下载中" : "查看"}</Text>
              </div>
              {hasQueue && <Badge className={styles.badge}>{stats.total}</Badge>}
            </Button>
          </Tooltip>
        </div>
      )}

      <Dialog open={visible && !minimized} modalType="modal">
        <DialogSurface className={styles.dialogSurface}>
          <DialogBody>
            <DialogTitle
              action={
                <Button
                  appearance="subtle"
                  icon={<Dismiss24Regular />}
                  aria-label="关闭"
                  onClick={closeManager}
                />
              }
            >
              下载管理器
            </DialogTitle>
            <DialogContent className={styles.dialogContent}>
              {hasQueue ? (
                <>
                  <div className={styles.statsRow}>
                    <div className={styles.statCard}>
                      <span className={styles.statLabel}>总数</span>
                      <span className={styles.statValue}>{stats.total}</span>
                    </div>
                    <div className={styles.statCard}>
                      <span className={styles.statLabel}>进行中</span>
                      <span className={styles.statValue}>{stats.running}</span>
                    </div>
                    <div className={styles.statCard}>
                      <span className={styles.statLabel}>成功</span>
                      <span className={styles.statValue}>{stats.success}</span>
                    </div>
                    <div className={styles.statCard}>
                      <span className={styles.statLabel}>失败 / 取消</span>
                      <span className={styles.statValue}>{stats.failed + stats.cancelled}</span>
                    </div>
                  </div>

                  <div className={styles.overallProgress}>
                    <Text weight="semibold">总体进度</Text>
                    <ProgressBar value={stats.overallProgress} max={1} thickness="large" />
                    <Text className={styles.progressMeta}>
                      {progressPercent}% · 已传输 {formatBytes(stats.receivedBytes)}
                      {stats.totalBytes ? ` / ${formatBytes(stats.totalBytes)}` : " / 未知大小"}
                    </Text>
                  </div>

                  <div className={styles.queueList}>
                    {queue.map((item) => {
                      const { label, color } = getItemStatusDetails(item);
                      return (
                        <div key={item.id} className={styles.queueItem}>
                          <div className={styles.queueItemHeader}>
                            <div className={styles.queueItemTitle}>
                              <Title3>{item.title}</Title3>
                              <Text className={styles.queueItemSubtitle}>
                                {item.difficulty} · {item.modValue}
                              </Text>
                            </div>
                            <Badge appearance="filled" color={color}>
                              {label}
                            </Badge>
                          </div>
                          <div className={styles.queueItemMeta}>
                            <span>Map ID: {item.mapId}</span>
                            <span>Beatmap ID: {item.beatmapId}</span>
                            {item.beatmapsetId && <span>Set ID: {item.beatmapsetId}</span>}
                          </div>
                          <ProgressBar value={item.progress} max={1} thickness="medium" />
                          <div className={styles.queueItemFooter}>
                            <Text>
                              {formatBytes(item.receivedBytes)}
                              {item.totalBytes ? ` / ${formatBytes(item.totalBytes)}` : " / 未知大小"}
                            </Text>
                            {item.error && <Text className={styles.errorText}>{item.error}</Text>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <Text className={styles.emptyState}>暂无下载任务</Text>
              )}

              {zipDownloadUrl && (
                <div className={styles.zipRow}>
                  <Button
                    as="a"
                    appearance="primary"
                    href={zipDownloadUrl}
                    download={zipDownloadName ?? undefined}
                  >
                    下载全部（ZIP）
                  </Button>
                  <Text className={styles.zipHint}>文件将保存到浏览器的默认下载目录</Text>
                </div>
              )}

              <div className={styles.footerActions}>
                <Button
                  appearance="outline"
                  onClick={cancelAll}
                  disabled={!hasQueue || (!isProcessing && activeCount === 0)}
                >
                  取消所有
                </Button>
                <div className={styles.actionsRight}>
                  <Button
                    appearance="secondary"
                    icon={<ArrowClockwise24Regular />}
                    onClick={retryFailed}
                    disabled={!hasFailed}
                  >
                    重试失败
                  </Button>
                  <Button appearance="primary" onClick={toggleMinimize}>
                    最小化
                  </Button>
                </div>
              </div>
            </DialogContent>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </>
  );
};

export default DownloadManager;
