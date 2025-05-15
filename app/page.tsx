// app/page.tsx
'use client';

import { useCallback, useEffect, useState, useRef } from 'react';
import { Search } from '@/components/Search';
import { Card, Place } from '@/components/Card';
import { InfiniteScroll } from '@/components/InfiniteScroll';
import { ThemeToggle } from '@/components/ThemeToggle';
import { BlogItem, convertBlogItemsToPlaces, searchBlogPosts } from '@/lib/api';
import Link from 'next/link';
import { LoginModal } from '@/components/LoginModal';
import { SignupModal } from '@/components/SignupModal';
import { UserProfileDropdown } from '@/components/UserProfileDropdown';
import {useUser} from "@/context/userContext";

export default function Home() {
  const [query, setQuery] = useState('');
  const [places, setPlaces] = useState<Place[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const ITEMS_PER_PAGE = 9;

  // 모달 상태 관리
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);

  // 사용자 상태 불러오기
  const { user, isLoading: userLoading } = useUser();

  // 검색 입력 요소에 대한 참조
  const searchInputRef = useRef<any>(null);
  const initialRenderRef = useRef(true);

  // 컴포넌트 마운트시 localStorage에서 이전 검색 결과 불러오기
  useEffect(() => {
    const savedQuery = localStorage.getItem('searchQuery');
    const savedResults = localStorage.getItem('searchResults');

    if (savedQuery) {
      setQuery(savedQuery);
      if (searchInputRef.current) {
        searchInputRef.current.setValue(savedQuery);
      }

      if (savedResults) {
        try {
          const parsedResults = JSON.parse(savedResults);
          setPlaces(parsedResults);
          setTotalResults(parsedResults.length);

          // localStorage에서 불러왔을 때 hasMore 상태 설정
          const savedTotal = localStorage.getItem('totalResults');
          if (savedTotal) {
            const total = parseInt(savedTotal);
            setHasMore(total > parsedResults.length);
          } else {
            setHasMore(true); // 총 결과수를 모르면 일단 더 있다고 가정
          }

          console.log('Loaded from localStorage:', {
            query: savedQuery,
            resultsCount: parsedResults.length,
            hasMore: (total: number) => total > parsedResults.length
          });
        } catch (e) {
          console.error('저장된 검색 결과 파싱 오류:', e);
        }
      } else {
        // 저장된 쿼리가 있지만 결과가 없는 경우 검색 수행
        handleSearch(savedQuery);
      }
    }

    initialRenderRef.current = false;
  }, []);

  // 검색 결과를 처리하는 함수
  const handleSearch = useCallback(async (searchQuery: string, results?: BlogItem[]) => {
    console.log('Search initiated:', searchQuery);
    setQuery(searchQuery);
    setPage(0);
    setLoading(true);
    setSelectedPlace(null); // 새 검색시 선택 초기화

    try {
      if (searchQuery && !results) {
        console.log('Fetching search results from API');
        const response = await searchBlogPosts(searchQuery, 1, ITEMS_PER_PAGE);

        const items = response.items || [];
        const total = response.total || 0;

        console.log('API response:', {
          items: items.length,
          total
        });

        const convertedPlaces = await convertBlogItemsToPlaces(items);

        setPlaces(convertedPlaces);
        setTotalResults(total);

        // 명확한 hasMore 설정
        const moreDataAvailable = items.length > 0 && total > items.length;
        console.log('Search completed:', {
          total,
          itemsLength: items.length,
          moreDataAvailable
        });

        setHasMore(moreDataAvailable);

        // 검색어와 결과 localStorage에 저장
        localStorage.setItem('searchQuery', searchQuery);
        localStorage.setItem('searchResults', JSON.stringify(convertedPlaces));
        localStorage.setItem('totalResults', total.toString());

        // 약간의 지연 후 스크롤 영역 가시성 확인 및 스크롤 위치 조정
        setTimeout(() => {
          window.scrollTo(0, 0); // 페이지 맨 위로 스크롤
          const loadingArea = document.querySelector('.infinite-scroll-loading');
          if (loadingArea) {
            const rect = loadingArea.getBoundingClientRect();
            console.log('Loading area visible:', {
              top: rect.top,
              bottom: rect.bottom,
              inViewport: rect.top < window.innerHeight
            });
          }
        }, 100);
      } else if (results) {
        console.log('Using provided results:', results.length);
        const convertedPlaces = await convertBlogItemsToPlaces(results);
        setPlaces(convertedPlaces);
        setTotalResults(results.length);
        setHasMore(true); // 직접 결과를 전달받은 경우 더 이상 데이터가 없다고 가정

        // 검색어와 결과 localStorage에 저장
        localStorage.setItem('searchQuery', searchQuery);
        localStorage.setItem('searchResults', JSON.stringify(convertedPlaces));
        localStorage.setItem('totalResults', results.length.toString());
      } else {
        console.log('Empty search query, clearing results');
        setPlaces([]);
        setTotalResults(0);
        setHasMore(true);

        // 검색어가 없을 경우 localStorage 항목 삭제
        localStorage.removeItem('searchQuery');
        localStorage.removeItem('searchResults');
        localStorage.removeItem('totalResults');
      }
    } catch (error) {
      console.error('검색 오류:', error);
      setPlaces([]);
      setTotalResults(0);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // 더보기 기능
  const loadMore = useCallback(async () => {
    console.log('LoadMore triggered:', {
      loading,
      hasMore,
      query,
      currentPage: page,
      currentResults: places.length
    });

    // 이미 로딩 중이거나 더 불러올 데이터가 없거나 검색어가 없으면 중단
    if (loading || !hasMore || !query) {
      console.log('LoadMore canceled due to conditions not met');
      return;
    }

    // 현재 스크롤 위치 저장
    const scrollPosition = window.scrollY;
    console.log('Current scroll position:', scrollPosition);

    setLoading(true);
    console.log('LoadMore: Loading started');

    try {
      const nextPage = page + 1;
      const startIndex = nextPage * ITEMS_PER_PAGE + 1;
      console.log('Fetching next page:', {
        nextPage,
        startIndex,
        itemsPerPage: ITEMS_PER_PAGE
      });

      const response = await searchBlogPosts(query, startIndex, ITEMS_PER_PAGE);
      const items = response.items || [];
      console.log('API response for next page:', {
        items: items.length,
        total: response.total
      });

      if (items.length > 0) {
        const convertedPlaces = await convertBlogItemsToPlaces(items);

        // 새 장소 목록 업데이트
        const newPlaces = [...places, ...convertedPlaces];
        console.log('Updated results:', {
          previousCount: places.length,
          newCount: newPlaces.length,
          addedCount: convertedPlaces.length
        });

        // 상태 업데이트
        setPlaces(newPlaces);
        setPage(nextPage);

        // localStorage 업데이트
        localStorage.setItem('searchResults', JSON.stringify(newPlaces));

        // 더 불러올 수 있는지 확인
        const moreAvailable = items.length > 0 && newPlaces.length < response.total;
        console.log('More data available:', moreAvailable);
        setHasMore(moreAvailable);

        // 상태 업데이트 후 스크롤 위치 복원
        setTimeout(() => {
          window.scrollTo({
            top: scrollPosition,
            behavior: 'auto' // 부드러운 스크롤이 아닌 즉시 이동
          });
          console.log('Scroll position restored to:', scrollPosition);
        }, 100);
      } else {
        console.log('No more items returned from API');
        setHasMore(false);
      }
    } catch (error) {
      console.error('추가 데이터 로드 오류:', error);
      setHasMore(false);
    } finally {
      setLoading(false);
      console.log('LoadMore: Loading completed');
    }
  }, [loading, hasMore, query, page, places.length]);

  // 장소 선택 처리 (단일 선택)
  const handlePlaceSelect = useCallback((place: Place) => {
    // 이미 선택된 장소라면 선택 해제, 아니면 새로 선택
    setSelectedPlace(selectedPlace?.id === place.id ? null : place);
  }, [selectedPlace]);

  // 검색어 입력만 하는 함수 (자동 검색 X)
  const setSearchInputValue = useCallback((value: string) => {
    if (searchInputRef.current) {
      searchInputRef.current.setValue(value);
      searchInputRef.current.focus();
    }
  }, []);

  // 로그인 모달 열기
  const openLoginModal = () => {
    setIsLoginModalOpen(true);
    setIsSignupModalOpen(false);
  };

  // 회원가입 모달 열기
  const openSignupModal = () => {
    setIsSignupModalOpen(true);
    setIsLoginModalOpen(false);
  };

  return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 shadow-sm">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-xl font-bold">Together</h1>
            <div className="flex items-center space-x-4">
              {user && (
                  <Link
                      href="/routes"
                      className="text-sm py-2 px-3 flex items-center"
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
                          d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                      />
                    </svg>
                    내 경로
                  </Link>
              )}

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
                      d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z"
                  />
                </svg>
                경로 만들기
              </Link>

              {/* 로그인 상태에 따른 UI 변경 */}
              {!userLoading && (
                  <>
                    {user ? (
                        <UserProfileDropdown />
                    ) : (
                        <>
                          <button
                              onClick={openSignupModal}
                              className="text-sm py-2 px-3 bg-green-500 text-white rounded hover:bg-green-600"
                          >
                            회원가입
                          </button>
                          <button
                              onClick={openLoginModal}
                              className="text-sm py-2 px-3 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            로그인
                          </button>
                        </>
                    )}
                  </>
              )}
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <Search onSearch={handleSearch} ref={searchInputRef} />
          </div>

          {loading && places.length === 0 ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
              </div>
          ) : places.length > 0 ? (
              <InfiniteScroll
                  onLoadMore={loadMore}
                  hasMore={hasMore}
                  loading={loading}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {places.map(place => (
                      <Card
                          key={place.id}
                          place={place}
                          onSelect={handlePlaceSelect}
                          isSelected={selectedPlace?.id === place.id} // 현재 선택된 카드인지 여부 전달
                      />
                  ))}
                </div>
              </InfiniteScroll>
          ) : (
              <div className="text-center py-16">
                <div className="max-w-2xl mx-auto">
                  <h2 className="text-2xl font-bold mb-4">Together와 함께 여행을 계획해보세요</h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-8">
                    검색창에 방문하고 싶은 장소나 키워드를 입력하여 여행 계획을 시작하세요.
                    다양한 장소들을 경로로 만들어 효율적인 여행 코스를 구성할 수 있습니다.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                      <div className="text-blue-500 text-3xl mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold mb-2">장소 검색</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        다양한 블로그 정보를 기반으로 방문하고 싶은 장소를 검색해보세요.
                      </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                      <div className="text-blue-500 text-3xl mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c-.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold mb-2">경로 만들기</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        원하는 장소들을 추가하여 나만의 여행 경로를 만들어보세요.
                      </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
                      <div className="text-blue-500 text-3xl mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold mb-2">내비게이션</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        T맵이나 네이버 지도와 연동하여 실제 내비게이션을 사용해보세요.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 justify-center">
                    <button
                        onClick={() => setSearchInputValue('맛집')}
                        className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full py-2 px-4 text-sm"
                    >
                      #맛집
                    </button>
                    <button
                        onClick={() => setSearchInputValue('카페')}
                        className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full py-2 px-4 text-sm"
                    >
                      #카페
                    </button>
                    <button
                        onClick={() => setSearchInputValue('관광지')}
                        className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full py-2 px-4 text-sm"
                    >
                      #관광지
                    </button>
                    <button
                        onClick={() => setSearchInputValue('공원')}
                        className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full py-2 px-4 text-sm"
                    >
                      #공원
                    </button>
                    <button
                        onClick={() => setSearchInputValue('박물관')}
                        className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full py-2 px-4 text-sm"
                    >
                      #박물관
                    </button>
                  </div>
                </div>
              </div>
          )}
        </main>

        {/* 로그인 모달 */}
        <LoginModal
            isOpen={isLoginModalOpen}
            onClose={() => setIsLoginModalOpen(false)}
            onSignupClick={openSignupModal}
        />

        {/* 회원가입 모달 */}
        <SignupModal
            isOpen={isSignupModalOpen}
            onClose={() => setIsSignupModalOpen(false)}
            onSignupSuccess={() => {
              alert('회원가입이 완료되었습니다. 로그인해주세요.');
              openLoginModal();
            }}
        />
      </div>
  );
}
