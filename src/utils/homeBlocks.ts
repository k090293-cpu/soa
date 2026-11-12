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

/** 홈 전체 섹션의 기본 순서 */
export const HOME_SECTION_ORDER_DEFAULT = [
  'hero',
  'about',
  'works',
  'services',
  'process',
  'trust',
  'contact',
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
  // 섹션
  hero: '01. HERO',
  about: '02. ABOUT',
  works: '03. WORKS',
  services: '04. SERVICES',
  process: '05. PROCESS',
  trust: '06. TRUST',
  contact: '07. CONTACT',
};

/** 섹션 키 → 설명 (편집 툴팁용) */
export const HOME_SECTION_HINTS: Record<string, string> = {
  hero: '메인 비주얼 · 헤드라인 · KPI',
  about: '스튜디오 소개 · 강점 · 툴',
  works: '대표 포트폴리오 그리드',
  services: '제공 서비스 및 작업 범위',
  process: '작업 프로세스 · FAQ',
  trust: '신뢰 지표 · 후기',
  contact: '견적 문의 폼',
};

/** 저장된 순서를 기본 순서에 병합해 항상 유효한 순서 배열을 만듭니다. */
const mergeOrder = (base: readonly string[], saved?: string[]): string[] => {
  const baseArr: string[] = [...base];
  if (!saved || saved.length === 0) return baseArr;

  const allowed = new Set<string>(baseArr);
  const result = saved.filter((k) => allowed.has(k));

  // 저장 순서에 빠진 키를 기본 순서 기준으로 보충
  baseArr.forEach((key, idx) => {
    if (result.includes(key)) return;
    const insertAt = Math.min(idx, result.length);
    result.splice(insertAt, 0, key);
  });

  return result;
};

/** 히어로 내부 블록 순서 */
export const getBlockOrder = (blockOrder?: string[]): string[] =>
  mergeOrder(HERO_BLOCK_ORDER_DEFAULT, blockOrder);

/** 홈 전체 섹션 순서 */
export const getSectionOrder = (sectionOrder?: string[]): string[] =>
  mergeOrder(HOME_SECTION_ORDER_DEFAULT, sectionOrder);

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

/** 키 배열에서 fromKey 를 toKey 위치로 옮긴 새 배열 */
export const moveKeyTo = (arr: string[], fromKey: string, toKey: string): string[] => {
  const from = arr.indexOf(fromKey);
  const to = arr.indexOf(toKey);
  if (from < 0 || to < 0 || from === to) return arr;
  return moveToIndex(arr, from, to);
};
