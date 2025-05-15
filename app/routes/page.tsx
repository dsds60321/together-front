// app/routes/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SavedRoute } from '@/types/route';
import { useUser } from '@/context/userContext';
import apiClient from '@/lib/api';

export default function SavedRoutesPage() {
    const router = useRouter();
    const { user, isLoading: userLoading } = useUser();
    const [routes, setRoutes] = useState<SavedRoute[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 로그인 상태 확인
        if (!userLoading && !user) {
            alert('로그인이 필요한 페이지입니다.');
            router.push('/');
            return;
        }

        if (user) {
            fetchSavedRoutes();
        }
    }, [user, userLoading, router]);

    const fetchSavedRoutes = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get(`/map?userId=${user?.userId}`);

            if (response.status === 200) {
                setRoutes(response.data);
            }
        } catch (error) {
            console.error('저장된 경로를 불러오는데 실패했습니다:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (routeId: string) => {
        if (!confirm('정말로 이 경로를 삭제하시겠습니까?')) {
            return;
        }

        try {
            const response = await apiClient.delete(`/map/${routeId}`);

            if (response.status === 200) {
                alert('경로가 삭제되었습니다.');
                // 목록 갱신
                setRoutes(routes.filter(route => route.id !== routeId));
            }
        } catch (error) {
            console.error('경로 삭제 실패:', error);
            alert('경로 삭제에 실패했습니다.');
        }
    };

    // 날짜 포맷팅 함수
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (userLoading || loading) {
        return (
            <div className="min-h-screen flex justify-center items-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <header className="bg-white dark:bg-gray-800 shadow-sm">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <Link href="/" className="flex items-center">
                        <h1 className="text-xl font-bold mr-2">Together</h1>
                        <span className="text-sm text-gray-500 dark:text-gray-400">/ 내 경로</span>
                    </Link>
                    <Link
                        href="/route/create"
                        className="btn-primary text-sm py-2 px-3 flex items-center"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-5 h-5 mr-1"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 4.5v15m7.5-7.5h-15"
                            />
                        </svg>
                        새 경로 만들기
                    </Link>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold mb-6">저장된 경로</h1>

                {routes.length === 0 ? (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-16 h-16 mx-auto mb-4 text-gray-400"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z"
                            />
                        </svg>
                        <h2 className="text-xl font-semibold mb-2">저장된 경로가 없습니다</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            새로운 경로를 만들고 저장해보세요.
                        </p>
                        <Link
                            href="/route/create"
                            className="btn-primary py-2 px-4 inline-flex items-center"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-5 h-5 mr-2"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 4.5v15m7.5-7.5h-15"
                                />
                            </svg>
                            경로 만들기
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {routes.map((route) => (
                            <div
                                key={route.id}
                                className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow"
                            >
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <h2 className="text-lg font-semibold line-clamp-1">{route.name}</h2>
                                        <button
                                            onClick={() => handleDelete(route.id)}
                                            className="text-red-500 hover:text-red-700 p-1"
                                            aria-label="삭제"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={1.5}
                                                stroke="currentColor"
                                                className="w-5 h-5"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                                                />
                                            </svg>
                                        </button>
                                    </div>

                                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                                        {formatDate(route.createdAt)}
                                    </p>

                                    <div className="mb-4">
                                        <p className="text-sm font-medium mb-1">경로 장소 ({route.points.length})</p>
                                        <ol className="text-sm text-gray-600 dark:text-gray-400 ml-5 list-decimal">
                                            {route.points.slice(0, 3).map((point, index) => (
                                                <li key={index} className="line-clamp-1">
                                                    {point.title}
                                                </li>
                                            ))}
                                            {route.points.length > 3 && (
                                                <li>+ {route.points.length - 3}개 더...</li>
                                            )}
                                        </ol>
                                    </div>

                                    <div className="flex space-x-2">
                                        <Link
                                            href={`/routes/${route.id}`}
                                            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded text-sm text-center"
                                        >
                                            상세보기
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}