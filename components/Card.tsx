'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';

export interface Place {
  id: string;
  title: string;
  description: string;
  image?: string;
  link?: string;
  bloggerName?: string;
}

interface CardProps {
  place: Place;
  onSelect?: (place: Place) => void;
}

export function Card({ place, onSelect }: CardProps) {
  const [isSelected, setIsSelected] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 대체 이미지 URL
  const fallbackImage = 'https://via.placeholder.com/300x200?text=No+Image';

  // 이미지 URL이 있는지 확인
  const hasImage = place.image && place.image.trim() !== '';

  const handleCardClick = () => {
    setIsSelected(!isSelected);
    // 선택 상태가 변경될 때 onSelect 콜백 호출
    if (onSelect && !isSelected) {
      onSelect(place);
    }
  };

  const handleLinkClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // 카드 선택 이벤트 중지
    setIsLoading(true);

    try {
      // 백엔드에 장소 정보 전송
      await axios.post('/api/places', { place });
      console.log('장소 정보가 서버에 저장되었습니다:', place.id);
    } catch (error) {
      console.error('장소 정보 저장 실패:', error);
      // 오류 발생 시 사용자에게 알림 가능
      alert('경로 정보를 저장하는 중 오류가 발생했습니다. 다시 시도해주세요.');
      e.preventDefault(); // 링크 이동 취소
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageError = () => {
    console.error('이미지 로딩 실패:', place.image);
    setImageError(true);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  // 블로그 링크 공유 함수
  const handleShareBlog = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!place.link) return;

    setShareLoading(true);

    try {
      if (navigator.share) {
        // Web Share API 사용 (모바일 기기에서 주로 지원)
        await navigator.share({
          title: place.title,
          text: place.description,
          url: place.link
        });
      } else {
        // 클립보드에 복사 (데스크톱 등에서 폴백)
        await navigator.clipboard.writeText(place.link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      console.error('공유 오류:', error);
    } finally {
      setShareLoading(false);
    }
  };

  // 이미지 프록시 URL 생성
  const getProxyImageUrl = (url: string) => {
    // 네이버 블로그 이미지인지 확인
    if (url.includes('blogthumb.pstatic.net') || url.includes('pstatic.net')) {
      // 프록시 API를 통해 이미지 로드
      return `/api/image-proxy?url=${encodeURIComponent(url)}`;
    }
    return url;
  };

  // https로 URL 전환 (http 이미지일 경우 문제 해결)
  const convertToHttps = (url: string) => {
    if (url && url.startsWith('http://')) {
      return url.replace('http://', 'https://');
    }
    return url;
  };

  // 안전한 이미지 URL
  const safeImageUrl = hasImage
      ? getProxyImageUrl(convertToHttps(place.image!))
      : fallbackImage;

  return (
      <div
          className={`card p-4 mb-4 cursor-pointer transition-all ${
              isSelected ? 'ring-2 ring-blue-500' : ''
          }`}
          onClick={handleCardClick}
      >
        <div className="mb-3 overflow-hidden rounded-md h-40 bg-gray-100 dark:bg-gray-700 relative">
          {hasImage && !imageError ? (
              <>
                {/* 로딩 표시기 */}
                {!imageLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                )}

                {/* 실제 이미지 */}
                <img
                    src={safeImageUrl}
                    alt={place.title}
                    className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                    onError={handleImageError}
                    onLoad={handleImageLoad}
                    loading="lazy"
                />
              </>
          ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-12 h-12">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
              </div>
          )}
        </div>

        <h3 className="text-lg font-semibold mb-2" dangerouslySetInnerHTML={{ __html: place.title }}></h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-2" dangerouslySetInnerHTML={{ __html: place.description }}></p>

        {place.bloggerName && (
            <p className="text-gray-500 dark:text-gray-400 text-xs mb-4">
              작성자: {place.bloggerName}
            </p>
        )}

        <div className="flex flex-col gap-3">
          <div className="flex items-center">
            <input
                type="checkbox"
                checked={isSelected}
                onChange={() => setIsSelected(!isSelected)}
                className="mr-2 h-4 w-4 text-blue-600"
                onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="flex gap-2">
            {place.link && (
                <>
                  <a
                      href={place.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary text-sm py-1 px-2 flex-1 text-center"
                      onClick={(e) => e.stopPropagation()}
                  >
                    블로그 방문
                  </a>
                  <button
                      onClick={handleShareBlog}
                      className="btn-secondary text-sm py-1 px-2"
                      disabled={shareLoading}
                  >
                    {shareLoading ? (
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : copied ? (
                        "복사됨!"
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935-2.186 2.25 2.25 0 0 0-3.935 2.186Z" />
                        </svg>
                    )}
                  </button>
                </>
            )}

            {isSelected && (
                <Link
                    href={`/route/${place.id}`}
                    className="btn-primary text-sm py-1 px-2 flex-1 text-center"
                    onClick={handleLinkClick}
                >
                  {isLoading ? (
                      <span className="flex items-center justify-center">
                      <svg className="animate-spin h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      처리 중
                    </span>
                  ) : "경로 안내"}
                </Link>
            )}
          </div>
        </div>
      </div>
  );
}