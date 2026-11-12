import React from 'react';
import { useStudio } from '../context/StudioContext';
import { ArrowUpRight } from 'lucide-react';

export const AboutPage: React.FC = () => {
  const { navigateTo, menuContent } = useStudio();
  const aboutData = menuContent.about;

  const careerMilestones = [
    {
      period: '2024 — 현재',
      role: '대표 크리에이티브 디렉터 & 디자이너',
      company: 'PORTFOLIO_SO.A',
      desc: '이커머스 브랜드, 테크 스타트업, F&B 기업을 대상으로 한 상세페이지, 프로모션 웹, 숏폼 모션 콘텐츠 원스톱 기획 및 제작 총괄. 누적 140+ 프로젝트 완료.',
    },
    {
      period: '2022 — 2024',
      role: '시니어 웹디자이너 & 아트디렉터',
      company: '디지털 커머스 크리에이티브 에이전시',
      desc: '뷰티/패션/가전 브랜드 론칭 캠페인 키비주얼, 와디즈/텀블벅 펀딩 상세페이지, Meta 및 Google GDN 광고 배너 패키지 제작 주도.',
    },
    {
      period: '2020 — 2022',
      role: '모션 그래픽 디자이너 & 콘텐츠 플래너',
      company: '뉴미디어 비디오 스튜디오',
      desc: '인스타그램 릴스, 유튜브 쇼츠, 브랜드 무드필름 컷편집 및 키네틱 타이포그래피 모션 디자인 제작. 누적 2,000만+ 유기적 조회수 달성.',
    },
  ];

  const coreStrengths = (aboutData.strengths && aboutData.strengths.length > 0)
    ? aboutData.strengths
    : [];

  const toolMatrix = [
    { name: 'Figma', level: 'Master', desc: 'UI/UX 프로토타이핑, 반응형 상세페이지 설계, 디자인 시스템 토큰 관리' },
    { name: 'After Effects', level: 'Advanced', desc: '키네틱 타이포그래피, 2D/3D 모션 그래픽, 로고 인터랙션 애니메이션' },
    { name: 'Premiere Pro', level: 'Advanced', desc: '릴스·쇼츠 세로형 9:16 비트 싱크 컷편집, 컬러 그레이딩, 오디오 마스터링' },
    { name: 'Photoshop', level: 'Master', desc: '하이엔드 제품 정밀 질감 리터칭, 패키지 목업 합성, 키비주얼 아트워크' },
    { name: 'Illustrator', level: 'Advanced', desc: '벡터 그래픽 개발, 임상 실험 인포그래픽 데이터 시각화, 브랜드 로고타입' },
    { name: 'Cinema 4D', level: 'Intermediate', desc: '3D 제품 하이라이트 렌더링, 앰비언트 라이팅 시뮬레이션, 오프닝 씬 연출' },
  ];

  return (
    <div className="py-12 md:py-20 animate-in fade-in duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
        {/* Breadcrumb & Page Header */}
        <div className="space-y-4 max-w-4xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400">
            <button onClick={() => navigateTo('home')} className="hover:text-white transition-colors cursor-pointer">
              HOME
            </button>
            <span className="text-zinc-600">/</span>
            <span className="text-blue-400">ABOUT ME</span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.1] whitespace-pre-line">
            {aboutData.headerTitle}
          </h1>

          <p className="text-base sm:text-lg text-zinc-300 leading-relaxed font-normal pt-2 whitespace-pre-line">
            {aboutData.introNarrative}
          </p>
        </div>

        {/* Narrative & Studio Philosophy Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center border-t border-zinc-850 pt-16">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-blue-400 tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>PHILOSOPHY & VISION</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight whitespace-pre-line">
              {aboutData.philosophyTitle}
            </h2>

            <div className="space-y-4 text-sm text-zinc-400 leading-relaxed whitespace-pre-line">
              <p>{aboutData.philosophyText1}</p>
              <p>{aboutData.philosophyText2}</p>
              <p>{aboutData.philosophyText3}</p>
            </div>

            <div className="pt-2 flex flex-wrap gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
                <div className="font-bold text-white text-base font-display">140+ 건</div>
                <div className="text-zinc-400 text-xs mt-0.5">상업 프로젝트 완료</div>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
                <div className="font-bold text-blue-400 text-base font-display">98.4%</div>
                <div className="text-zinc-400 text-xs mt-0.5">고객사 만족 및 재의뢰</div>
              </div>
              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
                <div className="font-bold text-white text-base font-display">100%</div>
                <div className="text-zinc-400 text-xs mt-0.5">약속 마감 기한 준수율</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 p-2 shadow-2xl">
              <img
                src="/images/hero_design_showcase_1794358690838.jpg"
                alt="SO.A Design Studio"
                className="w-full h-auto rounded-xl object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="p-4 space-y-1">
                <div className="text-xs font-bold text-white">SO.A CREATIVE WORKSPACE</div>
                <div className="text-[11px] text-zinc-500">기획과 디자인, 모션 영상이 유기적으로 완성되는 크리에이티브 랩</div>
              </div>
            </div>
          </div>
        </div>

        {/* Career & Experience Timeline */}
        <div className="space-y-8 border-t border-zinc-850 pt-16">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-blue-400 tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>EXPERIENCE ROADMAP</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">실무 경력 및 프로젝트 이력</h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              스타트업 론칭부터 중견·대기업 캠페인까지 검증된 실무 경험을 보유하고 있습니다.
            </p>
          </div>

          <div className="space-y-4">
            {careerMilestones.map((item, idx) => (
              <div
                key={idx}
                className="p-6 md:p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 transition-colors flex flex-col md:flex-row md:items-start justify-between gap-6"
              >
                <div className="md:w-1/4 space-y-1 shrink-0">
                  <span className="font-mono text-xs font-bold text-blue-400 block">{item.period}</span>
                  <strong className="text-sm font-bold text-white block">{item.company}</strong>
                  <span className="text-xs text-zinc-400 block">{item.role}</span>
                </div>
                <div className="md:w-3/4">
                  <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 6 Core Strengths Grid */}
        <div className="space-y-8 border-t border-zinc-850 pt-16">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-blue-400 tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>CORE CAPABILITIES</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">SO.A만의 6가지 실무 경쟁력</h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              클라이언트가 믿고 맡길 수 있는 확실한 이유를 제공합니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coreStrengths.map((item, idx) => (
              <div
                key={idx}
                className="p-7 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-3"
              >
                <span className="font-mono text-xs font-bold text-blue-400 block">
                  {item.number}.
                </span>
                <h3 className="text-base font-bold text-white">{item.title}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Specialized Software Matrix */}
        <div className="space-y-8 border-t border-zinc-850 pt-16">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-blue-400 tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>TOOL STACK & EXPERTISE</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">활용 소프트웨어 & 숙련도</h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              업계 표준 툴을 활용한 정밀한 에셋 제작과 완벽한 파일 호환성을 보장합니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {toolMatrix.map((tool, idx) => (
              <div key={idx} className="p-5 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">{tool.name}</h4>
                  <span className="text-[11px] font-mono font-semibold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-900/50">
                    {tool.level}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">{tool.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA Banner */}
        <div className="p-8 md:p-12 rounded-3xl bg-gradient-to-r from-blue-950/60 via-zinc-900 to-zinc-950 border border-blue-900/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-white">SO.A와 함께 귀사의 브랜드를 성장시키세요</h3>
            <p className="text-xs sm:text-sm text-zinc-400">
              상세페이지, 배너, 숏폼 영상까지 24시간 이내에 1:1 맞춤 견적과 일정을 안내해 드립니다.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigateTo('contact')}
              className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-600/30 whitespace-nowrap"
            >
              <span>프로젝트 의뢰하기</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigateTo('works')}
              className="px-5 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>포트폴리오 보러가기</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
