// app/not-found.tsx
import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
            <div className="text-center">
                <h1 className="text-6xl font-bold text-blue-500 mb-4">404</h1>
                <h2 className="text-2xl font-semibold mb-4">페이지를 찾을 수 없습니다</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                    요청하신 페이지가 존재하지 않거나 삭제되었습니다.
                </p>
                <Link
                    href="/"
                    className="px-6 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors"
                >
                    홈으로 돌아가기
                </Link>
            </div>
        </div>
    );
}