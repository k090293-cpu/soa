import React, { useState } from 'react';
import { useStudio } from '../context/StudioContext';
import { ProjectCategory, Project } from '../types';
import { ArrowUpRight, TrendingUp, Sparkles, Filter } from 'lucide-react';
import { EditableText } from './editable/EditableText';

export const Works: React.FC = () => {
  const { projects, setActiveProjectDetail, menuContent, updateHomeContent } = useStudio();
  const [activeFilter, setActiveFilter] = useState<string>('all');

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

  const filteredProjects = activeFilter === 'all'
    ? projects
    : projects.filter((p) => p.category === activeFilter);

  return (
    <section id="works" className="py-20 md:py-28 border-t border-zinc-850">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-blue-400">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>03. SELECTED PORTFOLIO</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
              <EditableText
                value={menuContent.home.worksTitle || '실적으로 증명하는 대표 포트폴리오'}
                onSave={(v) => updateHomeContent({ worksTitle: v })}
                label="WORKS 제목"
                multiline
              />
            </h2>
            <p className="text-zinc-400 text-sm max-w-xl">
              <EditableText
                value={
                  menuContent.home.worksSubtitle ||
                  '단순한 시각적 나열을 넘어, 실제 매출과 클릭 전환을 견인한 프로젝트 케이스 스터디입니다.'
                }
                onSave={(v) => updateHomeContent({ worksSubtitle: v })}
                label="WORKS 설명"
                multiline
              />
            </p>
          </div>

          {/* Interactive Filter Tabs - Functional segmented buttons */}
          <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-zinc-900/80 border border-zinc-800 rounded-xl">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 whitespace-nowrap cursor-pointer ${
                  activeFilter === tab.key
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProjects.map((project: Project) => (
            <article
              key={project.id}
              onClick={() => setActiveProjectDetail(project)}
              className="group rounded-2xl overflow-hidden bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 transition-all duration-300 flex flex-col cursor-pointer hover:-translate-y-1 hover:shadow-xl hover:shadow-black/50"
            >
              {/* Media Thumbnail Container */}
              <div data-theme="dark" className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-950">
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
                  {project.impactMetric ? (
                    <div className="flex items-center gap-1.5 text-blue-400 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-md border border-blue-500/30">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span className="font-bold">{project.impactMetric.value}</span>
                      <span className="text-zinc-400 text-[11px]">({project.impactMetric.label})</span>
                    </div>
                  ) : (
                    <span />
                  )}
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
                    {project.summary || project.strategy}
                  </p>
                </div>

                {/* Card Footer: Tags & Detail CTA */}
                <div className="pt-3 border-t border-zinc-800/60 flex items-center justify-between">
                  {/* Clean unboxed tags with typographic separator */}
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
      </div>
    </section>
  );
};
