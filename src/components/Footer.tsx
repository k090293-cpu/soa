import React from 'react';
import { useStudio } from '../context/StudioContext';
import { Lock, ArrowUp, ShieldCheck } from 'lucide-react';
import { SiteText } from './editable/SiteText';

export const Footer: React.FC = () => {
  const { navigateTo, setIsAdminModalOpen, isAdminLoggedIn, config, isHomeInlineEditMode } = useStudio();

  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 편집 모드에서는 페이지 이동을 막습니다 (문구 수정에 집중)
  const guardNav = (fn: () => void) => () => {
    if (isHomeInlineEditMode) return;
    fn();
  };

  const NAV_ITEMS: { page: 'home' | 'about' | 'works' | 'service' | 'contact'; fallback: string }[] = [
    { page: 'home', fallback: 'HOME (메인)' },
    { page: 'about', fallback: 'ABOUT (소개·경력)' },
    { page: 'works', fallback: 'WORKS (전체 포트폴리오)' },
    { page: 'service', fallback: 'SERVICE (작업 범위·견적)' },
    { page: 'contact', fallback: 'CONTACT (프로젝트 의뢰)' },
  ];

  const SERVICE_ITEMS = [
    '· 이커머스 상세페이지 기획 및 제작',
    '· 디지털 디스플레이 및 SNS 광고 배너 세트',
    '· 시즌 프로모션 및 이벤트 캠페인 키비주얼',
    '· 릴스 / 쇼츠 / 틱톡 숏폼 영상 기획·편집',
    '· 3D 모션 그래픽 및 브랜드 필름',
  ];

  return (
    <footer className="border-t border-zinc-850 bg-[var(--app-surface-2)] text-zinc-400 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Main Footer Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Brand info */}
          <div className="md:col-span-5 space-y-4">
            <div className="font-display font-extrabold text-xl text-white tracking-tight flex items-center gap-1.5">
              <SiteText tkey="footer.brand" fallback="PORTFOLIO_SO.A" label="브랜드명" />
              <span className="text-blue-500">.</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
              <SiteText
                tkey="footer.desc"
                fallback="보이는 디자인을 넘어, 실제 성과와 매출을 만드는 크리에이티브 디자인 스튜디오. 웹디자인과 영상 콘텐츠를 하나의 통합된 브랜드 경험으로 완성합니다."
                label="브랜드 소개"
                multiline
              />
            </p>
            <div className="text-[11px] text-zinc-500 font-mono space-y-0.5">
              <p>
                <SiteText tkey="footer.bizNo" fallback="사업자 등록 번호: 120-88-10120 | 대표: SO.A" label="사업자 정보" />
              </p>
              <p>
                <SiteText tkey="footer.emailLabel" fallback="이메일:" label="이메일 라벨" /> {config.email}{' '}
                <SiteText tkey="footer.phoneLabel" fallback="| 연락처:" label="연락처 라벨" /> {config.phone}
              </p>
              <p>
                <SiteText tkey="footer.address" fallback="서울특별시 강남구 테헤란로 크리에이티브 빌딩 7층" label="주소" multiline />
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3 space-y-3">
            <div className="text-xs font-bold text-white tracking-wider">
              <SiteText tkey="footer.navTitle" fallback="NAVIGATION" label="네비 제목" />
            </div>
            <ul className="space-y-2 text-xs">
              {NAV_ITEMS.map((item) => (
                <li key={item.page}>
                  <button
                    onClick={guardNav(() => navigateTo(item.page))}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    <SiteText tkey={`footer.nav.${item.page}`} fallback={item.fallback} label={`푸터 ${item.page}`} />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Services Quick Scope */}
          <div className="md:col-span-4 space-y-3">
            <div className="text-xs font-bold text-white tracking-wider">
              <SiteText tkey="footer.servicesTitle" fallback="CREATIVE SERVICES" label="서비스 제목" />
            </div>
            <ul className="space-y-1.5 text-xs text-zinc-400">
              {SERVICE_ITEMS.map((item, idx) => (
                <li key={idx}>
                  <SiteText tkey={`footer.service.${idx}`} fallback={item} label={`푸터 서비스${idx + 1}`} multiline />
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Strip */}
        <div className="pt-8 border-t border-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-zinc-500">
          <div>
            <SiteText
              tkey="footer.copyright"
              fallback={`© ${new Date().getFullYear()} PORTFOLIO_SO.A. All rights reserved.`}
              label="저작권 문구"
            />
          </div>

          <div className="flex items-center gap-6">
            {/* Admin entry trigger */}
            <button
              onClick={() => setIsAdminModalOpen(true)}
              className="flex items-center gap-1.5 text-[11px] text-zinc-500 hover:text-blue-400 transition-colors cursor-pointer"
            >
              {isAdminLoggedIn ? <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> : <Lock className="w-3 h-3" />}
              <span>
                {isAdminLoggedIn ? (
                  <SiteText tkey="footer.adminLoggedIn" fallback="관리자 대시보드" label="관리자 버튼" />
                ) : (
                  <SiteText tkey="footer.adminLoggedOut" fallback="포트폴리오 관리자" label="관리자 버튼" />
                )}
              </span>
            </button>

            <button
              onClick={handleScrollTop}
              className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <SiteText tkey="footer.toTop" fallback="맨 위로" label="맨위로 버튼" />
              <ArrowUp className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
