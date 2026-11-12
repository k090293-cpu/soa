import React, { useEffect, useRef, useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import { HomeLayer } from '../../types';
import { Trash2, GripVertical, Eye, EyeOff } from 'lucide-react';

/**
 * 홈 화면(미리보기) 위에 관리자가 만든 커스텀 레이어를 그리는 오버레이.
 * - 편집 모드에서만 선택/드래그/삭제가 가능합니다.
 * - 실제 홈에서는 읽기 전용으로 그대로 노출됩니다.
 * 부모 요소는 반드시 `relative` 여야 합니다.
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

  // 레이어가 하나도 없으면 아무것도 그리지 않습니다.
  const hasLayers = layers.length > 0;

  // 편집 모드 종료 시 선택/드래그 해제
  useEffect(() => {
    if (!isHomeInlineEditMode) {
      setSelectedHomeLayerId(null);
      dragRef.current = null;
      setDragId(null);
    }
  }, [isHomeInlineEditMode, setSelectedHomeLayerId]);

  if (!hasLayers) return null;

  const applyDrag = (clientX: number, clientY: number) => {
    const d = dragRef.current;
    if (!d) return;
    const dxPct = ((clientX - d.startX) / d.boxW) * 100;
    const dyPct = ((clientY - d.startY) / d.boxH) * 100;
    const nextX = Math.max(-20, Math.min(120, d.originX + dxPct));
    const nextY = Math.max(-20, Math.min(200, d.originY + dyPct));
    // 소수 1자리로 반올림해 같은 값이면 불필요한 업데이트를 건너뜁니다.
    const roundedX = Math.round(nextX * 10) / 10;
    const roundedY = Math.round(nextY * 10) / 10;
    if (roundedX === d.lastX && roundedY === d.lastY) return;
    d.lastX = roundedX;
    d.lastY = roundedY;
    updateHomeLayer(d.id, { x: roundedX, y: roundedY });
  };

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
    layer: HomeLayer,
    box: DOMRect
  ) => {
    if (!isHomeInlineEditMode) return;
    if (e.button !== 0 && e.pointerType === 'mouse') return;
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

  return (
    <>
      {layers.map((layer) => {
        if (!layer.visible && !isHomeInlineEditMode) return null;
        const isSelected = selectedHomeLayerId === layer.id;
        const isDragging = dragId === layer.id;
        const isImage = layer.type === 'image';
        const isBadge = layer.type === 'badge';

        return (
          <div
            key={layer.id}
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
            onPointerDown={(e) => {
              const parent = (e.currentTarget.offsetParent as HTMLElement) || null;
              // offsetParent 대신 실제 홈 컨테이너 크기를 기준으로 삼아
              // 변환(transform)이 걸려 있어도 정확한 비율을 유지합니다.
              const box = parent?.getBoundingClientRect();
              if (box) beginDrag(e, layer, box);
            }}
            onPointerMove={(e) => {
              if (!dragRef.current) return;
              applyDrag(e.clientX, e.clientY);
            }}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onLostPointerCapture={() => {
              dragRef.current = null;
              setDragId(null);
            }}
            onClick={(e) => {
              if (!isHomeInlineEditMode) return;
              e.stopPropagation();
              setSelectedHomeLayerId(layer.id);
            }}
          >
            {/* 편집 모드 선택 테두리 & 핸들 */}
            {isHomeInlineEditMode && (
              <div
                className={`absolute -inset-1.5 rounded-lg border-2 border-dashed pointer-events-none ${
                  isSelected ? 'border-blue-500' : 'border-blue-500/45'
                }`}
              >
                <span className="absolute -top-3 left-0 flex items-center gap-1 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap">
                  <GripVertical className="w-2.5 h-2.5" />
                  {isImage ? 'IMAGE' : isBadge ? 'BADGE' : 'TEXT'} · 드래그로 이동
                </span>
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

            {/* 실제 레이어 콘텐츠 */}
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
