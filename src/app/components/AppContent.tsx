"use client"

import {
    FluentProvider,
    webLightTheme
} from "@fluentui/react-components";

export function AppContent({ children }: { children: React.ReactNode }) {
    return (
        <FluentProvider theme={webLightTheme}>
            {children}
        </FluentProvider>
    );
}