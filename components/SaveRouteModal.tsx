// components/SaveRouteModal.tsx
'use client';

import {useEffect, useState} from 'react';
import {RoutePoint} from '@/types/route';
import {NavigationRequest, saveRoute, SaveRouteRequest} from '@/lib/api';
import {useRouter} from 'next/navigation';
import {useUser} from "@/context/userContext";

interface SaveRouteModalProps {
    isOpen: boolean;
    onClose: () => void;
    routePoints: RoutePoint[];
    isLoading: boolean;
    onSaveSuccess?: () => void;
}


export function SaveRouteModal({
                                   isOpen,
                                   onClose,
                                   routePoints,
                                   isLoading,
                                   onSaveSuccess
                               }: SaveRouteModalProps) {
    const { user } = useUser();
    const [routeName, setRouteName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const router = useRouter();

    // 사용자 로그인 확인
    useEffect(() => {
        if (isOpen && !user) {
            alert('로그인이 필요한 기능입니다.');
            onClose();
            router.push('/');
        }
    }, [isOpen, user, onClose, router]);

    // 모달이 열릴 때 경로 이름 기본값 설정
    useEffect(() => {
        if (isOpen && routePoints.length > 0) {
            const defaultName = `${routePoints[0].title} ${routePoints.length > 1 ? `외 ${routePoints.length-1}곳` : ''}`;
            setRouteName(defaultName);
        }
    }, [isOpen, routePoints]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user || !user.userId) {
            alert('로그인이 필요한 기능입니다.');
            onClose();
            router.push('/');
            return;
        }

        if (!routeName.trim()) {
            alert('경로 이름을 입력해주세요.');
            return;
        }

        setIsSaving(true);

        try {
            // 네이버 지도 URL 생성
            let naverUri = '';
            try {
                const naverRequestData: NavigationRequest = {
                    navigationType: 'naver',
                    routePoints: routePoints.map(point => ({
                        id: point.id,
                        title: point.title,
                        type: point.type,
                        mapx: point.mapx,
                        mapy: point.mapy,
                        address: point.address,
                        roadAddress: point.roadAddress
                    }))
                };

                const naverResponse = await fetch('/api/navigation', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(naverRequestData),
                });

                if (naverResponse.ok) {
                    const data = await naverResponse.json();
                    naverUri = data.uri || '';
                }
            } catch (error) {
                console.error('네이버 지도 URL 생성 오류:', error);
            }

            // T맵 URL 생성
            let tmapUri = '';
            try {
                const tmapRequestData: NavigationRequest = {
                    navigationType: 'tmap',
                    routePoints: routePoints.map(point => ({
                        id: point.id,
                        title: point.title,
                        type: point.type,
                        mapx: point.mapx,
                        mapy: point.mapy,
                        address: point.address,
                        roadAddress: point.roadAddress
                    }))
                };

                const tmapResponse = await fetch('/api/navigation', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(tmapRequestData),
                });

                if (tmapResponse.ok) {
                    const data = await tmapResponse.json();
                    tmapUri = data.uri || '';
                }
            } catch (error) {
                console.error('T맵 URL 생성 오류:', error);
            }

            // 경로 저장 요청 생성
            const saveRouteRequest: SaveRouteRequest = {
                name: routeName.trim(),
                points: routePoints.map(point => ({
                    ...point,
                    mapx: point.mapx || '',
                    mapy: point.mapy || '',
                    address: point.address || '',
                    roadAddress: point.roadAddress || '',
                    description: point.description || '',
                    link: point.link || '',
                    image: point.image || ''
                })),
                userId: user.userId, // 현재 로그인한 사용자의 ID
                naverUri,
                tmapUri
            };

            console.log('경로 저장 요청:', saveRouteRequest);

            // 경로 저장 API 호출
            await saveRoute(saveRouteRequest);

            alert('경로가 성공적으로 저장되었습니다.');
            onClose();

            if (onSaveSuccess) {
                onSaveSuccess();
            }

            // 경로 목록 페이지로 이동
            router.push('/routes');
        } catch (error) {
            console.error('경로 저장 오류:', error);
            alert('경로 저장에 실패했습니다. 다시 시도해주세요.');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-lg font-semibold">경로 저장하기</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        disabled={isSaving}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSave}>
                    <div className="px-6 py-4">
                        <div className="mb-4">
                            <label htmlFor="routeName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                경로 이름
                            </label>
                            <input
                                type="text"
                                id="routeName"
                                value={routeName}
                                onChange={(e) => setRouteName(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                placeholder="경로 이름을 입력하세요"
                                required
                                autoFocus
                                disabled={isSaving}
                            />
                        </div>

                        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            <p>
                                경로는 내 경로 목록에 저장되며 언제든지 불러올 수 있습니다.
                            </p>
                        </div>
                    </div>

                    <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-right">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-secondary mr-2"
                            disabled={isSaving}
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={isSaving || !routeName.trim()}
                        >
                            {isSaving ? (
                                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  저장 중...
                </span>
                            ) : (
                                '저장하기'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
