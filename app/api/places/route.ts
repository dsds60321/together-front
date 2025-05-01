import { NextRequest, NextResponse } from 'next/server';

// Place 인터페이스 정의
interface Place {
    id: string;
    title: string;
    description: string;
    image?: string;
    link?: string;
    bloggerName?: string;
}

// 메모리에 장소 데이터 저장 (실제로는 데이터베이스를 사용해야 함)
const placeStorage = new Map<string, Place>();
const recentPlaces: Place[] = [];

// HTML 태그 제거 및 텍스트 정리 함수
function sanitizeHtml(str: string): string {
    return str.replace(/<\/?[^>]+(>|$)/g, "").trim();
}

export async function POST(request: NextRequest) {
    try {
        const data = await request.json();
        const { place } = data;

        if (!place || !place.id) {
            return NextResponse.json({ error: '유효하지 않은 장소 데이터입니다' }, { status: 400 });
        }

        // 텍스트 정리
        const sanitizedPlace = {
            ...place,
            id: sanitizeHtml(place.id),
            title: place.title, // 타이틀은 HTML 형식으로 유지
            description: place.description // 설명도 HTML 형식으로 유지
        };

        // 장소 데이터 저장
        placeStorage.set(sanitizedPlace.id, sanitizedPlace);

        // 최근 장소 업데이트
        const existingIndex = recentPlaces.findIndex(p => p.id === sanitizedPlace.id);
        if (existingIndex >= 0) {
            recentPlaces.splice(existingIndex, 1);
        }
        recentPlaces.unshift(sanitizedPlace);

        // 최대 10개만 유지
        if (recentPlaces.length > 10) {
            recentPlaces.pop();
        }

        return NextResponse.json({ success: true, placeId: sanitizedPlace.id });
    } catch (error) {
        console.error('장소 저장 오류:', error);
        return NextResponse.json({ error: '장소 데이터 저장에 실패했습니다' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    const placeId = request.nextUrl.searchParams.get('id');

    if (placeId) {
        // ID에서 HTML 태그 제거 및 정리
        const sanitizedId = sanitizeHtml(placeId);

        // 특정 장소 정보 조회
        let placeData = placeStorage.get(sanitizedId);

        // ID로 찾지 못했다면 원본 ID로 한번 더 시도
        if (!placeData) {
            placeData = placeStorage.get(placeId);
        }

        // 그래도 없으면 오류 반환
        if (!placeData) {
            // 데모 목적으로 더미 데이터 생성
            const dummyPlace: Place = {
                id: sanitizedId || placeId,
                title: "샘플 장소",
                description: "테스트용 더미 데이터입니다. 실제 데이터베이스에서는 이 장소를 찾을 수 없습니다.",
                image: "https://via.placeholder.com/300x200?text=Sample+Place"
            };

            return NextResponse.json({
                place: dummyPlace,
                suggestions: []
            });
        }

        // 최근 방문 장소 목록 (현재 장소 제외)
        const suggestions = recentPlaces
            .filter(place => place.id !== placeData!.id)
            .slice(0, 5);

        return NextResponse.json({ place: placeData, suggestions });
    } else {
        // 모든 최근 장소 반환
        return NextResponse.json({ places: recentPlaces });
    }
}