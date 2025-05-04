// components/Search.tsx
'use client';

import { useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { searchBlogPosts, BlogItem } from '@/lib/api';

interface SearchProps {
  onSearch: (query: string, results?: BlogItem[]) => void;
  initialQuery?: string;
}

// Ref로 노출할 메서드 정의
export interface SearchRef {
  setValue: (value: string) => void;
  focus: () => void;
}

export const Search = forwardRef<SearchRef, SearchProps>(({ onSearch, initialQuery = '' }, ref) => {
  const [query, setQuery] = useState(initialQuery);
  const [isLoading, setIsLoading] = useState(false);

  // Ref 메서드 노출
  useImperativeHandle(ref, () => ({
    setValue: (value: string) => {
      setQuery(value);
    },
    focus: () => {
      const inputElement = document.querySelector('input[type="search"]') as HTMLInputElement;
      if (inputElement) {
        inputElement.focus();
      }
    }
  }));

  // API 요청 함수
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      onSearch('');
      return;
    }

    setIsLoading(true);
    try {
      const response = await searchBlogPosts(searchQuery, 1, 9);
      onSearch(searchQuery, response.items);
    } catch (error) {
      console.error('검색 처리 오류:', error);
      onSearch(searchQuery, []);
    } finally {
      setIsLoading(false);
    }
  }, [onSearch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

  return (
      <form onSubmit={handleSubmit} className="relative">
        <input
            type="search"
            value={query}
            onChange={handleInputChange}
            placeholder="장소를 검색하세요..."
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
        />
        <button
            type="submit"
            className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${isLoading ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400'}`}
            aria-label="검색"
            disabled={isLoading}
        >
          {isLoading ? (
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
          ) : (
              <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
              >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
          )}
        </button>
      </form>
  );
});

Search.displayName = 'Search';