import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import { HomeLayer } from '../../types';
import { Trash2, GripVertical, Eye, EyeOff, Pencil, ImageUp, Check } from 'lucide-react';
import { processImageFile } from '../../utils/mediaStorage';

/**
 * 홈 화면(미리보기) 위에 관리자가 만든 커스텀 레이어를 그리는 오버레이.
 * - 편집 모드에서만 선택/드래그/삭제/수정이 가능합니다.
 * - 실제 홈에서는 읽기 전용으로 그대로 노출됩니다.
 *
 * 드래그
 *  - 글씨 레이어 / 배지 레이어 / 이미지 레이어 모두 본체를 마우스로 잡고 끌면 이동합니다.
 *  - pointer capture 를 걸어 커서가 레이어 밖으로 나가도 계속 따라옵니다.
 *  - 좌표 기준은 `[data-home-canvas]` (없으면 offsetParent) 이며 x/y/width 는 그 기준 대비 %입니다.
 *
 * 내용 수정 (히어로 레이어)
 *  - 글씨/배지 레이어: 레이어를 더블클릭하거나 ✏️ 버튼을 누르면 그 자리에서 문구를 고칠 수 있습니다.
 *  - 이미지 레이어: 🖼️ 버튼으로 내 컴퓨터의 이미지로 교체할 수 있습니다.
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
  const [editingId, setEditingId] = useState<string | null>(null);

  const editRef = useRef<HTMLDivElement | null>(null);
  const editingIdRef = useRef<string | null>(null);
  const editOriginalRef = useRef<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const pendingImageLayerRef = useRef<string | null>(null);
  // 짧은 간격의 두 번째 pointerdown 을 "더블클릭 = 문구 수정" 으로 판별하기 위한 기록
  const lastDownIdRef = useRef<string | null>(null);
  const lastDownAtRef = useRef<number>(0);

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

  // 편집 모드 종료 시 선택/드래그/문구수정 상태 해제
  useEffect(() => {
    if (!isHomeInlineEditMode) {
      setSelectedHomeLayerId(null);
      dragRef.current = null;
      setDragId(null);
      setHoverId(null);
      setEditingId(null);
      editingIdRef.current = null;
    }
  }, [isHomeInlineEditMode, setSelectedHomeLayerId]);

  // 문구 수정 진입 시 포커스 + 캐럿을 맨 끝으로 (DOM 텍스트는 직접 건드리지 않습니다)
  useEffect(() => {
    if (!editingId) return;
    const el = editRef.current;
    if (!el) return;
    el.focus();
    const sel = window.getSelection();
    if (!sel) return;
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  }, [editingId]);

  /** contentEditable 안의 텍스트를 읽기만 합니다. (쓰기는 절대 하지 않습니다) */
  const readLayerText = (el: HTMLElement): string =>
    (el.innerText ?? '')
      .replace(/\u00a0/g, ' ')
      .replace(/\r\n/g, '\n')
      .replace(/\n+$/g, '');

  const startEdit = (layer: HomeLayer) => {
    if (!isHomeInlineEditMode) return;
    if (layer.type === 'image') return;
    setSelectedHomeLayerId(layer.id);
    editOriginalRef.current = layer.content || '';
    editingIdRef.current = layer.id;
    setEditingId(layer.id);
  };

  const commitEdit = () => {
    const id = editingIdRef.current;
    const el = editRef.current;
    if (!id || !el) {
      setEditingId(null);
      editingIdRef.current = null;
      return;
    }
    const next = readLayerText(el);
    setEditingId(null);
    editingIdRef.current = null;
    if (next !== editOriginalRef.current) {
      updateHomeLayer(id, { content: next });
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    editingIdRef.current = null;
  };

  /** 이미지 레이어 교체 */
  const pickImage = (layerId: string) => {
    pendingImageLayerRef.current = layerId;
    fileInputRef.current?.click();
  };

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    const targetId = pendingImageLayerRef.current;
    pendingImageLayerRef.current = null;
    if (!file || !targetId) return;
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다.');
      return;
    }
    try {
      const dataUrl = await processImageFile(file);
      updateHomeLayer(targetId, { content: dataUrl });
    } catch {
      alert('이미지를 불러오지 못했습니다. 다른 파일로 시도해 주세요.');
    }
  };

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

  const beginDrag = (e: React.PointerEvent<HTMLDivElement>, layer: HomeLayer) => {
    if (!isHomeInlineEditMode) return;
    // 문구 수정 중에는 드래그를 시작하지 않습니다.
    if (editingIdRef.current) return;
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    // ⚠️ preventDefault 는 dblclick 이벤트까지 막습니다.
    //    짧은 간격의 두 번째 pointerdown 은 "더블클릭 = 문구 수정" 으로 처리합니다.
    const now = Date.now();
    const isSecondClick = layer.id === lastDownIdRef.current && now - lastDownAtRef.current < 350;
    lastDownIdRef.current = layer.id;
    lastDownAtRef.current = now;
    if (isSecondClick && layer.type !== 'image') {
      e.preventDefault();
      e.stopPropagation();
      startEdit(layer);
      return;
    }

    const box = resolveCanvasRect(e.currentTarget);
    if (!box) return;

    // ⚠️ e.preventDefault() 를 부르면 브라우저가 이후 click/dblclick 을 아예 만들지 않습니다.
    //    (그래서 더블클릭 문구 수정이 동작하지 않았습니다)
    //    텍스트 선택/이미지 고스트 드래그는 select-none + draggable={false} 로 이미 막혀 있으므로
    //    preventDefault 없이 stopPropagation 만 사용합니다.
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
      {/* ⚠️ display:none 인 input 은 스크립트로 .click() 해도 파일창이 열리지 않습니다.
          sr-only 로 화면에서만 숨겨 실제로 렌더된 상태를 유지합니다.
          방문자 화면에는 아예 렌더하지 않습니다. */}
      {isHomeInlineEditMode && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageFile}
          className="sr-only"
          data-ui="file"
          tabIndex={-1}
        />
      )}

      {layers.map((layer) => {
        if (!layer.visible && !isHomeInlineEditMode) return null;
        const isSelected = selectedHomeLayerId === layer.id;
        const isDragging = dragId === layer.id;
        const isHovered = hoverId === layer.id;
        const isImage = layer.type === 'image';
        const isBadge = layer.type === 'badge';
        const isEditing = editingId === layer.id;
        const showFrame = isHomeInlineEditMode && !isEditing && (isSelected || isHovered || isDragging);
        const typeLabel = isImage ? 'IMAGE' : isBadge ? 'BADGE' : 'TEXT';

        const textStyle: React.CSSProperties = {
          fontSize: `${layer.fontSize}px`,
          color: isBadge ? '#0b0c10' : layer.color,
          textAlign: layer.align,
          fontWeight: layer.bold ? 800 : 600,
          backgroundColor: isBadge ? layer.color : undefined,
          textShadow: isBadge ? undefined : '0 2px 10px rgba(0,0,0,0.6)',
        };

        return (
          <div
            key={layer.id}
            data-home-layer={layer.id}
            data-layer-type={layer.type}
            className={`absolute ${
              isHomeInlineEditMode ? 'pointer-events-auto' : 'pointer-events-none'
            } ${isEditing ? 'z-40' : isSelected ? 'z-30' : 'z-20'} ${
              isDragging ? 'select-none' : ''
            } ${isHomeInlineEditMode && !isEditing ? 'cursor-move' : ''}`}
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
            onPointerLeave={() => setHoverId((prev) => (prev === layer.id ? null : prev))}
            onClick={(e) => {
              if (!isHomeInlineEditMode) return;
              e.stopPropagation();
              setSelectedHomeLayerId(layer.id);
            }}
            onDoubleClick={(e) => {
              if (!isHomeInlineEditMode) return;
              e.stopPropagation();
              startEdit(layer);
            }}
            {...pointerProps(layer)}
          >
            {/* 편집 모드 선택/호버 프레임 — 테두리를 잡아도 드래그됩니다 */}
            {isHomeInlineEditMode && (
              <div
                className={`absolute -inset-1.5 rounded-lg border-2 border-dashed ${
                  showFrame ? 'pointer-events-auto' : 'pointer-events-none'
                } ${
                  isEditing
                    ? 'border-blue-400'
                    : isSelected
                    ? 'border-blue-500 bg-blue-500/5'
                    : isDragging
                    ? 'border-blue-400'
                    : 'border-blue-500/45'
                }`}
                title={
                  isImage
                    ? `${typeLabel} · 잡고 드래그하면 이동합니다`
                    : `${typeLabel} · 잡고 드래그해서 이동 · 더블클릭하면 문구 수정`
                }
                {...(isEditing ? {} : pointerProps(layer))}
              >
                {(showFrame || isEditing) && (
                  <span className="absolute -top-3 left-0 flex items-center gap-1 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap pointer-events-none">
                    <GripVertical className="w-2.5 h-2.5" />
                    {isEditing ? `${typeLabel} · 문구 수정 중` : `${typeLabel} · 드래그로 이동`}
                  </span>
                )}

                {!isEditing && (
                  <div className="absolute -top-3 right-0 flex items-center gap-1 pointer-events-auto">
                    {/* 문구 수정 (글씨/배지) 또는 이미지 교체 (이미지) */}
                    {isImage ? (
                      <button
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          pickImage(layer.id);
                        }}
                        className="h-5 px-1 rounded bg-zinc-900 border border-blue-500 text-blue-300 hover:text-white flex items-center justify-center gap-0.5 cursor-pointer"
                        title="이미지 교체 (내 컴퓨터에서 업로드)"
                      >
                        <ImageUp className="w-3 h-3" />
                        <span className="text-[9px] font-bold pr-0.5">교체</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          startEdit(layer);
                        }}
                        className="h-5 px-1 rounded bg-zinc-900 border border-blue-500 text-blue-300 hover:text-white flex items-center justify-center gap-0.5 cursor-pointer"
                        title="문구 수정 (레이어 더블클릭도 가능)"
                      >
                        <Pencil className="w-3 h-3" />
                        <span className="text-[9px] font-bold pr-0.5">수정</span>
                      </button>
                    )}
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
                )}

                {/* 문구 수정 중 저장 안내 */}
                {isEditing && (
                  <span className="absolute -top-3 right-0 flex items-center gap-1 pointer-events-auto">
                    <span className="bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap">
                      바깥 클릭 시 저장
                    </span>
                    <button
                      type="button"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        editRef.current?.blur();
                      }}
                      className="h-5 px-1 rounded bg-blue-600 border border-blue-400 text-white flex items-center justify-center gap-0.5 cursor-pointer"
                      title="수정 완료"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  </span>
                )}
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
              /* ⚠️ contentEditable 로 전환할 때 key 를 바꿔 노드를 통째로 교체합니다.
                 React 가 관리하던 텍스트 노드를 브라우저가 갈아끼우면
                 removeChild 오류로 화면이 통째로 사라지기 때문입니다. */
              <div
                key={isEditing ? 'editing' : 'view'}
                ref={isEditing ? editRef : undefined}
                contentEditable={isEditing}
                suppressContentEditableWarning
                data-layer-edit={isEditing ? 'true' : undefined}
                className={`whitespace-pre-wrap break-words ${
                  isBadge ? 'inline-block rounded-lg px-3 py-1.5 shadow-lg' : 'leading-snug'
                } ${
                  isEditing
                    ? 'pointer-events-auto cursor-text ring-2 ring-blue-500 bg-blue-500/10 outline-none rounded'
                    : 'select-none pointer-events-none'
                }`}
                style={textStyle}
                onPointerDown={
                  isEditing
                    ? (e) => {
                        // 수정 중에는 드래그가 시작되지 않도록 이벤트를 끊습니다.
                        e.stopPropagation();
                      }
                    : undefined
                }
                onClick={isEditing ? (e) => e.stopPropagation() : undefined}
                onBlur={isEditing ? commitEdit : undefined}
                onKeyDown={
                  isEditing
                    ? (e) => {
                        e.stopPropagation();
                        if (e.key === 'Escape') {
                          e.preventDefault();
                          cancelEdit();
                        } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                          e.preventDefault();
                          e.currentTarget.blur();
                        }
                      }
                    : undefined
                }
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
