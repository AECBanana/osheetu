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

  // 复制基础主题
  const customTheme = { ...baseTheme };

  // 修改主要的品牌颜色 - 这些是按钮、链接等组件使用的主要颜色
  customTheme.colorBrandBackground = colors.primary;
  customTheme.colorBrandBackgroundHover = colors.light;
  customTheme.colorBrandBackgroundPressed = colors.dark;
  customTheme.colorBrandForeground1 = colors.primary;
  customTheme.colorBrandForeground2 = colors.primary;
  customTheme.colorBrandForegroundLink = colors.primary;
  customTheme.colorBrandForegroundLinkHover = colors.light;
  customTheme.colorBrandForegroundLinkPressed = colors.dark;

  // 修改品牌边框颜色
  customTheme.colorBrandStroke1 = colors.primary;
  customTheme.colorBrandStroke2 = colors.light;

  // 修改复合品牌颜色（用于特殊组件）
  customTheme.colorCompoundBrandBackground = colors.primary;
  customTheme.colorCompoundBrandForeground1 = colors.primary;

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
