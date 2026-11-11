import React, { useState, useRef } from 'react';
import { BeforeAfterData } from '../types';

interface BeforeAfterSliderProps {
  data: BeforeAfterData;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({ data }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.max(5, Math.min(95, (x / rect.width) * 100));
    setSliderPosition(percent);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches[0]) {
      handleMove(e.touches[0].clientX);
    }
  };

  const handleMouseDown = () => {
    isDragging.current = true;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging.current) {
      handleMove(e.clientX);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-medium text-zinc-400">
        <span className="flex items-center gap-1.5 text-zinc-400">
          <span className="w-2 h-2 rounded-full bg-zinc-600 inline-block" /> BEFORE (개선 전)
        </span>
        <span className="text-zinc-500 text-[11px]">슬라이더를 좌우로 드래그하여 비교해보세요</span>
        <span className="flex items-center gap-1.5 text-blue-400 font-semibold">
          <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> AFTER (개선 후)
        </span>
      </div>

      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        data-theme="dark" className="relative w-full h-[360px] md:h-[460px] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 select-none cursor-ew-resize group"
      >
        {/* AFTER Image (Background) */}
        <div className="absolute inset-0 w-full h-full">
          <img
            src={data.afterImage}
            alt="After design"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md px-3 py-1 rounded text-xs font-medium text-blue-400 border border-blue-500/30">
            AFTER · 전환율 +148%
          </div>
        </div>

        {/* BEFORE Image (Clipped overlay) */}
        <div
          className="absolute inset-0 h-full overflow-hidden"
          style={{ width: `${sliderPosition}%` }}
        >
          <div className="relative w-full h-full filter grayscale contrast-90 brightness-75">
            <img
              src={data.beforeImage}
              alt="Before design"
              className="absolute inset-0 w-full h-full object-cover max-w-none"
              style={{ width: containerRef.current ? `${containerRef.current.offsetWidth}px` : '100%' }}
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md px-3 py-1 rounded text-xs font-medium text-zinc-400 border border-zinc-800">
            BEFORE (기존 시안)
          </div>
        </div>

        {/* Divider line and handle */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_12px_rgba(255,255,255,0.7)] cursor-ew-resize"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-zinc-900 shadow-xl flex items-center justify-center text-xs font-bold transition-transform group-hover:scale-110">
            ↔
          </div>
        </div>
      </div>

      {/* Comparison notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/80 text-xs">
          <p className="font-semibold text-zinc-400 mb-1">기존 문제점 (Before)</p>
          <p className="text-zinc-500 leading-relaxed">{data.beforeNotes}</p>
        </div>
        <div className="p-3 rounded-lg bg-blue-950/20 border border-blue-900/40 text-xs">
          <p className="font-semibold text-blue-400 mb-1">디자인 솔루션 (After)</p>
          <p className="text-zinc-300 leading-relaxed">{data.afterNotes}</p>
        </div>
      </div>
    </div>
  );
};
