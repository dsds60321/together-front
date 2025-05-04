'use client';

import React, { useEffect, useRef } from 'react';

interface InfiniteScrollProps {
    children: React.ReactNode;
    onLoadMore: () => void;
    hasMore: boolean;
    loading: boolean;
}

export function InfiniteScroll({ children, onLoadMore, hasMore, loading }: InfiniteScrollProps) {
    const loadingAreaRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);

    // IntersectionObserver 생성 및 초기화 함수
    const setupObserver = () => {
        // 기존 옵저버 정리
        if (observerRef.current && loadingAreaRef.current) {
            observerRef.current.unobserve(loadingAreaRef.current);
        }

        // 새 옵저버 생성
        observerRef.current = new IntersectionObserver(
            (entries) => {
                const isIntersecting = entries[0]?.isIntersecting || false;
                if (isIntersecting && hasMore && !loading) {
                    onLoadMore();
                }
            },
            {
                rootMargin: '300px', // 더 먼저 감지되도록 여유 공간 증가
                threshold: 0.1
            }
        );

        // 로딩 영역 관찰 시작
        if (loadingAreaRef.current) {
            observerRef.current.observe(loadingAreaRef.current);
        }
    };

    // 컴포넌트 마운트 시와 의존성 변경 시 옵저버 설정
    useEffect(() => {
        setupObserver();

        // 컴포넌트 언마운트 시 정리
        return () => {
            if (observerRef.current && loadingAreaRef.current) {
                observerRef.current.unobserve(loadingAreaRef.current);
                observerRef.current = null;
            }
        };
    }, [hasMore, loading]); // 검색 결과나 상태가 변경되면 옵저버 재설정

    // 검색 결과가 변경될 때마다 옵저버 재설정
    useEffect(() => {
        // 약간의 지연을 두고 옵저버 재설정 (DOM 업데이트 후)
        const timer = setTimeout(() => {
            setupObserver();
        }, 500);

        return () => clearTimeout(timer);
    }, [children]);

    // 수동 로드 버튼 핸들러
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
                            더 많은 결과가 있습니다.
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