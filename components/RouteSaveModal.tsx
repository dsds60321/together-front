// components/RouteSaveModal.tsx
import { useState, useRef, useEffect } from 'react';

interface RouteSaveModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (routeName: string) => void;
    isLoading: boolean;
    routePointsCount: number;
    defaultName: string;
}

export function RouteSaveModal({
                                   isOpen,
                                   onClose,
                                   onSave,
                                   isLoading,
                                   routePointsCount,
                                   defaultName = ''
                               }: RouteSaveModalProps) {
    const [routeName, setRouteName] = useState(defaultName);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }

        // 모달이 열릴 때 기본 경로명 설정
        if (isOpen && defaultName) {
            setRouteName(defaultName);
        }
    }, [isOpen, defaultName]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!routeName.trim()) {
            alert('경로 이름을 입력해주세요.');
            return;
        }

        onSave(routeName.trim());
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full">
                <div className="p-6">
                    <h2 className="text-xl font-semibold mb-4">경로 저장</h2>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label htmlFor="routeName" className="block text-sm font-medium mb-1">
                                경로 이름
                            </label>
                            <input
                                ref={inputRef}
                                id="routeName"
                                type="text"
                                className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                                value={routeName}
                                onChange={(e) => setRouteName(e.target.value)}
                                placeholder="경로 이름을 입력하세요"
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {routePointsCount}개의 장소가 포함된 경로를 저장합니다.
                            </p>
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 dark:text-gray-300 dark:border-gray-600"
                                disabled={isLoading}
                            >
                                취소
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-70"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <span className="flex items-center">
                    <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    저장 중...
                  </span>
                                ) : '저장하기'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}