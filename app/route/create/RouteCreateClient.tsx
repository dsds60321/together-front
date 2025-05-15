// app/route/create/RouteCreateClient.tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search } from '@/components/Search';
import { Card, Place } from '@/components/Card';
import { RouteList } from '@/components/RouteList';
import { RoutePreview } from '@/components/RoutePreview';
import { NavigationRequest, searchBlogPosts, convertBlogItemsToPlaces, saveRoute } from '@/lib/api';
import { useUser } from '@/context/userContext';
import { checkMobileAndAlert } from '@/lib/utils';
import { RoutePoint } from '@/types/route';

export default function RouteCreateClient() {
    const router = useRouter();
    const { user, isLoading: userLoading } = useUser();
    const [query, setQuery] = useState('');
    const [places, setPlaces] = useState<Place[]>([]);
    const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
    const [loading, setLoading] = useState(false);
    const [navLoading, setNavLoading] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const [naverMapUri, setNaverMapUri] = useState('');
    const [tmapUri, setTmapUri] = useState('');
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [routeName, setRouteName] = useState('');

    // 검색 처리
    const handleSearch = useCallback(async (searchQuery: string) => {
        setQuery(searchQuery);
        setLoading(true);

        try {
            if (searchQuery) {
                const response = await searchBlogPosts(searchQuery, 1, 12);
                const items = response.items || [];
                const convertedPlaces = await convertBlogItemsToPlaces(items);
                setPlaces(convertedPlaces);
            } else {
                setPlaces([]);
            }
        } catch (error) {
            console.error('검색 오류:', error);
            setPlaces([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // 장소를 경로에 추가
    const addToRoute = useCallback((place: Place) => {
        // 이미 경로에 있는지 확인
        if (routePoints.some(point => point.id === place.id)) {
            alert('이미 경로에 추가된 장소입니다.');
            return;
        }

        const newPoint: RoutePoint = {
            ...place,
            type: routePoints.length === 0 ? 'start' : routePoints.length === 1 ? 'end' : 'waypoint',
        };

        // 경로에 추가하고 타입 업데이트
        const updatedPoints = [...routePoints, newPoint].map((point, index, array) => {
            let type: 'start' | 'waypoint' | 'end' = 'waypoint';
            if (index === 0) type = 'start';
            if (index === array.length - 1 && array.length > 1) type = 'end';
            return { ...point, type };
        });

        setRoutePoints(updatedPoints);
    }, [routePoints]);

    // 경로에서 장소 제거
    const removeFromRoute = useCallback((id: string) => {
        const updatedPoints = routePoints.filter(point => point.id !== id);

        // 타입 업데이트
        const updatedPointsWithType = updatedPoints.map((point, index, array) => {
            let type: 'start' | 'waypoint' | 'end' = 'waypoint';
            if (index === 0) type = 'start';
            if (index === array.length - 1 && array.length > 1) type = 'end';
            return { ...point, type };
        });

        setRoutePoints(updatedPointsWithType);
    }, [routePoints]);

    // 경로 순서 변경
    const handleReorder = useCallback((newOrder: RoutePoint[]) => {
        setRoutePoints(newOrder);
    }, []);

    // T맵 네비게이션 실행
    const launchNavigation = useCallback(async () => {
        if (routePoints.length < 1) {
            alert('경로에 최소 1개 이상의 장소를 추가해주세요.');
            return;
        }

        if (!checkMobileAndAlert('T맵')) return;

        setNavLoading(true);

        try {
            const requestData: NavigationRequest = {
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

            const response = await fetch('/api/navigation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            });

            if (!response.ok) {
                throw new Error('내비게이션 요청 실패');
            }

            const data = await response.json();
            if (data.uri) {
                setTmapUri(data.uri);
                window.location.href = data.uri;
            } else {
                alert('내비게이션 URI 생성에 실패했습니다.');
            }
        } catch (error) {
            console.error('내비게이션 오류:', error);
            alert('내비게이션을 실행할 수 없습니다.');
        } finally {
            setTimeout(() => setNavLoading(false), 1000);
        }
    }, [routePoints]);

    // 네이버 지도로 보기
    const viewNaverMap = useCallback(async () => {
        if (routePoints.length < 1) {
            alert('경로에 최소 1개 이상의 장소를 추가해주세요.');
            return;
        }

        try {
            const requestData: NavigationRequest = {
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

            const response = await fetch('/api/navigation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            });

            if (!response.ok) {
                throw new Error('네이버 지도 요청 실패');
            }

            const data = await response.json();
            if (data.uri) {
                setNaverMapUri(data.uri);
                window.open(data.uri, '_blank');
            } else {
                alert('네이버 지도 URI 생성에 실패했습니다.');
            }
        } catch (error) {
            console.error('네이버 지도 오류:', error);
            alert('네이버 지도를 열 수 없습니다.');
        }
    }, [routePoints]);

    // 경로 저장 모달 열기
    const openSaveModal = useCallback(() => {
        if (routePoints.length < 1) {
            alert('경로에 최소 1개 이상의 장소를 추가해주세요.');
            return;
        }

        if (!user) {
            if (confirm('로그인이 필요한 기능입니다. 로그인 페이지로 이동하시겠습니까?')) {
                router.push('/');
            }
            return;
        }

        // 기본 경로 이름 설정
        const defaultName = routePoints.length > 0 ?
            `${routePoints[0].title} ${routePoints.length > 1 ? `외 ${routePoints.length-1}곳` : ''}` : '';
        setRouteName(defaultName);

        setShowSaveModal(true);
    }, [routePoints, user, router]);

    // 경로 저장 처리
    const handleSaveRoute = useCallback(async () => {
        alert('11')
        if (!user) {
            alert('로그인이 필요한 기능입니다.');
            return;
        }

        if (routePoints.length < 1) {
            alert('경로에 최소 1개 이상의 장소를 추가해주세요.');
            return;
        }

        // 경로 이름이 없을 경우 간단한 프롬프트로 이름 묻기
        let name = routeName;
        if (!name) {
            name = prompt('경로 이름을 입력해주세요:',
                routePoints.length > 0 ?
                    `${routePoints[0].title} ${routePoints.length > 1 ? `외 ${routePoints.length-1}곳` : ''}` : ''
            );

            if (!name) return; // 취소 또는 빈 이름 입력시 중단
        }

        setSaveLoading(true);

        try {
            // 네이버 지도 URL이 없으면 생성
            let naverUri = naverMapUri;
            if (!naverUri) {
                const requestData: NavigationRequest = {
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

                const response = await fetch('/api/navigation', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestData),
                });

                if (response.ok) {
                    const data = await response.json();
                    naverUri = data.uri || '';
                }
            }

            // T맵 URL이 없으면 생성
            let tUri = tmapUri;
            if (!tUri) {
                const requestData: NavigationRequest = {
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

                const response = await fetch('/api/navigation', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestData),
                });

                if (response.ok) {
                    const data = await response.json();
                    tUri = data.uri || '';
                }
            }

            // API 호출하여 경로 저장
            const savedRoute = await saveRoute({
                name: name,
                points: routePoints,
                userId: user.userId,
                naverUri: naverUri,
                tmapUri: tUri
            });

            alert('경로가 성공적으로 저장되었습니다.');
            setShowSaveModal(false);

            // 저장된 경로 목록 페이지로 이동
            router.push('/routes');
        } catch (error) {
            console.error('경로 저장 실패:', error);
            alert('경로 저장에 실패했습니다.');
        } finally {
            setSaveLoading(false);
        }
    }, [routePoints, user, naverMapUri, tmapUri, router, routeName]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <header className="bg-white dark:bg-gray-800 shadow-sm">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <Link href="/" className="flex items-center">
                        <h1 className="text-xl font-bold mr-2">Together</h1>
                        <span className="text-sm text-gray-500 dark:text-gray-400">/ 경로 만들기</span>
                    </Link>

                    {user && (
                        <Link
                            href="/routes"
                            className="text-blue-500 hover:text-blue-700 flex items-center text-sm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                            </svg>
                            내 경로 목록
                        </Link>
                    )}
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <div className="mb-6">
                    <Search onSearch={handleSearch} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* 경로 목록 */}
                    <RouteList
                        routePoints={routePoints}
                        onReorder={handleReorder}
                        onRemovePoint={removeFromRoute}
                        onLaunchNav={launchNavigation}
                        onViewMap={viewNaverMap}
                        navLoading={navLoading}
                        saveLoading={saveLoading}
                        onAddPlace={addToRoute}
                        onSaveRoute={handleSaveRoute} // 여기에 경로 저장 함수 연결
                    />

                    {/* 검색 결과 및 경로 미리보기 */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* 검색 결과 */}
                        {query && (
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                                <h2 className="text-lg font-semibold mb-4">검색 결과</h2>
                                {loading ? (
                                    <div className="flex justify-center py-8">
                                        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                                    </div>
                                ) : places.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {places.map(place => (
                                            <Card
                                                key={place.id}
                                                place={place}
                                                onSelect={addToRoute}
                                                actionText="경로에 추가"
                                                isCompact={true}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md text-center">
                                        <p className="text-gray-500 dark:text-gray-400">
                                            검색 결과가 없습니다
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 경로 미리보기 */}
                        <RoutePreview routePoints={routePoints} />
                    </div>
                </div>
            </main>

            {/* 경로 저장 모달 */}
            {showSaveModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full">
                        <div className="p-6">
                            <h2 className="text-xl font-semibold mb-4">경로 저장</h2>

                            <div className="mb-4">
                                <label htmlFor="routeName" className="block text-sm font-medium mb-1">
                                    경로 이름
                                </label>
                                <input
                                    id="routeName"
                                    type="text"
                                    className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                                    value={routeName}
                                    onChange={(e) => setRouteName(e.target.value)}
                                    placeholder="경로 이름을 입력하세요"
                                    required
                                />
                            </div>

                            <div className="mb-4">
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {routePoints.length}개의 장소가 포함된 경로를 저장합니다.
                                </p>
                            </div>

                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowSaveModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 dark:text-gray-300 dark:border-gray-600"
                                    disabled={saveLoading}
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    onClick={handleSaveRoute}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-70"
                                    disabled={saveLoading}
                                >
                                    {saveLoading ? (
                                        <span className="flex items-center">
                      <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      저장 중...
                    </span>
                                    ) : '저장하기'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}