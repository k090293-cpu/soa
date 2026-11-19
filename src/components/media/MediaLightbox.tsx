import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Film, Image as ImageIcon } from 'lucide-react';
import type { MediaItem } from '../../types';
import { VideoPlayer } from './VideoPlayer';

interface MediaLightboxProps {
  /** 보여줄 미디어 전체 목록 (이미지 + 영상) */
  items: MediaItem[];
  /** 처음 열 때 보여줄 인덱스 */
  initialIndex?: number;
  /** 닫기 */
  onClose: () => void;
}

/**
 * 전체 화면 미디어 뷰어 (라이트박스).
 *
 * 요구사항:
 *  · 썸네일을 누르면 **큰 이미지**로 보인다.
 *  · 여러 장이면 **좌우로 넘겨** 볼 수 있다.
 *
 * 조작:
 *  · ← → 방향키, ESC 닫기
 *  · 화면 좌우 화살표 버튼
 *  · 모바일 스와이프
 *  · 하단 썸네일 스트립 클릭
 *  · 배경(검은 영역) 클릭 시 닫기
 */
export const MediaLightbox: React.FC<MediaLightboxProps> = ({ items, initialIndex = 0, onClose }) => {
  const [index, setIndex] = useState(() =>
    Math.min(Math.max(initialIndex, 0), Math.max(items.length - 1, 0))
  );

  // 터치 스와이프 시작 좌표
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const total = items.length;
  const current = items[index];

  const goPrev = useCallback(() => {
    setIndex((prev) => (prev > 0 ? prev - 1 : total - 1));
  }, [total]);

  const goNext = useCallback(() => {
    setIndex((prev) => (prev < total - 1 ? prev + 1 : 0));
  }, [total]);

  // 키보드 조작 + 배경 스크롤 잠금
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      }
    };

    window.addEventListener('keydown', onKeyDown);

    // 뒤 배경이 같이 스크롤되지 않도록 잠급니다.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [goNext, goPrev, onClose]);

  if (!current) return null;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;

    // 세로로 더 많이 움직였으면 스크롤 의도로 보고 무시합니다.
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) goNext();
      else goPrev();
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-sm flex flex-col animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-label="미디어 크게 보기"
      data-theme="dark"
    >
      {/* 상단 바 */}
      <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3 border-b border-zinc-800/80 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {current.type === 'video' ? (
            <Film className="w-4 h-4 text-blue-400 shrink-0" />
          ) : (
            <ImageIcon className="w-4 h-4 text-zinc-400 shrink-0" />
          )}
          <span className="text-xs sm:text-sm text-zinc-200 font-medium truncate">
            {current.name || '미디어'}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs font-mono text-zinc-400 tabular-nums">
            {index + 1} / {total}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="p-2 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 본문: 큰 이미지 / 영상 */}
      <div
        className="relative flex-1 min-h-0 flex items-center justify-center p-3 sm:p-6"
        onClick={onClose}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="relative w-full h-full flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          {current.type === 'video' ? (
            <VideoPlayer
              url={current.url}
              thumbnail={current.thumbnail}
              title={current.name || '영상'}
              autoPlay
              aspectClassName="aspect-video max-h-full"
              className="max-w-5xl"
            />
          ) : (
            <img
              src={current.url}
              alt={current.name || '이미지'}
              className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg select-none"
              referrerPolicy="no-referrer"
              draggable={false}
            />
          )}

          {/* 좌우 이동 버튼 (2장 이상일 때) */}
          {total > 1 && (
            <>
              <button
                type="button"
                onClick={goPrev}
                aria-label="이전 미디어"
                className="absolute left-0 sm:left-2 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center border border-zinc-700 backdrop-blur-md transition-all cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <button
                type="button"
                onClick={goNext}
                aria-label="다음 미디어"
                className="absolute right-0 sm:right-2 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center border border-zinc-700 backdrop-blur-md transition-all cursor-pointer"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* 하단 썸네일 스트립 */}
      {total > 1 && (
        <div className="shrink-0 border-t border-zinc-800/80 px-3 sm:px-6 py-3">
          <div className="flex items-center justify-center gap-2 overflow-x-auto">
            {items.map((item, i) => (
              <button
                key={item.id || i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`${i + 1}번째 미디어 보기`}
                aria-current={i === index}
                className={`relative w-16 h-12 sm:w-20 sm:h-14 shrink-0 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                  i === index
                    ? 'border-blue-500 opacity-100'
                    : 'border-transparent opacity-50 hover:opacity-90'
                }`}
              >
                {item.type === 'video' ? (
                  item.thumbnail ? (
                    <img
                      src={item.thumbnail}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                      <Film className="w-4 h-4 text-zinc-600" />
                    </div>
                  )
                ) : (
                  <img
                    src={item.url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
