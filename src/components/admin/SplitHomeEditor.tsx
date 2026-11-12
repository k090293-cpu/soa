import React, { useRef } from 'react';
import { useStudio } from '../../context/StudioContext';
import { HomePage } from '../../pages/HomePage';
import { MousePointerClick, Layers, Type, X } from 'lucide-react';

/**
 * 관리자 패널 옆에 홈 화면을 실제로 렌더링해 주는 분할 편집 뷰.
 * - 왼쪽: 실제 홈 화면 (글자 클릭 시 인라인 수정, 레이어 드래그 가능)
 * - 레이어는 홈 위에 그대로 얹혀 렌더링됩니다.
 */
export const SplitHomeEditor: React.FC = () => {
  const {
    isHomeInlineEditMode,
    setIsHomeInlineEditMode,
    menuContent,
    setIsSplitEditorOpen,
    setSelectedHomeLayerId,
  } = useStudio();

  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const layerCount = (menuContent.home.layers || []).length;

  return (
    <div className="flex-1 min-w-0 h-full flex flex-col bg-[var(--app-surface-2)]">
      {/* 상단 편집 툴바 */}
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-zinc-800 bg-[var(--app-header-bg)] backdrop-blur">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="text-[11px] font-bold text-white truncate">
            홈 실시간 편집 화면
          </span>
          <span className="text-[10px] text-zinc-500 hidden lg:inline">
            글자를 클릭하면 바로 수정됩니다
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsHomeInlineEditMode(!isHomeInlineEditMode)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors flex items-center gap-1 cursor-pointer ${
              isHomeInlineEditMode
                ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
            title="글자 클릭 편집 · 레이어 드래그를 켜거나 끕니다"
          >
            <MousePointerClick className="w-3 h-3" />
            <span>{isHomeInlineEditMode ? '편집 ON' : '편집 OFF'}</span>
          </button>

          <span className="px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 flex items-center gap-1">
            <Layers className="w-3 h-3 text-blue-400" />
            레이어 {layerCount}
          </span>

          <button
            onClick={() => {
              setIsHomeInlineEditMode(false);
              setSelectedHomeLayerId(null);
              setIsSplitEditorOpen(false);
            }}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 cursor-pointer"
            title="홈 보며 편집 닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 편집 안내 배너 */}
      {isHomeInlineEditMode && (
        <div className="shrink-0 px-3 py-1.5 bg-blue-950/40 border-b border-blue-900/40 text-[10px] text-blue-300 flex items-center gap-1.5">
          <Type className="w-3 h-3 shrink-0" />
          <span>
            점선 글자를 클릭해 수정 · 블록 좌상단 그립을 드래그하면 순서가 바뀝니다 · 블록 우측 상단
            휴지통으로 삭제 · <span className="font-bold text-blue-200">Ctrl+Z</span> 로 되돌리기 · 바깥
            클릭 시 자동 저장
          </span>
        </div>
      )}

      {/* 실제 홈 렌더 영역 */}
      <div
        ref={scrollerRef}
        data-editor-pane="split"
        className="relative flex-1 overflow-y-auto overflow-x-hidden bg-[var(--app-bg)]"
      >
        {/* HomePage 내부에서 HomeLayersOverlay 를 함께 렌더합니다 */}
        <div className="relative min-h-full">
          <HomePage />
        </div>
      </div>
    </div>
  );
};
