import React, { useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import { Project, InquiryStatus } from '../../types';
import { ProjectFormModal } from './ProjectFormModal';
import { MenuContentEditor } from './MenuContentEditor';
import { HomePage } from '../../pages/HomePage';
import {
  Lock,
  Unlock,
  X,
  Plus,
  Trash2,
  Edit3,
  Copy,
  Check,
  RotateCcw,
  Settings,
  Briefcase,
  Inbox,
  LogOut,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  FileText,
  Monitor,
  Tablet,
  Smartphone,
  Columns,
  Maximize2,
  Eye
} from 'lucide-react';

export const AdminModal: React.FC = () => {
  const {
    isAdminModalOpen,
    setIsAdminModalOpen,
    isAdminLoggedIn,
    loginAdmin,
    logoutAdmin,
    projects,
    inquiries,
    config,
    addProject,
    updateProject,
    deleteProject,
    resetProjectsToDefault,
    updateInquiryStatus,
    deleteInquiry,
    updateConfig,
    isSplitEditorOpen,
    setIsSplitEditorOpen,
  } = useStudio();

  // Login form state
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<'content' | 'preview' | 'projects' | 'inquiries' | 'settings'>('content');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // Project form modal state
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);

  // Studio config form state
  const [bannerInput, setBannerInput] = useState(config.statusBanner);
  const [emailInput, setEmailInput] = useState(config.email);
  const [phoneInput, setPhoneInput] = useState(config.phone);
  const [kakaoInput, setKakaoInput] = useState(config.kakao);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Copy contact feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isAdminModalOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const success = loginAdmin(passwordInput);
    if (success) {
      setPasswordInput('');
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  const handleCopyContact = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig({
      statusBanner: bannerInput,
      email: emailInput,
      phone: phoneInput,
      kakao: kakaoInput,
    });
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
  };

  const handleOpenAddProject = () => {
    setEditingProject(null);
    setIsProjectFormOpen(true);
  };

  const handleOpenEditProject = (p: Project) => {
    setEditingProject(p);
    setIsProjectFormOpen(true);
  };

  const handleSaveProjectForm = (data: Omit<Project, 'id'>) => {
    if (editingProject) {
      updateProject(editingProject.id, data);
    } else {
      addProject(data);
    }
    setIsProjectFormOpen(false);
    setEditingProject(null);
  };

  const statusColors: Record<InquiryStatus, string> = {
    '신규': 'bg-blue-950/60 text-blue-400 border-blue-800',
    '검토중': 'bg-amber-950/60 text-amber-400 border-amber-800',
    '상담완료': 'bg-purple-950/60 text-purple-400 border-purple-800',
    '계약체결': 'bg-emerald-950/60 text-emerald-400 border-emerald-800',
  };

  return (
    <>
      <div
        className={
          isSplitEditorOpen
            ? 'fixed inset-0 z-50 pointer-events-none flex justify-end animate-in fade-in duration-150'
            : 'fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150'
        }
      >
        <div
          className={
            isSplitEditorOpen
              ? 'pointer-events-auto relative w-full sm:w-[540px] md:w-[620px] h-full bg-[#0e0f14] border-l border-zinc-800 shadow-2xl overflow-hidden flex flex-col'
              : 'relative w-full max-w-5xl bg-[#0e0f14] border border-zinc-800 rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col'
          }
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-[#0e0f14]/90 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>스튜디오 관리자 모드</span>
                  <span className="text-[11px] font-mono text-blue-400 font-normal">ADMIN PANEL</span>
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isAdminLoggedIn && (
                <>
                  <button
                    onClick={() => setIsSplitEditorOpen(!isSplitEditorOpen)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 cursor-pointer ${
                      isSplitEditorOpen
                        ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                        : 'text-zinc-400 hover:text-white bg-zinc-900 border-zinc-800 hover:bg-zinc-800'
                    }`}
                    title={isSplitEditorOpen ? '중앙 전체 모달로 복귀' : '홈 화면을 배경으로 보며 편집하기 (플로팅 모드)'}
                  >
                    {isSplitEditorOpen ? <Maximize2 className="w-3.5 h-3.5" /> : <Columns className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">{isSplitEditorOpen ? '전체 모달' : '홈 보며 편집'}</span>
                  </button>

                  <button
                    onClick={logoutAdmin}
                    className="px-2.5 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>로그아웃</span>
                  </button>
                </>
              )}
              <button
                onClick={() => setIsAdminModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* If NOT logged in: Password entry screen */}
          {!isAdminLoggedIn ? (
            <div className="p-8 md:p-14 text-center max-w-md mx-auto space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 mx-auto">
                <Lock className="w-6 h-6 text-blue-400" />
              </div>

              <div className="space-y-1.5">
                <h4 className="text-xl font-bold text-white">관리자 인증이 필요합니다</h4>
                <p className="text-xs text-zinc-400">
                  포트폴리오 수정 및 접수된 견적 문의 조회를 위해 지정된 관리자 비밀번호(<strong className="text-blue-400">1012</strong>)를 입력하세요.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1 text-left">
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={(e) => {
                      setPasswordInput(e.target.value);
                      setLoginError(false);
                    }}
                    placeholder="비밀번호 1012 입력"
                    className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-center text-white tracking-widest placeholder:tracking-normal placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 font-mono"
                    autoFocus
                  />
                  {loginError && (
                    <p className="text-xs text-red-400 flex items-center justify-center gap-1 pt-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>비밀번호가 일치하지 않습니다. (지정 번호: 1012)</span>
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-lg shadow-blue-600/30"
                >
                  관리자 대시보드 로그인
                </button>
              </form>
            </div>
          ) : (
            /* Logged In Dashboard with Tabs */
            <div className="p-6 md:p-8 space-y-6 max-h-[82vh] overflow-y-auto">
              {/* Navigation Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4 shrink-0">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setActiveTab('content')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'content'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                        : 'text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>메뉴 & 카테고리 관리 (위치·삭제·수정)</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('preview')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'preview'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                        : 'text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800'
                    }`}
                  >
                    <Eye className="w-4 h-4 text-emerald-400" />
                    <span>전체 홈 실시간 뷰어</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('projects')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'projects'
                        ? 'bg-blue-600 text-white'
                        : 'text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800'
                    }`}
                  >
                    <Briefcase className="w-4 h-4" />
                    <span>포트폴리오 관리 ({projects.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('inquiries')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'inquiries'
                        ? 'bg-blue-600 text-white'
                        : 'text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800'
                    }`}
                  >
                    <Inbox className="w-4 h-4" />
                    <span>제작 문의 ({inquiries.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('settings')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                      activeTab === 'settings'
                        ? 'bg-blue-600 text-white'
                        : 'text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800'
                    }`}
                  >
                    <Settings className="w-4 h-4" />
                    <span>스튜디오 설정</span>
                  </button>
                </div>

                {activeTab === 'projects' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleOpenAddProject}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>새 프로젝트 등록</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('모든 포트폴리오를 초기 대표 프로젝트 목록으로 초기화하시겠습니까?')) {
                          resetProjectsToDefault();
                        }
                      }}
                      className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      title="초기 데이터 복원"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>초기화</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Tab 1: Inquiries Management */}
              {activeTab === 'inquiries' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>방문자가 웹사이트 견적 폼을 통해 제출한 실시간 문의 목록입니다.</span>
                    <span className="font-mono text-zinc-500">총 {inquiries.length}건</span>
                  </div>

                  {inquiries.length === 0 ? (
                    <div className="p-12 text-center text-zinc-500 text-xs rounded-2xl bg-zinc-950 border border-zinc-900">
                      접수된 문의 내역이 없습니다.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {inquiries.map((inq) => (
                        <div
                          key={inq.id}
                          className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4"
                        >
                          {/* Top Row: Client Info, Date, Status */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-900 pb-3">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <strong className="text-white text-sm">{inq.clientName}</strong>
                                {inq.company && (
                                  <span className="text-xs text-zinc-400">({inq.company})</span>
                                )}
                              </div>
                              <div className="text-[11px] text-zinc-500 font-mono">접수 일시: {inq.createdAt}</div>
                            </div>

                            {/* Status Selector */}
                            <div className="flex items-center gap-2">
                              <select
                                value={inq.status}
                                onChange={(e) => updateInquiryStatus(inq.id, e.target.value as InquiryStatus)}
                                className={`text-xs font-semibold px-2.5 py-1 rounded-lg border focus:outline-none cursor-pointer ${
                                  statusColors[inq.status]
                                }`}
                              >
                                <option value="신규">신규</option>
                                <option value="검토중">검토중</option>
                                <option value="상담완료">상담완료</option>
                                <option value="계약체결">계약체결</option>
                              </select>

                              <button
                                onClick={() => {
                                  if (confirm('이 문의 내역을 삭제하시겠습니까?')) {
                                    deleteInquiry(inq.id);
                                  }
                                }}
                                className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                                title="문의 삭제"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Contact Details & Requested Categories */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs bg-zinc-900/50 p-3.5 rounded-xl border border-zinc-850">
                            <div>
                              <div className="text-[11px] text-zinc-500">연락처</div>
                              <div className="font-mono text-zinc-200 flex items-center gap-1.5 pt-0.5">
                                <span>{inq.contact}</span>
                                <button
                                  onClick={() => handleCopyContact(inq.id, inq.contact)}
                                  className="text-zinc-400 hover:text-white"
                                  title="연락처 복사"
                                >
                                  {copiedId === inq.id ? (
                                    <Check className="w-3 h-3 text-blue-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            </div>

                            <div>
                              <div className="text-[11px] text-zinc-500">이메일</div>
                              <div className="text-zinc-200 truncate pt-0.5">{inq.email}</div>
                            </div>

                            <div>
                              <div className="text-[11px] text-zinc-500">의뢰 분야</div>
                              <div className="text-blue-400 font-medium pt-0.5">
                                {inq.categories.join(', ')}
                              </div>
                            </div>

                            <div>
                              <div className="text-[11px] text-zinc-500">예산 / 희망 일정</div>
                              <div className="text-zinc-300 pt-0.5">
                                {inq.budget} · {inq.schedule}
                              </div>
                            </div>
                          </div>

                          {/* Project Description Brief */}
                          <div className="space-y-1 text-xs">
                            <span className="font-semibold text-zinc-400">의뢰 상세 내용:</span>
                            <p className="text-zinc-300 bg-zinc-900/30 p-3 rounded-lg border border-zinc-850 leading-relaxed whitespace-pre-line">
                              {inq.description}
                            </p>
                          </div>

                          {inq.referenceUrl && (
                            <div className="text-xs flex items-center gap-1.5 text-zinc-400">
                              <span className="font-semibold">참고 링크:</span>
                              <a
                                href={inq.referenceUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-400 hover:underline flex items-center gap-1 truncate max-w-md"
                              >
                                <span>{inq.referenceUrl}</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          )}

                          {/* Admin Note Input */}
                          <div className="pt-2 border-t border-zinc-900 flex items-center gap-2">
                            <span className="text-[11px] text-zinc-500 shrink-0">관리자 메모:</span>
                            <input
                              type="text"
                              defaultValue={inq.adminNote || ''}
                              onBlur={(e) => updateInquiryStatus(inq.id, inq.status, e.target.value)}
                              placeholder="상담 진행 상황, 견적 전달 일자 등 내부 메모 (입력 후 포커스 아웃 시 자동 저장)"
                              className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Projects Management */}
              {activeTab === 'projects' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projects.map((p) => (
                      <div
                        key={p.id}
                        className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex gap-4 items-center justify-between"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <img
                            src={p.image}
                            alt={p.title}
                            className="w-16 h-16 rounded-xl object-cover shrink-0 border border-zinc-800"
                            referrerPolicy="no-referrer"
                          />
                          <div className="space-y-1 min-w-0">
                            <span className="text-[10px] font-mono text-blue-400 block">
                              {p.categoryLabel}
                            </span>
                            <h4 className="text-sm font-bold text-white truncate">{p.title}</h4>
                            <p className="text-xs text-zinc-400 truncate">{p.subtitle}</p>
                            <div className="flex items-center gap-1.5 pt-0.5">
                              <span className="text-[11px] text-blue-400 font-semibold">
                                {p.impactMetric.value} ({p.impactMetric.label})
                              </span>
                              {p.gallery && p.gallery.length > 0 && (
                                <span className="text-[10px] text-zinc-400 font-mono">
                                  · 미디어 {p.gallery.length}개
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleOpenEditProject(p)}
                            className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                            title="수정하기"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`'${p.title}' 프로젝트를 삭제하시겠습니까?`)) {
                                deleteProject(p.id);
                              }
                            }}
                            className="p-2 rounded-lg bg-zinc-900 hover:bg-red-950 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                            title="삭제하기"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab: Menu & Category Content Editor */}
              {activeTab === 'content' && <MenuContentEditor />}

              {/* Tab: Entire Live Home Preview */}
              {activeTab === 'preview' && (
                <div className="space-y-4">
                  {/* Top Bar with Device Viewport Selector */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-zinc-950 border border-zinc-800 rounded-2xl text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/50" />
                      <div>
                        <strong className="text-white text-xs block">전체 홈 실시간 라이브 뷰어</strong>
                        <span className="text-[11px] text-zinc-400">
                          수정한 메뉴 순서, 카테고리, 텍스트가 실시간으로 반영된 실제 메인 홈 화면입니다.
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-xl">
                      <button
                        onClick={() => setPreviewDevice('desktop')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                          previewDevice === 'desktop'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        <Monitor className="w-3.5 h-3.5" />
                        <span>데스크톱 (100%)</span>
                      </button>

                      <button
                        onClick={() => setPreviewDevice('tablet')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                          previewDevice === 'tablet'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        <Tablet className="w-3.5 h-3.5" />
                        <span>태블릿 (768px)</span>
                      </button>

                      <button
                        onClick={() => setPreviewDevice('mobile')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                          previewDevice === 'mobile'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>모바일 (390px)</span>
                      </button>
                    </div>
                  </div>

                  {/* Device Viewport Window Frame */}
                  <div className="p-3 sm:p-5 bg-zinc-950/70 rounded-3xl border border-zinc-850 flex justify-center overflow-x-auto min-h-[500px]">
                    <div
                      className={`transition-all duration-300 bg-[#0b0c10] border border-zinc-800 rounded-2xl overflow-y-auto max-h-[72vh] shadow-2xl relative ${
                        previewDevice === 'mobile'
                          ? 'w-[390px] px-2'
                          : previewDevice === 'tablet'
                          ? 'w-[768px] px-4'
                          : 'w-full'
                      }`}
                    >
                      {/* Inner live home preview */}
                      <HomePage />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Studio Settings */}
              {activeTab === 'settings' && (
                <form onSubmit={handleSaveSettings} className="space-y-6 max-w-2xl">
                  {settingsSaved && (
                    <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-xs text-emerald-300 flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      <span>스튜디오 설정 정보가 성공적으로 저장되었습니다.</span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-300">
                      상단 상태 공지 배너 문구
                    </label>
                    <input
                      type="text"
                      value={bannerInput}
                      onChange={(e) => setBannerInput(e.target.value)}
                      placeholder="예: 2026 Q2 신규 프로젝트 예약 접수 중 · 평균 회신 2시간 이내"
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                    <p className="text-[11px] text-zinc-500">웹사이트 최상단에 얇은 띠 배너로 노출됩니다.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-zinc-300">대표 이메일</label>
                      <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-zinc-300">대표 전화번호</label>
                      <input
                        type="text"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-300">카카오톡 채널 ID</label>
                    <input
                      type="text"
                      value={kakaoInput}
                      onChange={(e) => setKakaoInput(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-lg shadow-blue-600/30"
                  >
                    설정 변경사항 저장
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Project Form Modal for Add/Edit */}
      {isProjectFormOpen && (
        <ProjectFormModal
          projectToEdit={editingProject}
          onSave={handleSaveProjectForm}
          onClose={() => setIsProjectFormOpen(false)}
        />
      )}
    </>
  );
};
