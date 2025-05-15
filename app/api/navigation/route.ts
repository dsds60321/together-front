// app/api/navigation/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { navigationType, routePoints } = body;

        // 경로 포인트가 없는 경우
        if (!routePoints || routePoints.length === 0) {
            return NextResponse.json({ error: '경로 포인트가 필요합니다.' }, { status: 400 });
        }

        // 네이버 지도 URL 생성
        if (navigationType === 'naver') {
            const uri = createNaverMapUri(routePoints);
            return NextResponse.json({ uri });
        }

        // T맵 URL 생성
        if (navigationType === 'tmap') {
            const uri = createTmapUri(routePoints);
            return NextResponse.json({ uri });
        }

        return NextResponse.json({ error: '지원하지 않는 내비게이션 유형입니다.' }, { status: 400 });
    } catch (error) {
        console.error('내비게이션 URL 생성 오류:', error);
        return NextResponse.json({ error: '내비게이션 URL 생성 중 오류가 발생했습니다.' }, { status: 500 });
    }
}

// 네이버 지도 URL 생성 함수
function createNaverMapUri(routePoints: any[]) {
    // 시작, 경유지, 도착지 분리
    const start = routePoints.find(point => point.type === 'start');
    const waypoints = routePoints.filter(point => point.type === 'waypoint');
    const end = routePoints.find(point => point.type === 'end') ||
        (routePoints.length > 1 ? routePoints[routePoints.length - 1] : null);

    // 기본 URL
    let url = 'nmap://route/public?';

    // 파라미터 추가
    const params = [];

    // 시작점 추가
    if (start) {
        params.push(`slat=${start.mapy}&slng=${start.mapx}&sname=${encodeURIComponent(start.title)}`);
    }

    // 도착점 추가
    if (end && end !== start) {
        params.push(`dlat=${end.mapy}&dlng=${end.mapx}&dname=${encodeURIComponent(end.title)}`);
    }

    // 경유지 추가
    if (waypoints.length > 0) {
        const waypointParam = waypoints.map((wp, index) =>
            `wp${index + 1}lat=${wp.mapy}&wp${index + 1}lng=${wp.mapx}&wp${index + 1}name=${encodeURIComponent(wp.title)}`
        ).join('&');

        params.push(waypointParam);
    }

    // 모드 추가 (자동차 네비게이션)
    params.push('mode=car');

    // URL 완성
    url += params.join('&');

    return url;
}

// T맵 URL 생성 함수
function createTmapUri(routePoints: any[]) {
    // 시작, 경유지, 도착지 분리
    const start = routePoints.find(point => point.type === 'start');
    const waypoints = routePoints.filter(point => point.type === 'waypoint');
    const end = routePoints.find(point => point.type === 'end') ||
        (routePoints.length > 1 ? routePoints[routePoints.length - 1] : null);

    // 기본 URL (T맵 스키마 URL)
    let url = 'tmap://route?';

    // 파라미터 추가
    const params = [];

    // 시작점 추가
    if (start) {
        params.push(`startx=${start.mapx}&starty=${start.mapy}&startname=${encodeURIComponent(start.title)}`);
    }

    // 도착점 추가
    if (end && end !== start) {
        params.push(`endx=${end.mapx}&endy=${end.mapy}&endname=${encodeURIComponent(end.title)}`);
    }

    // 경유지 추가 (T맵은 경유지 최대 5개까지만 지원)
    if (waypoints.length > 0) {
        // T맵은 경유지 수가 제한되어 있으므로 최대 5개만 사용
        const limitedWaypoints = waypoints.slice(0, 5);

        limitedWaypoints.forEach((wp, index) => {
            params.push(`passx${index + 1}=${wp.mapx}&passy${index + 1}=${wp.mapy}&passname${index + 1}=${encodeURIComponent(wp.title)}`);
        });
    }

    // URL 완성
    url += params.join('&');

    return url;
}