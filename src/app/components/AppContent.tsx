"use client"

import { SessionProvider } from "next-auth/react";
import { FluentProvider, webLightTheme } from "@fluentui/react-components";

import { DownloadManagerProvider } from "../providers/DownloadManagerProvider";
import DownloadManager from "./download/DownloadManager";

export function AppContent({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <FluentProvider theme={webLightTheme}>
                <DownloadManagerProvider>
                    {children}
                    <DownloadManager />
                </DownloadManagerProvider>
            </FluentProvider>
        </SessionProvider>
    );
}