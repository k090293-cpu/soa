import React from 'react';
import { useStudio } from '../../context/StudioContext';
import { GripVertical, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';

interface HomeBlockShellProps {
  /** 블록 키 (heroKicker, heroActions, heroMedia, kpis ...) */
  blockKey: string;
  /** 화면에 표시할 이름 */
  label: string;
  /** 드래그 그룹 (같은 그룹 안에서만 순서를 바꿉니다) */
  group?: string;
  /** 이 블록이 삭제 가능한지 */
  deletable?: boolean;
  /** 이동(순서 변경) 가능 여부 */
  movable?: boolean;
  /** 그룹 내 첫번째/마지막 여부 (위/아래 버튼 비활성화) */
  isFirst?: boolean;
  isLast?: boolean;
  /** 드래그 중 이 블록 위에 올라와 있는지 */
  isDragOver?: boolean;
  /** 드래그 중인 블록인지 */
  isDragging?: boolean;
  /** 카드처럼 좁은 영역용 모드 (라벨 숨김, 컨트롤만) */
  compact?: boolean;
  /** ↑/↓ 옆에 추가로 넣을 컨트롤 (예: 이미지 카드 위치 전환) */
  extraControls?: React.ReactNode;
  onDelete?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onGripPointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onGripPointerMove?: (e: React.PointerEvent<HTMLDivElement>) => void;
  onGripPointerUp?: (e: React.PointerEvent<HTMLDivElement>) => void;
  className?: string;
  children: React.ReactNode;
}

/**
 * 홈 블록을 감싸 편집 모드에서 이동·삭제 컨트롤을 붙여주는 껍데기.
 * - 편집 모드가 아니면 오버레이 없이 내용만 렌더합니다.
 * - 이동: 좌상단 그립을 드래그(포인터 캡처)하거나 ↑/↓ 버튼
 * - 삭제: 우상단 휴지통 (Ctrl/Cmd+Z 로 되돌리기)
 */
export const HomeBlockShell: React.FC<HomeBlockShellProps> = ({
  blockKey,
  label,
  group = 'hero',
  deletable = true,
  movable = true,
  isFirst = false,
  isLast = false,
  isDragOver = false,
  isDragging = false,
  compact = false,
  extraControls,
  onDelete,
  onMoveUp,
  onMoveDown,
  onGripPointerDown,
  onGripPointerMove,
  onGripPointerUp,
  className = '',
  children,
}) => {
  const { isHomeInlineEditMode } = useStudio();
  const editMode = isHomeInlineEditMode;

  const btnBase =
    'w-5 h-5 rounded border flex items-center justify-center cursor-pointer transition-colors';

  return (
    <div
      data-home-block={blockKey}
      data-block-group={group}
      className={`relative ${className} ${
        editMode
          ? `rounded-lg outline outline-1 outline-dashed transition-colors ${
              isDragging
                ? 'outline-blue-500 bg-blue-500/10 opacity-60'
                : isDragOver
                ? 'outline-blue-400 bg-blue-500/10'
                : 'outline-blue-500/30 hover:outline-blue-400/70'
            }`
          : ''
      }`}
    >
      {editMode && (
        <div
          className={`absolute z-30 flex items-center justify-between gap-2 pointer-events-none ${
            compact ? '-top-2.5 left-0 right-0' : '-top-3 left-0 right-0'
          }`}
        >
          {/* 이동 그립 */}
          <div
            onPointerDown={movable ? onGripPointerDown : undefined}
            onPointerMove={movable ? onGripPointerMove : undefined}
            onPointerUp={movable ? onGripPointerUp : undefined}
            onPointerCancel={movable ? onGripPointerUp : undefined}
            className={`pointer-events-auto flex items-center gap-1 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-md select-none whitespace-nowrap ${
              movable ? 'cursor-grab active:cursor-grabbing' : ''
            }`}
            style={movable ? { touchAction: 'none' } : undefined}
            title={movable ? `${label} · 드래그해서 순서를 바꿉니다` : label}
          >
            {movable && <GripVertical className="w-2.5 h-2.5 shrink-0" />}
            {!compact && label}
          </div>

          {/* 컨트롤 */}
          <div className="pointer-events-auto flex items-center gap-1 shrink-0">
            {extraControls}
            {movable && (
              <>
                <button
                  type="button"
                  data-ui="ctl"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveUp?.();
                  }}
                  disabled={isFirst}
                  className={`${btnBase} bg-zinc-900 border-blue-500/60 text-blue-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed`}
                  title="위로 이동"
                >
                  <ArrowUp className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  data-ui="ctl"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveDown?.();
                  }}
                  disabled={isLast}
                  className={`${btnBase} bg-zinc-900 border-blue-500/60 text-blue-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed`}
                  title="아래로 이동"
                >
                  <ArrowDown className="w-3 h-3" />
                </button>
              </>
            )}
            {deletable && (
              <button
                type="button"
                data-ui="ctl"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.();
                }}
                className={`${btnBase} bg-red-600 border-red-400 text-white hover:bg-red-500`}
                title="이 블록 삭제 (Ctrl+Z 로 되돌리기)"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {children}
    </div>
  );
};
