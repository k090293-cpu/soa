import React, { useCallback } from 'react';
import { useStudio } from '../context/StudioContext';
import { ArrowDown, ArrowUpRight, CheckCircle2, TrendingUp } from 'lucide-react';
import { TRUST_STATS } from '../data/servicesData';
import { EditableText } from './editable/EditableText';
import { SiteText } from './editable/SiteText';
import { SiteImage } from './editable/SiteImage';
import { HomeBlockShell } from './editable/HomeBlockShell';
import { useBlockDrag } from '../hooks/useBlockDrag';
import { HOME_BLOCK_LABELS } from '../utils/homeBlocks';

const CAPABILITY_FALLBACK = ['01. WEB DESIGN', '02. PROMOTION DESIGN', '03. VIDEO & SHORT-FORM'];
const HERO_TRUST_FALLBACK = ['마감 일정 100% 엄수', '기획부터 영상까지 올인원', '세금계산서 발행 가능'];

export const Hero: React.FC = () => {
  const {
    navigateTo,
    setActiveProjectDetail,
    projects,
    menuContent,
    updateHomeContent,
    addHomeKpi,
    isHomeInlineEditMode,
    hiddenHomeBlocks,
    homeBlockOrder,
    deleteHomeBlock,
    restoreHomeBlock,
    moveHomeBlock,
    setHomeBlockOrder,
    moveHomeKpi,
    undoHomeEdit,
    canUndo,
    siteText,
    setSiteText,
  } = useStudio();

  const featuredProject = projects[0];
  const homeData = menuContent.home;
  const kpiList = homeData.kpis && homeData.kpis.length > 0 ? homeData.kpis : TRUST_STATS;
  const mediaPos: 'right' | 'bottom' = homeData.heroMediaPosition === 'bottom' ? 'bottom' : 'right';

  const isHidden = (key: string) => hiddenHomeBlocks.includes(key);

  // 히어로 좌측 블록들만 드래그 순서 변경 대상
  const heroKeys = homeBlockOrder.filter((k) => k !== 'heroMedia' && k !== 'kpis');
  const getHeroIndex = (key: string) => heroKeys.indexOf(key);

  const handleHeroDrop = useCallback(
    (fromKey: string, toKey: string) => {
      const full = [...homeBlockOrder];
      const from = full.indexOf(fromKey);
      const to = full.indexOf(toKey);
      if (from < 0 || to < 0 || from === to) return;
      const next = [...full];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      setHomeBlockOrder(next);
    },
    [homeBlockOrder, setHomeBlockOrder]
  );

  const heroDrag = useBlockDrag(handleHeroDrop);

  // KPI 카드 드래그 (data-home-block="kpi-N" 키를 인덱스로 변환)
  const handleKpiDrop = useCallback(
    (fromKey: string, toKey: string) => {
      const from = Number(fromKey.replace('kpi-', ''));
      const to = Number(toKey.replace('kpi-', ''));
      if (Number.isNaN(from) || Number.isNaN(to)) return;
      moveHomeKpi(from, to);
    },
    [moveHomeKpi]
  );

  const kpiDrag = useBlockDrag(handleKpiDrop);

  const updateKpi = (idx: number, field: 'value' | 'label' | 'sub', v: string) => {
    const next = kpiList.map((k, i) => (i === idx ? { ...k, [field]: v } : k));
    updateHomeContent({
      kpis: next.map((k) => ({ value: k.value, label: k.label, sub: k.sub })),
    });
  };

  const removeKpi = (idx: number) => {
    updateHomeContent({
      kpis: kpiList
        .filter((_, i) => i !== idx)
        .map((k) => ({ value: k.value, label: k.label, sub: k.sub })),
    });
  };

  // 편집 모드에서는 링크 이동을 막습니다 (문구 수정 클릭이 페이지 이동으로 이어지지 않도록)
  const guardNav = (fn: () => void) => () => {
    if (isHomeInlineEditMode) return;
    fn();
  };

  const shellPropsFor = (key: string) => {
    const idx = getHeroIndex(key);
    return {
      blockKey: key,
      group: 'hero',
      label: HOME_BLOCK_LABELS[key] || key,
      isFirst: idx === 0,
      isLast: idx === heroKeys.length - 1,
      isDragOver: heroDrag.overKey === key,
      isDragging: heroDrag.draggingKey === key,
      onDelete: () => deleteHomeBlock(key),
      onMoveUp: () => moveHomeBlock(key, 'up'),
      onMoveDown: () => moveHomeBlock(key, 'down'),
      onGripPointerDown: (e: React.PointerEvent<HTMLDivElement>) => heroDrag.start(e, key),
      onGripPointerMove: heroDrag.move,
      onGripPointerUp: heroDrag.end,
    };
  };

  // 블록 렌더러 (순서·표시 여부 적용)
  const renderHeroBlock = (key: string): React.ReactNode => {
    if (isHidden(key)) return null;

    switch (key) {
      case 'heroKicker':
        return (
          <HomeBlockShell key={key} {...shellPropsFor(key)}>
            <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-blue-400">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <EditableText
                value={homeData.heroKicker || 'PORTFOLIO_SO.A / WEB & MOTION STUDIO'}
                onSave={(v) => updateHomeContent({ heroKicker: v })}
                label="상단 킥커"
              />
            </div>
          </HomeBlockShell>
        );

      case 'heroHeadline':
        return (
          <HomeBlockShell key={key} {...shellPropsFor(key)}>
            <h1
              className="font-display font-extrabold text-4xl sm:text-5xl md:text-6xl lg:text-[4.2rem] leading-[1.08] tracking-tight text-white whitespace-pre-line"
              style={{ textWrap: 'balance' }}
            >
              <EditableText
                value={homeData.heroHeadline}
                onSave={(v) => updateHomeContent({ heroHeadline: v })}
                label="메인 헤드라인"
                multiline
              />
            </h1>
          </HomeBlockShell>
        );

      case 'heroSubheadline':
        return (
          <HomeBlockShell key={key} {...shellPropsFor(key)}>
            <p className="text-base sm:text-lg text-zinc-300 font-normal leading-relaxed max-w-2xl whitespace-pre-line">
              <EditableText
                value={homeData.heroSubheadline}
                onSave={(v) => updateHomeContent({ heroSubheadline: v })}
                label="서브 카피"
                multiline
              />
            </p>
          </HomeBlockShell>
        );

      case 'capabilities':
        return (
          <HomeBlockShell key={key} {...shellPropsFor(key)}>
            <div className="flex flex-wrap items-center gap-y-2 gap-x-3 text-xs text-zinc-400 pt-1">
              {(homeData.capabilities && homeData.capabilities.length > 0
                ? homeData.capabilities
                : CAPABILITY_FALLBACK
              ).map((cap, i, arr) => (
                <React.Fragment key={`cap-${i}`}>
                  <SiteText
                    tkey={`hero.capability.${i}`}
                    fallback={cap}
                    label={`역량 칩 ${i + 1}`}
                    className="text-zinc-200 font-medium"
                  />
                  {i < arr.length - 1 && <span className="text-zinc-600">·</span>}
                </React.Fragment>
              ))}
            </div>
          </HomeBlockShell>
        );

      case 'heroActions':
        return (
          <HomeBlockShell key={key} {...shellPropsFor(key)}>
            <div className="flex flex-wrap items-center gap-3 pt-3">
              <button
                onClick={guardNav(() => navigateTo('contact'))}
                className="px-6 py-3.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded-xl transition-all duration-150 flex items-center gap-2 shadow-lg shadow-blue-600/25 hover:shadow-blue-500/35 cursor-pointer whitespace-nowrap"
              >
                <SiteText
                  tkey="hero.cta.primary"
                  fallback="프로젝트 의뢰하기"
                  label="주요 CTA 문구"
                />
                <ArrowUpRight className="w-4 h-4" />
              </button>

              <button
                onClick={guardNav(() => navigateTo('works'))}
                className="px-5 py-3.5 text-sm font-semibold text-zinc-300 hover:text-white bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 rounded-xl transition-all duration-150 flex items-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <SiteText
                  tkey="hero.cta.secondary"
                  fallback="포트폴리오 전체보기"
                  label="보조 CTA 문구"
                />
                <ArrowDown className="w-4 h-4 text-zinc-400" />
              </button>
            </div>
          </HomeBlockShell>
        );

      case 'heroTrust':
        return (
          <HomeBlockShell key={key} {...shellPropsFor(key)}>
            <div className="pt-2 flex flex-wrap items-center gap-6 text-xs text-zinc-400">
              {HERO_TRUST_FALLBACK.map((t, i) => (
                <div key={`trust-${i}`} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                  <SiteText tkey={`hero.trust.${i}`} fallback={t} label={`신뢰 포인트 ${i + 1}`} />
                </div>
              ))}
            </div>
          </HomeBlockShell>
        );

      default:
        return null;
    }
  };

  // 대표 이미지 카드 (우측 / 하단 배치 공용)
  const mediaCard = !isHidden('heroMedia') ? (
    <HomeBlockShell
      blockKey="heroMedia"
      group="media"
      label={`${HOME_BLOCK_LABELS.heroMedia} · ${mediaPos === 'right' ? '우측' : '하단'}`}
      deletable
      movable={false}
      onDelete={() => deleteHomeBlock('heroMedia')}
      extraControls={
        <button
          type="button"
          data-ui="ctl"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            updateHomeContent({ heroMediaPosition: mediaPos === 'right' ? 'bottom' : 'right' });
          }}
          className="px-1.5 h-5 rounded bg-zinc-900 border border-blue-500/60 text-blue-300 hover:text-white text-[9px] font-bold cursor-pointer whitespace-nowrap"
          title="이미지 카드 위치를 우측 / 히어로 하단으로 전환"
        >
          {mediaPos === 'right' ? '하단으로' : '우측으로'}
        </button>
      }
      className="block"
    >
      <div
        data-theme="dark"
        className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900/60 shadow-2xl group"
      >
        {/* Studio Desk / Multi-Monitor Image */}
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          <SiteImage
            ikey="hero.media.image"
            fallback="/images/hero_design_showcase_1794358690838.jpg"
            label="히어로 이미지"
            alt="Creative Design Studio Workspace"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
        </div>

        {/* Overlaid Information Banner inside the card */}
        <div className="absolute bottom-0 inset-x-0 p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-300">
            <SiteText
              tkey="hero.media.title"
              fallback="PORTFOLIO_SO.A WORKSPACE"
              label="카드 제목"
              className="font-semibold text-white"
            />
            <SiteText
              tkey="hero.media.est"
              fallback="EST. 2026"
              label="카드 연도"
              className="text-blue-400 text-[11px] font-mono"
            />
          </div>
          <p className="text-xs text-zinc-300 line-clamp-2">
            <SiteText
              tkey="hero.media.desc"
              fallback="기획자 없이도 마케팅 목적에 부합하는 웹디자인과 고관여 숏폼 영상을 유기적으로 완성합니다."
              label="카드 설명"
              multiline
            />
          </p>

          {featuredProject && (
            <button
              onClick={guardNav(() => setActiveProjectDetail(featuredProject))}
              className="w-full mt-2 py-2 px-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-lg text-xs font-medium text-white flex items-center justify-between transition-colors cursor-pointer"
            >
              <SiteText
                tkey="hero.media.cta"
                fallback="대표 프로젝트 케이스 스터디 열람"
                label="카드 버튼 문구"
              />
              <ArrowUpRight className="w-3.5 h-3.5 text-blue-400" />
            </button>
          )}
        </div>

        {/* Floating conversion badge */}
        <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md border border-zinc-700/80 rounded-lg px-3 py-1.5 shadow-lg flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
          <SiteText
            tkey="hero.media.badge"
            fallback="평균 전환율 +148%"
            label="전환율 배지"
            className="text-xs font-semibold text-white"
          />
        </div>
      </div>
    </HomeBlockShell>
  ) : null;

  return (
    <section id="hero" className="relative pt-8 pb-16 md:pt-14 md:pb-24 overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column — 블록 순서/삭제 적용 */}
          <div className={`${mediaPos === 'bottom' ? 'lg:col-span-12' : 'lg:col-span-7'} space-y-6`}>
            {homeBlockOrder
              .filter((k) => k !== 'heroMedia' && k !== 'kpis')
              .map((key) => renderHeroBlock(key))}
          </div>

          {/* Right Column: 미디어 카드 (우측 배치일 때만) */}
          {mediaPos === 'right' && <div className="lg:col-span-5 relative">{mediaCard}</div>}
        </div>

        {/* 하단 배치일 때 미디어 카드 */}
        {mediaPos === 'bottom' && mediaCard && (
          <div className="mt-12 max-w-4xl mx-auto">{mediaCard}</div>
        )}

        {/* Full-Width Quantitative Trust & KPI Strip below the hero split */}
        {!isHidden('kpis') && (
          <div className="mt-14 pt-10 border-t border-zinc-800/80">
            <HomeBlockShell
              blockKey="kpis"
              group="kpis"
              label={HOME_BLOCK_LABELS.kpis}
              deletable
              movable={false}
              onDelete={() => deleteHomeBlock('kpis')}
              className="block"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
                {kpiList.map((stat, idx) => (
                  <HomeBlockShell
                    key={idx}
                    blockKey={`kpi-${idx}`}
                    group="kpi-card"
                    label={`KPI ${idx + 1}`}
                    compact
                    movable
                    isFirst={idx === 0}
                    isLast={idx === kpiList.length - 1}
                    isDragOver={kpiDrag.overKey === `kpi-${idx}`}
                    isDragging={kpiDrag.draggingKey === `kpi-${idx}`}
                    onDelete={() => removeKpi(idx)}
                    onMoveUp={() => moveHomeKpi(idx, idx - 1)}
                    onMoveDown={() => moveHomeKpi(idx, idx + 1)}
                    onGripPointerDown={(e) => kpiDrag.start(e, `kpi-${idx}`)}
                    onGripPointerMove={kpiDrag.move}
                    onGripPointerUp={kpiDrag.end}
                    className="space-y-1"
                  >
                    <div className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-white tabular-nums">
                      <EditableText
                        value={stat.value}
                        onSave={(v) => updateKpi(idx, 'value', v)}
                        label={`KPI ${idx + 1} 수치`}
                      />
                    </div>
                    <div className="text-xs sm:text-sm font-semibold text-zinc-300">
                      <EditableText
                        value={stat.label}
                        onSave={(v) => updateKpi(idx, 'label', v)}
                        label={`KPI ${idx + 1} 제목`}
                      />
                    </div>
                    <div className="text-xs text-zinc-500">
                      <EditableText
                        value={stat.sub}
                        onSave={(v) => updateKpi(idx, 'sub', v)}
                        label={`KPI ${idx + 1} 설명`}
                      />
                    </div>
                  </HomeBlockShell>
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
            </HomeBlockShell>
          </div>
        )}

        {/* 삭제된 블록 복원 바 (편집 모드에서만) */}
        {isHomeInlineEditMode && hiddenHomeBlocks.length > 0 && (
          <div className="mt-8 p-3 rounded-xl border border-amber-500/40 bg-amber-950/30 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-amber-300">
              삭제된 블록 {hiddenHomeBlocks.length}개
            </span>
            {hiddenHomeBlocks.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => restoreHomeBlock(key)}
                className="px-2 py-1 rounded-lg bg-amber-900/60 hover:bg-amber-800/80 border border-amber-700/70 text-[11px] text-amber-200 cursor-pointer"
                title="이 블록을 다시 표시합니다"
              >
                + {HOME_BLOCK_LABELS[key] || key} 복원
              </button>
            ))}
            <button
              type="button"
              onClick={undoHomeEdit}
              disabled={!canUndo}
              className="ml-auto px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-700 text-[11px] text-zinc-300 hover:text-white disabled:opacity-40 cursor-pointer"
              title="Ctrl/Cmd+Z"
            >
              Ctrl+Z 되돌리기
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
