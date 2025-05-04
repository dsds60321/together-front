// components/SearchResults.tsx
'use client';

import {Place} from './Card';
import {InfiniteScroll} from './InfiniteScroll';
import {useState} from "react";

interface SearchResultsProps {
    searchResults: Place[];
    loading: boolean;
    hasMore: boolean;
    searchQuery: string;
    apiError: string | null;
    onLoadMore: () => void;
    onAddPlaceToRoute: (place: Place) => void;
    onShareBlog: (place: Place) => void;
    onVisitBlog: (place: Place) => void;
    shareLoading: boolean;
    copied: boolean;
    previouslySelectedPlace: Place | null;
}

export function SearchResults({
                                  searchResults,
                                  loading,
                                  hasMore,
                                  searchQuery,
                                  apiError,
                                  onLoadMore,
                                  onAddPlaceToRoute,
                                  onShareBlog,
                                  onVisitBlog,
                                  shareLoading,
                                  copied,
                                  previouslySelectedPlace
                              }: SearchResultsProps) {
    // 장소가 이전에 선택된 장소인지 확인
    const isSelectedPlace = (place: Place) => {
        return previouslySelectedPlace && previouslySelectedPlace.id === place.id;
    };

    // 장소 카드 컴포넌트
    const PlaceCard = ({ place }: { place: Place }) => {
        const [imageError, setImageError] = useState(false);
        const [imageLoaded, setImageLoaded] = useState(false);
        const isPreviouslySelected = isSelectedPlace(place);

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

        const handleImageError = () => {
            setImageError(true);
        };

        const handleImageLoad = () => {
            setImageLoaded(true);
        };

        return (
            <div className={`card p-3 mb-3 ${isPreviouslySelected ? 'border-2 border-blue-500' : ''}`}>
                <div className="flex">
                    <div className="w-20 h-20 overflow-hidden rounded-md bg-gray-100 dark:bg-gray-700 mr-3">
                        {hasImage && !imageError ? (
                            <img
                                src={safeImageUrl}
                                alt={place.title}
                                className="w-full h-full object-cover"
                                onError={handleImageError}
                                onLoad={handleImageLoad}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                </svg>
                            </div>
                        )}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center mb-1">
                            <h3 className="text-sm font-semibold" dangerouslySetInnerHTML={{ __html: place.title }}></h3>
                            {isPreviouslySelected && (
                                <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded dark:bg-blue-900 dark:text-blue-300">
                  선택됨
                </span>
                            )}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mb-2" dangerouslySetInnerHTML={{ __html: place.description }}></div>

                        <div className="flex justify-end gap-2">
                            {place.link && (
                                <button
                                    onClick={() => onVisitBlog(place)}
                                    className="text-xs py-1 px-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md text-gray-700 dark:text-gray-300"
                                >
                                    블로그 방문
                                </button>
                            )}
                            {place.link && (
                                <button
                                    onClick={() => onShareBlog(place)}
                                    className="text-xs py-1 px-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md text-gray-700 dark:text-gray-300"
                                    disabled={shareLoading}
                                >
                                    {shareLoading ? (
                                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : copied ? "복사됨!" : "공유"}
                                </button>
                            )}
                            <button
                                onClick={() => onAddPlaceToRoute(place)}
                                className="btn-primary text-xs py-1 px-2"
                            >
                                경로에 추가
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                <h2 className="text-lg font-semibold mb-4">검색 결과</h2>

                {loading && searchResults.length === 0 ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                ) : searchResults.length > 0 ? (
                    <InfiniteScroll onLoadMore={onLoadMore} hasMore={hasMore} loading={loading}>
                        <div className="grid grid-cols-1 gap-3">
                            {searchResults.map(place => (
                                <PlaceCard key={place.id} place={place} />
                            ))}
                        </div>
                    </InfiniteScroll>
                ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        {searchQuery ? '검색 결과가 없습니다. 다른 검색어를 입력해보세요.' : '장소를 검색해보세요.'}
                    </div>
                )}

                {apiError && (
                    <div className="mt-4 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-md">
                        {apiError}
                    </div>
                )}
            </div>
        </div>
    );
}