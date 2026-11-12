import React from 'react';
import { useStudio } from '../context/StudioContext';
import { Contact } from '../components/Contact';
import { Sparkles } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const { navigateTo, menuContent } = useStudio();
  const contactData = menuContent.contact;

  const preparationTips = [
    {
      title: '01. 제품 또는 브랜드 기본 자료',
      desc: '제품의 누끼 컷, 원본 사진, 패키지 파일 또는 브랜드 소개서가 있다면 상담이 훨씬 구체화됩니다.',
    },
    {
      title: '02. 선호하시는 벤치마킹 레퍼런스',
      desc: '원하시는 무드의 웹사이트, 상세페이지, 또는 숏폼 릴스 링크 1~2개만 공유해 주셔도 정확한 시안 도출이 가능합니다.',
    },
    {
      title: '03. 타겟 론칭 일정 및 예상 예산',
      desc: '마케팅 오픈 데드라인과 가용 예산 범위를 미리 알려주시면 최적의 작업 범위와 마일스톤을 제안해 드립니다.',
    },
  ];

  return (
    <div className="py-12 md:py-20 animate-in fade-in duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Breadcrumb & Header */}
        <div className="space-y-4 max-w-4xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400">
            <button onClick={() => navigateTo('home')} className="hover:text-white transition-colors cursor-pointer">
              HOME
            </button>
            <span className="text-zinc-600">/</span>
            <span className="text-blue-400">CONTACT</span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.1] whitespace-pre-line">
            {contactData.headerTitle}
          </h1>

          <p className="text-base sm:text-lg text-zinc-300 leading-relaxed font-normal pt-2 whitespace-pre-line">
            {contactData.headerSubtitle || contactData.introDescription}
          </p>
        </div>

        {/* Preparation Guidelines Strip */}
        <div className="p-8 rounded-2xl bg-zinc-950 border border-zinc-850 space-y-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <h3 className="text-base font-bold text-white">더욱 빠르고 정확한 견적을 위한 준비 팁</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {preparationTips.map((tip, idx) => (
              <div key={idx} className="space-y-1.5 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/80">
                <h4 className="text-xs font-bold text-blue-400">{tip.title}</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">{tip.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Embed the rich interactive Contact form and direct communication channels */}
        <div className="border-t border-zinc-850 pt-8">
          <Contact />
        </div>
      </div>
    </div>
  );
};
