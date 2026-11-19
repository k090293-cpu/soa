import React, { useState } from 'react';
import { Project, MediaItem } from '../types';
import { useStudio } from '../context/StudioContext';
import {
  X,
  ArrowUpRight,
  CheckCircle2,
  TrendingUp,
  Layers,
  Calendar,
  User,
  Wrench,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Expand,
  Film,
  Image as ImageIcon
} from 'lucide-react';
import { BeforeAfterSlider } from './BeforeAfterSlider';
import { VideoPlayer } from './media/VideoPlayer';
import { MediaLightbox } from './media/MediaLightbox';
import { parseVideoUrl, VIDEO_PROVIDER_LABEL } from '../utils/videoEmbed';

interface ProjectDetailModalProps {
  project: Project;
  onClose: () => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({ project, onClose }) => {
  const { navigateTo, setSelectedInquiryCategory } = useStudio();

  // Normalize media items list from gallery or fallback to primary image & videoPreviewUrl
  const mediaList: MediaItem[] = React.useMemo(() => {
    if (project.gallery && project.gallery.length > 0) {
      return project.gallery;
    }
    const list: MediaItem[] = [
      {
        id: 'main-img',
        type: 'image',
        url: project.image,
        name: project.title,
        isCover: true,
      },
    ];
    if (project.videoPreviewUrl) {
      list.push({
        id: 'main-vid',
        type: 'video',
        url: project.videoPreviewUrl,
        name: `${project.title} 영상 미리보기`,
      });
    }
    if (project.secondaryImages && project.secondaryImages.length > 0) {
      project.secondaryImages.forEach((img, idx) => {
        list.push({
          id: `sec-img-${idx}`,
          type: 'image',
          url: img,
          name: `${project.title} 스틸컷 ${idx + 1}`,
        });
      });
    }
    return list;
  }, [project]);

  const [activeIndex, setActiveIndex] = useState(0);
  const activeMedia = mediaList[activeIndex] || mediaList[0];

  // 라이트박스(전체 화면 크게 보기) 열림 상태
  const [lightboxOpen, setLightboxOpen] = useState(false);

  /**
   * 목록·썸네일 스트립에 쓸 미리보기 주소.
   * 영상은 재생 전에 보여줄 정지 이미지가 필요합니다.
   *  · YouTube → 영상 ID 로 자동 생성
   *  · Vimeo   → 관리자가 지정한 값 우선, 없으면 null(아이콘 대체)
   */
  const thumbOf = (m: MediaItem): string | null => {
    if (m.type !== 'video') return m.url;
    if (m.thumbnail) return m.thumbnail;
    return parseVideoUrl(m.url)?.thumbnail ?? null;
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : mediaList.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev < mediaList.length - 1 ? prev + 1 : 0));
  };

  const handleInquireThisStyle = () => {
    let cat = '상세페이지';
    if (project.category === 'promotion') cat = '프로모션 배너';
    if (project.category === 'video') cat = '숏폼 영상';
    setSelectedInquiryCategory(cat);
    onClose();
    navigateTo('contact');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 md:p-10 animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-5xl bg-[var(--app-surface)] border border-zinc-800 rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Sticky Header */}
        <div className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-[var(--app-surface-glass)] backdrop-blur-md border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-blue-400 tracking-wider">
              {project.categoryLabel}
            </span>
            <span className="text-zinc-600">/</span>
            <span className="text-xs text-zinc-400 font-mono">{project.year}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleInquireThisStyle}
              className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
            >
              <span>이 스타일로 문의하기</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 md:p-10 space-y-10 max-h-[85vh] overflow-y-auto">
          {/* Project Title Block */}
          <div className="space-y-3">
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              {project.title}
            </h2>
            <p className="text-base text-zinc-300 font-medium">{project.subtitle}</p>

            {/* Unboxed Metadata Strip */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-400 pt-2 border-t border-zinc-850">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-zinc-500" />
                <span>클라이언트: <strong className="text-zinc-200">{project.client}</strong></span>
              </div>
              <span className="text-zinc-700">·</span>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                <span>제작 연도: <strong className="text-zinc-200">{project.year}</strong></span>
              </div>
              {project.impactMetric && (
                <>
                  <span className="text-zinc-700">·</span>
                  <div className="flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                    <span>성과 지표: <strong className="text-blue-400">{project.impactMetric.value} ({project.impactMetric.label})</strong></span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Primary Visual / Video Showcase Gallery
              ─ 영상: 썸네일 먼저 → 클릭해야 재생 (YouTube/Vimeo 링크)
              ─ 이미지: 클릭하면 전체 화면 라이트박스로 크게 보기 */}
          <div className="space-y-4">
            <div className="relative">
              {activeMedia.type === 'video' ? (
                <VideoPlayer
                  key={activeMedia.id}
                  url={activeMedia.url}
                  thumbnail={activeMedia.thumbnail}
                  title={activeMedia.name || `${project.title} 영상`}
                  aspectClassName="aspect-video"
                  className="max-h-[560px]"
                />
              ) : (
                <button
                  type="button"
                  data-theme="dark"
                  onClick={() => setLightboxOpen(true)}
                  className="group relative block w-full rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 cursor-zoom-in"
                  aria-label={`${activeMedia.name || project.title} 크게 보기`}
                >
                  <img
                    src={activeMedia.url}
                    alt={activeMedia.name || project.title}
                    className="w-full h-auto max-h-[560px] object-contain mx-auto"
                    referrerPolicy="no-referrer"
                  />
                  {/* 확대 안내 오버레이 */}
                  <span className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/75 backdrop-blur-md text-zinc-200 text-[11px] font-medium px-2.5 py-1.5 rounded-lg border border-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Expand className="w-3.5 h-3.5" />
                    크게 보기
                  </span>
                </button>
              )}

              {/* 좌우 이동 버튼 — 여러 장일 때 */}
              {mediaList.length > 1 && (
                <>
                  <button
                    onClick={handlePrev}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center backdrop-blur-md border border-zinc-700 transition-all cursor-pointer shadow-lg"
                    aria-label="이전 미디어"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleNext}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center backdrop-blur-md border border-zinc-700 transition-all cursor-pointer shadow-lg"
                    aria-label="다음 미디어"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* 좌상단 미디어 종류 · 순번 */}
              <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md px-3 py-1 rounded-lg border border-zinc-800 text-[11px] font-mono text-zinc-300 flex items-center gap-1.5 pointer-events-none">
                {activeMedia.type === 'video' ? (
                  <>
                    <Film className="w-3.5 h-3.5 text-blue-400" />
                    <span>
                      동영상
                      {parseVideoUrl(activeMedia.url) &&
                        ` · ${VIDEO_PROVIDER_LABEL[parseVideoUrl(activeMedia.url)!.provider]}`}
                      {' '}({activeIndex + 1}/{mediaList.length})
                    </span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-3.5 h-3.5 text-zinc-400" />
                    <span>이미지 ({activeIndex + 1}/{mediaList.length})</span>
                  </>
                )}
              </div>
            </div>

            {/* 썸네일 스트립 — 영상은 video 태그 대신 썸네일 이미지를 씁니다.
                (video 태그를 나열하면 썸네일마다 영상을 로드해 낭비가 큽니다) */}
            {mediaList.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto py-2 px-1">
                {mediaList.map((media, idx) => {
                  const thumb = thumbOf(media);
                  return (
                    <button
                      key={media.id || idx}
                      onClick={() => setActiveIndex(idx)}
                      className={`relative rounded-xl overflow-hidden border w-24 h-16 shrink-0 transition-all cursor-pointer ${
                        activeIndex === idx
                          ? 'border-blue-500 ring-2 ring-blue-500/40 scale-105'
                          : 'border-zinc-800 hover:border-zinc-700 opacity-70 hover:opacity-100'
                      }`}
                    >
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={media.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
                          <Film className="w-5 h-5 text-zinc-600" />
                        </div>
                      )}

                      {media.type === 'video' && (
                        <>
                          <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
                            <span className="w-6 h-6 rounded-full bg-white/90 flex items-center justify-center">
                              <svg viewBox="0 0 24 24" className="w-3 h-3 fill-zinc-900 ml-0.5">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </span>
                          </div>
                          <span className="absolute bottom-1 right-1 bg-black/80 text-[9px] text-blue-400 font-mono px-1 rounded">
                            VID
                          </span>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Before & After Interactive Comparison (If present) */}
          {project.beforeAfter && (
            <div className="p-6 md:p-8 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 text-xs font-bold text-blue-400">
                  <Sparkles className="w-4 h-4" />
                  <span>BEFORE & AFTER COMPARISON</span>
                </div>
                <h3 className="text-lg font-bold text-white">디자인 개선 전후 및 전환율 비교</h3>
                <p className="text-xs text-zinc-400">
                  기존의 분산된 시각 정보와 모바일 가독성 저하 문제를 해결하여 전환율을 비약적으로 상승시켰습니다.
                </p>
              </div>
              <BeforeAfterSlider data={project.beforeAfter} />
            </div>
          )}

          {/* 3-Section Deep Dive Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 01. Overview */}
            <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-3">
              <div className="text-xs font-mono font-semibold text-blue-400">01. OVERVIEW</div>
              <h4 className="text-base font-bold text-white">프로젝트 개요 및 목적</h4>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                {project.overview}
              </p>
            </div>

            {/* 02. Strategy */}
            <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-3">
              <div className="text-xs font-mono font-semibold text-blue-400">02. STRATEGY</div>
              <h4 className="text-base font-bold text-white">디자인 기획 & 접근 방식</h4>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                {project.strategy}
              </p>
            </div>

            {/* 03. Impact & Results */}
            {project.impactMetric && (
              <div className="p-6 rounded-2xl bg-blue-950/20 border border-blue-900/40 space-y-3">
                <div className="text-xs font-mono font-semibold text-blue-400">03. RESULTS & IMPACT</div>
                <h4 className="text-base font-bold text-white">입증된 성과 및 데이터</h4>
                <div className="space-y-2">
                  <div className="text-3xl font-extrabold text-blue-400 font-display tabular-nums">
                    {project.impactMetric.value}
                  </div>
                  <div className="text-xs font-semibold text-zinc-200">{project.impactMetric.label}</div>
                  <p className="text-xs text-zinc-400 leading-relaxed">{project.impactMetric.detail}</p>
                </div>
              </div>
            )}
          </div>

          {/* Deliverables & Tools */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-zinc-850">
            {project.deliverables && project.deliverables.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-400" />
                  <span>제공 작업 범위 & 최종 산출물</span>
                </h4>
                <div className="space-y-2">
                  {project.deliverables.map((d, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                      <span>{d}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Wrench className="w-4 h-4 text-blue-400" />
                <span>사용 소프트웨어 및 기술</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {project.tools.map((tool, i) => (
                  <span
                    key={i}
                    className="text-xs font-medium text-zinc-300 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg"
                  >
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Conversion CTA Strip */}
          <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-blue-950/60 to-zinc-900 border border-blue-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <h4 className="text-lg font-bold text-white">이 프로젝트와 유사한 작업이 필요하신가요?</h4>
              <p className="text-xs text-zinc-400 mt-1">
                상세페이지, 배너, 숏폼 영상까지 귀사의 브랜드 목표에 맞춰 맞춤 제안을 드립니다.
              </p>
            </div>
            <button
              onClick={handleInquireThisStyle}
              className="px-6 py-3.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-lg shadow-blue-600/30"
            >
              <span>이 스타일로 견적 문의하기</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 전체 화면 라이트박스 — 이미지 썸네일을 누르면 열립니다.
          좌우 화살표 · 방향키 · 모바일 스와이프로 여러 장을 넘겨 볼 수 있습니다. */}
      {lightboxOpen && (
        <MediaLightbox
          items={mediaList}
          initialIndex={activeIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </div>
  );
};
