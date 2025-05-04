'use client';

import {useCallback, useEffect, useRef, useState} from 'react';
import {DragDropContext, Draggable, Droppable} from '@hello-pangea/dnd';
import {Place} from './Card';
import {Search} from './Search';
import {BlogItem, convertBlogItemsToPlaces, searchBlogPosts} from '@/lib/api';
import {v4 as uuidv4} from 'uuid';
import { InfiniteScroll } from './InfiniteScroll';

// 경로 지점 타입 정의
interface RoutePoint extends Place {
  type: 'start' | 'waypoint' | 'end';
}

interface NavigationComponentProps {
  initialPlaces?: Place[];
}

export function NavigationComponent({ initialPlaces = [] }: NavigationComponentProps) {
  const [routePoints, setRoutePoints] = useState<RoutePoint[]>([]);
  const [searchResults, setSearchResults] = useState<Place[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [customPlaceName, setCustomPlaceName] = useState('');
  const [previouslySelectedPlace, setPreviouslySelectedPlace] = useState<Place | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const ITEMS_PER_PAGE = 9;

  // T맵 내비게이션 호출 상태
  const [navLoading, setNavLoading] = useState(false);

  // 블로그 링크 공유 상태
  const [shareLoading, setShareLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // 검색창 참조
  const searchInputRef = useRef<any>(null);

  // 컴포넌트 마운트시 localStorage에서 이전 검색과 선택된 장소 불러오기
  useEffect(() => {
    // localStorage에서 데이터 가져오기 (브라우저 환경에서만 실행)
    if (typeof window !== 'undefined') {
      // 이전 검색어
      const savedQuery = localStorage.getItem('searchQuery');
      if (savedQuery) {
        setSearchQuery(savedQuery);
        if (searchInputRef.current) {
          searchInputRef.current.setValue(savedQuery);
        }
      }

      // 이전에 선택된 장소가 있는지 확인
      const selectedPlace = localStorage.getItem('selectedPlace');
      if (selectedPlace) {
        try {
          const parsedPlace = JSON.parse(selectedPlace) as Place;
          setPreviouslySelectedPlace(parsedPlace);
        } catch (e) {
          console.error('저장된 장소 파싱 오류:', e);
        }
      }

      // 이전 검색 결과
      const savedResults = localStorage.getItem('searchResults');
      if (savedResults) {
        try {
          let parsedResults = JSON.parse(savedResults) as Place[];

          // 이전에 선택된 장소가 있고 검색 결과에 없는 경우, 검색 결과 상단에 추가
          if (previouslySelectedPlace) {
            const isInResults = parsedResults.some(place => place.id === previouslySelectedPlace.id);
            if (!isInResults) {
              // 선택된 장소를 검색 결과 맨 앞에 추가
              parsedResults = [previouslySelectedPlace, ...parsedResults];
            }
          }

          setSearchResults(parsedResults);
          // 더 불러올 수 있음을 표시
          setHasMore(true);
        } catch (e) {
          console.error('저장된 검색 결과 파싱 오류:', e);
        }
      }
    }
  }, []);

  // 초기 장소 설정
  useEffect(() => {
    if (initialPlaces.length > 0) {
      const initialRoutePoints = initialPlaces.map((place, index) => {
        let type: 'start' | 'waypoint' | 'end' = 'waypoint';
        if (index === 0) type = 'start';
        if (index === initialPlaces.length - 1 && index > 0) type = 'end';
        return { ...place, type };
      });
      setRoutePoints(initialRoutePoints);
    }
  }, [initialPlaces]);

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
      if (index === items.length - 1 && items.length > 1) type = 'end';
      return { ...item, type };
    });

    setRoutePoints(updatedItems);
  };

  // 장소 검색 처리
  const handleSearch = useCallback(async (query: string, results?: BlogItem[]) => {
    setSearchQuery(query);
    setPage(0); // 페이지 초기화
    setLoading(true);
    setApiError(null);

    try {
      if (query && !results) {
        const response = await searchBlogPosts(query, 1, ITEMS_PER_PAGE);
        const blogItems = response.items;
        const total = response.total || 0;

        let convertedPlaces = await convertBlogItemsToPlaces(blogItems);

        // 선택된 장소가 있고 검색 결과에 없는 경우 맨 위에 추가
        if (previouslySelectedPlace) {
          const isInResults = convertedPlaces.some(place => place.id === previouslySelectedPlace.id);
          if (!isInResults) {
            convertedPlaces = [previouslySelectedPlace, ...convertedPlaces];
          }
        }

        setSearchResults(convertedPlaces);
        setTotalResults(total);

        // 더 불러올 데이터가 있는지 확인
        const moreDataAvailable = blogItems.length > 0 && total > blogItems.length;
        setHasMore(moreDataAvailable);

        // 검색어와 결과 localStorage에 저장
        localStorage.setItem('searchQuery', query);
        localStorage.setItem('searchResults', JSON.stringify(convertedPlaces));
      } else if (results) {
        let convertedPlaces = await convertBlogItemsToPlaces(results);

        // 선택된 장소가 있고 검색 결과에 없는 경우 맨 위에 추가
        if (previouslySelectedPlace) {
          const isInResults = convertedPlaces.some(place => place.id === previouslySelectedPlace.id);
          if (!isInResults) {
            convertedPlaces = [previouslySelectedPlace, ...convertedPlaces];
          }
        }

        setSearchResults(convertedPlaces);
        setTotalResults(results.length);
        setHasMore(false); // 직접 결과를 전달받은 경우 더 불러올 데이터가 없음

        // 검색어와 결과 localStorage에 저장
        localStorage.setItem('searchQuery', query);
        localStorage.setItem('searchResults', JSON.stringify(convertedPlaces));
      } else {
        // 검색어가 없을 때도 선택된 장소는 표시
        if (previouslySelectedPlace) {
          setSearchResults([previouslySelectedPlace]);
        } else {
          setSearchResults([]);
        }
        setHasMore(false);

        // 검색어가 없을 경우 localStorage 항목 삭제
        localStorage.removeItem('searchQuery');
        localStorage.removeItem('searchResults');
      }
    } catch (error) {
      console.error('검색 오류:', error);

      // 오류 발생시에도 선택된 장소는 표시
      if (previouslySelectedPlace) {
        setSearchResults([previouslySelectedPlace]);
      } else {
        setSearchResults([]);
      }

      setApiError('검색 중 오류가 발생했습니다');
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [previouslySelectedPlace]);

  // 추가 데이터 로드 함수
  const loadMore = async () => {
    // 이미 로딩 중이거나 더 불러올 데이터가 없으면 중단
    if (loading || !hasMore || !searchQuery) {
      return;
    }

    // 현재 스크롤 위치 저장
    const scrollPosition = window.scrollY;

    setLoading(true);

    try {
      const nextPage = page + 1;
      const startIndex = nextPage * ITEMS_PER_PAGE + 1;

      const response = await searchBlogPosts(searchQuery, startIndex, ITEMS_PER_PAGE);
      const items = response.items || [];

      if (items.length > 0) {
        const convertedPlaces = await convertBlogItemsToPlaces(items);

        // 새 검색 결과 목록 업데이트
        const newResults = [...searchResults, ...convertedPlaces];
        setSearchResults(newResults);
        setPage(nextPage);

        // localStorage 업데이트
        localStorage.setItem('searchResults', JSON.stringify(newResults));

        // 더 불러올 수 있는지 확인
        const moreAvailable = items.length > 0 && newResults.length < response.total;
        setHasMore(moreAvailable);

        // 스크롤 위치 복원
        setTimeout(() => {
          window.scrollTo({
            top: scrollPosition,
            behavior: 'auto'
          });
        }, 0);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('추가 데이터 로드 오류:', error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  // 장소 추가
  const addPlaceToRoute = (place: Place) => {
    // 이미 경로에 있는지 확인
    if (routePoints.some(p => p.id === place.id)) return;

    const newRoutePoints = [...routePoints];
    const type = newRoutePoints.length === 0 ? 'start' : (newRoutePoints.length === 1 ? 'end' : 'waypoint');

    // 경로 추가
    newRoutePoints.push({ ...place, type });

    // 경로가 2개 이상일 경우 마지막 지점을 end로 설정
    if (newRoutePoints.length >= 2) {
      newRoutePoints[newRoutePoints.length - 1].type = 'end';
      // 이전 end를 waypoint로 변경
      if (newRoutePoints.length > 2) {
        newRoutePoints[newRoutePoints.length - 2].type = 'waypoint';
      }
    }

    setRoutePoints(newRoutePoints);
  };

  // 사용자 정의 장소 추가 핸들러
  const handleCustomPlaceAdd = () => {
    if (!customPlaceName.trim()) return;

    // 커스텀 장소 객체 생성
    const customPlace: Place = {
      id: `custom-${uuidv4()}`, // 고유 ID 생성
      title: customPlaceName.trim(),
      description: '사용자 지정 장소',
    };

    // 경로에 추가
    addPlaceToRoute(customPlace);

    // 입력란 초기화
    setCustomPlaceName('');
  };

  // 직접 입력 폼 제출 핸들러
  const handleCustomFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCustomPlaceAdd();
  };

  // 경로에서 장소 제거
  const removeFromRoute = (id: string) => {
    const updatedPoints = routePoints.filter(point => point.id !== id);

    // 타입 재할당
    const finalPoints = updatedPoints.map((item, index) => {
      let type: 'start' | 'waypoint' | 'end' = 'waypoint';
      if (index === 0) type = 'start';
      if (index === updatedPoints.length - 1 && updatedPoints.length > 1) type = 'end';
      return { ...item, type };
    });

    setRoutePoints(finalPoints);
  };

  // 블로그 링크 공유 함수
  const handleShareBlog = async (place: Place) => {
    if (!place.link) return;

    setShareLoading(true);

    try {
      if (navigator.share) {
        // Web Share API 사용 (모바일 기기에서 주로 지원)
        await navigator.share({
          title: place.title,
          text: place.description,
          url: place.link
        });
      } else {
        // 클립보드에 복사 (데스크톱 등에서 폴백)
        await navigator.clipboard.writeText(place.link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      console.error('공유 오류:', error);
    } finally {
      setShareLoading(false);
    }
  };

  // 블로그 방문 함수
  const visitBlog = (place: Place) => {
    if (place.link) {
      window.open(place.link, '_blank');
    }
  };

  // T맵 앱 실행하여 경로 안내
  const launchTmapNavigation = () => {
    if (routePoints.length < 2) {
      alert('출발지와 목적지를 설정해주세요.');
      return;
    }

    setNavLoading(true);

    try {
      // 출발지
      const startPoint = routePoints[0];
      // 목적지
      const endPoint = routePoints[routePoints.length - 1];
      // 경유지들
      const waypoints = routePoints.slice(1, routePoints.length - 1);

      // T맵 URI 스킴 생성
      let tmapScheme = `tmap://route?startname=${encodeURIComponent(startPoint.title)}`;

      // 좌표 정보가 있다면 추가 (현재는 예시이므로 좌표 정보는 없음)
      tmapScheme += `&goalname=${encodeURIComponent(endPoint.title)}`;

      // 경유지 추가
      waypoints.forEach((point, index) => {
        tmapScheme += `&passname${index}=${encodeURIComponent(point.title)}`;
      });

      // 모바일 기기 확인
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      if (isMobile) {
        // 모바일에서 T맵 실행 시도
        window.location.href = tmapScheme;

        // 앱이 없는 경우 스토어로 이동
        setTimeout(() => {
          if (!document.hidden) {
            if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
              window.location.href = 'https://apps.apple.com/kr/app/티맵/id431589174';
            } else {
              window.location.href = 'https://play.google.com/store/apps/details?id=com.skt.tmap.ku';
            }
          }
        }, 2000);
      } else {
        alert('T맵 내비게이션은 모바일 기기에서만 실행 가능합니다.');
      }
    } catch (error) {
      console.error('T맵 실행 오류:', error);
      alert('T맵 실행 중 오류가 발생했습니다.');
    } finally {
      setNavLoading(false);
    }
  };

  // 네이버 지도로 보기
  const viewOnNaverMap = () => {
    if (routePoints.length < 2) {
      alert('출발지와 목적지를 설정해주세요.');
      return;
    }

    // 네이버 지도 URL 생성
    const waypoints = routePoints.map((point, index) => {
      const prefix = index === 0 ? 'sname' : (index === routePoints.length - 1 ? 'dname' : `waypoint${index-1}`);
      return `${prefix}=${encodeURIComponent(point.title)}`;
    }).join('&');

    const mapUrl = `https://map.naver.com/v5/directions/?${waypoints}&pathType=0`;
    window.open(mapUrl, '_blank');
  };

  // 검색어 바로가기 목록
  const quickSearchTerms = [
    '맛집', '카페', '관광지', '공원', '박물관'
  ];

  // 검색어 입력 처리 함수
  const handleQuickSearch = (term: string) => {
    if (searchInputRef.current) {
      searchInputRef.current.setValue(term);
      searchInputRef.current.focus();
    }
  };

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
                        onClick={() => visitBlog(place)}
                        className="text-xs py-1 px-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md text-gray-700 dark:text-gray-300"
                    >
                      블로그 방문
                    </button>
                )}
                {place.link && (
                    <button
                        onClick={() => handleShareBlog(place)}
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
                    onClick={() => addPlaceToRoute(place)}
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
      <div className="w-full">
        <div className="mb-8">
          <Search onSearch={handleSearch} ref={searchInputRef} initialQuery={searchQuery} />

          {/* 검색어 바로가기 */}
          <div className="flex flex-wrap gap-3 mt-4 justify-center">
            {quickSearchTerms.map(term => (
                <button
                    key={term}
                    onClick={() => handleQuickSearch(term)}
                    className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full py-2 px-4 text-sm"
                >
                  #{term}
                </button>
            ))}
          </div>
        </div>

        {/* 장소 검색 영역이 끝난 후 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 왼쪽 패널: 경로 리스트 */}
          <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold mb-4">경로 목록</h2>

            {/* 직접 장소 추가 폼 */}
            <div className="mb-4">
              <form onSubmit={handleCustomFormSubmit} className="flex flex-col">
                <label className="text-sm mb-1 text-gray-600 dark:text-gray-300">
                  장소 직접 입력
                </label>
                <div className="flex">
                  <input
                      type="text"
                      value={customPlaceName}
                      onChange={(e) => setCustomPlaceName(e.target.value)}
                      placeholder="처음 입력한 장소는 출발지가 됩니다."
                      className="flex-1 border rounded-l-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600"
                  />
                  <button
                      type="submit"
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-r-md text-sm"
                      disabled={!customPlaceName.trim()}
                  >
                    추가
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  *정확한 장소명을 입력하면 내비게이션 연동이 잘 됩니다
                </p>
              </form>
            </div>

            <div className="h-px w-full bg-gray-200 dark:bg-gray-700 my-4"></div>

            {routePoints.length === 0 ? (
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md text-center">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    위에서 장소를 직접 입력하거나 검색하여 경로를 추가하세요
                  </p>
                </div>
            ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="droppable-route">
                    {(provided) => (
                        <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="space-y-2"
                        >
                          {routePoints.map((point, index) => (
                              <Draggable key={point.id} draggableId={point.id} index={index}>
                                {(provided) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md flex items-center"
                                    >
                                      <div className="mr-2">
                                        {point.type === 'start' ? (
                                            <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs">
                                              S
                                            </div>
                                        ) : point.type === 'end' ? (
                                            <div className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs">
                                              E
                                            </div>
                                        ) : (
                                            <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs">
                                              {index}
                                            </div>
                                        )}
                                      </div>
                                      <div className="flex-1 ml-1">
                                        <div className="text-sm font-medium line-clamp-1" dangerouslySetInnerHTML={{ __html: point.title }}></div>
                                      </div>
                                      <button
                                          onClick={() => removeFromRoute(point.id)}
                                          className="text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 ml-2"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                      </button>
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


            {routePoints.length >= 1 && (
                <div className="mt-6 space-y-3">
                  <button
                      onClick={launchTmapNavigation}
                      className="btn-primary w-full flex items-center justify-center"
                      disabled={navLoading}
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
                          T맵으로 내비게이션

                        </>
                    )}
                  </button>

                  <button
                      onClick={viewOnNaverMap}
                      className="btn-secondary w-full flex items-center justify-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                    </svg>
                    네이버 지도로 보기
                  </button>
                </div>
            )}
          </div>

          {/* 오른쪽 패널: 검색 결과 */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold mb-4">검색 결과</h2>

              {loading && searchResults.length === 0 ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
              ) : searchResults.length > 0 ? (
                  <InfiniteScroll onLoadMore={loadMore} hasMore={hasMore} loading={loading}>
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
            </div>
          </div>
        </div>
      </div>
  );
}