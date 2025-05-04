// utils.ts 파일에 유틸리티 함수 추가 (또는 lib 폴더 내 적절한 위치)
export const isMobileDevice = (): boolean => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const checkMobileAndAlert = (appName: string): boolean => {
    if (!isMobileDevice()) {
        alert(`${appName}은(는) 모바일 기기에서만 열 수 있습니다.`);
        return false;
    }
    return true;
};

// 좌표 변환 유틸리티 함수
export const convertCoordinate = (coord: string): number => parseFloat(coord) / 10000000;