// RoutePageClient.tsx 수정본
'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { Place } from '@/components/Card';
import { ThemeToggle } from '@/components/ThemeToggle';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { Search } from '@/components/Search';
import { BlogItem, convertBlogItemsToPlaces, searchBlogPosts } from '@/lib/api';

// 목적지 타입 정의
interface RoutePoint extends Place {
    type: 'start' | 'waypoint' | 'end';
}

interface RoutePageClientProps {
    initialPlace: Place | null;
    initialSuggestions: Place[];
    params: { id: string };
}

export default function RoutePageClient({
                                            initialPlace,
                                            initialSuggestions,
                                            params
                                        }: RoutePageClientProps) {
    const [mainPlace] = useState<Place | null>(initialPlace);
    const [routePoints, setRoutePoints] = useState<RoutePoint[]>(
        initialPlace ? [{ ...initialPlace, type: 'start' }] : []
    );
    const [suggestions, setSuggestions] = useState<Place[]>(initialSuggestions);
    const [copied, setCopied] = useState(false);
    const [searchMode, setSearchMode] = useState(false);
    const [selectedRoutePoint, setSelectedRoutePoint] = useState<RoutePoint | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Place[]>([]);
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);
    const [favorites, setFavorites] = useState<Place[]>([]);

    // 즐겨찾기 목록 가져오기
    useEffect(() => {
        const fetchFavorites = async () => {
            try {
                const response = await axios.get('/api/favorites');
                setFavorites(response.data.favorites || []);
            } catch (error) {
                console.error('즐겨찾기 로드 오류:', error);
                // 실패 시 빈 배열로 초기화
                setFavorites([]);
            }
        };

        fetchFavorites();
    }, []);

    // 드래그 앤 드롭 처리
    const handleDragEnd = (result: any) => {
        if (!result.destination) return;

        const items = Array.from(routePoints);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        // 순서에 따라 타입 다시 할당
        const updatedItems = items.map((item, index) => {
            let type: 'start' | 'waypoint' | 'end' = 'waypoint';
            if (index === 0) type = 'start';
            if (index === items.length - 1) type = 'end';
            return { ...item, type };
        });

        setRoutePoints(updatedItems);
    };

    // 장소 선택 처리
    const handlePlaceSelected = async (place: Place) => {
        // 이미 경로에 있는지 확인
        if (routePoints.some(p => p.id === place.id)) return;

        try {
            // 백엔드에 장소 정보 저장
            await axios.post('/api/places', { place });

            // 경로에 추가
            const newRoutePoints = [...routePoints];
            newRoutePoints.push({
                ...place,
                type: newRoutePoints.length === 0 ? 'start' : 'waypoint'
            });

            // 타입 재할당
            const updatedPoints = newRoutePoints.map((item, index) => {
                let type: 'start' | 'waypoint' | 'end' = 'waypoint';
                if (index === 0) type = 'start';
                if (index === newRoutePoints.length - 1) type = 'end';
                return { ...item, type };
            });

            setRoutePoints(updatedPoints);
            setSearchMode(false);
        } catch (error) {
            console.error('장소 추가 오류:', error);
            setApiError('장소를 추가하는 중 오류가 발생했습니다');
        }
    };

    // 경로에서 장소 제거
    const removeFromRoute = (id: string) => {
        const updatedPoints = routePoints.filter(point => point.id !== id);

        // 타입 재할당
        const finalPoints = updatedPoints.map((item, index) => {
            let type: 'start' | 'waypoint' | 'end' = 'waypoint';
            if (index === 0) type = 'start';
            if (index === updatedPoints.length - 1) type = 'end';
            return { ...item, type };
        });

        setRoutePoints(finalPoints);
    };

    // 블로그 검색 처리 함수
    const handleSearch = useCallback(async (query: string, results?: BlogItem[]) => {
        setSearchQuery(query);
        setLoading(true);
        setApiError(null);

        try {
            if (query && !results) {
                // 직접 API 호출하여 블로그 검색 수행
                const response = await searchBlogPosts(query);
                const blogItems = response.items;

                // BlogItem을 Place 객체로 변환
                const convertedPlaces = await convertBlogItemsToPlaces(blogItems);

                // 이미 경로에 추가된 장소 필터링
                const filteredResults = convertedPlaces.filter(
                    (p: Place) => !routePoints.some(rp => rp.id === p.id)
                );

                setSearchResults(filteredResults);
            } else if (results) {
                // 이미 결과가 전달된 경우 (Search 컴포넌트에서 직접 API 호출한 경우)
                const convertedPlaces = await convertBlogItemsToPlaces(results);

                // 이미 경로에 추가된 장소 필터링
                const filteredResults = convertedPlaces.filter(
                    (p: Place) => !routePoints.some(rp => rp.id === p.id)
                );

                setSearchResults(filteredResults);
            } else {
                setSearchResults([]);
            }
        } catch (error) {
            console.error('검색 오류:', error);
            setSearchResults([]);
            setApiError('검색 중 오류가 발생했습니다');
        } finally {
            setLoading(false);
        }
    }, [routePoints]);

    // 경로 포인트 선택 후 검색 모드 진입
    const selectRoutePointForSearch = (point: RoutePoint) => {
        setSelectedRoutePoint(point);
        setSearchMode(true);
        setSearchResults([]);
        setSearchQuery('');
    };

    // 즐겨찾기 추가/제거
    const toggleFavorite = async (place: Place) => {
        try {
            const isFavorited = favorites.some(p => p.id === place.id);

            if (isFavorited) {
                // 즐겨찾기 제거
                await axios.delete(`/api/favorites?id=${place.id}`);
                setFavorites(prev => prev.filter(p => p.id !== place.id));
            } else {
                // 즐겨찾기 추가
                await axios.post('/api/favorites', { place });
                setFavorites(prev => [...prev, place]);
            }
        } catch (error) {
            console.error('즐겨찾기 변경 오류:', error);
            setApiError('즐겨찾기를 변경하는 중 오류가 발생했습니다');
        }
    };

    // 즐겨찾기 여부 확인
    const isFavorite = (id: string): boolean => {
        return favorites.some(place => place.id === id);
    };

    // 경로 공유하기
    const shareRoute = async () => {
        if (routePoints.length === 0) return;

        try {
            // 경로 목록을 문자열로 변환
            const placesList = routePoints.map(p => p.title).join(' → ');
            const shareText = `함께 ${placesList}`;

            // 현재 페이지 URL
            const url = window.location.href;

            if (navigator.share) {
                // 모바일 기기에서 네이티브 공유
                await navigator.share({
                    title: '함께 여행 경로',
                    text: shareText,
                    url: url
                });
            } else {
                // 데스크톱에서는 URL만 복사
                await navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }
        } catch (error) {
            console.error('경로 공유 오류:', error);
        }
    };

    // 지도로 보기
    const viewOnMap = () => {
        if (routePoints.length === 0) return;

        // 네이버 지도 URL 생성
        const waypoints = routePoints.map((point, index) => {
            const prefix = index === 0 ? 'sname' : (index === routePoints.length - 1 ? 'dname' : `waypoint${index}`);
            return `${prefix}=${encodeURIComponent(point.title)}`;
        }).join('&');

        const mapUrl = `https://map.naver.com/v5/directions/?${waypoints}&pathType=0`;
        window.open(mapUrl, '_blank');
    };

    const callNavigation = () => {

    }
    // 경로 카드 컴포넌트
    const RouteCard = ({ place }: { place: Place }) => {
        const [imageError, setImageError] = useState(false);
        const [imageLoaded, setImageLoaded] = useState(false);
        const favorite = isFavorite(place.id);

        // 이미지 URL이 있는지 확인
        const hasImage = place.image && place.image.trim() !== '';

        // 이미지 프록시 URL 생성
        const getProxyImageUrl = (url: string) => {
            if (url.includes('blogthumb.pstatic.net') || url.includes('pstatic.net')) {
                return `/api/image-proxy?url=${encodeURIComponent(url)}`;
            }
            return url;
        };

        // 안전한 이미지 URL
        const safeImageUrl = hasImage
            ? getProxyImageUrl(place.image!)
            : 'https://via.placeholder.com/300x200?text=No+Image';

        // 이미지 오류 처리
        const handleImageError = () => {
            setImageError(true);
        };

        const handleImageLoad = () => {
            setImageLoaded(true);
        };

        return (
            <div className="card p-4 mb-4">
                <div className="mb-3 overflow-hidden rounded-md h-40 bg-gray-100 dark:bg-gray-700 relative">
                    {hasImage && !imageError ? (
                        <>
                            {!imageLoaded && (
                                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                                </div>
                            )}
                            <img
                                src={safeImageUrl}
                                alt={place.title}
                                className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                                onError={handleImageError}
                                onLoad={handleImageLoad}
                                loading="lazy"
                            />
                        </>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-12 h-12">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                            </svg>
                        </div>
                    )}
                </div>

                <h3 className="text-lg font-semibold mb-2" dangerouslySetInnerHTML={{ __html: place.title }}></h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-2" dangerouslySetInnerHTML={{ __html: place.description }}></p>

                {place.bloggerName && (
                    <p className="text-gray-500 dark:text-gray-400 text-xs mb-4">
                        작성자: {place.bloggerName}
                    </p>
                )}

                <div className="flex gap-2 mt-2">
                    {place.link && (
                        <a
                            href={place.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-secondary text-sm py-1 px-2 flex-1 text-center"
                        >
                            블로그 방문
                        </a>
                    )}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(place);
                        }}
                        className={`btn-secondary text-sm py-1 px-2 ${favorite ? 'text-yellow-500' : ''}`}
                        aria-label={favorite ? '즐겨찾기 제거' : '즐겨찾기 추가'}
                    >
                        {favorite ? (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.181.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.181-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.181.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.181-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="container mx-auto p-4 max-w-6xl">
            <header className="flex justify-between items-center mb-6">
                <Link
                    href="/"
                    className="text-xl font-bold flex items-center"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                    </svg>
                    함께
                </Link>
                <ThemeToggle />
            </header>

            {apiError && (
                <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 p-3 rounded-md mb-4">
                    {apiError}
                </div>
            )}

            {searchMode ? (
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">
                            {selectedRoutePoint ? '경로 변경하기' : '장소 추가하기'}
                        </h2>
                        <button
                            onClick={() => setSearchMode(false)}
                            className="btn-secondary"
                        >
                            돌아가기
                        </button>
                    </div>

                    <Search
                        onSearch={handleSearch}
                        placeholder="장소 이름으로 검색..."
                        className="mb-4"
                    />

                    {loading && (
                        <div className="flex justify-center my-8">
                            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                    )}

                    {!loading && searchResults.length === 0 && searchQuery && (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                            검색 결과가 없습니다. 다른 키워드로 검색해보세요.
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {searchResults.map(place => (
                            <div
                                key={place.id}
                                className="cursor-pointer"
                                onClick={() => handlePlaceSelected(place)}
                            >
                                <RouteCard place={place} />
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <>
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold mb-4">경로 안내</h1>
                        <div className="flex flex-wrap gap-2 mb-4">
                            <button
                                onClick={() => setSearchMode(true)}
                                className="btn-primary"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                                장소 추가
                            </button>
                            {routePoints.length > 0 && (
                                <>
                                    <button
                                        onClick={viewOnMap}
                                        className="btn-secondary"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                                        </svg>
                                        지도로 보기
                                    </button>
                                    <button
                                        onClick={viewOnMap}
                                        className="btn-secondary"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                                        </svg>
                                        경로 안내
                                    </button>
                                    <button
                                        onClick={shareRoute}
                                        className="btn-secondary"
                                    >
                                        {copied ? (
                                            "복사됨!"
                                        ) : (
                                            <>
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 103.935-2.186 2.25 2.25 0 00-3.935 2.186Z" />
                                                </svg>
                                                공유하기
                                            </>
                                        )}
                                    </button>
                                </>
                            )}
                        </div>

                        {routePoints.length === 0 ? (
                            <div className="bg-blue-50 dark:bg-blue-900/30 p-6 rounded-lg text-center">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto mb-3 text-blue-500">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                                </svg>
                                <p className="text-lg font-medium">경로를 설정해 주세요</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                    위의 '장소 추가' 버튼을 클릭하여 경로에 장소를 추가할 수 있습니다.
                                </p>
                            </div>
                        ) : (
                            <DragDropContext onDragEnd={handleDragEnd}>
                                <Droppable droppableId="routePoints">
                                    {(provided) => (
                                        <div
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}
                                            className="space-y-4"
                                        >
                                            {routePoints.map((point, index) => (
                                                <Draggable key={point.id} draggableId={point.id} index={index}>
                                                    {(provided) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
                                                        >
                                                            <div className="p-4 flex items-center justify-between">
                                                                <div className="flex items-center">
                                                                    <div className="w-10 h-10 flex-shrink-0 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3">
                                                                        {point.type === 'start' ? (
                                                                            <span className="text-blue-600 dark:text-blue-400 font-semibold">출발</span>
                                                                        ) : point.type === 'end' ? (
                                                                            <span className="text-red-600 dark:text-red-400 font-semibold">도착</span>
                                                                        ) : (
                                                                            <span className="text-gray-600 dark:text-gray-400 font-semibold">{index}</span>
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <h3 className="font-semibold" dangerouslySetInnerHTML={{ __html: point.title }}></h3>
                                                                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-sm">
                                                                            {point.description.replace(/<\/?[^>]+(>|$)/g, "")}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex space-x-2">
                                                                    <button
                                                                        onClick={() => selectRoutePointForSearch(point)}
                                                                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                                                                        aria-label="장소 변경"
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                                        </svg>
                                                                    </button>

                                                                    <button
                                                                        onClick={() => removeFromRoute(point.id)}
                                                                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                                                                        aria-label="장소 제거"
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                                        </svg>
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            {index < routePoints.length - 1 && (
                                                                <div className="h-6 border-l-2 border-dashed border-gray-300 dark:border-gray-600 ml-9"></div>
                                                            )}
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </DragDropContext>
                        )}
                    </div>

                    {suggestions.length > 0 && (
                        <div className="mt-8">
                            <h2 className="text-xl font-semibold mb-4">함께 방문하면 좋은 장소</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {suggestions.map(place => (
                                    <div
                                        key={place.id}
                                        className="cursor-pointer"
                                        onClick={() => handlePlaceSelected(place)}
                                    >
                                        <RouteCard place={place} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}