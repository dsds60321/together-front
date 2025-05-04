// components/RoutePointItem.tsx
'use client';

import { Draggable } from '@hello-pangea/dnd';
import { Place } from './Card';

interface RoutePoint extends Place {
    type: 'start' | 'waypoint' | 'end';
}

interface RoutePointItemProps {
    point: RoutePoint;
    index: number;
    onRemove: (id: string) => void;
}

export function RoutePointItem({ point, index, onRemove }: RoutePointItemProps) {
    return (
        <Draggable key={point.id} draggableId={point.id} index={index}>
            {(provided) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md flex items-center"
                >
                    <div className="mr-2">
                        {point.type === 'start' ? (
                            <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs">
                                S
                            </div>
                        ) : point.type === 'end' ? (
                            <div className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs">
                                E
                            </div>
                        ) : (
                            <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs">
                                {index}
                            </div>
                        )}
                    </div>
                    <div className="flex-1 ml-1">
                        <div className="text-sm font-medium line-clamp-1" dangerouslySetInnerHTML={{ __html: point.title }}></div>
                    </div>
                    <button
                        onClick={() => onRemove(point.id)}
                        className="text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 ml-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}
        </Draggable>
    );
}