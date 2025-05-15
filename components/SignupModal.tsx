// components/SignupModal.tsx
'use client';

import { useState } from 'react';
import { signup, checkUserIdExists } from '@/lib/userApi';

interface SignupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSignupSuccess: () => void;
}

export function SignupModal({ isOpen, onClose, onSignupSuccess }: SignupModalProps) {
    const [userId, setUserId] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [nickname, setNickname] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [isChecking, setIsChecking] = useState(false);
    const [isIdAvailable, setIsIdAvailable] = useState<boolean | null>(null);

    if (!isOpen) return null;

    const checkUserId = async () => {
        if (!userId.trim()) {
            setError('아이디를 입력해주세요.');
            return;
        }

        setIsChecking(true);
        try {
            const exists = await checkUserIdExists(userId);
            console.log('아이디 중복 확인 결과:', exists);
            setIsIdAvailable(!exists);
            setError(exists ? '이미 사용 중인 아이디입니다.' : '');
        } catch (e) {
            setError('아이디 중복 확인에 실패했습니다.');
        } finally {
            setIsChecking(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!userId || !password || !confirmPassword || !nickname || !email) {
            setError('모든 필드를 입력해주세요.');
            return;
        }

        if (password !== confirmPassword) {
            setError('비밀번호가 일치하지 않습니다.');
            return;
        }

        if (isIdAvailable !== true) {
            setError('아이디 중복 확인을 해주세요.');
            return;
        }

        try {
            const result = await signup({
                userId,
                password,
                nickname,
                email
            });

            if (result.success) {
                onSignupSuccess();
                onClose();
            } else {
                setError(result.message || '회원가입에 실패했습니다.');
            }
        } catch (e) {
            setError('회원가입 중 오류가 발생했습니다.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">회원가입</h2>

                {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">아이디</label>
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                value={userId}
                                onChange={(e) => {
                                    setUserId(e.target.value);
                                    setIsIdAvailable(null);
                                }}
                                className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
                                placeholder="아이디"
                            />
                            <button
                                type="button"
                                onClick={checkUserId}
                                disabled={isChecking}
                                className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 text-sm"
                            >
                                {isChecking ? '확인 중...' : '확인'}
                            </button>
                        </div>
                        {isIdAvailable === true && (
                            <p className="text-green-500 text-sm mt-1">사용 가능한 아이디입니다.</p>
                        )}
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">비밀번호</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
                            placeholder="비밀번호"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">비밀번호 확인</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
                            placeholder="비밀번호 확인"
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">닉네임</label>
                        <input
                            type="text"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
                            placeholder="닉네임"
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-1">이메일</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
                            placeholder="이메일"
                        />
                    </div>

                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            가입하기
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}