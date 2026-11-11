import React from 'react';
import { useStudio } from '../context/StudioContext';
import { Lock, ArrowUp, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  const { navigateTo, setIsAdminModalOpen, isAdminLoggedIn, config } = useStudio();

  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="border-t border-zinc-850 bg-[var(--app-surface-2)] text-zinc-400 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Main Footer Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Brand info */}
          <div className="md:col-span-5 space-y-4">
            <div className="font-display font-extrabold text-xl text-white tracking-tight flex items-center gap-1.5">
              <span>PORTFOLIO_SO.A</span>
              <span className="text-blue-500">.</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-sm">
              보이는 디자인을 넘어, 실제 성과와 매출을 만드는 크리에이티브 디자인 스튜디오. 웹디자인과 영상 콘텐츠를 하나의 통합된 브랜드 경험으로 완성합니다.
            </p>
            <div className="text-[11px] text-zinc-500 font-mono space-y-0.5">
              <p>사업자 등록 번호: 120-88-10120 | 대표: SO.A</p>
              <p>이메일: {config.email} | 연락처: {config.phone}</p>
              <p>서울특별시 강남구 테헤란로 크리에이티브 빌딩 7층</p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3 space-y-3">
            <div className="text-xs font-bold text-white tracking-wider">NAVIGATION</div>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => navigateTo('home')} className="hover:text-white transition-colors cursor-pointer">
                  HOME (메인)
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('about')} className="hover:text-white transition-colors cursor-pointer">
                  ABOUT (소개·경력)
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('works')} className="hover:text-white transition-colors cursor-pointer">
                  WORKS (전체 포트폴리오)
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('service')} className="hover:text-white transition-colors cursor-pointer">
                  SERVICE (작업 범위·견적)
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('contact')} className="hover:text-white transition-colors cursor-pointer">
                  CONTACT (프로젝트 의뢰)
                </button>
              </li>
            </ul>
          </div>

          {/* Services Quick Scope */}
          <div className="md:col-span-4 space-y-3">
            <div className="text-xs font-bold text-white tracking-wider">CREATIVE SERVICES</div>
            <ul className="space-y-1.5 text-xs text-zinc-400">
              <li>· 이커머스 상세페이지 기획 및 제작</li>
              <li>· 디지털 디스플레이 및 SNS 광고 배너 세트</li>
              <li>· 시즌 프로모션 및 이벤트 캠페인 키비주얼</li>
              <li>· 릴스 / 쇼츠 / 틱톡 숏폼 영상 기획·편집</li>
              <li>· 3D 모션 그래픽 및 브랜드 필름</li>
            </ul>
          </div>
        </div>

        {/* Bottom Strip */}
        <div className="pt-8 border-t border-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-zinc-500">
          <div>
            © {new Date().getFullYear()} PORTFOLIO_SO.A. All rights reserved.
          </div>

          <div className="flex items-center gap-6">
            {/* Admin entry trigger */}
            <button
              onClick={() => setIsAdminModalOpen(true)}
              className="flex items-center gap-1.5 text-[11px] text-zinc-500 hover:text-blue-400 transition-colors cursor-pointer"
            >
              {isAdminLoggedIn ? <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> : <Lock className="w-3 h-3" />}
              <span>{isAdminLoggedIn ? '관리자 대시보드' : '포트폴리오 관리자'}</span>
            </button>

            <button
              onClick={handleScrollTop}
              className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <span>맨 위로</span>
              <ArrowUp className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
