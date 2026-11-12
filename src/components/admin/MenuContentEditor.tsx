import React, { useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import {
  Check,
  RotateCcw,
  Save,
  Layout,
  User,
  Briefcase,
  Mail,
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  Sparkles,
  Layers,
  Compass,
  HelpCircle
} from 'lucide-react';

export const MenuContentEditor: React.FC = () => {
  const {
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
  } = useStudio();

  // Sub-tabs: 'nav' | 'works' | 'service' | 'about' | 'home' | 'contact' | 'faq'
  const [activeSubTab, setActiveSubTab] = useState<
    'nav' | 'works' | 'service' | 'about' | 'home' | 'contact' | 'faq'
  >('nav');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // New Item Modals/Forms State
  const [newNavLabel, setNewNavLabel] = useState('');
  const [newNavPage, setNewNavPage] = useState<'home' | 'about' | 'works' | 'service' | 'contact'>('home');
  const [showAddNav, setShowAddNav] = useState(false);

  const [newCatKey, setNewCatKey] = useState('');
  const [newCatLabel, setNewCatLabel] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [showAddCat, setShowAddCat] = useState(false);

  const [newStrengthTitle, setNewStrengthTitle] = useState('');
  const [newStrengthDesc, setNewStrengthDesc] = useState('');
  const [showAddStrength, setShowAddStrength] = useState(false);

  const [newKpiVal, setNewKpiVal] = useState('');
  const [newKpiLabel, setNewKpiLabel] = useState('');
  const [newKpiSub, setNewKpiSub] = useState('');
  const [showAddKpi, setShowAddKpi] = useState(false);

  const [showAddService, setShowAddService] = useState(false);
  const [newServiceTitle, setNewServiceTitle] = useState('');
  const [newServiceEngTitle, setNewServiceEngTitle] = useState('');
  const [newServiceTagline, setNewServiceTagline] = useState('');
  const [newServiceScopeStr, setNewServiceScopeStr] = useState('');
  const [newServicePeriod, setNewServicePeriod] = useState('3~5일 소요');
  const [newServiceRec, setNewServiceRec] = useState('신규 론칭 및 마케팅팀');

  // HOME form states
  const [heroKicker, setHeroKicker] = useState(menuContent.home.heroKicker);
  const [heroHeadline, setHeroHeadline] = useState(menuContent.home.heroHeadline);
  const [heroSubheadline, setHeroSubheadline] = useState(menuContent.home.heroSubheadline);

  // ABOUT text states
  const [aboutTitle, setAboutTitle] = useState(menuContent.about.headerTitle);
  const [aboutSubtitle, setAboutSubtitle] = useState(menuContent.about.headerSubtitle);
  const [aboutIntro, setAboutIntro] = useState(menuContent.about.introNarrative);
  const [philosophyTitle, setPhilosophyTitle] = useState(menuContent.about.philosophyTitle);
  const [philosophyText1, setPhilosophyText1] = useState(menuContent.about.philosophyText1);
  const [philosophyText2, setPhilosophyText2] = useState(menuContent.about.philosophyText2);
  const [philosophyText3, setPhilosophyText3] = useState(menuContent.about.philosophyText3);

  // CONTACT text states
  const [contactTitle, setContactTitle] = useState(menuContent.contact.headerTitle);
  const [contactSubtitle, setContactSubtitle] = useState(menuContent.contact.headerSubtitle);
  const [contactIntro, setContactIntro] = useState(menuContent.contact.introDescription);
  const [responsePledge, setResponsePledge] = useState(menuContent.contact.responsePledge);

  const notifySave = (msg: string) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(''), 2500);
  };

  const handleSaveHomeTexts = (e: React.FormEvent) => {
    e.preventDefault();
    updateHomeContent({
      heroKicker,
      heroHeadline,
      heroSubheadline,
    });
    notifySave('HOME 헤드라인 및 소개글이 저장되었습니다.');
  };

  const handleSaveAboutTexts = (e: React.FormEvent) => {
    e.preventDefault();
    updateAboutContent({
      headerTitle: aboutTitle,
      headerSubtitle: aboutSubtitle,
      introNarrative: aboutIntro,
      philosophyTitle,
      philosophyText1,
      philosophyText2,
      philosophyText3,
    });
    notifySave('ABOUT 소개 및 철학 글이 저장되었습니다.');
  };

  const handleSaveContactTexts = (e: React.FormEvent) => {
    e.preventDefault();
    updateContactContent({
      headerTitle: contactTitle,
      headerSubtitle: contactSubtitle,
      introDescription: contactIntro,
      responsePledge,
    });
    notifySave('CONTACT 안내 문구가 저장되었습니다.');
  };

  const handleCreateNav = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNavLabel.trim()) return;
    addNavMenu({
      label: newNavLabel.trim(),
      page: newNavPage,
      enabled: true,
    });
    setNewNavLabel('');
    setShowAddNav(false);
    notifySave(`'${newNavLabel}' 메뉴가 추가되었습니다.`);
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatKey.trim() || !newCatLabel.trim()) return;
    addWorksCategory({
      key: newCatKey.trim().toLowerCase(),
      label: newCatLabel.trim(),
      desc: newCatDesc.trim() || undefined,
    });
    setNewCatKey('');
    setNewCatLabel('');
    setNewCatDesc('');
    setShowAddCat(false);
    notifySave(`'${newCatLabel}' 포트폴리오 카테고리가 추가되었습니다.`);
  };

  const handleCreateStrength = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStrengthTitle.trim()) return;
    const nextNumber = String(menuContent.about.strengths.length + 1).padStart(2, '0');
    addAboutStrength({
      number: nextNumber,
      title: newStrengthTitle.trim(),
      desc: newStrengthDesc.trim(),
    });
    setNewStrengthTitle('');
    setNewStrengthDesc('');
    setShowAddStrength(false);
    notifySave(`'${newStrengthTitle}' 핵심 역량 카테고리가 추가되었습니다.`);
  };

  const handleCreateKpi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKpiVal.trim() || !newKpiLabel.trim()) return;
    addHomeKpi({
      value: newKpiVal.trim(),
      label: newKpiLabel.trim(),
      sub: newKpiSub.trim(),
    });
    setNewKpiVal('');
    setNewKpiLabel('');
    setNewKpiSub('');
    setShowAddKpi(false);
    notifySave(`'${newKpiVal}' KPI 지표가 추가되었습니다.`);
  };

  const handleCreateService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceTitle.trim()) return;
    const nextNum = String(menuContent.services.length + 1).padStart(2, '0');
    const scopeList = newServiceScopeStr.split('\n').map((s) => s.trim()).filter(Boolean);
    addServiceItem({
      number: nextNum,
      title: newServiceTitle.trim(),
      englishTitle: newServiceEngTitle.trim() || 'CUSTOM SERVICE PACKAGE',
      tagline: newServiceTagline.trim(),
      scopeList: scopeList.length > 0 ? scopeList : ['맞춤형 기획 및 디자인', '고해상도 원본 납품'],
      deliverables: ['최종 디자인 파일', '수정 가능한 원본 소스'],
      estimatedPeriod: newServicePeriod.trim() || '협의',
      recommendedFor: newServiceRec.trim() || '모든 클라이언트',
      popular: false,
    });
    setNewServiceTitle('');
    setNewServiceEngTitle('');
    setNewServiceTagline('');
    setNewServiceScopeStr('');
    setShowAddService(false);
    notifySave(`'${newServiceTitle}' 서비스 패키지가 추가되었습니다.`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Reset */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-850 pb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>메뉴 & 카테고리 종합 관리 (위치 순서 변경 · 삭제 · 글 수정)</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            상단 메뉴와 메뉴 내 카테고리의 위치 이동(▲/▼), 삭제, 추가 및 모든 세부 글을 실시간으로 편집할 수 있습니다.
          </p>
        </div>

        <button
          onClick={() => {
            if (confirm('모든 메뉴와 카테고리를 초기 기본 구조와 문구로 복원하시겠습니까?')) {
              resetMenuContentToDefault();
              setHeroKicker(menuContent.home.heroKicker);
              setHeroHeadline(menuContent.home.heroHeadline);
              setHeroSubheadline(menuContent.home.heroSubheadline);
              setAboutTitle(menuContent.about.headerTitle);
              setAboutIntro(menuContent.about.introNarrative);
              notifySave('초기 기본값으로 복원되었습니다.');
            }
          }}
          className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>기본값으로 초기화</span>
        </button>
      </div>

      {/* Save Success Alert */}
      {saveSuccessMsg && (
        <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* Category Sub-tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-zinc-850 pb-3">
        <button
          onClick={() => setActiveSubTab('nav')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'nav'
              ? 'bg-blue-600 text-white'
              : 'text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>1. 상단 메뉴 (네비게이션)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('works')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'works'
              ? 'bg-blue-600 text-white'
              : 'text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>2. WORKS 카테고리</span>
        </button>

        <button
          onClick={() => setActiveSubTab('service')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'service'
              ? 'bg-blue-600 text-white'
              : 'text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>3. SERVICE 패키지</span>
        </button>

        <button
          onClick={() => setActiveSubTab('about')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'about'
              ? 'bg-blue-600 text-white'
              : 'text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>4. ABOUT 핵심역량</span>
        </button>

        <button
          onClick={() => setActiveSubTab('home')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'home'
              ? 'bg-blue-600 text-white'
              : 'text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800'
          }`}
        >
          <Layout className="w-3.5 h-3.5" />
          <span>5. HOME 헤드라인 & KPI</span>
        </button>

        <button
          onClick={() => setActiveSubTab('contact')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'contact'
              ? 'bg-blue-600 text-white'
              : 'text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>6. CONTACT 안내</span>
        </button>

        <button
          onClick={() => setActiveSubTab('faq')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'faq'
              ? 'bg-blue-600 text-white'
              : 'text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>7. Q&A (자주 묻는 질문) {faqs.length}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. NAV MENUS TAB (Reorder, Delete, Add, Rename) */}
      {/* ========================================================================= */}
      {activeSubTab === 'nav' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-white">상단 헤더 네비게이션 메뉴 위치 및 항목 관리</h4>
              <p className="text-xs text-zinc-400">
                위치 이동(▲/▼), 메뉴 이름 글자 수정, 노출/비노출 토글, 메뉴 삭제를 지원합니다.
              </p>
            </div>
            <button
              onClick={() => setShowAddNav(!showAddNav)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>새 메뉴 항목 추가</span>
            </button>
          </div>

          {/* New Nav Form */}
          {showAddNav && (
            <form onSubmit={handleCreateNav} className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
              <h5 className="text-xs font-bold text-blue-400">새 네비게이션 메뉴 등록</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-400">메뉴명 (표시 라벨)</label>
                  <input
                    type="text"
                    value={newNavLabel}
                    onChange={(e) => setNewNavLabel(e.target.value)}
                    placeholder="예: PORTFOLIO, BLOG, REVIEWS"
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-750 text-xs text-white"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-400">연결할 페이지 뷰</label>
                  <select
                    value={newNavPage}
                    onChange={(e) => setNewNavPage(e.target.value as any)}
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-750 text-xs text-white"
                  >
                    <option value="home">HOME (메인 홈)</option>
                    <option value="about">ABOUT (디자이너 소개)</option>
                    <option value="works">WORKS (포트폴리오)</option>
                    <option value="service">SERVICE (서비스 가이드)</option>
                    <option value="contact">CONTACT (제작 문의)</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddNav(false)}
                  className="px-3 py-1 rounded-lg text-xs text-zinc-400 hover:text-white bg-zinc-900"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg"
                >
                  추가하기
                </button>
              </div>
            </form>
          )}

          {/* Nav Items List */}
          <div className="space-y-2">
            {menuContent.navMenus.map((nav, idx) => (
              <div
                key={nav.id}
                className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => reorderNavMenu(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 text-zinc-300 cursor-pointer"
                      title="위로 이동"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => reorderNavMenu(idx, 'down')}
                      disabled={idx === menuContent.navMenus.length - 1}
                      className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 text-zinc-300 cursor-pointer"
                      title="아래로 이동"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <span className="text-xs font-mono text-zinc-500 w-6">0{idx + 1}</span>

                  <div className="space-y-0.5">
                    <input
                      type="text"
                      defaultValue={nav.label}
                      onBlur={(e) => {
                        if (e.target.value.trim() && e.target.value !== nav.label) {
                          updateNavMenu(nav.id, { label: e.target.value.trim() });
                          notifySave(`메뉴명이 '${e.target.value.trim()}'(으)로 수정되었습니다.`);
                        }
                      }}
                      className="px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-xs font-bold text-white focus:outline-none focus:border-blue-500"
                    />
                    <span className="text-[11px] text-zinc-500 block">
                      연결 페이지: <strong className="text-zinc-400 font-mono">/{nav.page}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      updateNavMenu(nav.id, { enabled: !nav.enabled });
                      notifySave(`'${nav.label}' 메뉴가 ${!nav.enabled ? '노출' : '숨김'} 처리되었습니다.`);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 cursor-pointer ${
                      nav.enabled !== false
                        ? 'bg-blue-950/60 border-blue-800 text-blue-300'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                    }`}
                  >
                    {nav.enabled !== false ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    <span>{nav.enabled !== false ? '노출 중' : '숨김'}</span>
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`'${nav.label}' 메뉴를 삭제하시겠습니까?`)) {
                        deleteNavMenu(nav.id);
                        notifySave(`'${nav.label}' 메뉴가 삭제되었습니다.`);
                      }
                    }}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer"
                    title="메뉴 삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. WORKS CATEGORIES TAB (Reorder, Delete, Add, Rename) */}
      {/* ========================================================================= */}
      {activeSubTab === 'works' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-white">포트폴리오 탭 카테고리 위치 및 명칭 관리</h4>
              <p className="text-xs text-zinc-400">
                WORKS 필터 탭에 표시되는 카테고리의 위치 순서 변경(▲/▼), 카테고리 글 수정, 삭제 및 새 카테고리 생성을 지원합니다.
              </p>
            </div>
            <button
              onClick={() => setShowAddCat(!showAddCat)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>새 카테고리 추가</span>
            </button>
          </div>

          {/* New Category Form */}
          {showAddCat && (
            <form onSubmit={handleCreateCategory} className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
              <h5 className="text-xs font-bold text-blue-400">새 포트폴리오 카테고리 생성</h5>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-400">카테고리 Key (영문 소문자)</label>
                  <input
                    type="text"
                    value={newCatKey}
                    onChange={(e) => setNewCatKey(e.target.value)}
                    placeholder="예: brand, 3d, ui"
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-750 text-xs text-white font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-400">표시 라벨 (글자)</label>
                  <input
                    type="text"
                    value={newCatLabel}
                    onChange={(e) => setNewCatLabel(e.target.value)}
                    placeholder="예: 04. 3D & MOTION"
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-750 text-xs text-white"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-400">카테고리 설명 (선택)</label>
                  <input
                    type="text"
                    value={newCatDesc}
                    onChange={(e) => setNewCatDesc(e.target.value)}
                    placeholder="예: 3D 제품 렌더링 및 키네틱"
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-750 text-xs text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddCat(false)}
                  className="px-3 py-1 rounded-lg text-xs text-zinc-400 hover:text-white bg-zinc-900"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg"
                >
                  카테고리 저장
                </button>
              </div>
            </form>
          )}

          {/* Categories List */}
          <div className="space-y-2">
            {menuContent.worksCategories.map((cat, idx) => (
              <div
                key={cat.id || cat.key}
                className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => reorderWorksCategory(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 text-zinc-300 cursor-pointer"
                      title="위로 이동"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => reorderWorksCategory(idx, 'down')}
                      disabled={idx === menuContent.worksCategories.length - 1}
                      className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 text-zinc-300 cursor-pointer"
                      title="아래로 이동"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <span className="text-xs font-mono text-zinc-500 w-6 shrink-0">0{idx + 1}</span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
                    <input
                      type="text"
                      defaultValue={cat.label}
                      onBlur={(e) => {
                        if (e.target.value.trim() && e.target.value !== cat.label) {
                          updateWorksCategory(cat.id, { label: e.target.value.trim() });
                          notifySave(`카테고리명이 '${e.target.value.trim()}'(으)로 수정되었습니다.`);
                        }
                      }}
                      placeholder="카테고리 표시 라벨"
                      className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-bold text-white focus:outline-none focus:border-blue-500"
                    />

                    <input
                      type="text"
                      defaultValue={cat.desc || ''}
                      onBlur={(e) => {
                        updateWorksCategory(cat.id, { desc: e.target.value.trim() });
                        notifySave(`설명이 업데이트되었습니다.`);
                      }}
                      placeholder="카테고리 설명 (소구점)"
                      className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] font-mono text-zinc-500 bg-zinc-900 px-2 py-1 rounded">
                    Key: {cat.key}
                  </span>

                  <button
                    onClick={() => {
                      if (confirm(`'${cat.label}' 카테고리를 삭제하시겠습니까?`)) {
                        deleteWorksCategory(cat.id);
                        notifySave(`'${cat.label}' 카테고리가 삭제되었습니다.`);
                      }
                    }}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer"
                    title="카테고리 삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SERVICE PACKAGES TAB (Reorder, Delete, Add, Full text editing) */}
      {/* ========================================================================= */}
      {activeSubTab === 'service' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-white">서비스 패키지 카테고리 위치 및 제공 범위 관리</h4>
              <p className="text-xs text-zinc-400">
                각 서비스의 순서 위치 변경(▲/▼), 삭제, 새 서비스 추가 및 세부 작업 범위 문구를 실시간 편집합니다.
              </p>
            </div>
            <button
              onClick={() => setShowAddService(!showAddService)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>새 서비스 패키지 추가</span>
            </button>
          </div>

          {/* New Service Form */}
          {showAddService && (
            <form onSubmit={handleCreateService} className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
              <h5 className="text-xs font-bold text-blue-400">새 서비스 패키지 등록</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={newServiceTitle}
                  onChange={(e) => setNewServiceTitle(e.target.value)}
                  placeholder="서비스 한글명 (예: 유튜브 썸네일 & 패키지)"
                  className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-750 text-xs text-white"
                  required
                />
                <input
                  type="text"
                  value={newServiceEngTitle}
                  onChange={(e) => setNewServiceEngTitle(e.target.value)}
                  placeholder="영문명 (예: YOUTUBE THUMBNAIL SUITE)"
                  className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-750 text-xs text-white font-mono"
                />
              </div>
              <input
                type="text"
                value={newServiceTagline}
                onChange={(e) => setNewServiceTagline(e.target.value)}
                placeholder="한 줄 소개 태그라인"
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-750 text-xs text-white"
              />
              <textarea
                rows={3}
                value={newServiceScopeStr}
                onChange={(e) => setNewServiceScopeStr(e.target.value)}
                placeholder="작업 범위 체크리스트 (줄바꿈으로 구분)"
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-750 text-xs text-white leading-relaxed"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={newServicePeriod}
                  onChange={(e) => setNewServicePeriod(e.target.value)}
                  placeholder="예상 작업 기간 (예: 3~5일 소요)"
                  className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-750 text-xs text-white"
                />
                <input
                  type="text"
                  value={newServiceRec}
                  onChange={(e) => setNewServiceRec(e.target.value)}
                  placeholder="권장 대상 (예: 신규 론칭 및 마케팅팀)"
                  className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-750 text-xs text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddService(false)}
                  className="px-3 py-1 rounded-lg text-xs text-zinc-400 hover:text-white bg-zinc-900"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg"
                >
                  서비스 생성
                </button>
              </div>
            </form>
          )}

          {/* Service Items List */}
          <div className="space-y-4">
            {menuContent.services.map((service, idx) => (
              <div
                key={service.id}
                className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-900 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => reorderServices(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 text-zinc-300 cursor-pointer"
                        title="위로 이동"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => reorderServices(idx, 'down')}
                        disabled={idx === menuContent.services.length - 1}
                        className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 text-zinc-300 cursor-pointer"
                        title="아래로 이동"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="text-xs font-mono font-bold text-blue-400">
                      0{idx + 1}.
                    </span>

                    <h4 className="text-sm font-bold text-white">{service.title}</h4>
                    <span className="text-[11px] font-mono text-zinc-500 hidden sm:inline">
                      ({service.englishTitle})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        updateServiceContent(service.id, { popular: !service.popular });
                        notifySave(`'${service.title}' 인기 추천 표시가 변경되었습니다.`);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border flex items-center gap-1 cursor-pointer ${
                        service.popular
                          ? 'bg-blue-950/60 border-blue-800 text-blue-400'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                      }`}
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{service.popular ? '인기 추천중' : '추천 배지'}</span>
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`'${service.title}' 서비스를 삭제하시겠습니까?`)) {
                          deleteServiceItem(service.id);
                          notifySave(`'${service.title}' 서비스가 삭제되었습니다.`);
                        }
                      }}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer"
                      title="서비스 삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Form fields for this service */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">서비스 한글 제목</label>
                    <input
                      type="text"
                      defaultValue={service.title}
                      onBlur={(e) => {
                        if (e.target.value.trim() && e.target.value !== service.title) {
                          updateServiceContent(service.id, { title: e.target.value.trim() });
                          notifySave('서비스 제목이 수정되었습니다.');
                        }
                      }}
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white font-medium focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">서비스 영문명</label>
                    <input
                      type="text"
                      defaultValue={service.englishTitle}
                      onBlur={(e) => {
                        if (e.target.value.trim() && e.target.value !== service.englishTitle) {
                          updateServiceContent(service.id, { englishTitle: e.target.value.trim() });
                          notifySave('서비스 영문명이 수정되었습니다.');
                        }
                      }}
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 font-mono focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">한 줄 태그라인 (소구점)</label>
                  <input
                    type="text"
                    defaultValue={service.tagline}
                    onBlur={(e) => {
                      if (e.target.value.trim() && e.target.value !== service.tagline) {
                        updateServiceContent(service.id, { tagline: e.target.value.trim() });
                        notifySave('소구점 문구가 수정되었습니다.');
                      }
                    }}
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-zinc-400 block mb-1">포함 작업 범위 목록 (한 줄에 하나씩)</label>
                  <textarea
                    rows={3}
                    defaultValue={service.scopeList.join('\n')}
                    onBlur={(e) => {
                      const updated = e.target.value.split('\n').map((s) => s.trim()).filter(Boolean);
                      updateServiceContent(service.id, { scopeList: updated });
                      notifySave('작업 범위 항목이 업데이트되었습니다.');
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 leading-relaxed focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">예상 소요 기간</label>
                    <input
                      type="text"
                      defaultValue={service.estimatedPeriod}
                      onBlur={(e) => {
                        updateServiceContent(service.id, { estimatedPeriod: e.target.value.trim() });
                        notifySave('소요 기간이 수정되었습니다.');
                      }}
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">추천 대상</label>
                    <input
                      type="text"
                      defaultValue={service.recommendedFor}
                      onBlur={(e) => {
                        updateServiceContent(service.id, { recommendedFor: e.target.value.trim() });
                        notifySave('추천 대상이 수정되었습니다.');
                      }}
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. ABOUT STRENGTHS TAB (Reorder, Delete, Add, Text editing) */}
      {/* ========================================================================= */}
      {activeSubTab === 'about' && (
        <div className="space-y-8">
          {/* Section A: Strengths Categories */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-white">스튜디오 6대 핵심 역량 카테고리 위치 및 글 관리</h4>
                <p className="text-xs text-zinc-400">
                  ABOUT 섹션 및 상세페이지의 강점 카테고리 위치 변경(▲/▼), 삭제, 추가 및 내용글을 수정합니다.
                </p>
              </div>
              <button
                onClick={() => setShowAddStrength(!showAddStrength)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>새 강점 카테고리 추가</span>
              </button>
            </div>

            {/* New Strength Form */}
            {showAddStrength && (
              <form onSubmit={handleCreateStrength} className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                <h5 className="text-xs font-bold text-blue-400">새 핵심 역량 카테고리 추가</h5>
                <input
                  type="text"
                  value={newStrengthTitle}
                  onChange={(e) => setNewStrengthTitle(e.target.value)}
                  placeholder="강점 타이틀 (예: AI 기반 고속 시안 개발)"
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-750 text-xs text-white"
                  required
                />
                <textarea
                  rows={2}
                  value={newStrengthDesc}
                  onChange={(e) => setNewStrengthDesc(e.target.value)}
                  placeholder="강점 상세 설명글"
                  className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-750 text-xs text-white leading-relaxed"
                  required
                />
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddStrength(false)}
                    className="px-3 py-1 rounded-lg text-xs text-zinc-400 hover:text-white bg-zinc-900"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg"
                  >
                    강점 항목 등록
                  </button>
                </div>
              </form>
            )}

            {/* Strengths List */}
            <div className="space-y-3">
              {menuContent.about.strengths.map((str, idx) => (
                <div
                  key={str.id}
                  className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row sm:items-start justify-between gap-3"
                >
                  <div className="flex items-center gap-1 shrink-0 pt-0.5">
                    <button
                      onClick={() => reorderAboutStrengths(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 text-zinc-300 cursor-pointer"
                      title="위로 이동"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => reorderAboutStrengths(idx, 'down')}
                      disabled={idx === menuContent.about.strengths.length - 1}
                      className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 text-zinc-300 cursor-pointer"
                      title="아래로 이동"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <span className="text-xs font-mono font-bold text-blue-400 w-6 shrink-0 pt-1">
                    0{idx + 1}.
                  </span>

                  <div className="space-y-2 flex-1">
                    <input
                      type="text"
                      defaultValue={str.title}
                      onBlur={(e) => {
                        if (e.target.value.trim() && e.target.value !== str.title) {
                          updateAboutStrength(str.id, { title: e.target.value.trim() });
                          notifySave(`강점 제목이 수정되었습니다.`);
                        }
                      }}
                      placeholder="강점 타이틀"
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-bold text-white focus:outline-none focus:border-blue-500"
                    />
                    <textarea
                      rows={2}
                      defaultValue={str.desc}
                      onBlur={(e) => {
                        if (e.target.value.trim() && e.target.value !== str.desc) {
                          updateAboutStrength(str.id, { desc: e.target.value.trim() });
                          notifySave(`강점 설명이 수정되었습니다.`);
                        }
                      }}
                      placeholder="강점 상세 설명글"
                      className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 leading-relaxed focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <button
                    onClick={() => {
                      if (confirm(`'${str.title}' 강점 항목을 삭제하시겠습니까?`)) {
                        deleteAboutStrength(str.id);
                        notifySave(`'${str.title}' 항목이 삭제되었습니다.`);
                      }
                    }}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer shrink-0"
                    title="강점 항목 삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Section B: About Page Narrative & Philosophy Form */}
          <div className="pt-6 border-t border-zinc-850 space-y-4">
            <h4 className="text-sm font-bold text-white">ABOUT 소개글 및 디자인 철학 문구 편집</h4>
            <form onSubmit={handleSaveAboutTexts} className="space-y-4 max-w-3xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-400">ABOUT 헤드라인</label>
                  <input
                    type="text"
                    value={aboutTitle}
                    onChange={(e) => setAboutTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-400">인사말 소제목</label>
                  <input
                    type="text"
                    value={aboutSubtitle}
                    onChange={(e) => setAboutSubtitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-zinc-400">디자이너 소개 인트로 본문</label>
                <textarea
                  rows={3}
                  value={aboutIntro}
                  onChange={(e) => setAboutIntro(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white leading-relaxed"
                />
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-[11px] text-blue-400 font-semibold block">디자인 철학 & 비전 3단락</label>
                <input
                  type="text"
                  value={philosophyTitle}
                  onChange={(e) => setPhilosophyTitle(e.target.value)}
                  placeholder="철학 헤드라인"
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white font-semibold"
                />
                <textarea
                  rows={2}
                  value={philosophyText1}
                  onChange={(e) => setPhilosophyText1(e.target.value)}
                  placeholder="단락 1"
                  className="w-full px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300"
                />
                <textarea
                  rows={2}
                  value={philosophyText2}
                  onChange={(e) => setPhilosophyText2(e.target.value)}
                  placeholder="단락 2"
                  className="w-full px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300"
                />
                <textarea
                  rows={2}
                  value={philosophyText3}
                  onChange={(e) => setPhilosophyText3(e.target.value)}
                  placeholder="단락 3"
                  className="w-full px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-300"
                />
              </div>

              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-lg shadow-blue-600/30 flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>ABOUT 소개글 저장</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. HOME TAB (Hero texts & KPIs with Reorder, Delete, Add) */}
      {/* ========================================================================= */}
      {activeSubTab === 'home' && (
        <div className="space-y-8">
          {/* Section A: Hero Texts */}
          <form onSubmit={handleSaveHomeTexts} className="space-y-4 max-w-3xl">
            <h4 className="text-sm font-bold text-white">홈 히어로 헤드라인 및 대표 문구</h4>
            <div className="space-y-1">
              <label className="text-[11px] text-zinc-400">히어로 상단 키커 문구</label>
              <input
                type="text"
                value={heroKicker}
                onChange={(e) => setHeroKicker(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-zinc-400">히어로 메인 대형 헤드라인</label>
              <input
                type="text"
                value={heroHeadline}
                onChange={(e) => setHeroHeadline(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-zinc-400">히어로 부제목 설명글</label>
              <textarea
                rows={3}
                value={heroSubheadline}
                onChange={(e) => setHeroSubheadline(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white leading-relaxed"
              />
            </div>

            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-md shadow-blue-600/30"
            >
              <Save className="w-3.5 h-3.5" />
              <span>히어로 문구 저장</span>
            </button>
          </form>

          {/* Section B: KPI Strip Items (Reorder, Delete, Add) */}
          <div className="pt-6 border-t border-zinc-850 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-white">4대 핵심 실적 수치 (KPI Strip) 위치 & 내용</h4>
                <p className="text-xs text-zinc-400">
                  홈 화면 하단 지표 띠 배너의 순서 변경(▲/▼), 수치 및 설명 글 수정, 삭제, 추가를 관리합니다.
                </p>
              </div>
              <button
                onClick={() => setShowAddKpi(!showAddKpi)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>새 실적 지표 추가</span>
              </button>
            </div>

            {/* New KPI Form */}
            {showAddKpi && (
              <form onSubmit={handleCreateKpi} className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                <h5 className="text-xs font-bold text-blue-400">새 KPI 실적 지표 등록</h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    value={newKpiVal}
                    onChange={(e) => setNewKpiVal(e.target.value)}
                    placeholder="수치 (예: 99.8%)"
                    className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-750 text-xs text-white font-bold"
                    required
                  />
                  <input
                    type="text"
                    value={newKpiLabel}
                    onChange={(e) => setNewKpiLabel(e.target.value)}
                    placeholder="지표명 (예: 계약 달성률)"
                    className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-750 text-xs text-white"
                    required
                  />
                  <input
                    type="text"
                    value={newKpiSub}
                    onChange={(e) => setNewKpiSub(e.target.value)}
                    placeholder="부연설명 (예: 고객 신뢰)"
                    className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-750 text-xs text-white"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddKpi(false)}
                    className="px-3 py-1 rounded-lg text-xs text-zinc-400 hover:text-white bg-zinc-900"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg"
                  >
                    지표 추가
                  </button>
                </div>
              </form>
            )}

            {/* KPI list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {menuContent.home.kpis.map((kpi, idx) => (
                <div
                  key={kpi.id || idx}
                  className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2"
                >
                  <div className="flex items-center justify-between text-[11px] text-zinc-500">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => reorderHomeKpis(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 text-zinc-300 cursor-pointer"
                        title="위로 이동"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => reorderHomeKpis(idx, 'down')}
                        disabled={idx === menuContent.home.kpis.length - 1}
                        className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 disabled:opacity-30 text-zinc-300 cursor-pointer"
                        title="아래로 이동"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-mono text-zinc-400 ml-1">지표 0{idx + 1}</span>
                    </div>

                    <button
                      onClick={() => {
                        if (confirm(`'${kpi.label}' 지표를 삭제하시겠습니까?`)) {
                          deleteHomeKpi(idx);
                          notifySave(`'${kpi.label}' 지표가 삭제되었습니다.`);
                        }
                      }}
                      className="p-1 text-zinc-500 hover:text-red-400 cursor-pointer"
                      title="지표 삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      defaultValue={kpi.value}
                      onBlur={(e) => {
                        const updated = [...menuContent.home.kpis];
                        updated[idx].value = e.target.value.trim();
                        updateHomeContent({ kpis: updated });
                        notifySave('수치가 저장되었습니다.');
                      }}
                      placeholder="수치 (140+)"
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-bold text-white focus:border-blue-500"
                    />
                    <input
                      type="text"
                      defaultValue={kpi.label}
                      onBlur={(e) => {
                        const updated = [...menuContent.home.kpis];
                        updated[idx].label = e.target.value.trim();
                        updateHomeContent({ kpis: updated });
                        notifySave('지표명이 저장되었습니다.');
                      }}
                      placeholder="지표명"
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-blue-500"
                    />
                  </div>
                  <input
                    type="text"
                    defaultValue={kpi.sub}
                    onBlur={(e) => {
                      const updated = [...menuContent.home.kpis];
                      updated[idx].sub = e.target.value.trim();
                      updateHomeContent({ kpis: updated });
                      notifySave('설명이 저장되었습니다.');
                    }}
                    placeholder="부연설명"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400 focus:border-blue-500"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. CONTACT TAB */}
      {/* ========================================================================= */}
      {activeSubTab === 'contact' && (
        <form onSubmit={handleSaveContactTexts} className="space-y-4 max-w-3xl">
          <h4 className="text-sm font-bold text-white">CONTACT 페이지 및 문의 섹션 안내글</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] text-zinc-400">CONTACT 헤드라인</label>
              <input
                type="text"
                value={contactTitle}
                onChange={(e) => setContactTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-zinc-400">부제목</label>
              <input
                type="text"
                value={contactSubtitle}
                onChange={(e) => setContactSubtitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-zinc-400">문의 인트로 안내글</label>
            <textarea
              rows={3}
              value={contactIntro}
              onChange={(e) => setContactIntro(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white leading-relaxed"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-zinc-400">2시간 내 회신 보장 공약 문구</label>
            <input
              type="text"
              value={responsePledge}
              onChange={(e) => setResponsePledge(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
            />
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-lg shadow-blue-600/30 flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>CONTACT 내용 저장</span>
          </button>
        </form>
      )}

      {/* ========================================================================= */}
      {/* 7. FAQ(Q&A) TAB — 홈/서비스 페이지에 노출되는 질문·답변 관리 */}
      {/* ========================================================================= */}
      {activeSubTab === 'faq' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-blue-400" />
                <span>Q&A (자주 묻는 질문) 관리</span>
              </h4>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                홈 화면의 <strong className="text-zinc-200">05. PROCESS</strong> 섹션과{' '}
                <strong className="text-zinc-200">SERVICE</strong> 페이지에 함께 노출됩니다. 질문·답변을
                수정하고, ▲▼ 로 순서를 바꾸거나 삭제·추가할 수 있습니다.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (confirm('Q&A 를 기본 5개 항목으로 되돌리시겠습니까?')) resetFaqs();
              }}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400 hover:text-white flex items-center gap-1.5 cursor-pointer shrink-0"
              title="기본 Q&A 5개 항목으로 복원"
            >
              <RotateCcw className="w-3 h-3" />
              <span>기본값 복원</span>
            </button>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={faq.id}
                className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-blue-400 font-mono">
                    Q{String(idx + 1).padStart(2, '0')}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => reorderFaq(idx, 'up')}
                      disabled={idx === 0}
                      className="w-5 h-5 rounded border flex items-center justify-center bg-zinc-900 border-zinc-700 text-zinc-300 hover:text-white disabled:opacity-30 cursor-pointer"
                      title="위로 이동"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => reorderFaq(idx, 'down')}
                      disabled={idx === faqs.length - 1}
                      className="w-5 h-5 rounded border flex items-center justify-center bg-zinc-900 border-zinc-700 text-zinc-300 hover:text-white disabled:opacity-30 cursor-pointer"
                      title="아래로 이동"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('이 Q&A 항목을 삭제하시겠습니까?' + '\n\n' + faq.q)) deleteFaq(faq.id);
                      }}
                      className="w-5 h-5 rounded border flex items-center justify-center bg-red-600 border-red-400 text-white hover:bg-red-500 cursor-pointer"
                      title="삭제"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-400">질문</label>
                  <input
                    type="text"
                    value={faq.q}
                    onChange={(e) => updateFaq(faq.id, { q: e.target.value })}
                    placeholder="질문을 입력하세요"
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-zinc-400">답변</label>
                  <textarea
                    rows={3}
                    value={faq.a}
                    onChange={(e) => updateFaq(faq.id, { a: e.target.value })}
                    placeholder="답변을 입력하세요"
                    className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white leading-relaxed focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            ))}

            {faqs.length === 0 && (
              <p className="text-xs text-zinc-500 text-center py-8">
                등록된 Q&A 가 없습니다. 아래 버튼으로 첫 질문을 추가해 보세요.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => addFaq()}
            className="w-full py-2.5 rounded-xl border border-dashed border-blue-500/50 text-blue-300 hover:text-white hover:bg-blue-600/20 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Q&A 항목 추가</span>
          </button>

          <p className="text-[11px] text-zinc-500 leading-relaxed">
            ※ 변경 내용은 입력 즉시 자동 저장됩니다(별도 저장 버튼 없음). 홈 화면에서는 편집 모드를 켜면
            질문·답변 글자를 직접 클릭해 수정할 수도 있습니다.
          </p>
        </div>
      )}
    </div>
  );
};
