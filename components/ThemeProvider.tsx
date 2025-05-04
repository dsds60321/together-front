'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { ReactNode, useEffect } from 'react';

interface ThemeProviderProps {
    children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
    useEffect(() => {
        // 테마 변경 감지 및 정확한 클래스 적용을 위한 스타일 추가
        const style = document.createElement('style');
        style.innerHTML = `
      /* 라이트 모드 기본 설정 (html.light 또는 html에 .dark가 없을 때) */
      html:not(.dark) .dark\\:bg-gray-900,
      html:not(.dark) .dark\\:bg-gray-800,
      html:not(.dark) .dark\\:bg-gray-700,
      html:not(.dark) .dark\\:text-gray-400,
      html:not(.dark) .dark\\:text-gray-300,
      html:not(.dark) .dark\\:text-gray-200,
      html:not(.dark) .dark\\:border-gray-700,
      html:not(.dark) .dark\\:border-gray-600,
      html:not(.dark) .dark\\:hover\\:bg-gray-600:hover {
        background-color: inherit !important;
        color: inherit !important;
        border-color: inherit !important;
      }
      
      /* 라이트 모드에서 기본 클래스 강화 */
      html:not(.dark) .bg-white {
        background-color: #ffffff !important;
      }
      
      html:not(.dark) .bg-gray-50 {
        background-color: #f9fafb !important;
      }
      
      html:not(.dark) .bg-gray-100 {
        background-color: #f3f4f6 !important;
      }
      
      html:not(.dark) .bg-gray-200 {
        background-color: #e5e7eb !important;
      }
      
      html:not(.dark) .text-gray-600 {
        color: #4b5563 !important;
      }
      
      html:not(.dark) .text-gray-700 {
        color: #374151 !important;
      }
      
      html:not(.dark) .text-gray-800 {
        color: #1f2937 !important;
      }
      
      /* 테두리 색상 부드럽게 조정 */
      html:not(.dark) .border,
      html:not(.dark) .border-gray-200,
      html:not(.dark) .border-gray-300,
      html:not(.dark) .dark\\:border-gray-700,
      html:not(.dark) .dark\\:border-gray-600 {
        border-color: #edf2f7 !important;
      }
      
      /* 헤더와 푸터의 테두리 */
      html:not(.dark) header,
      html:not(.dark) footer {
        border-color: #edf2f7 !important;
      }
      
      /* 그림자 효과도 부드럽게 */
      html:not(.dark) .shadow-sm {
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
      }
    `;
        document.head.appendChild(style);

        // 테마 변경 처리
        const handleThemeChange = () => {
            const isDarkMode = document.documentElement.classList.contains('dark');

            // 라이트 모드일 때 dark: 클래스를 무시하고 테두리 색상 조정
            if (!isDarkMode) {
                requestAnimationFrame(() => {
                    // 테두리 요소들에 밝은 색상 적용
                    const borderElements = document.querySelectorAll('[class*="border-"]');
                    borderElements.forEach(el => {
                        (el as HTMLElement).style.borderColor = '#edf2f7';
                    });

                    // 다크 모드 클래스를 사용하는 요소들에 현재 테마에 맞는 스타일 강제 적용
                    const darkBgElements = document.querySelectorAll('[class*="dark:bg-"]');
                    const darkTextElements = document.querySelectorAll('[class*="dark:text-"]');
                    const darkBorderElements = document.querySelectorAll('[class*="dark:border-"]');

                    darkBgElements.forEach(el => {
                        (el as HTMLElement).style.backgroundColor = '';
                    });

                    darkTextElements.forEach(el => {
                        (el as HTMLElement).style.color = '';
                    });

                    darkBorderElements.forEach(el => {
                        (el as HTMLElement).style.borderColor = '#edf2f7';
                    });
                });
            }
        };

        // MutationObserver로 body 클래스 변경 감지
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (
                    mutation.type === 'attributes' &&
                    mutation.attributeName === 'class'
                ) {
                    handleThemeChange();
                }
            });
        });

        observer.observe(document.documentElement, { attributes: true });

        // 초기 실행
        handleThemeChange();

        return () => {
            observer.disconnect();
            if (style.parentNode) {
                style.parentNode.removeChild(style);
            }
        };
    }, []);

    return (
        <NextThemesProvider
            attribute="class"
            defaultTheme="system"
            enableSystem={true}
        >
            {children}
        </NextThemesProvider>
    );
}