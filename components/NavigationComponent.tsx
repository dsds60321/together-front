// components/NavigationComponent.tsx
'use client';

import {useCallback, useEffect, useRef, useState} from 'react';
import {Place} from './Card';
import {Search} from './Search';
import {BlogItem, convertBlogItemsToPlaces, searchBlogPosts} from '@/lib/api';
import {RouteList} from './RouteList';
import {SearchResults} from './SearchResults';
import {checkMobileAndAlert, convertCoordinate} from "@/lib/utils";

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

  // 경로 재정렬 처리
  const handleReorderRoutePoints = (updatedPoints: RoutePoint[]) => {
    setRoutePoints(updatedPoints);
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
          text: place.description || '함께 공유하고 싶은 장소입니다.',
          url: place.link
        });
      } else {
        // 클립보드에 복사
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
  const handleVisitBlog = (place: Place) => {
    if (place.link) {
      window.open(place.link, '_blank', 'noopener,noreferrer');
    }
  };

  // 네이버 내비게이션 실행
  const viewNaverMap = () => {
    if (routePoints.length === 0) return;

    // 모바일 기기 체크
    if (!checkMobileAndAlert('네이버 지도')) return;

    try {
      const APP_NAME = 'test';
      const BASE_URL = 'nmap://route/car';

      // 단일 장소인 경우 간단히 처리
      if (routePoints.length === 1) {
        const point = routePoints[0];
        if (point.mapx && point.mapy) {
          const x = convertCoordinate(point.mapx);
          const y = convertCoordinate(point.mapy);
          console.log(`${BASE_URL}?dlat=${y}&dlng=${x}&dname=${encodeURIComponent(point.title)}&appname=${APP_NAME}`)
          window.location.href = `${BASE_URL}?dlat=${y}&dlng=${x}&dname=${encodeURIComponent(point.title)}&appname=${APP_NAME}`;
          return;
        }
      }

      // 경로 지점 분류
      const waypoints = routePoints.filter(p => p.type === 'waypoint');
      const startPoint = routePoints.find(p => p.type === 'start') || (waypoints.length > 0 ? waypoints.shift() : null);
      const endPoint = routePoints.find(p => p.type === 'end') || (waypoints.length > 0 ? waypoints.pop() : null);

      // URL 파라미터 구성
      const params: string[] = [];

      // 출발지 파라미터 추가
      if (startPoint?.mapx && startPoint?.mapy) {
        params.push(`slng=${convertCoordinate(startPoint.mapx)}`);
        params.push(`slat=${convertCoordinate(startPoint.mapy)}`);
        params.push(`sname=${encodeURIComponent(startPoint.title)}`);
      }

      // 도착지 파라미터 추가
      if (endPoint?.mapx && endPoint?.mapy) {
        params.push(`dlng=${convertCoordinate(endPoint.mapx)}`);
        params.push(`dlat=${convertCoordinate(endPoint.mapy)}`);
        params.push(`dname=${encodeURIComponent(endPoint.title)}`);
      }

      // 경유지 파라미터 추가
      waypoints.forEach((waypoint, index) => {
        if (waypoint.mapx && waypoint.mapy) {
          const prefix = `v${index + 1}`;
          params.push(`${prefix}lng=${convertCoordinate(waypoint.mapx)}`);
          params.push(`${prefix}lat=${convertCoordinate(waypoint.mapy)}`);
          params.push(`${prefix}name=${encodeURIComponent(waypoint.title)}`);
        }
      });

      // 앱 이름 추가
      params.push(`appname=${APP_NAME}`);

      // URL 완성 및 실행
      const naverUrl = `${BASE_URL}?${params.join('&')}`;
      console.log('네이버 지도 URL:', naverUrl);
      window.location.href = naverUrl;
    } catch (error) {
      console.error('네이버 지도 실행 오류:', error);
      alert('네이버 지도를 열 수 없습니다.');
    }
  };


  // 티맵 내비게이션 함수
  const launchTmapNavigation = async () => {
    if (routePoints.length === 0) return;

    // 모바일 기기 체크
    if (!checkMobileAndAlert('T맵')) return;

    // 티맵은 경로가 2개를 초과하면 불가능
    if (routePoints.length > 2) {
      alert('T맵은 출발지와 도착지만 지원합니다. 경유지가 있는 경로는 네이버 지도를 이용해주세요.');
      return;
    }

    setNavLoading(true);

    try {
      const BASE_URL = "tmap://route";

      // 단일 장소인 경우 (목적지만 있는 경우)
      if (routePoints.length === 1) {
        const point = routePoints[0];

        if (!point.mapx || !point.mapy) {
          alert("좌표 정보가 없는 장소입니다. 다른 장소를 선택해주세요.");
          return;
        }

        // 티맵도 좌표 변환 함수 사용
        const x = convertCoordinate(point.mapx);
        const y = convertCoordinate(point.mapy);
        const tmapUrl = `${BASE_URL}?goalx=${x}&goaly=${y}&goalname=${encodeURIComponent(point.title)}`;
        window.location.href = tmapUrl;
        return;
      }

      // 출발지와 목적지가 있는 경우
      const [start, end] = routePoints;

      if (!start.mapx || !start.mapy || !end.mapx || !end.mapy) {
        alert("좌표 정보가 없는 장소가 포함되어 있습니다. 다른 장소를 선택해주세요.");
        return;
      }

      // URL 생성 및 실행 (티맵도 convertCoordinate 사용)
      const startX = convertCoordinate(start.mapx);
      const startY = convertCoordinate(start.mapy);
      const endX = convertCoordinate(end.mapx);
      const endY = convertCoordinate(end.mapy);

      const tmapUrl = `${BASE_URL}?startx=${startX}&starty=${startY}&startname=${encodeURIComponent(start.title)}&goalx=${endX}&goaly=${endY}&goalname=${encodeURIComponent(end.title)}`;
      window.location.href = tmapUrl;
    } catch (error) {
      console.error('T맵 실행 오류:', error);
      alert('T맵을 열 수 없습니다.');
    } finally {
      setNavLoading(false);
    }
  };





  return (
      <div>
        <div className="mb-6">
          <Search onSearch={handleSearch} ref={searchInputRef} />
        </div>

        {/*<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">*/}
        {/* 세로로 변경 */}
        <div className="grid lg:grid-cols-4 gap-6">
          {/* 왼쪽 패널: 경로 목록 */}
          <RouteList
              routePoints={routePoints}
              onReorder={handleReorderRoutePoints}
              onRemovePoint={removeFromRoute}
              onLaunchNav={launchTmapNavigation}
              onViewMap={viewNaverMap}
              navLoading={navLoading}
              onAddPlace={addPlaceToRoute} // 장소 추가 함수 연결
          />

          {/* 오른쪽 패널: 검색 결과 */}
          <SearchResults
              searchResults={searchResults}
              loading={loading}
              hasMore={hasMore}
              searchQuery={searchQuery}
              apiError={apiError}
              onLoadMore={loadMore}
              onAddPlaceToRoute={addPlaceToRoute}
              onShareBlog={handleShareBlog}
              onVisitBlog={handleVisitBlog}
              shareLoading={shareLoading}
              copied={copied}
              previouslySelectedPlace={previouslySelectedPlace}
          />
        </div>
      </div>
  );
}