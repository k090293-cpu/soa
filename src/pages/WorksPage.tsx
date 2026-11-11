import React, { useState } from 'react';
import { useStudio } from '../context/StudioContext';
import { ProjectCategory, Project } from '../types';
import {
  ArrowUpRight,
  TrendingUp,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  Layers,
  ArrowRight
} from 'lucide-react';

export const WorksPage: React.FC = () => {
  const { projects, setActiveProjectDetail, navigateTo, setSelectedInquiryCategory, menuContent } = useStudio();
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categoriesList = menuContent.worksCategories && menuContent.worksCategories.length > 0
    ? menuContent.worksCategories
    : [
        { id: '1', key: 'web', label: '01. WEB DESIGN' },
        { id: '2', key: 'promotion', label: '02. PROMOTION DESIGN' },
        { id: '3', key: 'video', label: '03. VIDEO DESIGN' },
      ];

  const filterTabs = [
    { key: 'all', label: '전체 (ALL)' },
    ...categoriesList.map((c) => ({ key: c.key, label: c.label })),
  ];

  const filteredProjects = projects.filter((p) => {
    const matchesCategory = activeFilter === 'all' || p.category === activeFilter;
    const matchesSearch =
      searchQuery.trim() === '' ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleInquireFromWorks = (catName?: string) => {
    if (catName) setSelectedInquiryCategory(catName);
    navigateTo('contact');
  };

  return (
    <div className="py-12 md:py-20 animate-in fade-in duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Breadcrumb & Page Header */}
        <div className="space-y-4 max-w-4xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400">
            <button onClick={() => navigateTo('home')} className="hover:text-white transition-colors cursor-pointer">
              HOME
            </button>
            <span className="text-zinc-600">/</span>
            <span className="text-blue-400">WORKS</span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.1]">
            PORTFOLIO & <br />
            <span className="bg-gradient-to-r from-blue-400 via-blue-200 to-white bg-clip-text text-transparent">
              CASE STUDIES.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-zinc-300 leading-relaxed font-normal pt-2">
            단순한 비주얼 나열을 넘어, 실제 매출 전환과 브랜드 인지도를 견인한 웹디자인, 프로모션, 영상 콘텐츠 프로젝트 아카이브입니다.
          </p>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-4 md:p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-zinc-950 rounded-xl border border-zinc-850">
              {filterTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveFilter(tab.key)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                    activeFilter === tab.key
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Keyword Search */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="프로젝트, 태그, 클라이언트 검색..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Result Count and Active Filter Info */}
          <div className="flex items-center justify-between text-xs text-zinc-500 pt-1 border-t border-zinc-850/60">
            <span>
              총 <strong className="text-zinc-200">{filteredProjects.length}개</strong>의 프로젝트가 표시됩니다.
            </span>
            <span className="font-mono text-[11px]">SORT BY: RECENT / IMPACT</span>
          </div>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="p-16 text-center rounded-2xl bg-zinc-950 border border-zinc-900 space-y-3">
            <p className="text-zinc-400 text-sm">검색 조건에 맞는 프로젝트가 없습니다.</p>
            <button
              onClick={() => {
                setActiveFilter('all');
                setSearchQuery('');
              }}
              className="text-xs text-blue-400 hover:underline"
            >
              전체 필터 초기화
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProjects.map((project: Project) => (
              <article
                key={project.id}
                onClick={() => setActiveProjectDetail(project)}
                className="group rounded-2xl overflow-hidden bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 transition-all duration-300 flex flex-col cursor-pointer hover:-translate-y-1 hover:shadow-xl hover:shadow-black/50"
              >
                {/* Media Thumbnail Container */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-950">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                  {/* Top overlay badges */}
                  <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between">
                    <span className="text-[11px] font-mono font-medium tracking-wide text-zinc-300 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-md border border-zinc-800">
                      {project.categoryLabel.split('.')[1]?.trim() || project.category.toUpperCase()}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {project.gallery && project.gallery.length > 1 && (
                        <span className="text-[10px] font-mono text-zinc-300 bg-black/70 backdrop-blur-md px-2 py-1 rounded-md border border-zinc-800 flex items-center gap-1">
                          <span>미디어 {project.gallery.length}개</span>
                        </span>
                      )}
                      {project.beforeAfter && (
                        <span className="text-[11px] font-medium text-blue-300 bg-blue-950/80 backdrop-blur-md px-2.5 py-1 rounded-md border border-blue-800/60 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-blue-400" />
                          <span>Before / After</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom Impact Metric Tag on Image */}
                  <div className="absolute bottom-3.5 left-3.5 right-3.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-blue-400 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-md border border-blue-500/30">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span className="font-bold">{project.impactMetric.value}</span>
                      <span className="text-zinc-400 text-[11px]">({project.impactMetric.label})</span>
                    </div>
                    <span className="text-zinc-400 text-[11px] font-mono">{project.year}</span>
                  </div>
                </div>

                {/* Card Meta Content */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="text-xs text-zinc-500 font-medium">{project.client}</div>
                    <h3 className="font-display text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                      {project.title}
                    </h3>
                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {project.summary}
                    </p>
                  </div>

                  {/* Card Footer: Tags & Detail CTA */}
                  <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[11px] text-zinc-400 overflow-hidden">
                      <span>{project.tags[0]}</span>
                      {project.tags[1] && (
                        <>
                          <span className="text-zinc-700">·</span>
                          <span className="truncate">{project.tags[1]}</span>
                        </>
                      )}
                    </div>

                    <span className="text-xs font-bold text-blue-400 flex items-center gap-1 shrink-0 group-hover:translate-x-0.5 transition-transform">
                      <span>분석 보기</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Bottom Conversion CTA Strip */}
        <div className="p-8 md:p-12 rounded-3xl bg-zinc-950 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-white">마음에 드는 프로젝트 스타일을 발견하셨나요?</h3>
            <p className="text-xs sm:text-sm text-zinc-400">
              원하시는 프로젝트의 링크나 스타일을 문의란에 남겨주시면 동일한 높은 퀄리티로 제작해 드립니다.
            </p>
          </div>
          <button
            onClick={() => handleInquireFromWorks()}
            className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-600/30 whitespace-nowrap"
          >
            <span>이 스타일로 제작 문의하기</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
