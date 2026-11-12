import React from 'react';
import { useStudio } from '../context/StudioContext';
import { SERVICES_LIST } from '../data/servicesData';
import { ArrowUpRight, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { EditableText } from './editable/EditableText';
import { SiteText } from './editable/SiteText';

export const Services: React.FC = () => {
  const { scrollToSection, setSelectedInquiryCategory, menuContent, updateHomeContent, updateServiceContent, isHomeInlineEditMode } = useStudio();

  const handleInquireService = (serviceTitle: string) => {
    // 편집 모드에서는 문의 폼으로 튀지 않도록 막습니다.
    if (isHomeInlineEditMode) return;
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
            <SiteText tkey="services.kicker" fallback="04. SERVICE & SCOPE" label="SERVICES 상단 라벨" />
          </div>

          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
            <EditableText
              value={menuContent.home.serviceTitle || '제공 서비스 및 작업 범위'}
              onSave={(v) => updateHomeContent({ serviceTitle: v })}
              label="SERVICES 제목"
              multiline
            />
          </h2>

          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
            <EditableText
              value={
                menuContent.home.serviceSubtitle ||
                '필요한 단건 디자인부터 웹과 영상이 통합된 올인원 패키지까지, 귀사의 예산과 마케팅 목적에 부합하는 명확한 작업 범위를 제안합니다.'
              }
              onSave={(v) => updateHomeContent({ serviceSubtitle: v })}
              label="SERVICES 설명"
              multiline
            />
          </p>
        </div>

        {/* Services Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {servicesList.map((service, idx) => (
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
                  <SiteText tkey="services.popularBadge" fallback="MOST REQUESTED" label="인기 배지" />
                </div>
              )}

              <div className="space-y-6">
                {/* Number & Titles */}
                <div className="space-y-2">
                  <div className="text-xs font-mono font-bold text-blue-400">
                    {service.number}.{' '}
                    <EditableText
                      value={service.englishTitle}
                      onSave={(v) => updateServiceContent(service.id, { englishTitle: v })}
                      label={`서비스${idx + 1} 영문명`}
                    />
                  </div>
                  <h3 className="font-display text-2xl font-bold text-white">
                    <EditableText
                      value={service.title}
                      onSave={(v) => updateServiceContent(service.id, { title: v })}
                      label={`서비스${idx + 1} 제목`}
                      multiline
                    />
                  </h3>
                  <p className="text-xs text-zinc-300 leading-relaxed font-medium pt-1">
                    <EditableText
                      value={service.tagline}
                      onSave={(v) => updateServiceContent(service.id, { tagline: v })}
                      label={`서비스${idx + 1} 한줄설명`}
                      multiline
                    />
                  </p>
                </div>

                {/* Scope Checklist */}
                <div className="space-y-3 pt-2">
                  <div className="text-xs font-bold text-zinc-400 tracking-wider">
                    <SiteText tkey="services.scopeTitle" fallback="주요 작업 범위" label="작업범위 라벨" />
                  </div>
                  <ul className="space-y-2">
                    {service.scopeList.map((item, idx2) => (
                      <li key={`${service.id}-scope-${idx2}`} className="flex items-start gap-2 text-xs text-zinc-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                        <span>
                          <EditableText
                            value={item}
                            onSave={(v) => {
                              const nextScope = service.scopeList.map((sc, i) => (i === idx2 ? v : sc));
                              updateServiceContent(service.id, { scopeList: nextScope });
                            }}
                            label={`서비스${idx + 1} 범위${idx2 + 1}`}
                            multiline
                          />
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Deliverables & Period Info */}
                <div className="pt-4 border-t border-zinc-800/70 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    <span>
                      <SiteText tkey="services.periodLabel" fallback="예상 소요 기간:" label="기간 라벨" />{' '}
                      <strong className="text-zinc-200">
                        <EditableText
                          value={service.estimatedPeriod}
                          onSave={(v) => updateServiceContent(service.id, { estimatedPeriod: v })}
                          label={`서비스${idx + 1} 소요기간`}
                        />
                      </strong>
                    </span>
                  </div>
                  <div className="text-[11px] text-zinc-400 leading-relaxed">
                    <SiteText tkey="services.targetLabel" fallback="추천 대상:" label="추천대상 라벨" />{' '}
                    <EditableText
                      value={service.recommendedFor}
                      onSave={(v) => updateServiceContent(service.id, { recommendedFor: v })}
                      label={`서비스${idx + 1} 추천대상`}
                      multiline
                    />
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
                  <SiteText tkey="services.cta" fallback="이 서비스 견적 문의하기" label="서비스 문의 버튼" />
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
