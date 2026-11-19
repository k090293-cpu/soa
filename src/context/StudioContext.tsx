import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  Project,
  ProjectInquiry,
  StudioConfig,
  InquiryStatus,
  NavPage,
  SiteMenuContent,
  HomeContent,
  AboutContent,
  ServiceContentItem,
  ContactContent,
  NavMenuItem,
  WorksCategoryItem,
  AboutStrengthItem,
  HomeLayer,
  ThemeMode,
  FaqItem,
} from '../types';
import { INITIAL_PROJECTS, INITIAL_INQUIRIES, INITIAL_STUDIO_CONFIG } from '../data/initialProjects';
import {
  INITIAL_MENU_CONTENT,
  INITIAL_NAV_MENUS,
  INITIAL_WORKS_CATEGORIES,
  INITIAL_ABOUT_STRENGTHS,
  INITIAL_FAQS
} from '../data/servicesData';
import {
  getBlockOrder,
  getSectionOrder,
  moveWithinArray,
  moveToIndex,
  moveKeyTo,
} from '../utils/homeBlocks';
import { offloadMedia, hydrateMedia, containsMediaRef } from '../utils/mediaVault';
import { api } from '../utils/api';
import {
  verifyLocalPassword,
  hasLocalAdminSession,
  startLocalAdminSession,
  clearLocalAdminSession,
} from '../utils/localAdmin';

interface StudioContextType {
  projects: Project[];
  inquiries: ProjectInquiry[];
  config: StudioConfig;
  menuContent: SiteMenuContent;
  updateHomeContent: (data: Partial<HomeContent>) => void;
  updateAboutContent: (data: Partial<AboutContent>) => void;
  updateServiceContent: (serviceId: string, data: Partial<ServiceContentItem>) => void;
  updateContactContent: (data: Partial<ContactContent>) => void;
  resetMenuContentToDefault: () => void;
  // Category management & reordering
  reorderNavMenu: (index: number, direction: 'up' | 'down') => void;
  updateNavMenu: (id: string, data: Partial<NavMenuItem>) => void;
  deleteNavMenu: (id: string) => void;
  addNavMenu: (menu: Omit<NavMenuItem, 'id'>) => void;
  reorderWorksCategory: (index: number, direction: 'up' | 'down') => void;
  updateWorksCategory: (id: string, data: Partial<WorksCategoryItem>) => void;
  deleteWorksCategory: (id: string) => void;
  addWorksCategory: (cat: Omit<WorksCategoryItem, 'id'>) => void;
  reorderServices: (index: number, direction: 'up' | 'down') => void;
  deleteServiceItem: (id: string) => void;
  addServiceItem: (item: Omit<ServiceContentItem, 'id'>) => void;
  reorderAboutStrengths: (index: number, direction: 'up' | 'down') => void;
  updateAboutStrength: (id: string, data: Partial<AboutStrengthItem>) => void;
  deleteAboutStrength: (id: string) => void;
  addAboutStrength: (strength: Omit<AboutStrengthItem, 'id'>) => void;
  reorderHomeKpis: (index: number, direction: 'up' | 'down') => void;
  deleteHomeKpi: (index: number) => void;
  addHomeKpi: (kpi: { value: string; label: string; sub: string }) => void;
  // Q&A(자주 묻는 질문) 관리
  faqs: FaqItem[];
  addFaq: (faq?: Partial<Pick<FaqItem, 'q' | 'a'>>) => string;
  updateFaq: (id: string, data: Partial<Pick<FaqItem, 'q' | 'a'>>) => void;
  deleteFaq: (id: string) => void;
  reorderFaq: (index: number, direction: 'up' | 'down') => void;
  resetFaqs: () => void;
  // 홈 화면 전체 문구 / 이미지 오버라이드
  /** key 에 저장된 문구 (없으면 fallback) */
  siteText: (key: string, fallback: string) => string;
  setSiteText: (key: string, value: string) => void;
  /** key 에 저장된 이미지 URL (없으면 fallback) */
  siteImage: (key: string, fallback: string) => string;
  setSiteImage: (key: string, value: string) => void;
  /** 특정 문구/이미지 오버라이드 제거 (기본값으로 되돌리기) */
  clearSiteOverride: (key: string) => void;
  /** 모든 문구/이미지 오버라이드 초기화 */
  resetSiteOverrides: () => void;
  // 홈 커스텀 레이어 편집 (생성/수정/삭제)
  addHomeLayer: (layer: Omit<HomeLayer, 'id'>) => string;
  updateHomeLayer: (id: string, data: Partial<HomeLayer>) => void;
  deleteHomeLayer: (id: string) => void;
  moveHomeLayer: (index: number, direction: 'up' | 'down') => void;
  resetHomeLayers: () => void;
  // 홈 블록(킥커/버튼/이미지카드/KPI 등) 삭제·복원·이동
  /** 편집 모드에서 숨긴 블록 키 목록 */
  hiddenHomeBlocks: string[];
  /** 히어로 좌측 블록 표시 순서 */
  homeBlockOrder: string[];
  deleteHomeBlock: (key: string) => void;
  restoreHomeBlock: (key: string) => void;
  restoreAllHomeBlocks: () => void;
  moveHomeBlock: (key: string, direction: 'up' | 'down') => void;
  setHomeBlockOrder: (keys: string[]) => void;
  /** KPI 카드를 임의 위치로 이동 */
  moveHomeKpi: (from: number, to: number) => void;
  /** 홈 전체 섹션 순서 */
  homeSectionOrder: string[];
  moveHomeSection: (key: string, direction: 'up' | 'down') => void;
  setHomeSectionOrder: (keys: string[]) => void;
  // 되돌리기 (Ctrl/Cmd+Z)
  undoHomeEdit: () => boolean;
  canUndo: boolean;
  undoDepth: number;
  /** 홈 위에서 직접 글자를 수정할 수 있는 편집 모드 여부 */
  isHomeInlineEditMode: boolean;
  setIsHomeInlineEditMode: (on: boolean) => void;
  /** 현재 선택된 레이어 id */
  selectedHomeLayerId: string | null;
  setSelectedHomeLayerId: (id: string | null) => void;
  // Editor view modes (Modal vs Split Home Preview)
  isSplitEditorOpen: boolean;
  setIsSplitEditorOpen: (open: boolean) => void;
  currentPage: NavPage;
  setCurrentPage: (page: NavPage) => void;
  navigateTo: (page: NavPage, targetSectionId?: string) => void;
  isAdminLoggedIn: boolean;
  isAdminModalOpen: boolean;
  setIsAdminModalOpen: (open: boolean) => void;
  /**
   * 관리자 로그인. 비밀번호 검증은 서버에서만 이루어집니다.
   * (예전처럼 비밀번호가 프론트엔드 번들에 들어 있지 않습니다)
   */
  loginAdmin: (password: string) => Promise<{ ok: boolean; message?: string }>;
  logoutAdmin: () => Promise<void>;
  /** 서버 콘텐츠 저장이 진행 중인지 (관리자 저장 상태 표시용) */
  isSavingToServer: boolean;
  /** 마지막으로 서버 저장에 성공한 시각 (없으면 null) */
  lastServerSaveAt: string | null;
  /** 서버에 연결할 수 있는지 여부 (false 면 정적 배포 모드로 동작) */
  isServerOnline: boolean;
  addProject: (projectData: Omit<Project, 'id'>) => void;
  updateProject: (id: string, updated: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  resetProjectsToDefault: () => void;
  // 포트폴리오 백업 / 복원
  backupProjects: () => { ok: boolean; savedAt?: string; error?: string };
  restoreProjectsFromBackup: () => boolean;
  deleteBackup: () => void;
  backupInfo: { savedAt: string; count: number } | null;
  addInquiry: (
    inquiryData: Omit<ProjectInquiry, 'id' | 'createdAt' | 'status'>
  ) => Promise<{ ok: boolean; message?: string; offline?: boolean }>;
  /** 관리자: 서버에서 최신 문의 목록을 다시 불러옵니다. */
  refreshInquiries: () => Promise<void>;
  updateInquiryStatus: (id: string, status: InquiryStatus, adminNote?: string) => void;
  deleteInquiry: (id: string) => void;
  updateConfig: (updated: Partial<StudioConfig>) => void;
  /** 현재 사이트 테마 */
  theme: ThemeMode;
  /** 테마 변경 (관리자 설정) */
  setTheme: (next: ThemeMode) => void;
  /** 다크 <-> 화이트 토글 */
  toggleTheme: () => void;
  activeProjectDetail: Project | null;
  setActiveProjectDetail: (p: Project | null) => void;
  selectedInquiryCategory: string | null;
  setSelectedInquiryCategory: (cat: string | null) => void;
  scrollToSection: (sectionId: string) => void;
  /**
   * 저장 공간 문제로 자동 저장이 실패했을 때 관리자에게 보여줄 경고.
   * (예전에는 콘솔에만 남겨서 사용자가 저장 실패를 알 수 없었습니다)
   */
  storageWarning: StorageWarning | null;
  dismissStorageWarning: () => void;
  /** IndexedDB 에 보관된 미디어 복원이 끝났는지 여부 */
  isHydrated: boolean;
}

/** 자동 저장 실패 경고 */
export interface StorageWarning {
  /** 실패한 저장 키 (projects / menuContent ...) */
  key: string;
  /** 화면에 그대로 노출할 안내 문구 */
  message: string;
}

const StudioContext = createContext<StudioContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PROJECTS: 'soa_studio_projects_v2',
  PROJECTS_BACKUP: 'soa_studio_projects_backup_v1',
  INQUIRIES: 'soa_studio_inquiries_v2',
  CONFIG: 'soa_studio_config_v2',
  MENU_CONTENT: 'soa_menu_content_v2',
};

/** 현재 시각을 'YYYY-MM-DD HH:mm' 형식으로 반환 */
const formatNow = () => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

/** localStorage 에서 포트폴리오를 읽습니다. (없거나 깨졌으면 기본값) */
const loadProjectsFromStorage = (): Project[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed as Project[];
    }
  } catch (e) {
    console.error('Failed to load projects from storage', e);
  }
  return INITIAL_PROJECTS;
};

/** localStorage 에서 홈/메뉴 문구를 읽습니다. (없거나 깨졌으면 기본값) */
const loadMenuContentFromStorage = (): SiteMenuContent => {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.MENU_CONTENT);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...INITIAL_MENU_CONTENT,
        ...parsed,
        navMenus: parsed.navMenus || INITIAL_NAV_MENUS,
        worksCategories: parsed.worksCategories || INITIAL_WORKS_CATEGORIES,
        home: {
          ...INITIAL_MENU_CONTENT.home,
          ...(parsed.home || {}),
          capabilities: parsed.home?.capabilities || INITIAL_MENU_CONTENT.home.capabilities,
          kpis: parsed.home?.kpis || INITIAL_MENU_CONTENT.home.kpis,
        },
        about: {
          ...INITIAL_MENU_CONTENT.about,
          ...(parsed.about || {}),
          strengths: parsed.about?.strengths || INITIAL_ABOUT_STRENGTHS,
        },
        services: parsed.services || INITIAL_MENU_CONTENT.services,
        contact: {
          ...INITIAL_MENU_CONTENT.contact,
          ...(parsed.contact || {}),
        },
        // 기존 저장본에는 faqs 가 없을 수 있으므로 기본값으로 보충합니다.
        faqs: Array.isArray(parsed.faqs) ? parsed.faqs : INITIAL_FAQS,
      };
    }
  } catch (e) {
    console.error('Failed to load menu content from storage', e);
  }
  return INITIAL_MENU_CONTENT;
};

/** 저장 실패 시 관리자에게 보여줄 안내 문구 */
const storageErrorMessage = (label: string) =>
  `${label} 자동 저장에 실패했습니다. 브라우저 저장 공간이 가득 찼을 수 있습니다. ` +
  '용량이 큰 이미지/영상을 정리한 뒤 다시 시도해 주세요. (지금 화면의 변경 내용은 새로고침하면 사라집니다)';

/**
 * 서버 저장 여부를 판단하기 위한 스냅샷 문자열.
 * 콘텐츠가 실제로 바뀌었을 때만 PUT 하도록, 직전에 저장/로드한 값과 비교합니다.
 * (테마 토글처럼 잦은 변경이 매번 디스크 쓰기로 이어지지 않게 하려는 목적)
 */
const snapshotKey = (
  projects: Project[] | null | undefined,
  menuContent: SiteMenuContent | null | undefined,
  config: StudioConfig | null | undefined
) => JSON.stringify({ projects: projects ?? null, menuContent: menuContent ?? null, config: config ?? null });

export const StudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load Projects
  const [projects, setProjects] = useState<Project[]>(loadProjectsFromStorage);

  // Load Inquiries
  const [inquiries, setInquiries] = useState<ProjectInquiry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INQUIRIES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          /*
           * 예전 버전이 넣어 둔 가짜 데모 문의('김민준 팀장' 등)가 브라우저에 남아 있으면
           * 실제 접수된 문의처럼 보입니다. 알려진 데모 id 는 걸러냅니다.
           * (서버에서 내려온 실제 문의는 id 가 inq-<timestamp>-<hex> 형식입니다)
           */
          const DEMO_IDS = new Set(['inq-1718001', 'inq-1717892']);
          return (parsed as ProjectInquiry[]).filter((item) => item && !DEMO_IDS.has(item.id));
        }
      }
    } catch (e) {
      console.error('Failed to load inquiries from storage', e);
    }
    return INITIAL_INQUIRIES;
  });

  // Load Config
  const [config, setConfig] = useState<StudioConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load config from storage', e);
    }
    return INITIAL_STUDIO_CONFIG;
  });

  // Load Editable Menu Content
  const [menuContent, setMenuContent] = useState<SiteMenuContent>(loadMenuContentFromStorage);

  // Split Editor View Mode (Edit while viewing full home)
  const [isSplitEditorOpen, setIsSplitEditorOpen] = useState(false);

  // 홈 위 직접 편집 모드 & 선택된 레이어
  const [isHomeInlineEditMode, setIsHomeInlineEditMode] = useState(false);
  const [selectedHomeLayerId, setSelectedHomeLayerId] = useState<string | null>(null);

  // Page Routing State ('home' | 'about' | 'works' | 'service' | 'contact')
  const [currentPage, setCurrentPage] = useState<NavPage>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '') as NavPage;
      if (['home', 'about', 'works', 'service', 'contact'].includes(hash)) {
        return hash;
      }
    }
    return 'home';
  });

  // Listen to hash change for browser navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as NavPage;
      if (['home', 'about', 'works', 'service', 'contact'].includes(hash)) {
        setCurrentPage(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (page: NavPage, targetSectionId?: string) => {
    setCurrentPage(page);
    window.location.hash = page;
    if (targetSectionId) {
      setTimeout(() => {
        scrollToSection(targetSectionId);
      }, 100);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Admin Auth State
  // 예전에는 sessionStorage 플래그만 봤기 때문에 누구나 개발자 도구로 우회할 수 있었습니다.
  // 이제는 서버가 발급한 HttpOnly 세션 쿠키가 유일한 근거이며, 아래 effect 에서 서버에 확인합니다.
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // ── 서버 연동 상태 ──────────────────────────────────────────────────────
  // isServerOnline: /api/content 에 응답이 있는지. false 면 정적 배포 모드(기존 동작)로 동작합니다.
  const [isServerOnline, setIsServerOnline] = useState(false);
  const [isSavingToServer, setIsSavingToServer] = useState(false);
  const [lastServerSaveAt, setLastServerSaveAt] = useState<string | null>(null);

  // Active Project Detail Modal
  const [activeProjectDetail, setActiveProjectDetail] = useState<Project | null>(null);

  // Selected Category preset for quick quote transfer
  const [selectedInquiryCategory, setSelectedInquiryCategory] = useState<string | null>(null);

  // 자동 저장 실패 경고 & IndexedDB 복원 완료 여부
  const [storageWarning, setStorageWarning] = useState<StorageWarning | null>(null);
  /**
   * 저장본에 idb-media:// 참조가 없으면 복원할 것이 없으므로 처음부터 완료 상태입니다.
   * 참조가 있을 때만 false 로 시작해, 실제 이미지가 준비될 때까지 첫 화면을 잠시 미룹니다.
   * (참조 문자열이 img src 로 잠깐 노출되는 깜빡임을 막습니다)
   */
  const [isHydrated, setIsHydrated] = useState(
    () => !containsMediaRef(projects) && !containsMediaRef(menuContent)
  );
  const dismissStorageWarning = useCallback(() => setStorageWarning(null), []);

  // 저장용(가벼운) 사본 캐시 — 백업에서도 그대로 재사용합니다.
  const lightProjectsRef = useRef<Project[] | null>(null);
  // 최초 렌더 시점의 상태 참조. 복원이 "사용자가 아직 아무것도 건드리지 않았을 때"만
  // 적용되도록 비교 기준으로 씁니다.
  const initialProjectsRef = useRef(projects);
  const initialMenuRef = useRef(menuContent);

  // 서버에 마지막으로 저장(또는 로드)한 스냅샷. 불필요한 재저장을 막는 비교 기준입니다.
  const lastSyncedRef = useRef<string>('');

  /**
   * ── 서버 부트스트랩 ─────────────────────────────────────────────────────
   * 1) /api/content 로 "모든 방문자에게 공통인" 콘텐츠를 받아옵니다.
   *    서버에 저장된 값이 없으면(null) 번들 기본값을 그대로 쓰므로 미리보기도 동일하게 보입니다.
   * 2) /api/auth/session 으로 HttpOnly 세션 쿠키의 유효성을 확인합니다.
   *    (예전의 sessionStorage 플래그는 누구나 위조할 수 있어 더 이상 사용하지 않습니다)
   */
  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      const [remote, authenticated] = await Promise.all([api.getContent(), api.getSession()]);
      if (cancelled) return;

      // 서버가 응답하면 "서버 모드" 입니다. 실패하면 정적 배포 모드로 남습니다.
      const online = remote !== null;
      setIsServerOnline(online);
      /*
       * 로그인 판정
       *  1) 서버가 살아 있으면 서버 세션(HttpOnly 쿠키)이 유일한 근거입니다.
       *  2) 서버가 없는 정적 배포에서는 서버 로그인 자체가 불가능하므로,
       *     브라우저에 남아 있는 로컬 관리자 세션(12시간)을 확인합니다.
       */
      setIsAdminLoggedIn(online ? authenticated : hasLocalAdminSession());

      if (remote) {
        // 부트스트랩은 최초 렌더 직후 1회만 실행되고, 그 전에는 사용자가 아무것도 편집할 수 없습니다.
        // 따라서 서버 값이 "관리자가 방금 고친 내용"을 덮어쓸 위험은 없습니다.
        if (remote.projects && Array.isArray(remote.projects) && remote.projects.length > 0) {
          setProjects(remote.projects);
        }
        if (remote.menuContent) {
          setMenuContent((prev) => ({
            ...prev,
            ...remote.menuContent!,
            // 서버 값이 일부만 있어도 화면이 깨지지 않도록 필수 하위 구조를 보정합니다.
            navMenus: remote.menuContent!.navMenus || prev.navMenus,
            worksCategories: remote.menuContent!.worksCategories || prev.worksCategories,
            home: { ...prev.home, ...(remote.menuContent!.home || {}) },
            about: { ...prev.about, ...(remote.menuContent!.about || {}) },
            contact: { ...prev.contact, ...(remote.menuContent!.contact || {}) },
          }));
        }
        if (remote.config) {
          setConfig((prev) => ({ ...prev, ...remote.config! }));
        }
        if (remote.updatedAt) {
          setLastServerSaveAt(remote.updatedAt);
          lastSyncedRef.current = snapshotKey(remote.projects, remote.menuContent, remote.config);
        }
      }

      // 서버 콘텐츠 로드가 끝났으므로 화면을 열어 줍니다.
      setIsHydrated(true);
    };

    void bootstrap();
    return () => {
      cancelled = true;
    };
    // 최초 1회만 실행합니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── IndexedDB 미디어 복원 ────────────────────────────────────────────────
  // 저장된 값에는 이미지가 idb-media://... 짧은 참조로 들어 있을 수 있습니다.
  // 최초 렌더는 참조 그대로 보여주고, IndexedDB 를 읽어 실제 이미지로 되돌립니다.
  useEffect(() => {
    let cancelled = false;

    const hydrateAll = async () => {
      try {
        // localStorage 를 다시 읽어 "지금 저장된 상태"를 기준으로 복원합니다.
        const rawProjects = loadProjectsFromStorage();
        if (containsMediaRef(rawProjects)) {
          const full = await hydrateMedia(rawProjects);
          if (!cancelled) {
            lightProjectsRef.current = rawProjects;
            // 사용자가 이미 편집을 시작했다면 덮어쓰지 않습니다.
            setProjects((prev) => (prev === initialProjectsRef.current ? full : prev));
          }
        }

        const rawMenu = loadMenuContentFromStorage();
        if (containsMediaRef(rawMenu)) {
          const full = await hydrateMedia(rawMenu);
          if (!cancelled) {
            setMenuContent((prev) => (prev === initialMenuRef.current ? full : prev));
          }
        }
      } catch (e) {
        console.warn('[StudioContext] 미디어 복원 중 오류가 발생했습니다.', e);
      } finally {
        // 복원에 실패해도 저장은 계속 동작해야 하므로 항상 플래그를 세웁니다.
        if (!cancelled) setIsHydrated(true);
      }
    };

    void hydrateAll();
    return () => {
      cancelled = true;
    };
    // 최초 1회만 실행합니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 열려 있는 프로젝트 상세 모달도 실제 이미지로 되돌립니다.
  useEffect(() => {
    if (!isHydrated) return;
    setActiveProjectDetail((prev) => {
      if (!prev) return prev;
      // 참조가 남아 있을 때만 복원합니다.
      if (!containsMediaRef(prev)) return prev;
      void hydrateMedia(prev).then((full) => {
        setActiveProjectDetail((cur) => (cur && cur.id === prev.id ? full : cur));
      });
      return prev;
    });
  }, [isHydrated]);

  // ── localStorage 저장 (미디어는 IndexedDB 로 분리) ────────────────────────
  // 저장 직전에 긴 data: URL 을 IndexedDB 로 옮기고 짧은 참조만 남깁니다.
  // 이렇게 해야 사진을 여러 장 올려도 5MB 한도에 걸리지 않아 관리자 수정이 홈에 그대로 저장됩니다.
  useEffect(() => {
    // 복원이 끝나기 전에 저장하면 참조가 실제 데이터보다 먼저 덮어써질 수 있어 건너뜁니다.
    if (!isHydrated) return;

    let cancelled = false;
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const light = await offloadMedia(projects);
          if (cancelled) return;
          lightProjectsRef.current = light;
          localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(light));
          setStorageWarning((prev) => (prev?.key === 'projects' ? null : prev));
        } catch (e) {
          console.error('Failed to save projects to storage', e);
          setStorageWarning({ key: 'projects', message: storageErrorMessage('포트폴리오') });
        }
      })();
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [projects, isHydrated]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.INQUIRIES, JSON.stringify(inquiries));
    } catch (e) {
      console.error('Failed to save inquiries to storage', e);
    }
  }, [inquiries]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
    } catch (e) {
      console.error('Failed to save config to storage', e);
    }
  }, [config]);

  useEffect(() => {
    if (!isHydrated) return;

    let cancelled = false;
    const timer = setTimeout(() => {
      void (async () => {
        try {
          // 홈 이미지 오버라이드 / 레이어 이미지도 IndexedDB 로 분리합니다.
          const light = await offloadMedia(menuContent);
          if (cancelled) return;
          localStorage.setItem(STORAGE_KEYS.MENU_CONTENT, JSON.stringify(light));
          setStorageWarning((prev) => (prev?.key === 'menuContent' ? null : prev));
        } catch (e) {
          console.error('Failed to save menu content to storage', e);
          setStorageWarning({ key: 'menuContent', message: storageErrorMessage('홈 편집 내용') });
        }
      })();
    }, 200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [menuContent, isHydrated]);

  // ── 서버 저장 (관리자 편집 → 모든 방문자에게 반영) ─────────────────────────
  // 이 effect 가 "관리자가 고친 내용이 다른 사람에게 보이지 않던" 문제를 해결합니다.
  //  · 조건: 서버가 살아 있고 + 관리자로 로그인되어 있을 때만 저장합니다.
  //    (방문자 브라우저가 서버 콘텐츠를 실수로 덮어쓰는 사고를 원천 차단)
  //  · 스냅샷 비교: 직전에 저장/로드한 값과 같으면 요청하지 않습니다.
  //    (테마 토글·되돌리기 등 잦은 변경이 매번 디스크 쓰기로 이어지지 않게 함)
  useEffect(() => {
    if (!isHydrated || !isAdminLoggedIn || !isServerOnline) return;

    const key = snapshotKey(projects, menuContent, config);
    if (key === lastSyncedRef.current) return;

    let cancelled = false;
    // 타이핑/드래그 중간 상태를 매번 저장하지 않도록 잠깐 모읍니다.
    const timer = setTimeout(() => {
      void (async () => {
        setIsSavingToServer(true);
        const result = await api.saveContent({ projects, menuContent, config });
        if (cancelled) return;

        setIsSavingToServer(false);

        if (result.ok) {
          lastSyncedRef.current = key;
          setLastServerSaveAt(new Date().toISOString());
          setStorageWarning((prev) => (prev?.key === 'server' ? null : prev));
          return;
        }

        // 세션이 만료되었으면 관리자 상태를 내려 편집을 계속하지 못하게 합니다.
        if (result.unauthorized) {
          setIsAdminLoggedIn(false);
          setIsHomeInlineEditMode(false);
        }

        setStorageWarning({
          key: 'server',
          message:
            result.message ||
            '서버 저장에 실패했습니다. 변경 내용이 아직 다른 방문자에게 반영되지 않았습니다.',
        });
      })();
    }, 800);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [projects, menuContent, config, isHydrated, isAdminLoggedIn, isServerOnline]);

  // 관리자 로그인 시 최신 문의 목록을 서버에서 가져옵니다.
  // (문의는 공개 GET 이 아니므로 로그인 전에는 조회할 수 없습니다)
  useEffect(() => {
    if (!isAdminLoggedIn) return;
    void refreshInquiries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdminLoggedIn]);

  // 사이트 테마(다크 / 화이트) 적용 ─────────────────────────────────────────
  const theme: ThemeMode = config.theme === 'light' ? 'light' : 'dark';

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.style.colorScheme = theme;
    root.style.backgroundColor = theme === 'light' ? '#eef0f4' : '#0b0c10';
  }, [theme]);

  const setTheme = (next: ThemeMode) => {
    setConfig((prev) => ({ ...prev, theme: next }));
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  /**
   * 관리자 로그인.
   *
   * [두 가지 경로]
   *  1순위 — 서버가 살아 있으면 서버에서 검증합니다(scrypt 해시, HttpOnly 세션 쿠키).
   *  2순위 — 서버가 없으면(정적 호스팅) 브라우저에서 PBKDF2 해시로 검증합니다.
   *          이 경로는 편의를 위한 잠금이며 보안 경계가 아닙니다(개발자 도구로 우회 가능).
   *          비밀번호 평문은 번들에 들어가지 않고 해시만 들어갑니다.
   */
  const loginAdmin = async (password: string): Promise<{ ok: boolean; message?: string }> => {
    // 서버가 없는 것이 이미 확인된 경우 → 로컬 검증으로 바로 갑니다.
    if (!isServerOnline) {
      const valid = await verifyLocalPassword(password);
      if (valid) {
        startLocalAdminSession();
        setIsAdminLoggedIn(true);
        return { ok: true };
      }
      return { ok: false, message: '비밀번호가 일치하지 않습니다.' };
    }

    const result = await api.login(password);
    if (result.ok) {
      setIsAdminLoggedIn(true);
      return { ok: true };
    }

    // 서버에 닿지 않는 경우(오프라인/네트워크 오류)에만 로컬 검증으로 한 번 더 시도합니다.
    if (result.offline) {
      setIsServerOnline(false);
      const valid = await verifyLocalPassword(password);
      if (valid) {
        startLocalAdminSession();
        setIsAdminLoggedIn(true);
        return { ok: true };
      }
      return { ok: false, message: '비밀번호가 일치하지 않습니다.' };
    }

    return { ok: false, message: result.message || '비밀번호가 일치하지 않습니다.' };
  };

  const logoutAdmin = async (): Promise<void> => {
    setIsAdminLoggedIn(false);
    // 편집 모드가 켜진 채 남아 방문자가 글자를 수정할 수 있는 문제를 방지합니다.
    setIsHomeInlineEditMode(false);
    setSelectedHomeLayerId(null);
    setIsSplitEditorOpen(false);
    setIsAdminModalOpen(false);
    clearLocalAdminSession();
    await api.logout();
  };

  // 관리자 권한이 없어지거나 모달이 닫히면 편집 모드를 반드시 해제합니다.
  useEffect(() => {
    if (!isAdminLoggedIn || !isAdminModalOpen) {
      setIsHomeInlineEditMode(false);
      setSelectedHomeLayerId(null);
    }
    if (!isAdminLoggedIn) {
      setIsSplitEditorOpen(false);
    }
  }, [isAdminLoggedIn, isAdminModalOpen]);

  // CRUD for Projects
  const addProject = (projectData: Omit<Project, 'id'>) => {
    const newProj: Project = {
      ...projectData,
      id: `proj-${Date.now()}`,
    };
    setProjects((prev) => [newProj, ...prev]);
  };

  const updateProject = (id: string, updated: Partial<Project>) => {
    setProjects((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updated } : item))
    );
    if (activeProjectDetail?.id === id) {
      setActiveProjectDetail((prev) => (prev ? { ...prev, ...updated } : null));
    }
  };

  const deleteProject = (id: string) => {
    setProjects((prev) => prev.filter((item) => item.id !== id));
    if (activeProjectDetail?.id === id) {
      setActiveProjectDetail(null);
    }
  };

  const resetProjectsToDefault = () => {
    setProjects(INITIAL_PROJECTS);
  };

  // ── 포트폴리오 백업 / 복원 ──────────────────────────────────────────
  // 백업 정보는 저장 시각과 당시 프로젝트 수를 함께 보관합니다.
  const [backupInfo, setBackupInfo] = useState<{ savedAt: string; count: number } | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PROJECTS_BACKUP);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.projects)) {
        return { savedAt: parsed.savedAt, count: parsed.projects.length };
      }
    } catch (e) {
      console.warn('Failed to read backup info', e);
    }
    return null;
  });

  /** 현재 포트폴리오를 브라우저에 백업합니다. (한 개의 최신 백업만 유지) */
  const backupProjects = (): { ok: boolean; savedAt?: string; error?: string } => {
    try {
      const savedAt = formatNow();
      // 이미 IndexedDB 로 분리된(가벼운) 사본을 쓰면 백업도 용량 한도에 걸리지 않습니다.
      const payload = lightProjectsRef.current || projects;
      localStorage.setItem(
        STORAGE_KEYS.PROJECTS_BACKUP,
        JSON.stringify({ savedAt, savedTs: Date.now(), projects: payload })
      );
      setBackupInfo({ savedAt, count: projects.length });
      return { ok: true, savedAt };
    } catch (e) {
      console.error('Failed to create backup', e);
      return {
        ok: false,
        error: '저장 공간이 부족하여 백업에 실패했습니다. 미디어 용량이 큰 경우 일부를 정리한 뒤 다시 시도해 주세요.',
      };
    }
  };

  /** 마지막 백업 시점의 포트폴리오로 되돌립니다. */
  const restoreProjectsFromBackup = (): boolean => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PROJECTS_BACKUP);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.projects)) return false;
      const restored = parsed.projects as Project[];
      setProjects(restored);
      setActiveProjectDetail(null);
      // 백업본에 idb-media:// 참조가 남아 있으면 실제 이미지로 되돌립니다.
      if (containsMediaRef(restored)) {
        void hydrateMedia(restored).then((full) => setProjects(full));
      }
      return true;
    } catch (e) {
      console.error('Failed to restore backup', e);
      return false;
    }
  };

  /** 저장된 백업을 삭제합니다. */
  const deleteBackup = () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.PROJECTS_BACKUP);
    } catch (e) {
      console.error('Failed to delete backup', e);
    }
    setBackupInfo(null);
  };

  // Inquiry operations
  // 예전에는 문의가 제출한 사람의 브라우저에만 남아 관리자가 볼 수 없었습니다(사실상 유실).
  // 이제는 서버에 저장하고, 화면에는 "이번 세션의 사본"만 유지합니다.
  const addInquiry = async (
    inquiryData: Omit<ProjectInquiry, 'id' | 'createdAt' | 'status'>
  ): Promise<{ ok: boolean; message?: string; offline?: boolean }> => {
    const result = await api.createInquiry(inquiryData as unknown as Record<string, unknown>);

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newInq: ProjectInquiry = {
      ...inquiryData,
      id: `inq-local-${Date.now()}`,
      createdAt: formattedDate,
      status: '신규',
    };

    if (!result.ok) {
      /*
       * 서버가 없는 정적 배포(Netlify 등)에서는 문의를 접수할 수 없습니다.
       * 이때도 작성한 내용을 로컬에 남겨 두어, 같은 브라우저의 관리자 화면에서
       * 최소한 확인할 수 있게 합니다. (방문자에게는 실패를 정직하게 알립니다)
       */
      if (result.offline) {
        setInquiries((prev) => {
          // 같은 내용이 중복 저장되지 않도록 방어
          if (prev.some((item) => item.id === newInq.id)) return prev;
          return [newInq, ...prev];
        });
      }
      return result;
    }

    // 서버 저장에 성공한 경우에만 화면 목록에도 반영합니다.
    setInquiries((prev) => [newInq, ...prev]);

    // 방문자는 문의 목록을 볼 수 없으므로, 관리자 화면은 다음 새로고침 때 서버에서 다시 읽습니다.
    return { ok: true };
  };

  /** 관리자: 서버에서 최신 문의 목록을 다시 불러옵니다. */
  const refreshInquiries = async () => {
    const list = await api.listInquiries();
    if (list) setInquiries(list);
  };

  const updateInquiryStatus = (id: string, status: InquiryStatus, adminNote?: string) => {
    // 화면을 먼저 갱신해 즉시 반응하도록 하고(낙관적 업데이트), 서버에도 반영합니다.
    setInquiries((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status,
              ...(adminNote !== undefined ? { adminNote } : {}),
            }
          : item
      )
    );

    // 로컬에서만 만든 항목(서버 저장 실패)은 서버에 존재하지 않으므로 건너뜁니다.
    if (!id.startsWith('inq-local-')) {
      void api.updateInquiry(id, {
        status,
        ...(adminNote !== undefined ? { adminNote } : {}),
      });
    }
  };

  const deleteInquiry = (id: string) => {
    setInquiries((prev) => prev.filter((item) => item.id !== id));
    if (!id.startsWith('inq-local-')) {
      void api.deleteInquiry(id);
    }
  };

  const updateConfig = (updated: Partial<StudioConfig>) => {
    setConfig((prev) => ({ ...prev, ...updated }));
  };

  // Menu Content Updating Handlers
  const updateHomeContent = (data: Partial<HomeContent>) => {
    setMenuContent((prev) => ({
      ...prev,
      home: { ...prev.home, ...data },
    }));
  };

  const updateAboutContent = (data: Partial<AboutContent>) => {
    setMenuContent((prev) => ({
      ...prev,
      about: { ...prev.about, ...data },
    }));
  };

  const updateServiceContent = (serviceId: string, data: Partial<ServiceContentItem>) => {
    setMenuContent((prev) => ({
      ...prev,
      services: prev.services.map((s) => (s.id === serviceId ? { ...s, ...data } : s)),
    }));
  };

  const updateContactContent = (data: Partial<ContactContent>) => {
    setMenuContent((prev) => ({
      ...prev,
      contact: { ...prev.contact, ...data },
    }));
  };

  const resetMenuContentToDefault = () => {
    setMenuContent(INITIAL_MENU_CONTENT);
  };

  // Category Array Reordering Helper
  const moveItemInArray = <T,>(arr: T[], index: number, direction: 'up' | 'down'): T[] => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= arr.length) return arr;
    const newArr = [...arr];
    const [moved] = newArr.splice(index, 1);
    newArr.splice(targetIndex, 0, moved);
    return newArr;
  };

  // Nav menus handlers
  const reorderNavMenu = (index: number, direction: 'up' | 'down') => {
    setMenuContent((prev) => ({
      ...prev,
      navMenus: moveItemInArray(prev.navMenus, index, direction),
    }));
  };

  const updateNavMenu = (id: string, data: Partial<NavMenuItem>) => {
    setMenuContent((prev) => ({
      ...prev,
      navMenus: prev.navMenus.map((m) => (m.id === id ? { ...m, ...data } : m)),
    }));
  };

  const deleteNavMenu = (id: string) => {
    setMenuContent((prev) => ({
      ...prev,
      navMenus: prev.navMenus.filter((m) => m.id !== id),
    }));
  };

  const addNavMenu = (menu: Omit<NavMenuItem, 'id'>) => {
    const newMenu: NavMenuItem = {
      ...menu,
      id: `nav-${Date.now()}`,
    };
    setMenuContent((prev) => ({
      ...prev,
      navMenus: [...prev.navMenus, newMenu],
    }));
  };

  // Works Categories handlers
  const reorderWorksCategory = (index: number, direction: 'up' | 'down') => {
    setMenuContent((prev) => ({
      ...prev,
      worksCategories: moveItemInArray(prev.worksCategories, index, direction),
    }));
  };

  const updateWorksCategory = (id: string, data: Partial<WorksCategoryItem>) => {
    setMenuContent((prev) => ({
      ...prev,
      worksCategories: prev.worksCategories.map((c) => (c.id === id ? { ...c, ...data } : c)),
    }));
  };

  const deleteWorksCategory = (id: string) => {
    setMenuContent((prev) => ({
      ...prev,
      worksCategories: prev.worksCategories.filter((c) => c.id !== id),
    }));
  };

  const addWorksCategory = (cat: Omit<WorksCategoryItem, 'id'>) => {
    const newCat: WorksCategoryItem = {
      ...cat,
      id: `cat-${Date.now()}`,
    };
    setMenuContent((prev) => ({
      ...prev,
      worksCategories: [...prev.worksCategories, newCat],
    }));
  };

  // Services category handlers
  const reorderServices = (index: number, direction: 'up' | 'down') => {
    setMenuContent((prev) => ({
      ...prev,
      services: moveItemInArray(prev.services, index, direction),
    }));
  };

  const deleteServiceItem = (id: string) => {
    setMenuContent((prev) => ({
      ...prev,
      services: prev.services.filter((s) => s.id !== id),
    }));
  };

  const addServiceItem = (item: Omit<ServiceContentItem, 'id'>) => {
    const newItem: ServiceContentItem = {
      ...item,
      id: `serv-${Date.now()}`,
    };
    setMenuContent((prev) => ({
      ...prev,
      services: [...prev.services, newItem],
    }));
  };

  // About strengths handlers
  const reorderAboutStrengths = (index: number, direction: 'up' | 'down') => {
    setMenuContent((prev) => ({
      ...prev,
      about: {
        ...prev.about,
        strengths: moveItemInArray(prev.about.strengths, index, direction),
      },
    }));
  };

  const updateAboutStrength = (id: string, data: Partial<AboutStrengthItem>) => {
    setMenuContent((prev) => ({
      ...prev,
      about: {
        ...prev.about,
        strengths: prev.about.strengths.map((st) => (st.id === id ? { ...st, ...data } : st)),
      },
    }));
  };

  const deleteAboutStrength = (id: string) => {
    setMenuContent((prev) => ({
      ...prev,
      about: {
        ...prev.about,
        strengths: prev.about.strengths.filter((st) => st.id !== id),
      },
    }));
  };

  const addAboutStrength = (strength: Omit<AboutStrengthItem, 'id'>) => {
    const newSt: AboutStrengthItem = {
      ...strength,
      id: `str-${Date.now()}`,
    };
    setMenuContent((prev) => ({
      ...prev,
      about: {
        ...prev.about,
        strengths: [...prev.about.strengths, newSt],
      },
    }));
  };

  // Home KPIs handlers
  const reorderHomeKpis = (index: number, direction: 'up' | 'down') => {
    setMenuContent((prev) => ({
      ...prev,
      home: {
        ...prev.home,
        kpis: moveItemInArray(prev.home.kpis, index, direction),
      },
    }));
  };

  const deleteHomeKpi = (index: number) => {
    setMenuContent((prev) => ({
      ...prev,
      home: {
        ...prev.home,
        kpis: prev.home.kpis.filter((_, i) => i !== index),
      },
    }));
  };

  const addHomeKpi = (kpi: { value: string; label: string; sub: string }) => {
    setMenuContent((prev) => ({
      ...prev,
      home: {
        ...prev.home,
        kpis: [...prev.home.kpis, { id: `kpi-${Date.now()}`, ...kpi }],
      },
    }));
  };

  // Q&A(자주 묻는 질문) 관리 ------------------------------------------------
  const faqs = menuContent.faqs || [];

  const addFaq = (faq?: Partial<Pick<FaqItem, 'q' | 'a'>>) => {
    const id = `faq-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newFaq: FaqItem = {
      id,
      q: faq?.q ?? '새로운 질문을 입력하세요',
      a: faq?.a ?? '답변 내용을 입력하세요.',
    };
    setMenuContent((prev) => ({
      ...prev,
      faqs: [...(prev.faqs || []), newFaq],
    }));
    return id;
  };

  const updateFaq = (id: string, data: Partial<Pick<FaqItem, 'q' | 'a'>>) => {
    setMenuContent((prev) => ({
      ...prev,
      faqs: (prev.faqs || []).map((f) => (f.id === id ? { ...f, ...data } : f)),
    }));
  };

  const deleteFaq = (id: string) => {
    setMenuContent((prev) => ({
      ...prev,
      faqs: (prev.faqs || []).filter((f) => f.id !== id),
    }));
  };

  const reorderFaq = (index: number, direction: 'up' | 'down') => {
    setMenuContent((prev) => ({
      ...prev,
      faqs: moveItemInArray(prev.faqs || [], index, direction),
    }));
  };

  const resetFaqs = () => {
    setMenuContent((prev) => ({ ...prev, faqs: INITIAL_FAQS }));
  };

  // 홈 화면 전체 문구 / 이미지 오버라이드 -------------------------------------
  // key: 화면상 위치를 나타내는 고유 문자열. value 가 있으면 기본 문구 대신 사용합니다.
  const siteText = (key: string, fallback: string): string => {
    const v = menuContent.textOverrides?.[key];
    return typeof v === 'string' && v.length > 0 ? v : fallback;
  };

  const setSiteText = (key: string, value: string) => {
    setMenuContent((prev) => {
      const next = { ...(prev.textOverrides || {}) };
      const fallback = '';
      if (!value || value === fallback) delete next[key];
      else next[key] = value;
      return { ...prev, textOverrides: next };
    });
  };

  const siteImage = (key: string, fallback: string): string => {
    const v = menuContent.imageOverrides?.[key];
    return typeof v === 'string' && v.length > 0 ? v : fallback;
  };

  const setSiteImage = (key: string, value: string) => {
    setMenuContent((prev) => {
      const next = { ...(prev.imageOverrides || {}) };
      if (!value) delete next[key];
      else next[key] = value;
      return { ...prev, imageOverrides: next };
    });
  };

  const clearSiteOverride = (key: string) => {
    setMenuContent((prev) => {
      const texts = { ...(prev.textOverrides || {}) };
      const images = { ...(prev.imageOverrides || {}) };
      delete texts[key];
      delete images[key];
      return { ...prev, textOverrides: texts, imageOverrides: images };
    });
  };

  const resetSiteOverrides = () => {
    setMenuContent((prev) => ({ ...prev, textOverrides: {}, imageOverrides: {} }));
  };

  // 홈 커스텀 레이어 (생성/수정/삭제/순서) -------------------------------------
  const addHomeLayer = (layer: Omit<HomeLayer, 'id'>) => {
    const newLayer: HomeLayer = { ...layer, id: `layer-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` };
    setMenuContent((prev) => ({
      ...prev,
      home: {
        ...prev.home,
        layers: [...(prev.home.layers || []), newLayer],
      },
    }));
    return newLayer.id;
  };

  const updateHomeLayer = (id: string, data: Partial<HomeLayer>) => {
    setMenuContent((prev) => ({
      ...prev,
      home: {
        ...prev.home,
        layers: (prev.home.layers || []).map((l) => (l.id === id ? { ...l, ...data } : l)),
      },
    }));
  };

  const deleteHomeLayer = (id: string) => {
    setMenuContent((prev) => ({
      ...prev,
      home: {
        ...prev.home,
        layers: (prev.home.layers || []).filter((l) => l.id !== id),
      },
    }));
  };

  const moveHomeLayer = (index: number, direction: 'up' | 'down') => {
    setMenuContent((prev) => ({
      ...prev,
      home: {
        ...prev.home,
        layers: moveItemInArray(prev.home.layers || [], index, direction),
      },
    }));
  };

  const resetHomeLayers = () => {
    setMenuContent((prev) => ({
      ...prev,
      home: { ...prev.home, layers: [] },
    }));
  };

  // 홈 블록(킥커/버튼/이미지카드/KPI) 삭제·복원·순서 ---------------------------
  const hiddenHomeBlocks = menuContent.home.hiddenBlocks || [];
  const homeBlockOrder = getBlockOrder(menuContent.home.blockOrder);

  const deleteHomeBlock = (key: string) => {
    setMenuContent((prev) => {
      const current = prev.home.hiddenBlocks || [];
      if (current.includes(key)) return prev;
      return { ...prev, home: { ...prev.home, hiddenBlocks: [...current, key] } };
    });
  };

  const restoreHomeBlock = (key: string) => {
    setMenuContent((prev) => {
      const current = prev.home.hiddenBlocks || [];
      if (!current.includes(key)) return prev;
      return { ...prev, home: { ...prev.home, hiddenBlocks: current.filter((k) => k !== key) } };
    });
  };

  const restoreAllHomeBlocks = () => {
    setMenuContent((prev) => ({ ...prev, home: { ...prev.home, hiddenBlocks: [] } }));
  };

  const setHomeBlockOrder = (keys: string[]) => {
    setMenuContent((prev) => ({ ...prev, home: { ...prev.home, blockOrder: keys } }));
  };

  const moveHomeBlock = (key: string, direction: 'up' | 'down') => {
    setMenuContent((prev) => {
      const order = getBlockOrder(prev.home.blockOrder);
      const index = order.indexOf(key);
      if (index < 0) return prev;
      return {
        ...prev,
        home: { ...prev.home, blockOrder: moveWithinArray(order, index, direction) },
      };
    });
  };

  const moveHomeKpi = (from: number, to: number) => {
    setMenuContent((prev) => {
      if (from === to) return prev;
      return { ...prev, home: { ...prev.home, kpis: moveToIndex(prev.home.kpis, from, to) } };
    });
  };

  // 홈 전체 섹션(hero/about/works/...) 순서 --------------------------------
  const homeSectionOrder = getSectionOrder(menuContent.home.sectionOrder);

  const setHomeSectionOrder = (keys: string[]) => {
    setMenuContent((prev) => ({ ...prev, home: { ...prev.home, sectionOrder: keys } }));
  };

  const moveHomeSection = (key: string, direction: 'up' | 'down') => {
    setMenuContent((prev) => {
      const order = getSectionOrder(prev.home.sectionOrder);
      const index = order.indexOf(key);
      if (index < 0) return prev;
      return {
        ...prev,
        home: { ...prev.home, sectionOrder: moveWithinArray(order, index, direction) },
      };
    });
  };

  // 되돌리기(Ctrl/Cmd+Z) 이력 ─────────────────────────────────────────────
  // menuContent 가 바뀔 때마다 "바뀌기 직전" 스냅샷을 쌓아 두고, 되돌리기 시 복원합니다.
  // 드래그처럼 짧은 간격의 연속 변경은 한 단계로 묶어 Ctrl+Z 한 번에 되돌아가게 합니다.
  const historyRef = useRef<SiteMenuContent[]>([]);
  const prevContentRef = useRef<SiteMenuContent>(menuContent);
  const skipHistoryRef = useRef(false);
  const lastPushAtRef = useRef(0);
  const [undoDepth, setUndoDepth] = useState(0);

  useEffect(() => {
    const prev = prevContentRef.current;
    const skipped = skipHistoryRef.current;
    // skip 플래그는 어떤 경로로 끝나든 반드시 소비합니다.
    // (조기 return 에서 해제하지 않으면 다음 실제 편집이 이력에서 누락됩니다)
    skipHistoryRef.current = false;

    if (prev === menuContent) return;
    prevContentRef.current = menuContent;

    if (skipped) return;

    const now = Date.now();
    // 500ms 이내 연속 변경(레이어 드래그 등)은 하나의 되돌리기 단계로 병합
    if (now - lastPushAtRef.current < 500 && historyRef.current.length > 0) {
      lastPushAtRef.current = now;
      return;
    }

    historyRef.current.push(prev);
    if (historyRef.current.length > 80) historyRef.current.shift();
    lastPushAtRef.current = now;
    setUndoDepth(historyRef.current.length);
  }, [menuContent]);

  const undoHomeEdit = (): boolean => {
    const prev = historyRef.current.pop();
    if (!prev) return false;
    skipHistoryRef.current = true;
    prevContentRef.current = prev;
    lastPushAtRef.current = 0;
    setMenuContent(prev);
    setUndoDepth(historyRef.current.length);
    return true;
  };

  const canUndo = undoDepth > 0;

  // Ctrl/Cmd+Z 로 홈 편집 되돌리기 (편집 모드일 때만 동작)
  useEffect(() => {
    if (!isHomeInlineEditMode || !isAdminLoggedIn) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const isUndoKey = (e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z';
      if (!isUndoKey) return;

      // contentEditable 안에서의 브라우저 기본 undo 는 그대로 두지 않고,
      // 홈 편집 이력을 우선 사용합니다. (입력 중이면 먼저 blur 로 커밋)
      const active = document.activeElement as HTMLElement | null;
      if (active?.isContentEditable) {
        active.blur();
      }

      if (undoHomeEdit()) {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isHomeInlineEditMode, isAdminLoggedIn]);

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      const offset = 80;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  return (
    <StudioContext.Provider
      value={{
        projects,
        inquiries,
        config,
        menuContent,
        updateHomeContent,
        updateAboutContent,
        updateServiceContent,
        updateContactContent,
        resetMenuContentToDefault,
        reorderNavMenu,
        updateNavMenu,
        deleteNavMenu,
        addNavMenu,
        reorderWorksCategory,
        updateWorksCategory,
        deleteWorksCategory,
        addWorksCategory,
        reorderServices,
        deleteServiceItem,
        addServiceItem,
        reorderAboutStrengths,
        updateAboutStrength,
        deleteAboutStrength,
        addAboutStrength,
        reorderHomeKpis,
        deleteHomeKpi,
        addHomeKpi,
        faqs,
        addFaq,
        updateFaq,
        deleteFaq,
        reorderFaq,
        resetFaqs,
        siteText,
        setSiteText,
        siteImage,
        setSiteImage,
        clearSiteOverride,
        resetSiteOverrides,
        addHomeLayer,
        updateHomeLayer,
        deleteHomeLayer,
        moveHomeLayer,
        resetHomeLayers,
        hiddenHomeBlocks,
        homeBlockOrder,
        deleteHomeBlock,
        restoreHomeBlock,
        restoreAllHomeBlocks,
        moveHomeBlock,
        setHomeBlockOrder,
        moveHomeKpi,
        homeSectionOrder,
        moveHomeSection,
        setHomeSectionOrder,
        undoHomeEdit,
        canUndo,
        undoDepth,
        isHomeInlineEditMode,
        setIsHomeInlineEditMode,
        selectedHomeLayerId,
        setSelectedHomeLayerId,
        isSplitEditorOpen,
        setIsSplitEditorOpen,
        currentPage,
        setCurrentPage,
        navigateTo,
        isAdminLoggedIn,
        isAdminModalOpen,
        setIsAdminModalOpen,
        loginAdmin,
        logoutAdmin,
        addProject,
        updateProject,
        deleteProject,
        resetProjectsToDefault,
        backupProjects,
        restoreProjectsFromBackup,
        deleteBackup,
        backupInfo,
        addInquiry,
        refreshInquiries,
        updateInquiryStatus,
        deleteInquiry,
        updateConfig,
        theme,
        setTheme,
        toggleTheme,
        activeProjectDetail,
        setActiveProjectDetail,
        selectedInquiryCategory,
        setSelectedInquiryCategory,
        scrollToSection,
        storageWarning,
        dismissStorageWarning,
        isHydrated,
        isSavingToServer,
        lastServerSaveAt,
        isServerOnline,
      }}
    >
      {children}
    </StudioContext.Provider>
  );
};

export const useStudio = () => {
  const context = useContext(StudioContext);
  if (!context) {
    throw new Error('useStudio must be used within a StudioProvider');
  }
  return context;
};
