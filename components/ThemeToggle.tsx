'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleToggle = () => {
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);

    // 테마 변경 후 스타일 적용 지연
    setTimeout(() => {
      if (newTheme === 'light') {
        // 라이트 모드로 변경했을 때 dark: 클래스 숨기기
        const darkModeElements = document.querySelectorAll('[class*="dark:"]');
        darkModeElements.forEach(el => {
          (el as HTMLElement).style.transition = 'background-color 0.3s, color 0.3s, border-color 0.3s';
        });
      }
    }, 10);
  };

  // 컴포넌트 마운트 전에는 아무것도 렌더링하지 않음
  if (!mounted) return null;

  return (
      <button
          className="p-2 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200"
          onClick={handleToggle}
          aria-label="Toggle theme"
      >
        {resolvedTheme === 'dark' ? (
            // Sun icon for dark mode
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
            </svg>
        ) : (
            // Moon icon for light mode
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
            </svg>
        )}
      </button>
  );
}