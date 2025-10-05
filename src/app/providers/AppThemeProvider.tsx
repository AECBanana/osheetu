"use client";

import { createContext, useContext, useState, useMemo, type ReactNode, useEffect } from "react";
import { webLightTheme, webDarkTheme, type Theme, createLightTheme, createDarkTheme, tokens, type BrandVariants } from "@fluentui/react-components";

export type ColorScheme = "blue" | "green" | "purple" | "orange" | "pink";

type AppThemeContextType = {
  theme: "light" | "dark";
  colorScheme: ColorScheme;
  toggleTheme: () => void;
  setColorScheme: (scheme: ColorScheme) => void;
  fluentTheme: Theme;
};

const AppThemeContext = createContext<AppThemeContextType | null>(null);

// 定义颜色主题
const colorSchemes = {
  blue: {
    primary: "#0078d4",
    light: "#106ebe",
    dark: "#005a9e",
  },
  green: {
    primary: "#107c10",
    light: "#0b5a0b",
    dark: "#0d652d",
  },
  purple: {
    primary: "#5c2d91",
    light: "#4b1c7c",
    dark: "#6b2ba6",
  },
  orange: {
    primary: "#ff8c00",
    light: "#e67300",
    dark: "#cc6600",
  },
  pink: {
    primary: "#e3008c",
    light: "#c4007a",
    dark: "#b3007a",
  },
};

const createCustomTheme = (baseTheme: Theme, colorScheme: ColorScheme): Theme => {
  const colors = colorSchemes[colorScheme];

  // 创建BrandVariants对象 - 使用更完整的变体
  const brandVariants: BrandVariants = {
    10: colors.primary,
    20: colors.light,
    30: colors.primary,
    40: colors.primary,
    50: colors.primary,
    60: colors.primary,
    70: colors.primary,
    80: colors.primary,
    90: colors.primary,
    100: colors.primary,
    110: colors.primary,
    120: colors.primary,
    130: colors.primary,
    140: colors.primary,
    150: colors.primary,
    160: colors.primary,
  };

  // 使用FluentUI的createLightTheme或createDarkTheme来创建完整的自定义主题
  const customTheme = baseTheme === webLightTheme
    ? createLightTheme(brandVariants)
    : createDarkTheme(brandVariants);

  return customTheme;
};

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [colorScheme, setColorScheme] = useState<ColorScheme>("blue");

  useEffect(() => {
    // 从localStorage读取保存的设置
    const savedTheme = localStorage.getItem("app-theme") as "light" | "dark" | null;
    const savedColorScheme = localStorage.getItem("app-color-scheme") as ColorScheme | null;

    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    setTheme(savedTheme || (prefersDark ? "dark" : "light"));
    setColorScheme(savedColorScheme || "blue");
  }, []);

  const toggleTheme = () => {
    setTheme((prevTheme) => {
      const newTheme = prevTheme === "light" ? "dark" : "light";
      localStorage.setItem("app-theme", newTheme);
      return newTheme;
    });
  };

  const handleSetColorScheme = (scheme: ColorScheme) => {
    setColorScheme(scheme);
    localStorage.setItem("app-color-scheme", scheme);
  };

  const fluentTheme = useMemo(() => {
    const baseTheme = theme === "light" ? webLightTheme : webDarkTheme;
    return createCustomTheme(baseTheme, colorScheme);
  }, [theme, colorScheme]);

  const value = useMemo(() => ({
    theme,
    colorScheme,
    toggleTheme,
    setColorScheme: handleSetColorScheme,
    fluentTheme,
  }), [theme, colorScheme, toggleTheme, handleSetColorScheme, fluentTheme]);

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
