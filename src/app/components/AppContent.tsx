"use client"

import { SessionProvider } from "next-auth/react";
import {
    FluentProvider,
    webLightTheme
} from "@fluentui/react-components";

export function AppContent({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <FluentProvider theme={webLightTheme}>
                {children}
            </FluentProvider>
        </SessionProvider>
    );
}