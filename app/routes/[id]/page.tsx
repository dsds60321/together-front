// app/routes/[id]/page.tsx
import { Suspense } from 'react';
import SavedRouteDetailClient from "@/app/routes/[id]/SavedRouteDetailClient";

export default async function SavedRouteDetailPage({params}: {
    params: { id: string };
}) {
    const { id } = params;

    return (
        <Suspense
            fallback={
                <div className="flex justify-center items-center min-h-screen">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            }
        >
            <SavedRouteDetailClient id={id} />
        </Suspense>
    );
}