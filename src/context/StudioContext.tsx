import React, { createContext, useContext, useState, useEffect } from 'react';
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
} from '../types';
import { INITIAL_PROJECTS, INITIAL_INQUIRIES, INITIAL_STUDIO_CONFIG } from '../data/initialProjects';
import {
  INITIAL_MENU_CONTENT,
  INITIAL_NAV_MENUS,
  INITIAL_WORKS_CATEGORIES,
  INITIAL_ABOUT_STRENGTHS
} from '../data/servicesData';

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
  addInquiry: (inquiryData: Omit<ProjectInquiry, 'id' | 'createdAt' | 'status'>) => void;
  updateInquiryStatus: (id: string, status: InquiryStatus, adminNote?: string) => void;
  deleteInquiry: (id: string) => void;
  updateConfig: (updated: Partial<StudioConfig>) => void;
  activeProjectDetail: Project | null;
  setActiveProjectDetail: (p: Project | null) => void;
  selectedInquiryCategory: string | null;
  setSelectedInquiryCategory: (cat: string | null) => void;
  scrollToSection: (sectionId: string) => void;
}

const StudioContext = createContext<StudioContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PROJECTS: 'soa_studio_projects_v2',
  INQUIRIES: 'soa_studio_inquiries_v2',
  CONFIG: 'soa_studio_config_v2',
  MENU_CONTENT: 'soa_menu_content_v2',
  ADMIN_SESSION: 'soa_studio_admin_session_v2',
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

  // Admin Auth State (Password: 1012)
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

  // Admin Login with required password '1012'
  const loginAdmin = (password: string): boolean => {
    if (password.trim() === '1012') {
      setIsAdminLoggedIn(true);
      sessionStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, 'true');
      return true;
    }
    return false;
  };

  const logoutAdmin = () => {
    setIsAdminLoggedIn(false);
    sessionStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
  };

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
        addInquiry,
        updateInquiryStatus,
        deleteInquiry,
        updateConfig,
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
