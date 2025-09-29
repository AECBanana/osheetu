import type { Metadata } from "next";
import "./globals.css";
import { AppContent } from "./components/AppContent";



export const metadata: Metadata = {
  title: "OSU! 比赛管理系统",
  description: "专业的OSU比赛组织和管理平台，支持图池管理、分数统计、BP记录等功能",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh">
      <body>
        <AppContent>
          {children}
        </AppContent>
      </body>
    </html>
  );
}
