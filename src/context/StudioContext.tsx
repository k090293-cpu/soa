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
  loginAdmin: (password: string) => boolean;
  logoutAdmin: () => void;
  addProject: (projectData: Omit<Project, 'id'>) => void;
  updateProject: (id: string, updated: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  resetProjectsToDefault: () => void;
  // 포트폴리오 백업 / 복원
  backupProjects: () => { ok: boolean; savedAt?: string; error?: string };
  restoreProjectsFromBackup: () => boolean;
  deleteBackup: () => void;
  backupInfo: { savedAt: string; count: number } | null;
  addInquiry: (inquiryData: Omit<ProjectInquiry, 'id' | 'createdAt' | 'status'>) => void;
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
  ADMIN_SESSION: 'soa_studio_admin_session_v2',
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

export const StudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load Projects
  const [projects, setProjects] = useState<Project[]>(loadProjectsFromStorage);

  // Load Inquiries
  const [inquiries, setInquiries] = useState<ProjectInquiry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INQUIRIES);
      if (saved) return JSON.parse(saved);
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
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return sessionStorage.getItem(STORAGE_KEYS.ADMIN_SESSION) === 'true';
  });
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

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

  // Admin Login
  const loginAdmin = (password: string): boolean => {
    // 관리자 비밀번호는 환경변수로 재정의할 수 있습니다. (기본값은 기존 동작 유지)
    const adminPassword = (import.meta.env.VITE_ADMIN_PASSWORD as string | undefined)?.trim() || '1012';
    if (password.trim() === adminPassword) {
      setIsAdminLoggedIn(true);
      sessionStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, 'true');
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setIsAdminLoggedIn(false);
    sessionStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
    // 편집 모드가 켜진 채 남아 방문자가 글자를 수정할 수 있는 문제를 방지합니다.
    setIsHomeInlineEditMode(false);
    setSelectedHomeLayerId(null);
    setIsSplitEditorOpen(false);
    setIsAdminModalOpen(false);
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
  const addInquiry = (inquiryData: Omit<ProjectInquiry, 'id' | 'createdAt' | 'status'>) => {
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newInq: ProjectInquiry = {
      ...inquiryData,
      id: `inq-${Date.now()}`,
      createdAt: formattedDate,
      status: '신규',
    };
    setInquiries((prev) => [newInq, ...prev]);
  };

  const updateInquiryStatus = (id: string, status: InquiryStatus, adminNote?: string) => {
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
  };

  const deleteInquiry = (id: string) => {
    setInquiries((prev) => prev.filter((item) => item.id !== id));
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
