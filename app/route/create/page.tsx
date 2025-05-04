// app/route/create/page.tsx
'use client';

import {ThemeToggle} from '@/components/ThemeToggle';
import Link from 'next/link';
import {NavigationComponent} from "@/components/NavigationComponent";

export default function CreateRoutePage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow-sm">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center">
                        <Link href="/" className="mr-4">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                            </svg>
                        </Link>
                        <h1 className="text-xl font-bold">경로 생성</h1>
                    </div>
                    <ThemeToggle />
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold mb-6">나만의 경로 만들기</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                    장소를 검색하고 경로를 만든 후 T맵이나 네이버 지도로 내비게이션하세요.
                </p>

                <NavigationComponent />
            </main>

            <footer className="bg-white dark:bg-gray-800 py-6 border-t border-gray-200 dark:border-gray-700">
                <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-400">
                    <p>© 2025 Together. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}