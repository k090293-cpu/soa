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
} from '../types';
import { INITIAL_PROJECTS, INITIAL_INQUIRIES, INITIAL_STUDIO_CONFIG } from '../data/initialProjects';
import {
  INITIAL_MENU_CONTENT,
  INITIAL_NAV_MENUS,
  INITIAL_WORKS_CATEGORIES,
  INITIAL_ABOUT_STRENGTHS
} from '../data/servicesData';
import { getBlockOrder, moveWithinArray, moveToIndex } from '../utils/homeBlocks';

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

export const StudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load Projects
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load projects from storage', e);
    }
    return INITIAL_PROJECTS;
  });

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
  const [menuContent, setMenuContent] = useState<SiteMenuContent>(() => {
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
        };
      }
    } catch (e) {
      console.error('Failed to load menu content from storage', e);
    }
    return INITIAL_MENU_CONTENT;
  });

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

  // Sync to local storage & IndexedDB
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    } catch (e) {
      console.warn('localStorage quota limit reached. Media safely preserved in state and IndexedDB.', e);
    }
  }, [projects]);

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
    try {
      localStorage.setItem(STORAGE_KEYS.MENU_CONTENT, JSON.stringify(menuContent));
    } catch (e) {
      console.error('Failed to save menu content to storage', e);
    }
  }, [menuContent]);

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
      localStorage.setItem(
        STORAGE_KEYS.PROJECTS_BACKUP,
        JSON.stringify({ savedAt, savedTs: Date.now(), projects })
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
      setProjects(parsed.projects);
      setActiveProjectDetail(null);
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
