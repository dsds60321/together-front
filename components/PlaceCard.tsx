'use client';

import { useState } from 'react';
import Link from 'next/link';

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
}

export function Card({ place }: CardProps) {
  const [isSelected, setIsSelected] = useState(false);

  const handleCardClick = () => {
    setIsSelected(!isSelected);
  };

  const handleLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // 카드 선택 이벤트 중지
  };

  return (
      <div
          className={`card p-4 mb-4 cursor-pointer transition-all ${
              isSelected ? 'ring-2 ring-blue-500' : ''
          }`}
          onClick={handleCardClick}
      >
        {place.image && (
            <div className="mb-3 overflow-hidden rounded-md h-40">
              <img
                  src={place.image}
                  alt={place.title}
                  className="w-full h-full object-cover"
              />
            </div>
        )}
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
                <a
                    href={place.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary text-sm py-1 px-2 flex-1 text-center"
                    onClick={handleLinkClick}
                >
                  블로그 방문
                </a>
            )}

            {isSelected && (
                <Link
                    href={`/route/${place.id}`}
                    className="btn-primary text-sm py-1 px-2 flex-1 text-center"
                    onClick={(e) => e.stopPropagation()}
                >
                  경로 안내
                </Link>
            )}
          </div>
        </div>
      </div>
  );
}