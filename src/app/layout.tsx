import type { Metadata } from "next";
import "./globals.css";
import { AppContent } from "./components/AppContent";
import { initializeApp } from '../utils/init';

// 在服务器端初始化应用
// 这个函数会在应用启动时运行一次
initializeApp().catch((error) => {
  console.error('应用初始化失败:', error);
});

export const metadata: Metadata = {
  title: "OSheetU 比赛练图表",
  description: "一个基于 Next.js 和 Fluent UI 的练图表",
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
