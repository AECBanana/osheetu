"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

export type DownloadStatus = "pending" | "downloading" | "success" | "error" | "cancelled";

export interface DownloadItemState {
  id: string;
  mapId: number;
  tournamentId: string;
  beatmapsetId: number | null;
  beatmapId: number;
  title: string;
  difficulty: string;
  modValue: string;
  status: DownloadStatus;
  progress: number;
  receivedBytes: number;
  totalBytes: number | null;
  error?: string;
  filename: string;
}

export interface DownloadBatchItemInput {
  mapId: number;
  beatmapId: number;
  beatmapsetId: number | null;
  title: string;
  difficulty: string;
  modValue: string;
  tournamentId: string;
}

interface StartBatchOptions {
  items: DownloadBatchItemInput[];
  replaceExisting?: boolean;
}

interface DownloadStats {
  total: number;
  success: number;
  failed: number;
  cancelled: number;
  running: number;
  overallProgress: number;
  receivedBytes: number;
  totalBytes: number | null;
}

interface DownloadManagerContextValue {
  queue: DownloadItemState[];
  stats: DownloadStats;
  visible: boolean;
  minimized: boolean;
  zipDownloadUrl: string | null;
  zipDownloadName: string | null;
  isProcessing: boolean;
  startBatch: (options: StartBatchOptions) => { added: number };
  openManager: () => void;
  closeManager: () => void;
  minimizeManager: () => void;
  toggleMinimize: () => void;
  retryFailed: () => void;
  cancelAll: () => void;
}

const DownloadManagerContext = createContext<DownloadManagerContextValue | null>(null);

const sanitizeFilename = (value: string) => {
  const sanitized = value
    .replace(/[^a-zA-Z0-9\u4e00-\u9fa5\-_.\s\[\]\(\)]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 140);
  return sanitized.length > 0 ? sanitized : "beatmap.osz";
};

const formatBatchItemToState = (input: DownloadBatchItemInput): DownloadItemState => {
  const identifier = input.beatmapsetId ?? input.beatmapId;
  const filename = sanitizeFilename(`[${input.modValue}] ${input.title} - ${input.difficulty} (${identifier}).osz`);
  return {
    id: `${input.tournamentId}:${input.mapId}`,
    mapId: input.mapId,
    tournamentId: input.tournamentId,
    beatmapsetId: input.beatmapsetId,
    beatmapId: input.beatmapId,
    title: input.title,
    difficulty: input.difficulty,
    modValue: input.modValue,
    status: input.beatmapsetId ? "pending" : "error",
    progress: 0,
    receivedBytes: 0,
    totalBytes: null,
    error: input.beatmapsetId ? undefined : "缺少 beatmapset_id 无法下载",
    filename,
  };
};

export function DownloadManagerProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<DownloadItemState[]>([]);
  const queueRef = useRef<DownloadItemState[]>(queue);
  const downloadBlobsRef = useRef(new Map<string, Blob>());
  const [visible, setVisible] = useState(false);
  const [minimized, setMinimized] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentBatchIdRef = useRef<number | null>(null);
  const [zipDownloadUrl, setZipDownloadUrl] = useState<string | null>(null);
  const [zipDownloadName, setZipDownloadName] = useState<string | null>(null);
  const zipObjectUrlRef = useRef<string | null>(null);
  const zipGeneratingRef = useRef(false);

  const setQueueSafe = useCallback((updater: (prev: DownloadItemState[]) => DownloadItemState[]) => {
    setQueue((prev) => {
      const next = updater(prev);
      queueRef.current = next;
      return next;
    });
  }, []);

  const cleanupZipUrl = useCallback(() => {
    if (zipObjectUrlRef.current) {
      URL.revokeObjectURL(zipObjectUrlRef.current);
      zipObjectUrlRef.current = null;
    }
    setZipDownloadUrl(null);
    setZipDownloadName(null);
  }, []);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      cleanupZipUrl();
    };
  }, [cleanupZipUrl]);

  const updateItem = useCallback((id: string, updater: (item: DownloadItemState) => DownloadItemState) => {
    setQueueSafe((prev) => prev.map((item) => (item.id === id ? updater(item) : item)));
  }, [setQueueSafe]);

  const assembleZip = useCallback(async (batchId: number) => {
    if (currentBatchIdRef.current !== batchId) {
      return;
    }
    if (zipGeneratingRef.current) {
      return;
    }

    const successfulItems = queueRef.current.filter((item) => item.status === "success");
    if (successfulItems.length === 0) {
      cleanupZipUrl();
      return;
    }

    zipGeneratingRef.current = true;
    try {
      cleanupZipUrl();
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();

      for (const item of successfulItems) {
        const blob = downloadBlobsRef.current.get(item.id);
        if (!blob) {
          continue;
        }
        const buffer = await blob.arrayBuffer();
        zip.file(item.filename, buffer);
      }

      const manifest = {
        generatedAt: new Date().toISOString(),
        total: successfulItems.length,
        failures: queueRef.current
          .filter((item) => item.status === "error" || item.status === "cancelled")
          .map((item) => ({
            mapId: item.mapId,
            tournamentId: item.tournamentId,
            reason: item.error ?? item.status,
          })),
      };

      zip.file("download-manifest.json", JSON.stringify(manifest, null, 2));

      const archive = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      });

      const url = URL.createObjectURL(archive);
      zipObjectUrlRef.current = url;
      const filename = `map-pool-download-${batchId}.zip`;
      setZipDownloadUrl(url);
      setZipDownloadName(filename);

      if (typeof window !== "undefined") {
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
      }
    } catch (error) {
      console.error("Failed to assemble download zip:", error);
    } finally {
      zipGeneratingRef.current = false;
    }
  }, [cleanupZipUrl]);

  const processQueue = useCallback(async () => {
    if (isProcessing) {
      return;
    }

    const batchId = currentBatchIdRef.current;
    if (!batchId) {
      return;
    }

    setIsProcessing(true);

    try {
      for (const item of queueRef.current) {
        if (currentBatchIdRef.current !== batchId) {
          return;
        }

        if (item.status !== "pending") {
          continue;
        }

        if (!item.beatmapsetId) {
          updateItem(item.id, (prev) => ({
            ...prev,
            status: "error",
            error: "缺少 beatmapset_id 无法下载",
          }));
          continue;
        }

        updateItem(item.id, (prev) => ({
          ...prev,
          status: "downloading",
          progress: 0,
          receivedBytes: 0,
          totalBytes: null,
          error: undefined,
        }));

        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
          const response = await fetch(
            `/api/tournaments/${encodeURIComponent(item.tournamentId)}/map-pool/download-map`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ mapId: item.mapId }),
              signal: controller.signal,
            }
          );

          if (!response.ok || !response.body) {
            let reason = "下载失败";
            try {
              const payload = await response.json();
              reason = payload?.error ?? reason;
            } catch {
              // ignore
            }
            throw new Error(reason);
          }

          const totalBytes = Number(response.headers.get("content-length") ?? "0");
          let received = 0;
          const reader = response.body.getReader();
          const chunks: Uint8Array[] = [];

          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              break;
            }
            if (value) {
              chunks.push(value);
              received += value.length;
              updateItem(item.id, (prev) => ({
                ...prev,
                receivedBytes: received,
                totalBytes: totalBytes > 0 ? totalBytes : null,
                progress:
                  totalBytes > 0
                    ? Math.min(received / totalBytes, 0.99)
                    : Math.min(prev.progress + value.length / 5_000_000, 0.99),
              }));
            }
          }

          const aggregated = new Uint8Array(received);
          let offset = 0;
          for (const chunk of chunks) {
            aggregated.set(chunk, offset);
            offset += chunk.length;
          }

          const blob = new Blob([aggregated], {
            type: response.headers.get("content-type") ?? "application/octet-stream",
          });
          downloadBlobsRef.current.set(item.id, blob);

          updateItem(item.id, (prev) => ({
            ...prev,
            status: "success",
            progress: 1,
            receivedBytes: received,
            totalBytes: totalBytes > 0 ? totalBytes : received,
          }));
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            updateItem(item.id, (prev) => ({
              ...prev,
              status: "cancelled",
              error: "已取消",
            }));
            return;
          }

          console.error("Download failed:", error);
          updateItem(item.id, (prev) => ({
            ...prev,
            status: "error",
            progress: 0,
            error: error instanceof Error ? error.message : "下载失败",
          }));
        } finally {
          abortControllerRef.current = null;
        }
      }

      if (currentBatchIdRef.current === batchId) {
        await assembleZip(batchId);
      }
    } finally {
      setIsProcessing(false);
    }
  }, [assembleZip, isProcessing, updateItem]);

  useEffect(() => {
    if (!isProcessing && queueRef.current.some((item) => item.status === "pending")) {
      void processQueue();
    }
  }, [isProcessing, processQueue, queue]);

  const startBatch = useCallback(({ items, replaceExisting = true }: StartBatchOptions) => {
    if (!items || items.length === 0) {
      return { added: 0 };
    }

    const formatted = items.map(formatBatchItemToState);

    if (replaceExisting) {
      abortControllerRef.current?.abort();
      currentBatchIdRef.current = Date.now();
      downloadBlobsRef.current.clear();
      cleanupZipUrl();
      zipGeneratingRef.current = false;
      setQueueSafe(() => formatted);
    } else {
      const existingIds = new Set(queueRef.current.map((item) => item.id));
      const toAdd = formatted.filter((item) => !existingIds.has(item.id));
      if (toAdd.length === 0) {
        return { added: 0 };
      }
      currentBatchIdRef.current = currentBatchIdRef.current ?? Date.now();
      setQueueSafe((prev) => [...prev, ...toAdd]);
    }

    setVisible(true);
    setMinimized(true);

    if (!isProcessing) {
      void processQueue();
    }

    return { added: formatted.length };
  }, [cleanupZipUrl, isProcessing, processQueue, setQueueSafe]);

  const openManager = useCallback(() => {
    setVisible(true);
    setMinimized(false);
  }, []);

  const closeManager = useCallback(() => {
    setVisible(false);
  }, []);

  const minimizeManager = useCallback(() => {
    setVisible(true);
    setMinimized(true);
  }, []);

  const toggleMinimize = useCallback(() => {
    setVisible(true);
    setMinimized((prev) => !prev);
  }, []);

  const cancelAll = useCallback(() => {
    abortControllerRef.current?.abort();
    currentBatchIdRef.current = null;
    downloadBlobsRef.current.clear();
    zipGeneratingRef.current = false;
    cleanupZipUrl();
    setQueueSafe((prev) =>
      prev.map((item) => {
        if (item.status === "pending" || item.status === "downloading") {
          return {
            ...item,
            status: "cancelled",
            progress: 0,
            error: "已取消",
          };
        }
        return item;
      })
    );
  }, [cleanupZipUrl, setQueueSafe]);

  const retryFailed = useCallback(() => {
    const hasRetryable = queueRef.current.some((item) => item.status === "error" || item.status === "cancelled");
    if (!hasRetryable) {
      return;
    }

    currentBatchIdRef.current = Date.now();
    downloadBlobsRef.current.clear();
    cleanupZipUrl();
    zipGeneratingRef.current = false;
    setMinimized(false);
    setQueueSafe((prev) =>
      prev.map((item) => {
        if (item.status === "error" || item.status === "cancelled") {
          if (!item.beatmapsetId) {
            return {
              ...item,
              status: "error",
              progress: 0,
              error: "缺少 beatmapset_id 无法下载",
            };
          }
          return {
            ...item,
            status: "pending",
            progress: 0,
            receivedBytes: 0,
            totalBytes: null,
            error: undefined,
          };
        }
        return item;
      })
    );

    if (!isProcessing) {
      void processQueue();
    }
  }, [cleanupZipUrl, isProcessing, processQueue, setQueueSafe]);

  const stats = useMemo<DownloadStats>(() => {
    if (queue.length === 0) {
      return {
        total: 0,
        success: 0,
        failed: 0,
        cancelled: 0,
        running: 0,
        overallProgress: 0,
        receivedBytes: 0,
        totalBytes: null,
      };
    }

    let success = 0;
    let failed = 0;
    let cancelled = 0;
    let running = 0;
    let progressSum = 0;
    let receivedBytes = 0;
    let totalBytes = 0;

    for (const item of queue) {
      if (item.status === "success") {
        success += 1;
      } else if (item.status === "error") {
        failed += 1;
      } else if (item.status === "cancelled") {
        cancelled += 1;
      } else if (item.status === "downloading") {
        running += 1;
      }

      progressSum += item.progress;
      receivedBytes += item.receivedBytes;
      if (item.totalBytes && item.totalBytes > 0) {
        totalBytes += item.totalBytes;
      }
    }

    return {
      total: queue.length,
      success,
      failed,
      cancelled,
      running,
      overallProgress: Math.min(progressSum / queue.length, 1),
      receivedBytes,
      totalBytes: totalBytes > 0 ? totalBytes : null,
    };
  }, [queue]);

  const value = useMemo<DownloadManagerContextValue>(() => ({
    queue,
    stats,
    visible,
    minimized,
    zipDownloadUrl,
    zipDownloadName,
    isProcessing,
    startBatch,
    openManager,
    closeManager,
    minimizeManager,
    toggleMinimize,
    retryFailed,
    cancelAll,
  }), [
    cancelAll,
    closeManager,
    isProcessing,
    minimized,
    openManager,
    queue,
    retryFailed,
    startBatch,
    stats,
    toggleMinimize,
    visible,
    zipDownloadName,
    zipDownloadUrl,
    minimizeManager,
  ]);

  return <DownloadManagerContext.Provider value={value}>{children}</DownloadManagerContext.Provider>;
}

export const useDownloadManager = () => {
  const context = useContext(DownloadManagerContext);
  if (!context) {
    throw new Error("useDownloadManager 必须在 DownloadManagerProvider 内使用");
  }
  return context;
};
