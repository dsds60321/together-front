import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
    // URL 파라미터에서 이미지 URL 가져오기
    const url = request.nextUrl.searchParams.get('url');

    if (!url) {
        return new NextResponse('이미지 URL이 필요합니다', { status: 400 });
    }

    try {
        // 적절한 헤더 설정
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Referer': 'https://blog.naver.com/',
                'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
                'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
                'Cache-Control': 'no-cache'
            },
            responseType: 'arraybuffer'
        });

        // 이미지 데이터를 바이너리로 반환
        const buffer = Buffer.from(response.data, 'binary');

        // 이미지 타입에 맞는 Content-Type 설정
        let contentType = 'image/jpeg'; // 기본값

        if (url.endsWith('.png') || url.includes('type=png')) {
            contentType = 'image/png';
        } else if (url.endsWith('.gif') || url.includes('type=gif')) {
            contentType = 'image/gif';
        } else if (url.endsWith('.webp') || url.includes('type=webp')) {
            contentType = 'image/webp';
        }

        // 이미지 데이터 반환
        return new NextResponse(buffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400' // 24시간 캐싱
            }
        });
    } catch (error) {
        console.error('이미지 프록시 오류:', error);
        return new NextResponse('이미지를 가져오는 데 실패했습니다', { status: 500 });
    }
}