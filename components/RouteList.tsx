// components/RouteList.tsx
'use client';

import {DragDropContext, Droppable} from '@hello-pangea/dnd';
import {CustomPlaceForm} from './CustomPlaceForm';
import {RoutePointItem} from './RoutePointItem';
import {Place} from './Card';

interface RoutePoint extends Place {
    type: 'start' | 'waypoint' | 'end';
}

interface RouteListProps {
    routePoints: RoutePoint[];
    onReorder: (newOrder: RoutePoint[]) => void;
    onRemovePoint: (id: string) => void;
    onLaunchNav: () => void;
    onViewMap: () => void;
    navLoading: boolean;
    saveLoading?: boolean;
    onAddPlace: (place: Place) => void;
    onSaveRoute: () => void;
}

export function RouteList({
                              routePoints,
                              onReorder,
                              onRemovePoint,
                              onLaunchNav,
                              onViewMap,
                              navLoading,
                              saveLoading = false,
                              onAddPlace,
                              onSaveRoute
                          }: RouteListProps) {
    // 드래그 앤 드롭 처리
    const handleDragEnd = (result: any) => {
        if (!result.destination) return;

        const items = Array.from(routePoints);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        // 순서에 따라 타입 다시 할당
        const updatedItems = items.map((item, index) => {
            let type: 'start' | 'waypoint' | 'end' = 'waypoint';
            if (index === 0) type = 'start';
            if (index === items.length - 1 && items.length > 1) type = 'end';
            return { ...item, type };
        });

        onReorder(updatedItems);
    };

    return (
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold mb-4">경로 목록</h2>

            {/* 직접 장소 검색 폼 - 현재 경로 포인트 전달 */}
            <CustomPlaceForm onAddPlace={onAddPlace} routePoints={routePoints} />

            <div className="h-px w-full bg-gray-200 dark:bg-gray-700 my-4"></div>

            {routePoints.length === 0 ? (
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md text-center">
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                        장소를 검색하여 경로를 추가하세요
                    </p>
                </div>
            ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="droppable-route">
                        {(provided) => (
                            <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className="space-y-2"
                            >
                                {routePoints.map((point, index) => (
                                    <RoutePointItem
                                        key={point.id}
                                        point={point}
                                        index={index}
                                        onRemove={onRemovePoint}
                                    />
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
            )}

            {routePoints.length >= 1 && (
                <div className="mt-6 space-y-3">
                    <button
                        onClick={onLaunchNav}
                        className="btn-primary w-full flex items-center justify-center"
                        disabled={navLoading}
                    >
                        {navLoading ? (
                            <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                처리 중
              </span>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                                </svg>
                                T맵으로 내비게이션
                            </>
                        )}
                    </button>

                    <button
                        onClick={onViewMap}
                        className="btn-secondary w-full flex items-center justify-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                        </svg>
                        네이버 지도로 보기
                    </button>

                    {/* 경로 저장하기 버튼 추가 */}
                    <button
                        onClick={onSaveRoute}
                        className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded flex items-center justify-center w-full"
                        disabled={saveLoading}
                    >
                        {saveLoading ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                저장 중
                            </span>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                                </svg>
                                경로 저장하기
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}