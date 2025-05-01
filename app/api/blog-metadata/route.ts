import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

// 이미지 URL이 상대 경로일 경우 절대 경로로 변환
function convertToAbsoluteUrl(baseUrl: string, relativeUrl: string): string {
    if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
        return relativeUrl;
    }

    try {
        const url = new URL(baseUrl);
        if (relativeUrl.startsWith('/')) {
            return `${url.protocol}//${url.host}${relativeUrl}`;
        } else {
            // 현재 경로에 상대 경로 추가
            const pathParts = url.pathname.split('/').filter(Boolean);
            pathParts.pop(); // 마지막 파일명 제거
            return `${url.protocol}//${url.host}/${pathParts.join('/')}/${relativeUrl}`;
        }
    } catch (error) {
        return relativeUrl;
    }
}

// 네이버 블로그의 실제 iframe URL 추출
async function getNaverBlogIframeUrl(url: string): Promise<string | null> {
    try {
        // 블로그 메인 페이지 요청
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Referer': 'https://blog.naver.com/'
            }
        });

        // iframe 찾기
        const $ = cheerio.load(response.data);
        const mainFrame = $('#mainFrame');

        if (mainFrame.length > 0) {
            const iframeSrc = mainFrame.attr('src');
            if (iframeSrc) {
                return `https://blog.naver.com${iframeSrc}`;
            }
        }

        return null;
    } catch (error) {
        console.error('네이버 블로그 iframe URL 추출 실패:', error);
        return null;
    }
}

// 네이버 블로그에서 og:image 값 추출
async function extractNaverBlogOgImage(url: string): Promise<string | null> {
    try {
        // 네이버 블로그 체크
        if (!url.includes('blog.naver.com')) {
            return null;
        }

        // 1. 메인 페이지에서 iframe URL 추출
        const iframeUrl = await getNaverBlogIframeUrl(url);
        if (!iframeUrl) {
            console.log('iframe URL을 찾을 수 없음');
            return null;
        }

        console.log('추출된 iframe URL:', iframeUrl);

        // 2. iframe 내부 HTML 가져오기
        const iframeResponse = await axios.get(iframeUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Referer': url
            }
        });

        // 3. iframe 내부 HTML에서 og:image 추출
        const $iframe = cheerio.load(iframeResponse.data);
        const ogImage = $iframe('meta[property="og:image"]').attr('content');

        if (ogImage) {
            console.log('iframe 내부에서 og:image 찾음:', ogImage);
            return convertToAbsoluteUrl(iframeUrl, ogImage);
        }

        return null;
    } catch (error) {
        console.error('네이버 블로그 iframe og:image 추출 실패:', error);
        return null;
    }
}

// 일반 웹사이트에서 og:image 값 추출
async function extractRegularOgImage(url: string): Promise<string | null> {
    try {
        // 요청에 사용할 헤더
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml',
            'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
            'Cache-Control': 'no-cache',
            'Referer': 'https://search.naver.com/'
        };

        // HTML 페이지 요청
        const response = await axios.get(url, { headers });
        const $ = cheerio.load(response.data);

        // meta[property="og:image"] 태그 찾기
        const ogImage = $('meta[property="og:image"]').attr('content');

        if (ogImage) {
            return convertToAbsoluteUrl(url, ogImage);
        }

        return null;
    } catch (error) {
        console.error('일반 og:image 추출 실패:', error);
        return null;
    }
}

export async function GET(request: NextRequest) {
    const url = request.nextUrl.searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    console.log('블로그 메타데이터 요청 URL:', url);

    try {
        // 기본 HTTP 요청 헤더
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml',
            'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
            'Cache-Control': 'no-cache',
            'Referer': 'https://search.naver.com/'
        };

        // HTML 가져오기
        const response = await axios.get(url, { headers });
        const $ = cheerio.load(response.data);

        // 네이버 블로그인지 확인
        const isNaverBlog = url.includes('blog.naver.com');
        let ogImage = null;

        // 네이버 블로그일 경우 iframe 내부에서 og:image 추출
        if (isNaverBlog) {
            console.log('네이버 블로그 감지: iframe에서 og:image 추출 시도');
            ogImage = await extractNaverBlogOgImage(url);
        } else {
            // 일반 웹사이트에서 og:image 추출
            ogImage = await extractRegularOgImage(url);
        }

        // 메타데이터 정보 (이미지는 무조건 og:image만 사용)
        const metadata = {
            title: $('meta[property="og:title"]').attr('content') || $('title').text() || '',
            description: $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '',
            image: ogImage || '', // og:image 값만 사용
            siteName: $('meta[property="og:site_name"]').attr('content') || '',
            url: url
        };

        console.log('추출된 메타데이터:', metadata);

        return NextResponse.json(metadata);
    } catch (error) {
        console.error('블로그 메타데이터 가져오기 실패:', error);
        return NextResponse.json({
            error: '메타데이터 가져오기 실패',
            details: error instanceof Error ? error.message : '알 수 없는 오류'
        }, { status: 500 });
    }
}