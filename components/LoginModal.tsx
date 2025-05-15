// components/LoginModal.tsx
'use client';

import { useState } from 'react';
import { login } from '@/lib/userApi';
import { useUser } from '@/context/userContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignupClick: () => void;
}

export function LoginModal({ isOpen, onClose, onSignupClick }: LoginModalProps) {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setUser } = useUser();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId || !password) {
      setError('아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await login(userId, password);

      if (result.success && result.user) {
        setUser(result.user);
        onClose();
      } else {
        setError(result.message || '로그인에 실패했습니다.');
      }
    } catch (e) {
      setError('로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">로그인</h2>

        {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">아이디</label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
              placeholder="아이디"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
              placeholder="비밀번호"
            />
          </div>

          <div className="flex flex-col space-y-3">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </button>

            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={onClose}
                className="text-sm text-gray-600 dark:text-gray-400 hover:underline"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSignupClick();
                }}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                회원가입하기
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}