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

// 메모리에 즐겨찾기 데이터 저장 (실제로는 데이터베이스를 사용해야 함)
const favoritesStorage = new Map<string, Place>();

export async function POST(request: NextRequest) {
    try {
        const data = await request.json();
        const { place } = data;

        if (!place || !place.id) {
            return NextResponse.json({ error: '유효하지 않은 장소 데이터입니다' }, { status: 400 });
        }

        // 즐겨찾기에 저장
        favoritesStorage.set(place.id, place);

        return NextResponse.json({ success: true, placeId: place.id });
    } catch (error) {
        console.error('즐겨찾기 저장 오류:', error);
        return NextResponse.json({ error: '즐겨찾기 저장에 실패했습니다' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const placeId = request.nextUrl.searchParams.get('id');

    if (!placeId) {
        return NextResponse.json({ error: '장소 ID가 필요합니다' }, { status: 400 });
    }

    // 즐겨찾기에서 제거
    const existed = favoritesStorage.has(placeId);
    favoritesStorage.delete(placeId);

    return NextResponse.json({ success: true, removed: existed });
}

export async function GET() {
    // 모든 즐겨찾기 반환
    const favorites: Place[] = Array.from(favoritesStorage.values());
    return NextResponse.json({ favorites });
}