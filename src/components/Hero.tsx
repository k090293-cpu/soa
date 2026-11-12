import React from 'react';
import { useStudio } from '../context/StudioContext';
import { ArrowDown, ArrowUpRight, CheckCircle2, TrendingUp } from 'lucide-react';
import { TRUST_STATS } from '../data/servicesData';
import { EditableText } from './editable/EditableText';

export const Hero: React.FC = () => {
  const {
    navigateTo,
    setActiveProjectDetail,
    projects,
    menuContent,
    updateHomeContent,
    addHomeKpi,
    isHomeInlineEditMode,
  } = useStudio();

  const featuredProject = projects[0];
  const homeData = menuContent.home;
  const kpiList = homeData.kpis && homeData.kpis.length > 0 ? homeData.kpis : TRUST_STATS;

  return (
    <section id="hero" className="relative pt-8 pb-16 md:pt-14 md:pb-24 overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Split Hero: Typography Left, High-Impact Media Frame Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Domain Kicker */}
            <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-blue-400">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <EditableText
                value={homeData.heroKicker || 'PORTFOLIO_SO.A / WEB & MOTION STUDIO'}
                onSave={(v) => updateHomeContent({ heroKicker: v })}
                label="상단 킥커"
              />
            </div>

            {/* Massive Editorial Headline with text-wrap: balance */}
            <h1 className="font-display font-extrabold text-4xl sm:text-5xl md:text-6xl lg:text-[4.2rem] leading-[1.08] tracking-tight text-white whitespace-pre-line" style={{ textWrap: 'balance' }}>
              <EditableText
                value={homeData.heroHeadline}
                onSave={(v) => updateHomeContent({ heroHeadline: v })}
                label="메인 헤드라인"
                multiline
              />
            </h1>

            {/* Sub-headline & Positioning */}
            <p className="text-base sm:text-lg text-zinc-300 font-normal leading-relaxed max-w-2xl whitespace-pre-line">
              <EditableText
                value={homeData.heroSubheadline}
                onSave={(v) => updateHomeContent({ heroSubheadline: v })}
                label="서브 카피"
                multiline
              />
            </p>

            {/* Core Capability Chips - Clean unboxed text with subtle dividers */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-3 text-xs text-zinc-400 pt-1">
              <span className="text-zinc-200 font-medium">01. WEB DESIGN</span>
              <span className="text-zinc-600">·</span>
              <span className="text-zinc-200 font-medium">02. PROMOTION DESIGN</span>
              <span className="text-zinc-600">·</span>
              <span className="text-zinc-200 font-medium">03. VIDEO & SHORT-FORM</span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-3">
              <button
                onClick={() => navigateTo('contact')}
                className="px-6 py-3.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-xl transition-all duration-150 flex items-center gap-2 shadow-lg shadow-blue-600/25 hover:shadow-blue-500/35 cursor-pointer whitespace-nowrap"
              >
                <span>프로젝트 의뢰하기</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => navigateTo('works')}
                className="px-5 py-3.5 text-sm font-semibold text-zinc-300 hover:text-white bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-all duration-150 flex items-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <span>포트폴리오 전체보기</span>
                <ArrowDown className="w-4 h-4 text-zinc-400" />
              </button>
            </div>

            {/* Quick Trust Highlights */}
            <div className="pt-2 flex flex-wrap items-center gap-6 text-xs text-zinc-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                <span>마감 일정 100% 엄수</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                <span>기획부터 영상까지 올인원</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                <span>세금계산서 발행 가능</span>
              </div>
            </div>
          </div>

          {/* Right Column (5 cols on lg): Representative Studio Showcase Media Frame */}
          <div className="lg:col-span-5 relative">
            <div data-theme="dark" className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900/60 shadow-2xl group">
              {/* Studio Desk / Multi-Monitor Image */}
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                <img
                  src="/images/hero_design_showcase_1794358690838.jpg"
                  alt="Creative Design Studio Workspace"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              </div>

              {/* Overlaid Information Banner inside the card */}
              <div className="absolute bottom-0 inset-x-0 p-5 space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-300">
                  <span className="font-semibold text-white">PORTFOLIO_SO.A WORKSPACE</span>
                  <span className="text-blue-400 text-[11px] font-mono">EST. 2026</span>
                </div>
                <p className="text-xs text-zinc-300 line-clamp-2">
                  기획자 없이도 마케팅 목적에 부합하는 웹디자인과 고관여 숏폼 영상을 유기적으로 완성합니다.
                </p>

                {featuredProject && (
                  <button
                    onClick={() => setActiveProjectDetail(featuredProject)}
                    className="w-full mt-2 py-2 px-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-lg text-xs font-medium text-white flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <span>대표 프로젝트 케이스 스터디 열람</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-blue-400" />
                  </button>
                )}
              </div>

              {/* Floating conversion badge */}
              <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md border border-zinc-700/80 rounded-lg px-3 py-1.5 shadow-lg flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs font-semibold text-white">평균 전환율 +148%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Full-Width Quantitative Trust & KPI Strip below the hero split */}
        <div className="mt-14 pt-10 border-t border-zinc-800/80">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
            {kpiList.map((stat, idx) => (
              <div key={idx} className="space-y-1">
                <div className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-white tabular-nums">
                  <EditableText
                    value={stat.value}
                    onSave={(v) => {
                      const next = kpiList.map((k, i) => (i === idx ? { ...k, value: v } : k));
                      updateHomeContent({
                        kpis: next.map((k) => ({ value: k.value, label: k.label, sub: k.sub })),
                      });
                    }}
                    label={`KPI ${idx + 1} 수치`}
                  />
                </div>
                <div className="text-xs sm:text-sm font-semibold text-zinc-300">
                  <EditableText
                    value={stat.label}
                    onSave={(v) => {
                      const next = kpiList.map((k, i) => (i === idx ? { ...k, label: v } : k));
                      updateHomeContent({
                        kpis: next.map((k) => ({ value: k.value, label: k.label, sub: k.sub })),
                      });
                    }}
                    label={`KPI ${idx + 1} 제목`}
                  />
                </div>
                <div className="text-xs text-zinc-500">
                  <EditableText
                    value={stat.sub}
                    onSave={(v) => {
                      const next = kpiList.map((k, i) => (i === idx ? { ...k, sub: v } : k));
                      updateHomeContent({
                        kpis: next.map((k) => ({ value: k.value, label: k.label, sub: k.sub })),
                      });
                    }}
                    label={`KPI ${idx + 1} 설명`}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* KPI 추가 — 편집 모드에서만 노출 */}
          {isHomeInlineEditMode && (
            <div className="pt-6">
              <button
                type="button"
                onClick={() =>
                  addHomeKpi({ value: '{VALUE}', label: '새 지표', sub: '설명을 입력하세요' })
                }
                className="px-4 py-2 rounded-xl border border-dashed border-blue-500/60 text-blue-300 hover:text-white hover:bg-blue-600/20 text-xs font-semibold transition-colors cursor-pointer"
              >
                + KPI 지표 추가
              </button>
            </div>
          )}
        </div>
      </div>

    </section>
  );
};
