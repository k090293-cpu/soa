import { useCallback, useRef, useState } from 'react';

/**
 * 블록을 드래그해서 순서를 바꾸는 훅.
 * - 그립을 pointerdown 하면 포인터 캡처를 걸어, 커서가 블록 밖으로 나가도 추적합니다.
 * - 이동 중 커서 아래의 [data-home-block] 요소를 찾아 드롭 대상으로 삼습니다.
 * - group 을 지정하면 같은 그룹의 블록만 드롭 대상으로 인정합니다.
 *   (섹션 안에 중첩된 히어로 블록 위로 드롭해도 섹션이 바뀌지 않도록)
 * - 드롭 대상은 ref 로도 보관해 pointermove 직후 pointerup 이 와도 값이 유실되지 않게 합니다.
 */
export const useBlockDrag = (
  onDrop: (fromKey: string, toKey: string) => void,
  options: { group?: string } = {}
) => {
  const { group } = options;
  const dragRef = useRef<{ key: string } | null>(null);
  const overRef = useRef<string | null>(null);
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const [overKey, setOverKey] = useState<string | null>(null);

  /** 커서 위치에서 해당 그룹의 블록 키를 찾습니다. */
  const findTargetKey = useCallback(
    (clientX: number, clientY: number): string | null => {
      const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
      if (!el) return null;

      let node: HTMLElement | null = el.closest('[data-home-block]');
      // 그룹이 지정된 경우, 조상으로 올라가며 같은 그룹의 블록을 찾습니다.
      while (node && group && node.getAttribute('data-block-group') !== group) {
        node = node.parentElement?.closest('[data-home-block]') ?? null;
      }
      const key = node?.getAttribute('data-home-block') || null;
      return key && key !== dragRef.current?.key ? key : null;
    },
    [group]
  );

  const start = useCallback((e: React.PointerEvent<HTMLElement>, key: string) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = { key };
    overRef.current = null;
    setDraggingKey(key);
    setOverKey(null);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* 미지원 브라우저 무시 */
    }
  }, []);

  const move = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (!dragRef.current) return;
      const key = findTargetKey(e.clientX, e.clientY);
      if (overRef.current === key) return;
      overRef.current = key;
      setOverKey(key);
    },
    [findTargetKey]
  );

  const end = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      const from = dragRef.current?.key || null;
      const to = overRef.current;
      dragRef.current = null;
      overRef.current = null;
      setDraggingKey(null);
      setOverKey(null);
      try {
        if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {
        /* 이미 해제된 경우 무시 */
      }
      if (from && to && from !== to) onDrop(from, to);
    },
    [onDrop]
  );

  const cancel = useCallback((e?: React.PointerEvent<HTMLElement>) => {
    dragRef.current = null;
    overRef.current = null;
    setDraggingKey(null);
    setOverKey(null);
    if (e) {
      try {
        if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {
        /* 무시 */
      }
    }
  }, []);

  return { draggingKey, overKey, start, move, end, cancel };
};
