"use client";

import { SessionProvider } from "next-auth/react";
import { FluentProvider } from "@fluentui/react-components";

import { DownloadManagerProvider } from "../providers/DownloadManagerProvider";
import DownloadManager from "./download/DownloadManager";
import { AppThemeProvider, useTheme } from "../providers/AppThemeProvider";

function ThemedApp({ children }: { children: React.ReactNode }) {
    const { fluentTheme } = useTheme();
    return (
        <FluentProvider theme={fluentTheme}>
            <DownloadManagerProvider>
                {children}
                <DownloadManager />
            </DownloadManagerProvider>
        </FluentProvider>
    );
}

export function AppContent({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <AppThemeProvider>
                <ThemedApp>{children}</ThemedApp>
            </AppThemeProvider>
        </SessionProvider>
    );
}