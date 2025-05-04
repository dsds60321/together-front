// RoutePageClient.tsx
// app/route/[id]/RoutePageClient.tsx
'use client';

import { useEffect, useState } from 'react';
import { notFound, useRouter } from 'next/navigation';
import Link from 'next/link'; // Link 컴포넌트 추가
import axios from 'axios';
import { Place } from '@/lib/data';
import { ThemeToggle } from '@/components/ThemeToggle'; // ThemeToggle 컴포넌트 추가

interface RoutePageClientProps {
    id: string;
}

export default function RoutePageClient({ id }: RoutePageClientProps) {
    const [mainPlace, setMainPlace] = useState<Place | null>(null);
    const [suggestions, setSuggestions] = useState<Place[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        // API에서 장소 정보 가져오기
        const fetchPlaceData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // API 호출하여 장소 정보 가져오기
                const response = await axios.get(`/api/places?id=${id}`);
                const { place, suggestions } = response.data;

                if (place) {
                    setMainPlace(place);
                    setSuggestions(suggestions || []);
                } else {
                    console.error('유효한 장소 정보가 반환되지 않았습니다');
                    setMainPlace(null);
                    setError('장소 정보를 찾을 수 없습니다');
                }
            } catch (error) {
                console.error('장소 데이터 로드 오류:', error);
                setMainPlace(null);
                setError('장소 정보를 불러오는 중 오류가 발생했습니다');
            } finally {
                setIsLoading(false);
            }
        };

        fetchPlaceData();
    }, [id]);

    // 로딩 중 표시
    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // 오류 발생 시
    if (error) {
        return (
            <div className="flex flex-col justify-center items-center min-h-screen p-4">
                <div className="text-red-500 text-xl mb-4">{error}</div>
                <button
                    onClick={() => router.push('/')}
                    className="btn-primary"
                >
                    메인으로 돌아가기
                </button>
            </div>
        );
    }

    // 장소 정보가 없으면 404 페이지로 이동
    if (!mainPlace) {
        notFound();
        return null;
    }

    // NavigationComponent에서 사용할 initialPlaces 준비
    const initialPlaces = [mainPlace, ...(suggestions || [])];

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
                        <h1 className="text-xl font-bold">Together - 경로 계획</h1>
                    </div>
                    <ThemeToggle />
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h2 className="text-2xl font-bold mb-4">{mainPlace.title}</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{mainPlace.description || '설명 없음'}</p>

                    <div className="mt-6">
                        <h3 className="text-xl font-semibold mb-4">경로 계획</h3>
                        <ul className="space-y-4">
                            {initialPlaces.map((place, index) => (
                                <li key={place.id} className="flex items-start p-3 border-b dark:border-gray-700">
                                    <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-3">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <h4 className="font-medium">{place.title}</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{place.description || '설명 없음'}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </main>

            <footer className="bg-white dark:bg-gray-800 py-6 border-t border-gray-200 dark:border-gray-700">
                <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-400">
                    <p>© 2025 Together. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}