import React from 'react';
import { useStudio } from '../context/StudioContext';
import { Layout, Video, Zap, CheckCircle2, Shield, Layers, Award, Terminal } from 'lucide-react';

export const About: React.FC = () => {
  const { menuContent } = useStudio();
  const aboutData = menuContent.about;

  const icons = [Layout, Video, Layers, Zap, Shield, Award];

  const strengthsList = (aboutData.strengths && aboutData.strengths.length > 0)
    ? aboutData.strengths
    : [];

  const tools = [
    { name: 'Figma', role: 'UI/UX & 상세페이지 기획/디자인' },
    { name: 'After Effects', role: '모션 그래픽 & 키네틱 타이포' },
    { name: 'Premiere Pro', role: '숏폼 및 브랜드 영상 컷편집' },
    { name: 'Photoshop', role: '제품 정밀 리터칭 & 아트워크' },
    { name: 'Illustrator', role: '벡터 그래픽 & 인포그래픽' },
    { name: 'Cinema 4D', role: '3D 제품 시각화 & 앰비언트 모션' },
  ];

  return (
    <section id="about" className="py-20 md:py-28 border-t border-zinc-850 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-blue-400">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>02. ABOUT STUDIO</span>
          </div>

          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight whitespace-pre-line" style={{ textWrap: 'balance' }}>
            {aboutData.headerTitle}
          </h2>

          <p className="text-zinc-400 text-base leading-relaxed whitespace-pre-line">
            {aboutData.headerSubtitle}
          </p>
        </div>

        {/* Core Strengths Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {strengthsList.map((item, idx) => {
            const Icon = icons[idx % icons.length];
            return (
              <div
                key={idx}
                className="p-6 md:p-8 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/80 transition-all duration-200 space-y-4 group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-950/40 border border-blue-900/50 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Tool Stack & Workflow Strip */}
        <div className="p-8 rounded-2xl bg-zinc-950 border border-zinc-850">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-zinc-800/80">
            <div>
              <h3 className="text-base font-bold text-white">실무 전문 소프트웨어 & 워크플로우</h3>
              <p className="text-xs text-zinc-400 mt-1">업계 표준 툴을 활용한 정밀한 에셋 제작과 완벽한 호환성을 약속합니다.</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-blue-400 font-medium">
              <CheckCircle2 className="w-4 h-4 text-blue-500" />
              <span>수정 가능한 원본 소스 (Figma / PSD / Pr) 전달</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 pt-6">
            {tools.map((t, idx) => (
              <div key={idx} className="space-y-1">
                <div className="text-sm font-bold text-zinc-200">{t.name}</div>
                <div className="text-[11px] text-zinc-500 leading-snug">{t.role}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
