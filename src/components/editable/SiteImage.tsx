import React, { useRef } from 'react';
import { useStudio } from '../../context/StudioContext';
import { ImageUp, RotateCcw } from 'lucide-react';
import { processImageFile } from '../../utils/mediaStorage';

interface SiteImageProps {
  /** 오버라이드 저장 키 (예: 'hero.media', 'works.card.0.image') */
  ikey: string;
  /** 관리자가 교체하지 않았을 때 사용할 기본 이미지 URL */
  fallback: string;
  /** 편집 모드 배지에 표시할 이름 */
  label?: string;
  alt?: string;
  className?: string;
  imgClassName?: string;
  referrerPolicy?: 'no-referrer' | 'origin' | 'no-referrer-when-downgrade' | '';
  /** 컨테이너에 추가로 붙일 클래스 */
  wrapClassName?: string;
  draggable?: boolean;
}

/**
 * 홈 화면 어디에나 쓸 수 있는 편집 가능 이미지.
 * - 편집 모드에서 이미지 위에 마우스를 올리면 "이미지 교체" 버튼이 나타납니다.
 * - 업로드한 이미지는 Data URL 로 압축되어 imageOverrides 맵에 저장됩니다.
 */
export const SiteImage: React.FC<SiteImageProps> = ({
  ikey,
  fallback,
  label,
  alt = '',
  className = '',
  imgClassName = '',
  referrerPolicy = 'no-referrer',
  wrapClassName,
  draggable = false,
}) => {
  const { siteImage, setSiteImage, clearSiteOverride, isHomeInlineEditMode } = useStudio();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const src = siteImage(ikey, fallback);
  const isOverridden = src !== fallback;

  const handlePick = () => fileRef.current?.click();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다.');
      return;
    }
    try {
      const dataUrl = await processImageFile(file);
      setSiteImage(ikey, dataUrl);
    } catch {
      alert('이미지를 불러오지 못했습니다. 다른 파일로 시도해 주세요.');
    }
  };

  return (
    <span className={`relative block ${wrapClassName || ''}`}>
      <img
        src={src}
        alt={alt}
        className={`${className} ${imgClassName}`.trim()}
        draggable={draggable}
        referrerPolicy={referrerPolicy as React.ImgHTMLAttributes<HTMLImageElement>['referrerPolicy']}
      />

      {isHomeInlineEditMode && (
        <>
          {/* ⚠️ display:none 인 input 은 스크립트로 .click() 해도 파일창이 열리지 않습니다.
              sr-only 로 화면에서만 숨겨 실제로 렌더된 상태를 유지합니다. */}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="sr-only"
            data-ui="file"
            tabIndex={-1}
          />

          {/* 편집 모드 오버레이 — 호버 시 이미지 교체 버튼
              ⚠️ wrapper 에 pointer-events:none 을 주면 hover 자체가 발생하지 않아
                 버튼이 영영 보이지 않습니다. 컨트롤 영역만 auto 로 둡니다. */}
          <span
            data-ui="imgctl"
            className="absolute inset-0 z-20 flex items-start justify-end gap-1 p-1.5 opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity"
          >
            <span className="flex items-center gap-1" style={{ pointerEvents: 'auto' }}>
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  handlePick();
                }}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-600 text-white text-[9px] font-bold shadow-md cursor-pointer hover:bg-blue-500"
                title="이미지 교체"
              >
                <ImageUp className="w-2.5 h-2.5" />
                {label || '이미지 교체'}
              </button>
              {isOverridden && (
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    clearSiteOverride(ikey);
                  }}
                  className="p-0.5 rounded bg-zinc-900/90 border border-zinc-600 text-zinc-300 hover:text-white shadow-md cursor-pointer"
                  title="기본 이미지로 되돌리기"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                </button>
              )}
            </span>
          </span>

          {/* 상시 표시 테두리 */}
          <span
            data-ui="imgframe"
            aria-hidden
            className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] outline outline-1 outline-dashed outline-blue-500/40"
          />
        </>
      )}
    </span>
  );
};
