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
  Play,
  Film,
  Image as ImageIcon
} from 'lucide-react';
import { BeforeAfterSlider } from './BeforeAfterSlider';

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
        className="relative w-full max-w-5xl bg-[#0e0f14] border border-zinc-800 rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Sticky Header */}
        <div className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-[#0e0f14]/90 backdrop-blur-md border-b border-zinc-800">
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

          {/* Primary Visual / Video Showcase Gallery */}
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 flex items-center justify-center min-h-[300px] md:min-h-[460px] max-h-[580px]">
              {/* Media Renderer */}
              {activeMedia.type === 'video' ? (
                <div className="w-full h-full relative flex items-center justify-center bg-black">
                  <video
                    key={activeMedia.url}
                    src={activeMedia.url}
                    controls
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full max-h-[560px] object-contain rounded-2xl"
                  />
                </div>
              ) : (
                <img
                  src={activeMedia.url}
                  alt={activeMedia.name || project.title}
                  className="w-full h-auto max-h-[560px] object-contain rounded-2xl"
                  referrerPolicy="no-referrer"
                />
              )}

              {/* Navigation Arrows (if multiple media) */}
              {mediaList.length > 1 && (
                <>
                  <button
                    onClick={handlePrev}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center backdrop-blur-md border border-zinc-700 transition-all cursor-pointer shadow-lg"
                    aria-label="Previous media"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleNext}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center backdrop-blur-md border border-zinc-700 transition-all cursor-pointer shadow-lg"
                    aria-label="Next media"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Top Media Tag Overlay */}
              <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md px-3 py-1 rounded-lg border border-zinc-800 text-[11px] font-mono text-zinc-300 flex items-center gap-1.5">
                {activeMedia.type === 'video' ? (
                  <>
                    <Film className="w-3.5 h-3.5 text-blue-400" />
                    <span>동영상 ({activeIndex + 1}/{mediaList.length})</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-3.5 h-3.5 text-zinc-400" />
                    <span>이미지 ({activeIndex + 1}/{mediaList.length})</span>
                  </>
                )}
              </div>
            </div>

            {/* Thumbnail Filmstrip (Multiple Images & Videos Selector) */}
            {mediaList.length > 1 && (
              <div className="flex items-center gap-3 overflow-x-auto py-2 px-1">
                {mediaList.map((media, idx) => (
                  <button
                    key={media.id || idx}
                    onClick={() => setActiveIndex(idx)}
                    className={`relative rounded-xl overflow-hidden border w-24 h-16 shrink-0 transition-all cursor-pointer ${
                      activeIndex === idx
                        ? 'border-blue-500 ring-2 ring-blue-500/40 scale-105'
                        : 'border-zinc-800 hover:border-zinc-700 opacity-70 hover:opacity-100'
                    }`}
                  >
                    {media.type === 'video' ? (
                      <div className="w-full h-full bg-zinc-900 flex items-center justify-center relative">
                        <video src={media.url} className="w-full h-full object-cover" muted />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Play className="w-4 h-4 text-white" />
                        </div>
                        <span className="absolute bottom-1 right-1 bg-black/80 text-[9px] text-blue-400 font-mono px-1 rounded">
                          VID
                        </span>
                      </div>
                    ) : (
                      <div className="w-full h-full relative">
                        <img
                          src={media.url}
                          alt={media.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <span className="absolute bottom-1 right-1 bg-black/80 text-[9px] text-zinc-400 font-mono px-1 rounded">
                          IMG
                        </span>
                      </div>
                    )}
                  </button>
                ))}
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
    </div>
  );
};
