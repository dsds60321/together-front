// lib/userApi.ts
import apiClient from './api';

interface User {
    userId: string;
    nickname: string;
    email: string;
}

interface SignupData {
    userId: string;
    password: string;
    nickname: string;
    email: string;
}

interface AuthResponse {
    success: boolean;
    message?: string;
    user?: User;
}

// Axios 인스턴스를 사용하는 API 클라이언트
const userApiClient = {
    // 회원가입 함수
    async signup(userData: SignupData): Promise<{ success: boolean; message?: string }> {
        try {
            const response = await apiClient.post('/users', {
                ...userData,
                csrf: "example-csrf-token" // 실제 구현에서는 서버에서 제공하는 CSRF 토큰을 사용해야 합니다
            });

            return { success: true };
        } catch (error: any) {
            console.error('회원가입 오류:', error);

            // Axios 오류 처리
            if (error.response) {
                // 서버가 응답을 반환했으나 오류 상태 코드가 있는 경우
                const errorMessage = error.response.data?.message || '회원가입에 실패했습니다.';
                return { success: false, message: errorMessage };
            } else if (error.request) {
                // 요청이 전송되었지만 응답을 받지 못한 경우
                return { success: false, message: '서버로부터 응답이 없습니다.' };
            } else {
                // 요청 설정 중 오류가 발생한 경우
                return { success: false, message: '서버 연결에 실패했습니다.' };
            }
        }
    },

    // 아이디 중복 확인 함수
    async checkUserIdExists(userId: string): Promise<boolean> {
        try {
            const { data } = await apiClient.get(`/users?userId=${userId}`)
            return !data.success;
        } catch (error: any) {
            // 사용자를 찾을 수 없는 경우 (404 오류) -> 사용 가능한 아이디
            if (error.response && error.response.status === 404) {
                return false;
            }

            // 그 외 오류는 예외 발생
            console.error('아이디 중복 확인 오류:', error);
            throw new Error('서버 연결에 실패했습니다.');
        }
    },

    // 로그인 함수
    async login(userId: string, password: string): Promise<{ success: boolean; user?: User; message?: string }> {
        try {
            // 로그인 엔드포인트로 POST 요청 보내기
            const response = await apiClient.post('/login', {
                userId,
                password
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            // 응답 데이터 처리
            const responseData = response.data;

            if (responseData.success) {
                // 서버에서 받은 사용자 데이터
                const userData = responseData.data;

                // 로컬 스토리지에 토큰 저장
                if (userData.token) {
                    localStorage.setItem('token', userData.token);
                }

                // 사용자 정보 반환
                return {
                    success: true,
                    user: {
                        userId: userData.userId,
                        nickname: userData.nickname,
                        email: userData.email
                        // grade 필드는 응답에 있지만 User 인터페이스에 없으므로 제외
                    }
                };
            } else {
                // 응답은 성공적으로 받았지만 로그인에 실패한 경우
                return {
                    success: false,
                    message: responseData.message || '로그인에 실패했습니다.'
                };
            }
        } catch (error: any) {
            console.error('로그인 오류:', error);

            if (error.response) {
                // 서버가 응답을 반환했으나 오류 상태 코드가 있는 경우
                if (error.response.status === 401) {
                    return { success: false, message: '아이디 또는 비밀번호가 일치하지 않습니다.' };
                } else if (error.response.status === 404) {
                    return { success: false, message: '사용자를 찾을 수 없습니다.' };
                }
                return { success: false, message: error.response.data?.message || '로그인에 실패했습니다.' };
            } else if (error.request) {
                // 요청이 전송되었지만 응답을 받지 못한 경우
                return { success: false, message: '서버로부터 응답이 없습니다.' };
            } else {
                // 요청 설정 중 오류가 발생한 경우
                return { success: false, message: '서버 연결에 실패했습니다.' };
            }
        }
    },

    // 로그아웃 함수 (클라이언트에서만 처리하는 경우)
    async logout(): Promise<{ success: boolean }> {
        // 실제 구현에서는 서버에 로그아웃 요청을 보내 토큰을 무효화해야 할 수 있습니다
        try {
            // 여기서는 클라이언트 측 로그아웃만 처리한다고 가정합니다
            return { success: true };
        } catch (error) {
            console.error('로그아웃 오류:', error);
            return { success: false };
        }
    },

    // 현재 사용자 정보 가져오기 (인증 토큰 기반)
    async getCurrentUser(): Promise<User | null> {
        try {
            // 실제 구현에서는 저장된 토큰을 사용하여 사용자 정보를 가져오는 API 호출이 있을 것입니다
            const response = await apiClient.get('/users/me');
            return response.data;
        } catch (error) {
            console.error('사용자 정보 가져오기 오류:', error);
            return null;
        }
    }
};

// 편의를 위해 함수를 개별적으로 export
export const { signup, checkUserIdExists, login, logout, getCurrentUser } = userApiClient;

// 기본 export로 전체 객체 export
export default userApiClient;