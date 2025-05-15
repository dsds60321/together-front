// components/UserProfileDropdown.tsx
'use client';

import { useUser } from '@/context/userContext';
import { useState, useRef, useEffect } from 'react';

export function UserProfileDropdown() {
    const { user, setUser } = useUser();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleLogout = () => {
        setUser(null);
        setIsOpen(false);
    };

    // 다른 곳을 클릭했을 때 드롭다운 닫기
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    if (!user) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-1 text-sm font-medium hover:opacity-80"
            >
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                    {user.nickname.charAt(0)}
                </div>
                <span className="hidden md:inline">{user.userId}</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg z-20 overflow-hidden">
                    <div className="p-4 border-b dark:border-gray-700">
                        <div className="flex items-center mb-2">
                            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white mr-3">
                                {user.nickname.charAt(0)}
                            </div>
                            <div>
                                <p className="font-medium">{user.nickname}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{user.userId}</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{user.email}</p>
                    </div>
                    <div className="p-2">
                        <button
                            onClick={handleLogout}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-5 h-5 mr-2"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
                                />
                            </svg>
                            로그아웃
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}