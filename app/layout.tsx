import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Together - Search and Navigate",
  description: "Search, find, and navigate to your destinations",
};

export default function RootLayout({
                                     children,
                                   }: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html lang="en" suppressHydrationWarning>
      <head>
        {/* 라이트 모드에서 다크 모드 클래스를 무시하는 스크립트 */}
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              const currentTheme = localStorage.getItem('theme');
              const systemDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
              
              // 라이트 모드일 때 dark: 클래스를 초기에 무시하는 스타일 추가
              if (currentTheme === 'light' || (!currentTheme && !systemDarkMode)) {
                document.documentElement.classList.remove('dark');
                document.documentElement.classList.add('light');
                
                // CSS 트랜지션 비활성화 (테마 초기화 중 깜빡임 방지)
                const style = document.createElement('style');
                style.textContent = 'body * { transition: none !important; }';
                document.head.appendChild(style);
                
                // 잠시 후 트랜지션 다시 활성화
                setTimeout(() => {
                  style.remove();
                }, 100);
              } else if (currentTheme === 'dark' || (!currentTheme && systemDarkMode)) {
                document.documentElement.classList.add('dark');
                document.documentElement.classList.remove('light');
              }
            })();
          `
        }} />
      </head>
      <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
      <ThemeProvider>
        {children}
      </ThemeProvider>
      </body>
      </html>
  );
}