// app/routes/[id]/SavedRouteDetailClient.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SavedRoute } from '@/types/route';
import apiClient from '@/lib/api';
import { useUser } from '@/context/userContext';
import { checkMobileAndAlert } from '@/lib/utils';

interface SavedRouteDetailClientProps {
    id: string;
}

export default function SavedRouteDetailClient({ id }: SavedRouteDetailClientProps) {
    const router = useRouter();
    const { user, isLoading: userLoading } = useUser();
    const [route, setRoute] = useState<SavedRoute | null>(null);
    const [loading, setLoading] = useState(true);
    const [shareLoading, setShareLoading] = useState(false);
    const [navLoading, setNavLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!userLoading) {
            if (!user) {
                alert('로그인이 필요한 페이지입니다.');
                router.push('/');
                return;
            }
            fetchRouteDetail();
        }
    }, [id, user, userLoading, router]);

    const fetchRouteDetail = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get(`/map/${id}`);

            if (response.status === 200) {
                setRoute(response.data);
            } else {
                alert('경로를 불러오는데 실패했습니다.');
                router.push('/routes');
            }
        } catch (error) {
            console.error('경로 상세 조회 실패:', error);
            alert('경로를 불러오는데 실패했습니다.');
            router.push('/routes');
        } finally {
            setLoading(false);
        }
    };

    // 경로 공유 함수
    const handleShare = async () => {
        if (!route) return;

        setShareLoading(true);

        try {
            // 현재 URL 생성
            const shareUrl = `${window.location.origin}/routes/${route.id}`;

            // 공유 API 사용 가능한지 확인
            if (navigator.share) {
                await navigator.share({
                    title: route.name,
                    text: `Together 앱에서 '${route.name}' 경로를 확인해보세요.`,
                    url: shareUrl
                });
            } else {
                // 클립보드에 복사
                await navigator.clipboard.writeText(shareUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }
        } catch (error) {
            console.error('공유 실패:', error);
        } finally {
            setShareLoading(false);
        }
    };

    // T맵 네비게이션 실행
    const launchTmapNavigation = () => {
        if (!route || !route.tmapUri) {
            alert('내비게이션 정보가 없습니다.');
            return;
        }

        if (!checkMobileAndAlert('T맵')) return;

        setNavLoading(true);

        try {
            window.location.href = route.tmapUri;
        } catch (error) {
            console.error('T맵 실행 오류:', error);
            alert('T맵을 실행할 수 없습니다.');
        } finally {
            setTimeout(() => setNavLoading(false), 1000);
        }
    };

    // 네이버 지도 실행
    const viewNaverMap = () => {
        if (!route || !route.naverUri) {
            alert('내비게이션 정보가 없습니다.');
            return;
        }

        if (!checkMobileAndAlert('네이버 지도')) return;

        try {
            window.location.href = route.naverUri;
        } catch (error) {
            console.error('네이버 지도 실행 오류:', error);
            alert('네이버 지도를 실행할 수 없습니다.');
        }
    };

    // 경로 삭제
    const handleDelete = async () => {
        if (!confirm('정말로 이 경로를 삭제하시겠습니까?')) {
            return;
        }

        try {
            const response = await apiClient.delete(`/map/${id}`);

            if (response.status === 200) {
                alert('경로가 삭제되었습니다.');
                router.push('/routes');
            }
        } catch (error) {
            console.error('경로 삭제 실패:', error);
            alert('경로 삭제에 실패했습니다.');
        }
    };

    // 날짜 포맷팅 함수
    const formatDate = (dateString: string) => {
        if (!dateString) return '';

        const date = new Date(dateString);
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex justify-center items-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!route) {
        return (
            <div className="min-h-screen flex flex-col justify-center items-center">
                <p className="text-xl mb-4">경로를 찾을 수 없습니다.</p>
                <Link href="/routes" className="btn-primary py-2 px-4">
                    저장된 경로 목록으로 돌아가기
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <header className="bg-white dark:bg-gray-800 shadow-sm">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center">
                        <Link href="/" className="text-xl font-bold mr-2">Together</Link>
                        <span className="text-sm text-gray-500 dark:text-gray-400">/ <Link href="/routes" className="hover:underline">내 경로</Link> / {route.name}</span>
                    </div>
                    <button
                        onClick={handleDelete}
                        className="text-red-500 hover:text-red-700 py-2 px-3 flex items-center text-sm"
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
                                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                            />
                        </svg>
                        삭제
                    </button>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                    <div className="p-6">
                        <h1 className="text-2xl font-bold mb-4">{route.name}</h1>

                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
                            작성일: {formatDate(route.createdAt)}
                        </p>

                        {/* 경로 장소 목록 */}
                        <div className="mb-6">
                            <h2 className="text-lg font-semibold mb-3">경로 정보</h2>
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                <ol className="space-y-4 list-decimal ml-4">
                                    {route.points.map((point, index) => (
                                        <li key={point.id} className="pl-2">
                                            <div className="flex items-start">
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 shrink-0 ${
                                                    point.type === 'start' ? 'bg-green-500' :
                                                        point.type === 'end' ? 'bg-red-500' : 'bg-blue-500'
                                                } text-white text-xs`}>
                                                    {point.type === 'start' ? 'S' :
                                                        point.type === 'end' ? 'E' : (index)}
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-medium">{point.title}</h3>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        {point.address || point.roadAddress || '주소 정보 없음'}
                                                    </p>
                                                    {point.description && (
                                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                            {point.description}
                                                        </p>
                                                    )}
                                                    {point.link && (
                                                        <a
                                                            href={point.link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-500 hover:underline text-sm inline-flex items-center mt-2"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                                                            </svg>
                                                            블로그 보기
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        </div>

                        {/* 버튼 영역 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
                            <button
                                onClick={launchTmapNavigation}
                                disabled={navLoading}
                                className="btn-primary py-3 flex items-center justify-center"
                            >
                                {navLoading ? (
                                    <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    처리 중
                  </span>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                                        </svg>
                                        T맵 내비게이션
                                    </>
                                )}
                            </button>

                            <button
                                onClick={viewNaverMap}
                                className="btn-secondary py-3 flex items-center justify-center"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                                </svg>
                                네이버 지도로 보기
                            </button>

                            <button
                                onClick={handleShare}
                                disabled={shareLoading}
                                className="md:col-span-2 bg-green-500 hover:bg-green-600 text-white py-3 rounded flex items-center justify-center"
                            >
                                {shareLoading ? (
                                    <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    처리 중
                  </span>
                                ) : copied ? (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                        </svg>
                                        링크가 복사되었습니다
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                                        </svg>
                                        이 경로 공유하기
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="mt-8 text-center">
                            <Link href="/route/create" className="text-blue-500 hover:underline inline-flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                                새 경로 만들기
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}