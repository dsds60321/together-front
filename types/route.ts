// types/route.ts
import { Place } from '@/components/Card';

export interface RoutePoint extends Place {
    type: 'start' | 'waypoint' | 'end';
}

export interface SavedRoute {
    id: string;
    name: string;
    points: RoutePoint[];
    naverUri: string;
    tmapUri: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
}