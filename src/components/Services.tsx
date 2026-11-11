import React from 'react';
import { useStudio } from '../context/StudioContext';
import { SERVICES_LIST } from '../data/servicesData';
import { ArrowUpRight, CheckCircle2, Clock, Sparkles } from 'lucide-react';

export const Services: React.FC = () => {
  const { scrollToSection, setSelectedInquiryCategory, menuContent } = useStudio();

  const handleInquireService = (serviceTitle: string) => {
    setSelectedInquiryCategory(serviceTitle);
    scrollToSection('contact');
  };

  const servicesList = menuContent.services && menuContent.services.length > 0
    ? menuContent.services
    : SERVICES_LIST;

  return (
    <section id="service" className="py-20 md:py-28 border-t border-zinc-850 bg-zinc-950/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-blue-400">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>04. SERVICE & SCOPE</span>
          </div>

          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
            제공 서비스 및 작업 범위
          </h2>

          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
            필요한 단건 디자인부터 웹과 영상이 통합된 올인원 패키지까지, 귀사의 예산과 마케팅 목적에 부합하는 명확한 작업 범위를 제안합니다.
          </p>
        </div>

        {/* Services Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {servicesList.map((service) => (
            <div
              key={service.id}
              className={`rounded-2xl p-7 md:p-8 flex flex-col justify-between transition-all duration-200 relative ${
                service.popular
                  ? 'bg-gradient-to-b from-blue-950/30 via-zinc-900/60 to-zinc-900/40 border-2 border-blue-500/50 shadow-xl shadow-blue-500/10'
                  : 'bg-zinc-900/50 border border-zinc-800/80 hover:border-zinc-700'
              }`}
            >
              {/* Popular Kicker */}
              {service.popular && (
                <div className="absolute -top-3.5 right-6 bg-blue-600 text-white text-[11px] font-bold px-3 py-0.5 rounded-full flex items-center gap-1 shadow-md shadow-blue-600/30">
                  <Sparkles className="w-3 h-3" />
                  <span>MOST REQUESTED</span>
                </div>
              )}

              <div className="space-y-6">
                {/* Number & Titles */}
                <div className="space-y-2">
                  <div className="text-xs font-mono font-bold text-blue-400">{service.number}. {service.englishTitle}</div>
                  <h3 className="font-display text-2xl font-bold text-white">{service.title}</h3>
                  <p className="text-xs text-zinc-300 leading-relaxed font-medium pt-1">
                    {service.tagline}
                  </p>
                </div>

                {/* Scope Checklist */}
                <div className="space-y-3 pt-2">
                  <div className="text-xs font-bold text-zinc-400 tracking-wider">주요 작업 범위</div>
                  <ul className="space-y-2">
                    {service.scopeList.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-zinc-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Deliverables & Period Info */}
                <div className="pt-4 border-t border-zinc-800/70 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    <span>예상 소요 기간: <strong className="text-zinc-200">{service.estimatedPeriod}</strong></span>
                  </div>
                  <div className="text-[11px] text-zinc-400 leading-relaxed">
                    추천 대상: {service.recommendedFor}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-8">
                <button
                  onClick={() => handleInquireService(service.title)}
                  className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer ${
                    service.popular
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white'
                  }`}
                >
                  <span>이 서비스 견적 문의하기</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
