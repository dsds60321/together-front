// app/page.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import { Search } from '@/components/Search';
import { Card } from '@/components/Card';
import { InfiniteScroll } from '@/components/InfiniteScroll';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Place } from '@/lib/data';
import { BlogItem, convertBlogItemsToPlaces } from '@/lib/api';

export default function Home() {
  const [query, setQuery] = useState('');
  const [places, setPlaces] = useState<Place[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalResults, setTotalResults] = useState(0);
  const ITEMS_PER_PAGE = 9;

  // 검색 결과를 처리하는 함수
  const handleSearch = async (searchQuery: string, results?: BlogItem[]) => {
    setQuery(searchQuery);
    setPage(0);
    setLoading(true);

    try {
      if (results && results.length > 0) {
        console.log('검색 결과:', results.length);

        // API 응답을 Place 형식에 맞게 변환 (비동기 처리)
        const convertedPlaces = await convertBlogItemsToPlaces(results);
        console.log('변환된 장소:', convertedPlaces);

        setPlaces(convertedPlaces);
        setHasMore(false); // 현재는 페이지네이션 없음
        setTotalResults(results.length);
      } else if (searchQuery === '') {
        // 검색어가 비어있으면 기본 데이터 로드
        loadInitialData();
      } else {
        // 검색 결과가 없는 경우
        setPlaces([]);
        setHasMore(false);
        setTotalResults(0);
      }
    } catch (error) {
      console.error('검색 결과 처리 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 장소 선택 처리
  const handlePlaceSelect = (place: Place) => {
    // localStorage에 장소 정보 저장 (경로 페이지에서 사용)
    localStorage.setItem(`place_${place.id}`, JSON.stringify(place));

    // 최근 장소 목록 업데이트
    const recentPlaces = JSON.parse(localStorage.getItem('recent_places') || '[]');
    const updatedPlaces = [
      place,
      ...recentPlaces.filter((p: Place) => p.id !== place.id)
    ].slice(0, 10); // 최대 10개 저장

    localStorage.setItem('recent_places', JSON.stringify(updatedPlaces));
  };

  // 초기 데이터 로드
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      // 여기서 기본 데이터를 로드하는 로직을 구현
      // 예: 인기 장소나 추천 장소 목록 또는 localStorage에서 최근 검색 결과
      const recentPlaces = JSON.parse(localStorage.getItem('recent_places') || '[]');

      setPlaces(recentPlaces);
      setHasMore(false);
      setTotalResults(recentPlaces.length);
    } catch (error) {
      console.error('초기 데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 초기 로드
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // 더보기 기능 - 현재는 지원하지 않음
  const loadMore = () => {
    // API가 페이지네이션을 지원한다면 여기서 구현
    console.log('더 많은 결과 로드 시도');
  };

  return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow-sm">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-xl font-bold">Together</h1>
            <ThemeToggle />
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <Search onSearch={handleSearch} />
          </div>

          {places.length > 0 ? (
              <>
                <div className="mb-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {totalResults} 개의 결과를 찾았습니다
                  </p>
                </div>

                <InfiniteScroll
                    loadMore={loadMore}
                    hasMore={hasMore}
                    loading={loading}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {places.map(place => (
                        <Card
                            key={place.id}
                            place={place}
                            onSelect={handlePlaceSelect}
                        />
                    ))}
                  </div>
                </InfiniteScroll>
              </>
          ) : (
              <div className="text-center py-12">
                {loading ? (
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                ) : (
                    <p className="text-gray-600 dark:text-gray-400">검색 결과가 없습니다. 다른 검색어를 입력해보세요.</p>
                )}
              </div>
          )}
        </main>

        <footer className="bg-white dark:bg-gray-800 py-6 border-t border-gray-200 dark:border-gray-700">
          <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-400">
            <p>© 2025 Together. All rights reserved.</p>
          </div>
        </footer>
      </div>
  );
}