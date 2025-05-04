// lib/api.ts
import axios from 'axios';
import { Place } from './data';

// axios 인스턴스 생성
const apiClient = axios.create({
    baseURL: 'https://gunho.dev/together',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    }
});

// 응답 데이터 인터페이스
export interface BlogSearchResponse {
    lastBuildDate: string;
    total: number;
    start: number;
    display: number;
    items: BlogItem[];
}

export interface BlogItem {
    id : string;
    title: string;
    link: string;
    description: string;
    bloggername: string;
    bloggerlink: string;
    postdate: string;
}

export interface NavigationRequest {
    navigationType: 'tmap' | 'naver';
    routePoints: {
        id: string;
        title: string;
        type: 'start' | 'waypoint' | 'end';
        mapx?: string;
        mapy?: string;
        address?: string;
        roadAddress?: string;
    }[];
}

// HTML 태그 제거 유틸리티 함수
export const removeHTMLTags = (str: string): string => {
    if (!str) return '';
    return str.replace(/<\/?[^>]+(>|$)/g, "");
};

// 블로그 검색 API 호출 함수
export const searchBlogPosts = async (query: string, start: number = 1, display: number = 9): Promise<BlogSearchResponse> => {
    try {
        const response = await apiClient.get<BlogSearchResponse>(`/search/blog?query=${encodeURIComponent(query)}&start=${start}&display=${display}`);
        return response.data;
    } catch (error) {
        console.error('블로그 검색 API 오류:', error);
        // 기본 빈 응답 반환
        return {
            lastBuildDate: new Date().toISOString(),
            total: 0,
            start: start,
            display: 0,
            items: []
        };
    }
};

export const searchLocals = async (query: string) => {
    try {
        const response = await apiClient.get<BlogSearchResponse>(`/search/locals?query=${encodeURIComponent(query)}`);
        return response.data;
    } catch (error) {
        console.error('지역 검색 API 오류:', error);
        // 기본 빈 응답 반환
        return {
            lastBuildDate: new Date().toISOString(),
            total: 0,
            start: 1,
            display: 0,
            items: []
        };
    }
}

// 블로그 메타데이터 가져오기
export const fetchBlogMetadata = async (url: string) => {
    try {
        const response = await fetch(`/api/blog-metadata?url=${encodeURIComponent(url)}`);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`메타데이터 가져오기 실패: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        return null;
    }
};

// 임시 이미지 URL
const FALLBACK_IMAGES = [
    'https://picsum.photos/seed/blog1/300/200',
    'https://picsum.photos/seed/blog2/300/200',
    'https://picsum.photos/seed/blog3/300/200',
    'https://picsum.photos/seed/blog4/300/200',
    'https://picsum.photos/seed/blog5/300/200'
];

// BlogItem을 Place 형식으로 변환하는 함수
export const convertBlogItemToPlace = async (item: BlogItem, index: number): Promise<Place> => {
    // 기본 변환
    const place: Place = {
        id: item.id || `blog-${index + 1}`,
        title: removeHTMLTags(item.title) || '제목 없음',
        description: removeHTMLTags(item.description) || '설명 없음',
        link: item.link,
        bloggerName: item.bloggername,
        // 임시 이미지 지정 (기본값)
        image: FALLBACK_IMAGES[index % FALLBACK_IMAGES.length]
    };

    // 블로그 메타데이터에서 이미지 URL 가져오기 시도
    try {
        const metadata = await fetchBlogMetadata(item.link);
        if (metadata && metadata.image) {
            place.image = metadata.image;
        } else {
        }
    } catch (error) {
        console.warn('블로그 이미지 가져오기 실패, 임시 이미지 사용:', error);
    }

    return place;
};

// 전체 검색 결과를 Place 배열로 변환하는 함수
export const convertBlogItemsToPlaces = async (items: BlogItem[]): Promise<Place[]> => {
    return Promise.all(items.map((item, index) => convertBlogItemToPlace(item, index)));
};

export default apiClient;