// app/route/[id]/page.tsx
import { Suspense } from 'react';
import RoutePageClient from './RoutePageClient';

export default async function RoutePage({params}: {
    params: Promise<{ id: string }>;
}) {
    // Promise에서 params 해결
    const { id } = await params;

    // 클라이언트 컴포넌트를 반환
    return (
        <Suspense
            fallback={
                <div className="flex justify-center items-center min-h-screen">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            }
        >
            <RoutePageClient id={id} />
        </Suspense>
    );
}