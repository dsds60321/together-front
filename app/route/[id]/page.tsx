'use client';

import { useEffect, useState } from 'react';
import { notFound, useRouter } from 'next/navigation';
import axios from 'axios';
import RoutePageClient from './RoutePageClient';
import { Place } from '@/lib/data';
import { use } from 'react';

// HTML 태그 제거 함수
function sanitizeHtml(str: string): string {
    return str.replace(/<\/?[^>]+(>|$)/g, "").trim();
}

// 서버 컴포넌트를 클라이언트 컴포넌트로 변경
export default function RoutePage({ params }: { params: { id: string } }) {
    const [mainPlace, setMainPlace] = useState<Place | null>(null);
    const [suggestions, setSuggestions] = useState<Place[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    // params는 이제 Promise이므로 React.use()로 unwrap 필요
    const unwrappedParams = use(params);
    const id = unwrappedParams.id;

    useEffect(() => {
        // API에서 장소 정보 가져오기
        const fetchPlaceData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // API 호출하여 장소 정보 가져오기 (간단한 숫자 ID 형태 사용)
                const response = await axios.get(`/api/places?id=${id}`);
                const { place, suggestions } = response.data;

                if (place) {
                    setMainPlace(place);
                    setSuggestions(suggestions || []);
                } else {
                    console.error('유효한 장소 정보가 반환되지 않았습니다');
                    setMainPlace(null);
                    setError('장소 정보를 찾을 수 없습니다');
                }
            } catch (error) {
                console.error('장소 데이터 로드 오류:', error);
                setMainPlace(null);
                setError('장소 정보를 불러오는 중 오류가 발생했습니다');
            } finally {
                setIsLoading(false);
            }
        };

        fetchPlaceData();
    }, [id]);

    // 로딩 중 표시
    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // 오류 발생 시
    if (error) {
        return (
            <div className="flex flex-col justify-center items-center min-h-screen p-4">
                <div className="text-red-500 text-xl mb-4">{error}</div>
                <button
                    onClick={() => router.push('/')}
                    className="btn-primary"
                >
                    메인으로 돌아가기
                </button>
            </div>
        );
    }

    // 장소 정보가 없으면 404 페이지로 이동
    if (!mainPlace) {
        notFound();
        return null;
    }

    // 클라이언트 컴포넌트로 데이터 전달
    return (
        <RoutePageClient
            initialPlace={mainPlace}
            initialSuggestions={suggestions}
            params={unwrappedParams}
        />
    );
}