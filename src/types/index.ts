export type NavPage = 'home' | 'about' | 'works' | 'service' | 'contact';

/** 사이트 테마 모드: 다크 / 화이트 */
export type ThemeMode = 'dark' | 'light';

// 카테고리 키는 관리자 패널에서 자유롭게 추가/변경할 수 있으므로 문자열로 관리합니다.
// (기본값: 'web' | 'promotion' | 'video')
export type ProjectCategory = string;

export interface BeforeAfterData {
  beforeImage: string;
  afterImage: string;
  beforeNotes: string;
  afterNotes: string;
}

export interface ImpactMetric {
  label: string;
  value: string;
  detail: string;
}

export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  name: string;
  size?: number;
  isCover?: boolean;
}

export interface Project {
  id: string;
  title: string;
  category: ProjectCategory;
  categoryLabel: string;
  client: string;
  year: string;
  image: string;
  gallery?: MediaItem[];
  secondaryImages?: string[];
  videoPreviewUrl?: string;
  tags: string[];
  overview: string;
  strategy: string;
  concept: string;
  scope: string[];
  tools: string[];
  featured: boolean;
  /** @deprecated 등록 폼에서 제거됨. 기존 데이터 호환용으로만 유지 */
  subtitle?: string;
  /** @deprecated 등록 폼에서 제거됨. 기존 데이터 호환용으로만 유지 */
  summary?: string;
  /** @deprecated 등록 폼에서 제거됨. 기존 데이터 호환용으로만 유지 */
  impactMetric?: ImpactMetric;
  /** @deprecated 등록 폼에서 제거됨. 기존 데이터 호환용으로만 유지 */
  deliverables?: string[];
  /** @deprecated 등록 폼에서 제거됨. 기존 데이터 호환용으로만 유지 */
  beforeAfter?: BeforeAfterData;
}

export type InquiryStatus = '신규' | '검토중' | '상담완료' | '계약체결';

export interface ProjectInquiry {
  id: string;
  createdAt: string;
  clientName: string;
  company?: string;
  contact: string;
  email: string;
  categories: string[];
  budget: string;
  schedule: string;
  description: string;
  referenceUrl?: string;
  status: InquiryStatus;
  adminNote?: string;
}

export interface StudioConfig {
  brandName: string;
  statusBanner: string;
  email: string;
  phone: string;
  kakao: string;
  instagram: string;
  availableFrom: string;
  /** 사이트 테마: 'dark' | 'light' */
  theme?: 'dark' | 'light';
}

export interface NavMenuItem {
  id: string;
  label: string;
  page: NavPage;
  enabled: boolean;
}

export interface WorksCategoryItem {
  id: string;
  key: string; // e.g. 'web', 'promotion', 'video'
  label: string;
  desc?: string;
}

export interface AboutStrengthItem {
  id: string;
  number: string;
  title: string;
  desc: string;
}

/**
 * 홈 화면 위에 자유롭게 얹는 커스텀 레이어(요소).
 * - 'text'  : 자유 문구 (제목/설명/이벤트 안내 등)
 * - 'badge' : 강조 배지형 문구
 * - 'image' : 이미지
 */
export type HomeLayerType = 'text' | 'badge' | 'image';

export interface HomeLayer {
  id: string;
  type: HomeLayerType;
  /** text/badge 는 문구, image 는 이미지 URL */
  content: string;
  /** 홈 영역 기준 위치 (%) */
  x: number;
  y: number;
  /** 홈 영역 기준 너비 (%) */
  width: number;
  /** 글자 크기 (px, 홈 기준) */
  fontSize: number;
  /** 글자/배경 색상 (hex) */
  color: string;
  /** 정렬 */
  align: 'left' | 'center' | 'right';
  /** 회전 각도 (deg) */
  rotation: number;
  /** 투명도 0~100 */
  opacity: number;
  /** 표시 여부 */
  visible: boolean;
  /** 굵게 */
  bold?: boolean;
}

/** 홈에서 삭제·이동할 수 있는 블록 키 */
export type HomeBlockKey =
  | 'heroKicker'
  | 'heroHeadline'
  | 'heroSubheadline'
  | 'capabilities'
  | 'heroActions'
  | 'heroTrust'
  | 'heroMedia'
  | 'kpis';

export interface HomeContent {
  heroKicker: string;
  heroHeadline: string;
  heroSubheadline: string;
  capabilities: string[];
  kpis: { id?: string; value: string; label: string; sub: string }[];
  /** Works 섹션 헤더 (미지정 시 기본 문구 사용) */
  worksTitle?: string;
  worksSubtitle?: string;
  /** Services 섹션 헤더 (미지정 시 기본 문구 사용) */
  serviceTitle?: string;
  serviceSubtitle?: string;
  /** 홈 위에 얹는 커스텀 레이어 목록 */
  layers?: HomeLayer[];
  /** 편집 모드에서 '삭제'한 블록 키 목록 (완전 삭제가 아니라 숨김) */
  hiddenBlocks?: string[];
  /** 히어로 좌측 블록 표시 순서 (미지정 시 기본 순서) */
  blockOrder?: string[];
  /** 홈 전체 섹션 표시 순서 (hero/about/works/...) */
  sectionOrder?: string[];
  /** 대표 이미지 카드 위치: 우측 컬럼 / 히어로 하단 전체폭 */
  heroMediaPosition?: 'right' | 'bottom';
}

export interface AboutContent {
  headerTitle: string;
  headerSubtitle: string;
  introNarrative: string;
  philosophyTitle: string;
  philosophyText1: string;
  philosophyText2: string;
  philosophyText3: string;
  strengths: AboutStrengthItem[];
}

export interface ServiceContentItem {
  id: string;
  number: string;
  title: string;
  englishTitle: string;
  tagline: string;
  scopeList: string[];
  deliverables: string[];
  estimatedPeriod: string;
  recommendedFor: string;
  popular?: boolean;
}

export interface ContactContent {
  headerTitle: string;
  headerSubtitle: string;
  introDescription: string;
  responsePledge: string;
}

/** 자주 묻는 질문(Q&A) 항목 */
export interface FaqItem {
  id: string;
  /** 질문 */
  q: string;
  /** 답변 */
  a: string;
}

export interface SiteMenuContent {
  navMenus: NavMenuItem[];
  worksCategories: WorksCategoryItem[];
  home: HomeContent;
  about: AboutContent;
  services: ServiceContentItem[];
  contact: ContactContent;
  /** 자주 묻는 질문 — 관리자 모드에서 추가/수정/삭제/순서 변경 가능 */
  faqs?: FaqItem[];
  /**
   * 홈 화면 문구 오버라이드.
   * key 는 화면상 위치를 나타내는 고유 문자열(예: 'hero.cta.primary'), value 는 사용자가 고친 문구.
   * 값이 없으면 컴포넌트에 지정된 기본 문구를 그대로 씁니다.
   */
  textOverrides?: Record<string, string>;
  /** 홈 화면 이미지 오버라이드. key → 이미지 URL(또는 업로드된 Data URL) */
  imageOverrides?: Record<string, string>;
}

