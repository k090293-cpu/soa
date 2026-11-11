export type NavPage = 'home' | 'about' | 'works' | 'service' | 'contact';

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

export interface HomeContent {
  heroKicker: string;
  heroHeadline: string;
  heroSubheadline: string;
  capabilities: string[];
  kpis: { id?: string; value: string; label: string; sub: string }[];
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

export interface SiteMenuContent {
  navMenus: NavMenuItem[];
  worksCategories: WorksCategoryItem[];
  home: HomeContent;
  about: AboutContent;
  services: ServiceContentItem[];
  contact: ContactContent;
}

