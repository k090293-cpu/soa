/**
 * 홈 화면에서 관리자가 삭제/이동할 수 있는 "블록" 정의.
 * 블록 키는 HomeContent.hiddenBlocks / blockOrder 에 저장되는 문자열입니다.
 */

/** 히어로 좌측 컬럼 블록의 기본 순서 */
export const HERO_BLOCK_ORDER_DEFAULT = [
  'heroKicker',
  'heroHeadline',
  'heroSubheadline',
  'capabilities',
  'heroActions',
  'heroTrust',
] as const;

/** 블록 키 → 화면에 보여줄 이름 */
export const HOME_BLOCK_LABELS: Record<string, string> = {
  heroKicker: '상단 킥커',
  heroHeadline: '메인 헤드라인',
  heroSubheadline: '서브 카피',
  capabilities: '역량 칩',
  heroActions: 'CTA 버튼',
  heroTrust: '신뢰 포인트',
  heroMedia: '대표 이미지 카드',
  kpis: 'KPI 지표',
};

/**
 * 저장된 순서(blockOrder)를 기본 순서에 병합해 항상 유효한 순서 배열을 만듭니다.
 * - 저장값에 없는 키(새로 추가된 블록)는 기본 위치에 끼워 넣습니다.
 * - 저장값에만 있는 알 수 없는 키는 버립니다.
 */
export const getBlockOrder = (blockOrder?: string[]): string[] => {
  const base: string[] = [...HERO_BLOCK_ORDER_DEFAULT];
  if (!blockOrder || blockOrder.length === 0) return base;

  const allowed = new Set<string>(base);
  const result = blockOrder.filter((k) => allowed.has(k));

  // 저장 순서에 빠진 키를 기본 순서 기준으로 보충
  base.forEach((key, idx) => {
    if (result.includes(key)) return;
    const insertAt = Math.min(idx, result.length);
    result.splice(insertAt, 0, key);
  });

  return result;
};

/** 배열에서 항목을 위/아래로 이동한 새 배열을 반환 */
export const moveWithinArray = <T,>(arr: T[], index: number, direction: 'up' | 'down'): T[] => {
  const target = direction === 'up' ? index - 1 : index + 1;
  if (index < 0 || index >= arr.length || target < 0 || target >= arr.length) return arr;
  const next = [...arr];
  const [moved] = next.splice(index, 1);
  next.splice(target, 0, moved);
  return next;
};

/** 배열에서 from 위치 항목을 to 위치로 옮긴 새 배열 */
export const moveToIndex = <T,>(arr: T[], from: number, to: number): T[] => {
  if (from === to || from < 0 || to < 0 || from >= arr.length || to >= arr.length) return arr;
  const next = [...arr];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
};
