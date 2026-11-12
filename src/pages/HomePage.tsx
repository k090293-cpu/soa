import React, { useCallback } from 'react';
import { Hero } from '../components/Hero';
import { About } from '../components/About';
import { Works } from '../components/Works';
import { Services } from '../components/Services';
import { Process } from '../components/Process';
import { Trust } from '../components/Trust';
import { Contact } from '../components/Contact';
import { useStudio } from '../context/StudioContext';
import { HomeLayersOverlay } from '../components/editable/HomeLayersOverlay';
import { HomeBlockShell } from '../components/editable/HomeBlockShell';
import { useBlockDrag } from '../hooks/useBlockDrag';
import { HOME_BLOCK_LABELS, HOME_SECTION_HINTS, moveKeyTo } from '../utils/homeBlocks';
import { ArrowRight } from 'lucide-react';

export const HomePage: React.FC = () => {
  const {
    navigateTo,
    isHomeInlineEditMode,
    hiddenHomeBlocks,
    homeSectionOrder,
    deleteHomeBlock,
    restoreHomeBlock,
    setHomeSectionOrder,
    moveHomeSection,
    undoHomeEdit,
    canUndo,
  } = useStudio();

  const isHidden = (key: string) => hiddenHomeBlocks.includes(key);
  const hiddenSections = homeSectionOrder.filter((k) => isHidden(k));

  const handleSectionDrop = useCallback(
    (fromKey: string, toKey: string) => {
      const next = moveKeyTo(homeSectionOrder, fromKey, toKey);
      if (next !== homeSectionOrder) setHomeSectionOrder(next);
    },
    [homeSectionOrder, setHomeSectionOrder]
  );

  // 섹션 내부 블록 위로 드롭해도 섹션이 섞이지 않도록 group='section' 으로 제한
  const sectionDrag = useBlockDrag(handleSectionDrop, { group: 'section' });

  const renderSectionBody = (key: string): React.ReactNode => {
    switch (key) {
      case 'hero':
        return <Hero />;

      case 'about':
        return (
          <>
            <About />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 -mt-10 flex justify-end">
              <button
                onClick={() => navigateTo('about')}
                className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition-colors cursor-pointer group"
              >
                <span>SO.A 디자이너 소개 & 상세 경력 페이지로 이동</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </>
        );

      case 'works':
        return (
          <>
            <Works />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 -mt-10 flex justify-end">
              <button
                onClick={() => navigateTo('works')}
                className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition-colors cursor-pointer group"
              >
                <span>전체 포트폴리오 & 케이스 스터디 아카이브 보기</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </>
        );

      case 'services':
        return (
          <>
            <Services />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 -mt-10 flex justify-end">
              <button
                onClick={() => navigateTo('service')}
                className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition-colors cursor-pointer group"
              >
                <span>서비스별 상세 작업 범위 & 견적 가이드 보기</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </>
        );

      case 'process':
        return <Process />;

      case 'trust':
        return <Trust />;

      case 'contact':
        return <Contact />;

      default:
        return null;
    }
  };

  const visibleSections = homeSectionOrder.filter((k) => !isHidden(k));

  return (
    <div
      data-home-canvas="home"
      className="relative space-y-0 animate-in fade-in duration-200"
    >
      {/* 관리자가 얹은 커스텀 레이어 (홈 전체 기준) */}
      <HomeLayersOverlay />

      {visibleSections.map((key, idx) => (
        <HomeBlockShell
          key={key}
          blockKey={key}
          group="section"
          label={HOME_BLOCK_LABELS[key] || key}
          deletable
          movable
          isFirst={idx === 0}
          isLast={idx === visibleSections.length - 1}
          isDragOver={sectionDrag.overKey === key}
          isDragging={sectionDrag.draggingKey === key}
          onDelete={() => deleteHomeBlock(key)}
          onMoveUp={() => moveHomeSection(key, 'up')}
          onMoveDown={() => moveHomeSection(key, 'down')}
          onGripPointerDown={(e) => sectionDrag.start(e, key)}
          onGripPointerMove={sectionDrag.move}
          onGripPointerUp={sectionDrag.end}
          className="block"
        >
          <div title={HOME_SECTION_HINTS[key]}>{renderSectionBody(key)}</div>
        </HomeBlockShell>
      ))}

      {/* 숨긴 섹션 복원 바 — 섹션 밖(항상 렌더)에 두어 히어로를 숨겨도 복구 가능하게 합니다 */}
      {isHomeInlineEditMode && hiddenSections.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="p-3 rounded-xl border border-amber-500/40 bg-amber-950/30 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-amber-300">
              숨긴 섹션 {hiddenSections.length}개
            </span>
            {hiddenSections.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => restoreHomeBlock(key)}
                className="px-2 py-1 rounded-lg bg-amber-900/60 hover:bg-amber-800/80 border border-amber-700/70 text-[11px] text-amber-200 cursor-pointer"
                title="이 섹션을 다시 표시합니다"
              >
                + {HOME_BLOCK_LABELS[key] || key} 복원
              </button>
            ))}
            <button
              type="button"
              onClick={undoHomeEdit}
              disabled={!canUndo}
              className="ml-auto px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-[11px] text-zinc-300 hover:text-white disabled:opacity-40 cursor-pointer"
              title="Ctrl/Cmd+Z"
            >
              Ctrl+Z 되돌리기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
