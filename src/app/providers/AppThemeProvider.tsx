"use client";

import { createContext, useContext, useState, useMemo, type ReactNode, useEffect } from "react";
import { webLightTheme, webDarkTheme, type Theme } from "@fluentui/react-components";

type AppThemeContextType = {
  theme: "light" | "dark";
  toggleTheme: () => void;
  fluentTheme: Theme;
};

const AppThemeContext = createContext<AppThemeContextType | null>(null);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    setTheme(prefersDark ? "dark" : "light");
  }, []);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  const fluentTheme = useMemo(() => (theme === "light" ? webLightTheme : webDarkTheme), [theme]);

  const value = useMemo(() => ({
    theme,
    toggleTheme,
    fluentTheme,
  }), [theme, toggleTheme, fluentTheme]);

  return (
    <AppThemeContext.Provider value={value}>
      {children}
    </AppThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(AppThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within an AppThemeProvider");
  }
  return context;
};
