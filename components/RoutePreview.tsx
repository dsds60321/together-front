// components/RoutePreview.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import { Place } from '@/lib/data';

interface RoutePoint extends Place {
    type: 'start' | 'waypoint' | 'end';
}

interface RoutePreviewProps {
    routePoints: RoutePoint[];
}

export function RoutePreview({ routePoints }: RoutePreviewProps) {
    if (routePoints.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                <h2 className="text-lg font-semibold mb-4">경로 미리보기</h2>
                <div className="bg-gray-50 dark:bg-gray-700 p-8 rounded-md text-center">
                    <p className="text-gray-500 dark:text-gray-400">
                        경로를 구성할 장소를 선택해주세요
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold mb-4">경로 미리보기</h2>

            <div className="space-y-6">
                {routePoints.map((point, index) => (
                    <div key={point.id} className="flex flex-col md:flex-row gap-4">
                        {/* 장소 이미지 */}
                        <div className="md:w-1/3 h-44 relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                            {point.image ? (
                                <Image
                                    src={point.image}
                                    alt={point.title}
                                    fill
                                    sizes="(max-width: 768px) 100vw, 33vw"
                                    className="object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-gray-400">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                    </svg>
                                </div>
                            )}

                            {/* 위치 라벨 */}
                            <div className="absolute top-2 left-2 z-10">
                                <div
                                    className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium
                    ${point.type === 'start' ? 'bg-green-500' : point.type === 'end' ? 'bg-red-500' : 'bg-blue-500'}
                  `}
                                >
                                    {point.type === 'start' ? 'S' : point.type === 'end' ? 'E' : (index)}
                                </div>
                            </div>
                        </div>

                        {/* 장소 정보 */}
                        <div className="md:w-2/3 flex flex-col">
                            <h3 className="text-lg font-semibold mb-1">{point.title}</h3>

                            {point.address && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    {point.address}
                                </p>
                            )}

                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-3">
                                {point.description || '설명 없음'}
                            </p>

                            {point.link && (
                                <a
                                    href={point.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:underline text-sm flex items-center mt-auto"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                                    </svg>
                                    블로그 보기
                                </a>
                            )}
                        </div>

                        {/* 화살표 (마지막 항목 제외) */}
                        {index < routePoints.length - 1 && (
                            <div className="flex justify-center py-2">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-400">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
                                </svg>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}