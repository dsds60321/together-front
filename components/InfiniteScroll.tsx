'use client';

import React, { useEffect, useState, useRef } from 'react';

interface InfiniteScrollProps {
    children: React.ReactNode;
    onLoadMore: () => void;
    hasMore: boolean;
    loading: boolean;
}

export function InfiniteScroll({ children, onLoadMore, hasMore, loading }: InfiniteScrollProps) {
    const [isVisible, setIsVisible] = useState(false);
    const loadingAreaRef = useRef<HTMLDivElement>(null);
    const prevChildrenHeightRef = useRef<number>(0);
    const containerRef = useRef<HTMLDivElement>(null);

    // 처음 렌더링 시 자식 요소 높이 저장
    useEffect(() => {
        if (containerRef.current) {
            prevChildrenHeightRef.current = containerRef.current.scrollHeight;
        }
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const isIntersecting = entries[0]?.isIntersecting || false;
                setIsVisible(isIntersecting);

                if (isIntersecting && hasMore && !loading) {
                    onLoadMore();
                }
            },
            {
                rootMargin: '200px', // 더 먼저 감지되도록 여유 공간 증가
                threshold: 0.1
            }
        );

        if (loadingAreaRef.current) {
            observer.observe(loadingAreaRef.current);
        }

        return () => {
            if (loadingAreaRef.current) {
                observer.unobserve(loadingAreaRef.current);
            }
        };
    }, [hasMore, loading, onLoadMore]);

    const handleManualLoad = () => {
        if (!loading && hasMore) {
            onLoadMore();
        }
    };

    return (
        <div ref={containerRef}>
            {children}
            <div
                ref={loadingAreaRef}
                className="py-8 flex flex-col justify-center items-center"
                style={{ minHeight: '100px' }} // 최소 높이 설정으로 항상 감지되도록
            >
                {loading ? (
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mb-4"></div>
                ) : hasMore ? (
                    <div className="flex flex-col items-center gap-4">
                        <p className="text-gray-500 dark:text-gray-400">
                            {isVisible ? '추가 데이터를 불러오는 중...' : '스크롤하여 더 보기'}
                        </p>
                        <button
                            onClick={handleManualLoad}
                            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            더 불러오기
                        </button>
                    </div>
                ) : (
                    <p className="text-gray-500 dark:text-gray-400">모든 결과를 불러왔습니다</p>
                )}
            </div>
        </div>
    );
}