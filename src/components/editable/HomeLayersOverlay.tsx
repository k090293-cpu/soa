import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import { HomeLayer } from '../../types';
import { Trash2, GripVertical, Eye, EyeOff } from 'lucide-react';

/**
 * 홈 화면(미리보기) 위에 관리자가 만든 커스텀 레이어를 그리는 오버레이.
 * - 편집 모드에서만 선택/드래그/삭제가 가능합니다.
 * - 실제 홈에서는 읽기 전용으로 그대로 노출됩니다.
 *
 * 드래그
 *  - 글씨 레이어 / 배지 레이어 / 이미지 레이어 모두 본체를 마우스로 잡고 끌면 이동합니다.
 *  - pointer capture 를 걸어 커서가 레이어 밖으로 나가도 계속 따라옵니다.
 *  - 좌표 기준은 `[data-home-canvas]` (없으면 offsetParent) 이며 x/y/width 는 그 기준 대비 %입니다.
 */
export const HomeLayersOverlay: React.FC = () => {
  const {
    menuContent,
    isHomeInlineEditMode,
    selectedHomeLayerId,
    setSelectedHomeLayerId,
    updateHomeLayer,
    deleteHomeLayer,
  } = useStudio();

  const layers = menuContent.home.layers || [];
  const [dragId, setDragId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);

  // 드래그 계산에 쓰는 값은 ref 로 보관합니다.
  // (state 로 두면 pointermove 마다 리렌더가 일어나 값이 stale 해질 수 있습니다)
  const dragRef = useRef<{
    id: string;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    boxW: number;
    boxH: number;
    lastX: number;
    lastY: number;
  } | null>(null);

  const hasLayers = layers.length > 0;

  // 편집 모드 종료 시 선택/드래그 해제
  useEffect(() => {
    if (!isHomeInlineEditMode) {
      setSelectedHomeLayerId(null);
      dragRef.current = null;
      setDragId(null);
      setHoverId(null);
    }
  }, [isHomeInlineEditMode, setSelectedHomeLayerId]);

  /** 레이어 좌표의 기준이 되는 박스(홈 캔버스)를 찾습니다. */
  const resolveCanvasRect = (el: HTMLElement): DOMRect | null => {
    const canvas = el.closest('[data-home-canvas]') as HTMLElement | null;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) return rect;
    }
    const parent = (el.offsetParent as HTMLElement | null) ?? document.body;
    const rect = parent.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 ? rect : null;
  };

  const applyDrag = useCallback(
    (clientX: number, clientY: number) => {
      const d = dragRef.current;
      if (!d) return;
      const dxPct = ((clientX - d.startX) / d.boxW) * 100;
      const dyPct = ((clientY - d.startY) / d.boxH) * 100;
      const nextX = Math.max(-30, Math.min(130, d.originX + dxPct));
      const nextY = Math.max(-30, Math.min(220, d.originY + dyPct));
      // 소수 1자리로 반올림해 같은 값이면 불필요한 업데이트를 건너뜁니다.
      const roundedX = Math.round(nextX * 10) / 10;
      const roundedY = Math.round(nextY * 10) / 10;
      if (roundedX === d.lastX && roundedY === d.lastY) return;
      d.lastX = roundedX;
      d.lastY = roundedY;
      updateHomeLayer(d.id, { x: roundedX, y: roundedY });
    },
    [updateHomeLayer]
  );

  const endDrag = (e?: React.PointerEvent<HTMLDivElement>) => {
    if (e) {
      // 캡처를 해제해 이후 이벤트가 정상 흐름으로 돌아가게 합니다.
      try {
        if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {
        /* 이미 해제된 경우 무시 */
      }
    }
    dragRef.current = null;
    setDragId(null);
  };

  const beginDrag = (
    e: React.PointerEvent<HTMLDivElement>,
    layer: HomeLayer
  ) => {
    if (!isHomeInlineEditMode) return;
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const box = resolveCanvasRect(e.currentTarget);
    if (!box) return;

    e.preventDefault();
    e.stopPropagation();
    setSelectedHomeLayerId(layer.id);
    dragRef.current = {
      id: layer.id,
      startX: e.clientX,
      startY: e.clientY,
      originX: layer.x,
      originY: layer.y,
      boxW: box.width || 1,
      boxH: box.height || 1,
      lastX: layer.x,
      lastY: layer.y,
    };
    setDragId(layer.id);
    // ⚠️ 포인터 캡처가 없으면 커서가 레이어 밖으로 나가는 순간
    //    pointermove 가 끊겨 드래그가 즉시 멈춥니다.
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* 미지원 브라우저 무시 */
    }
  };

  /** 레이어 본체 / 선택 프레임 공통 포인터 핸들러 */
  const pointerProps = (layer: HomeLayer) => ({
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => beginDrag(e, layer),
    onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragRef.current) return;
      applyDrag(e.clientX, e.clientY);
    },
    onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => endDrag(e),
    onPointerCancel: (e: React.PointerEvent<HTMLDivElement>) => endDrag(e),
    onLostPointerCapture: () => {
      dragRef.current = null;
      setDragId(null);
    },
  });

  if (!hasLayers) return null;

  return (
    <>
      {layers.map((layer) => {
        if (!layer.visible && !isHomeInlineEditMode) return null;
        const isSelected = selectedHomeLayerId === layer.id;
        const isDragging = dragId === layer.id;
        const isHovered = hoverId === layer.id;
        const isImage = layer.type === 'image';
        const isBadge = layer.type === 'badge';
        const showFrame = isHomeInlineEditMode && (isSelected || isHovered || isDragging);
        const typeLabel = isImage ? 'IMAGE' : isBadge ? 'BADGE' : 'TEXT';

        return (
          <div
            key={layer.id}
            data-home-layer={layer.id}
            data-layer-type={layer.type}
            className={`absolute ${
              isHomeInlineEditMode ? 'pointer-events-auto cursor-move' : 'pointer-events-none'
            } ${isSelected ? 'z-30' : 'z-20'} ${isDragging ? 'select-none' : ''}`}
            style={{
              left: `${layer.x}%`,
              top: `${layer.y}%`,
              width: `${layer.width}%`,
              transform: `rotate(${layer.rotation}deg)`,
              transformOrigin: 'top left',
              opacity: layer.visible ? layer.opacity / 100 : 0.35,
              // 드래그 중 스크롤/줌 제스처로 이벤트가 끊기지 않도록 합니다.
              touchAction: isHomeInlineEditMode ? 'none' : undefined,
            }}
            onPointerEnter={() => {
              if (isHomeInlineEditMode) setHoverId(layer.id);
            }}
            onPointerLeave={() =>
              setHoverId((prev) => (prev === layer.id ? null : prev))
            }
            onClick={(e) => {
              if (!isHomeInlineEditMode) return;
              e.stopPropagation();
              setSelectedHomeLayerId(layer.id);
            }}
            {...pointerProps(layer)}
          >
            {/* 편집 모드 선택/호버 프레임 — 테두리를 잡아도 드래그됩니다 */}
            {isHomeInlineEditMode && (
              <div
                className={`absolute -inset-1.5 rounded-lg border-2 border-dashed ${
                  showFrame ? 'pointer-events-auto' : 'pointer-events-none'
                } ${
                  isSelected
                    ? 'border-blue-500 bg-blue-500/5'
                    : isDragging
                    ? 'border-blue-400'
                    : 'border-blue-500/45'
                }`}
                title={`${typeLabel} · 잡고 드래그하면 이동합니다`}
                {...pointerProps(layer)}
              >
                {showFrame && (
                  <span className="absolute -top-3 left-0 flex items-center gap-1 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap pointer-events-none">
                    <GripVertical className="w-2.5 h-2.5" />
                    {typeLabel} · 드래그로 이동
                  </span>
                )}

                <div className="absolute -top-3 right-0 flex items-center gap-1 pointer-events-auto">
                  <button
                    type="button"
                    // 버튼을 누를 때 드래그가 시작되지 않도록 막습니다.
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      updateHomeLayer(layer.id, { visible: !layer.visible });
                    }}
                    className="w-5 h-5 rounded bg-zinc-900 border border-blue-500 text-blue-300 hover:text-white flex items-center justify-center cursor-pointer"
                    title={layer.visible ? '레이어 숨기기' : '레이어 표시'}
                  >
                    {layer.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  </button>
                  <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('이 레이어를 삭제하시겠습니까?')) deleteHomeLayer(layer.id);
                    }}
                    className="w-5 h-5 rounded bg-red-600 border border-red-400 text-white hover:bg-red-500 flex items-center justify-center cursor-pointer"
                    title="레이어 삭제"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* 실제 레이어 콘텐츠 — pointer-events-none 이라 어떤 지점을 잡아도 부모가 드래그 담당 */}
            {isImage ? (
              <img
                src={layer.content}
                alt=""
                className="w-full h-auto block select-none pointer-events-none"
                draggable={false}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div
                className={`select-none whitespace-pre-wrap break-words pointer-events-none ${
                  isBadge ? 'inline-block rounded-lg px-3 py-1.5 shadow-lg' : 'leading-snug'
                }`}
                style={{
                  fontSize: `${layer.fontSize}px`,
                  color: isBadge ? '#0b0c10' : layer.color,
                  textAlign: layer.align,
                  fontWeight: layer.bold ? 800 : 600,
                  backgroundColor: isBadge ? layer.color : undefined,
                  textShadow: isBadge ? undefined : '0 2px 10px rgba(0,0,0,0.6)',
                }}
              >
                {layer.content}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
};
