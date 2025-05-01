import { NextRequest, NextResponse } from 'next/server';

// 임시 검색 결과를 위한 더미 데이터
const dummyPlaces = [
    {
        id: 'place1',
        title: '서울 타워',
        description: '서울의 대표적인 랜드마크',
        image: 'https://via.placeholder.com/300x200?text=Seoul+Tower',
        link: 'https://example.com/seoul-tower',
        bloggerName: '서울여행'
    },
    {
        id: 'place2',
        title: '경복궁',
        description: '조선시대 정궁',
        image: 'https://via.placeholder.com/300x200?text=Gyeongbokgung',
        link: 'https://example.com/gyeongbokgung',
        bloggerName: '역사탐방'
    },
    {
        id: 'place3',
        title: '한강공원',
        description: '서울 한강변 공원',
        image: 'https://via.placeholder.com/300x200?text=Han+River+Park',
        link: 'https://example.com/hangang',
        bloggerName: '서울나들이'
    }
];

export async function GET(request: NextRequest) {
    const query = request.nextUrl.searchParams.get('query');

    if (!query) {
        return NextResponse.json({ places: [] });
    }

    // 실제로는 DB 검색 로직이 들어갈 부분
    // 여기서는 간단히 필터링하는 로직 구현
    const filteredPlaces = dummyPlaces.filter(place =>
        place.title.includes(query) || place.description.includes(query)
    );

    // 검색 결과 반환
    return NextResponse.json({ places: filteredPlaces });
}