// components/CustomPlaceForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Place } from './Card';
import { searchLocals } from "@/lib/api";

// 검색 결과 장소 인터페이스
interface SearchResultPlace {
    id: string;
    title: string;
    category?: string;
    description?: string;
    telephone?: string;
    address?: string;
    roadAddress?: string;
    mapx?: string;
    mapy?: string;
    isDuplicate?: boolean; // 속성 추가
}

interface CustomPlaceFormProps {
    onAddPlace?: (place: Place) => void;
    routePoints?: Place[]; // 현재 경로에 포함된 장소 배열을 prop으로 받기
}

export function CustomPlaceForm({ onAddPlace, routePoints = [] }: CustomPlaceFormProps) {
    const [customPlaceName, setCustomPlaceName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [searchResults, setSearchResults] = useState<SearchResultPlace[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 장소가 이미 경로에 존재하는지 확인
    const isPlaceAlreadyAdded = (place: SearchResultPlace): boolean => {
        // 좌표와 이름으로 중복 체크
        return routePoints.some(existingPlace => {
            // 좌표가 있는 경우 mapx, mapy 비교
            if (place.mapx && place.mapy && existingPlace.mapx && existingPlace.mapy) {
                return (
                    place.mapx === existingPlace.mapx &&
                    place.mapy === existingPlace.mapy
                );
            }
            // 좌표가 없는 경우 title로 비교 (HTML 태그 제거 후)
            const placeTitle = place.title.replace(/<\/?[^>]+(>|$)/g, '');
            const existingTitle = existingPlace.title.replace(/<\/?[^>]+(>|$)/g, '');
            return placeTitle === existingTitle;
        });
    };

    // 모달이 열리고 닫힐 때 body 스크롤 제어
    useEffect(() => {
        if (showModal) {
            // 모달이 열릴 때 body 스크롤 비활성화
            document.body.style.overflow = 'hidden';
            // 현재 스크롤 위치 저장
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
            document.body.style.top = `-${window.scrollY}px`;
        } else {
            // 모달이 닫힐 때 body 스크롤 활성화 및 스크롤 위치 복원
            const scrollY = document.body.style.top;
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
            document.body.style.top = '';
            window.scrollTo(0, parseInt(scrollY || '0') * -1);
        }

        // 컴포넌트가 언마운트될 때 스크롤 복원
        return () => {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.width = '';
            document.body.style.top = '';
        };
    }, [showModal]);

    // 장소 검색 API 호출
    const searchPlace = async (placeName: string) => {
        if (!placeName.trim()) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await searchLocals(placeName);

            if (response.items && response.items.length > 0) {
                // 검색 결과가 있을 때 모달 표시 및 결과 설정
                // 각 검색 결과에 중복 여부 표시
                const resultsWithDuplicateFlag = response.items.map(item => ({
                    ...item,
                    isDuplicate: isPlaceAlreadyAdded(item)
                }));

                setSearchResults(resultsWithDuplicateFlag);
                setShowModal(true);
            } else {
                setError('검색 결과가 없습니다. 다른 키워드로 검색해 보세요.');
            }
        } catch (error) {
            console.error('장소 검색 오류:', error);
            setError('장소 검색 중 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    // 검색 결과에서 장소 선택 처리
    const handleSelectPlace = (place: SearchResultPlace & { isDuplicate?: boolean }) => {
        if (onAddPlace) {
            // 중복 확인
            if (place.isDuplicate) {
                alert('이미 경로에 추가된 장소입니다.');
                return;
            }

            const selectedPlace: Place = {
                id: place.id || `custom-${uuidv4()}`,
                title: place.title.replace(/<\/?[^>]+(>|$)/g, ''), // HTML 태그 제거
                description: place.category || '사용자 지정 장소',
                // 네비게이션용 추가 정보 저장
                mapx: place.mapx,
                mapy: place.mapy,
                address: place.address,
                roadAddress: place.roadAddress,
            };

            // 장소를 경로에 추가
            onAddPlace(selectedPlace);

            // 폼 초기화 및 모달 닫기
            setCustomPlaceName('');
            setShowModal(false);
        }
    };

    // 모달 닫기 핸들러
    const closeModal = () => {
        setShowModal(false);
    };

    // 모달 백그라운드 클릭시 닫기 방지 (모달 내부에서만 닫기 가능)
    const handleModalBackgroundClick = (e: React.MouseEvent) => {
        // 모달 배경 클릭 시에만 닫힘 방지 (버블링 방지)
        e.stopPropagation();
    };

    // 폼 제출 핸들러
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        searchPlace(customPlaceName);
    };

    return (
        <div className="mb-4">
            <form onSubmit={handleSubmit} className="flex flex-col">
                <label className="text-sm mb-1 text-gray-600 dark:text-gray-300">
                    장소 검색
                </label>
                <div className="flex">
                    <input
                        type="text"
                        value={customPlaceName}
                        onChange={(e) => setCustomPlaceName(e.target.value)}
                        placeholder="장소 이름을 입력하세요"
                        className="flex-1 border rounded-l-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600"
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-r-md text-sm"
                        disabled={!customPlaceName.trim() || isLoading}
                    >
                        {isLoading ? (
                            <span className="flex items-center">
                                <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                검색 중
                            </span>
                        ) : (
                            '검색'
                        )}
                    </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    *정확한 장소명을 입력해주세요.
                </p>
                {error && (
                    <p className="text-xs text-red-500 mt-1">{error}</p>
                )}
            </form>

            {/* 장소 선택 모달 */}
            {showModal && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    onClick={closeModal} // 배경 클릭시 모달 닫기
                >
                    <div
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden"
                        onClick={handleModalBackgroundClick} // 모달 내부 클릭 시 이벤트 전파 방지
                    >
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                            <h3 className="text-lg font-semibold">장소 선택</h3>
                            <button
                                onClick={closeModal}
                                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                "{customPlaceName}" 검색 결과입니다. 원하는 장소를 선택하면 경로에 추가됩니다.
                            </p>
                        </div>

                        <div className="overflow-y-auto max-h-[60vh] px-4">
                            {searchResults.length > 0 ? (
                                searchResults.map((place) => (
                                    <div
                                        key={place.id || uuidv4()}
                                        className={`p-3 border-b border-gray-100 dark:border-gray-700 flex items-center ${
                                            place.isDuplicate
                                                ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed'
                                                : 'hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer'
                                        }`}
                                        onClick={() => !place.isDuplicate && handleSelectPlace(place)}
                                    >
                                        <div className="flex-1">
                                            <h4 className="font-medium" dangerouslySetInnerHTML={{ __html: place.title }}></h4>
                                            {place.category && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{place.category}</p>
                                            )}
                                            {place.roadAddress && (
                                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{place.roadAddress}</p>
                                            )}
                                            {place.address && !place.roadAddress && (
                                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{place.address}</p>
                                            )}
                                            {place.isDuplicate && (
                                                <p className="text-xs text-red-500 mt-1">이미 경로에 추가된 장소입니다</p>
                                            )}
                                        </div>
                                        <button
                                            className={`ml-2 p-2 ${
                                                place.isDuplicate
                                                    ? 'text-gray-400 cursor-not-allowed'
                                                    : 'text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300'
                                            }`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (!place.isDuplicate) {
                                                    handleSelectPlace(place);
                                                }
                                            }}
                                            disabled={place.isDuplicate}
                                        >
                                            {place.isDuplicate ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center py-4 text-gray-500 dark:text-gray-400">
                                    검색 결과가 없습니다.
                                </p>
                            )}
                        </div>

                        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                            <button
                                onClick={closeModal}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md text-gray-700 dark:text-gray-300 text-sm"
                            >
                                취소
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}