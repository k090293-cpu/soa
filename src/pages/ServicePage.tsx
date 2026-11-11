import React, { useState } from 'react';
import { useStudio } from '../context/StudioContext';
import { SERVICES_LIST, PROCESS_STEPS, FAQS } from '../data/servicesData';
import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Sparkles,
  HelpCircle,
  ChevronDown,
  Layers,
  FileCheck,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

export const ServicePage: React.FC = () => {
  const { navigateTo, setSelectedInquiryCategory, menuContent } = useStudio();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const servicesList = menuContent.services && menuContent.services.length > 0
    ? menuContent.services
    : SERVICES_LIST;

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const handleInquireService = (title: string) => {
    setSelectedInquiryCategory(title);
    navigateTo('contact');
  };

  const packageComparison = [
    { feature: '시장 분석 및 카피라이팅 기획', single: '기본 포함', allInOne: '심층 타겟 분석 포함' },
    { feature: '고화질 3D/패키지 그래픽 목업', single: '해당 범위만', allInOne: '웹 & 영상 전체 일체화' },
    { feature: '모바일 100% 가독성 최적화', single: '지원', allInOne: 'PC/Mobile/태블릿 전 규격' },
    { feature: '소셜 미디어 숏폼(릴스·쇼츠) 영상 연계', single: '별도 추가', allInOne: '기본 2편 포함' },
    { feature: '광고 집행용 배너 세트 (Meta, GDN 등)', single: '별도 추가', allInOne: '최적화 20종 기본 포함' },
    { feature: '수정 가능한 원본 소스 파일(Figma/PSD/Pr)', single: '무상 제공', allInOne: '마스터 라이브러리 전체 제공' },
    { feature: '세금계산서 및 계약서 체결', single: '100% 지원', allInOne: '100% 지원' },
    { feature: '단품 대비 예산 절감률', single: '정가 기준', allInOne: '약 25% 절감 패키지' },
  ];

  return (
    <div className="py-12 md:py-20 animate-in fade-in duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
        {/* Breadcrumb & Page Header */}
        <div className="space-y-4 max-w-4xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400">
            <button onClick={() => navigateTo('home')} className="hover:text-white transition-colors cursor-pointer">
              HOME
            </button>
            <span className="text-zinc-600">/</span>
            <span className="text-blue-400">SERVICE</span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.1]">
            SERVICES & <br />
            <span className="bg-gradient-to-r from-blue-500 via-blue-400 to-blue-200 bg-clip-text text-transparent">
              PRODUCTION SCOPE.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-zinc-300 leading-relaxed font-normal pt-2">
            단품 배너 제작부터 상세페이지, 숏폼 영상, 그리고 올인원 브랜드 론칭 패키지까지. 귀사의 예산과 마케팅 일정에 최적화된 명확한 서비스 가이드를 제공합니다.
          </p>
        </div>

        {/* 5 Core Services Detailed Cards */}
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
              {service.popular && (
                <div className="absolute -top-3.5 right-6 bg-blue-600 text-white text-[11px] font-bold px-3 py-0.5 rounded-full flex items-center gap-1 shadow-md shadow-blue-600/30">
                  <Sparkles className="w-3 h-3" />
                  <span>MOST POPULAR</span>
                </div>
              )}

              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="text-xs font-mono font-bold text-blue-400">{service.number}. {service.englishTitle}</div>
                  <h3 className="font-display text-2xl font-bold text-white">{service.title}</h3>
                  <p className="text-xs text-zinc-300 leading-relaxed font-medium pt-1">
                    {service.tagline}
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="text-xs font-bold text-zinc-400 tracking-wider">포함 작업 범위</div>
                  <ul className="space-y-2">
                    {service.scopeList.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-zinc-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-3 pt-2 border-t border-zinc-850">
                  <div className="text-xs font-bold text-zinc-400 tracking-wider">최종 납품 산출물</div>
                  <ul className="space-y-1.5">
                    {service.deliverables.map((d, dIdx) => (
                      <li key={dIdx} className="text-xs text-zinc-400 flex items-center gap-1.5">
                        <span className="text-zinc-600">·</span>
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>

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

        {/* Scope Comparison Table */}
        <div className="space-y-6 border-t border-zinc-850 pt-16">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-blue-400 tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>PACKAGE COMPARISON</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">단품 의뢰 vs 올인원 브랜드 패키지</h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              신제품 론칭이나 리브랜딩을 준비 중이라면, 웹과 영상을 묶은 올인원 패키지가 비용과 브랜딩 일관성 측면에서 가장 효율적입니다.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 overflow-hidden bg-zinc-950">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/60 text-zinc-300 font-semibold">
                    <th className="py-4 px-6">제공 항목 및 작업 조건</th>
                    <th className="py-4 px-6">개별 단품 의뢰</th>
                    <th className="py-4 px-6 text-blue-400">올인원 론칭 패키지 (추천)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850">
                  {packageComparison.map((row, idx) => (
                    <tr key={idx} className="hover:bg-zinc-900/30 transition-colors">
                      <td className="py-3.5 px-6 font-medium text-zinc-300">{row.feature}</td>
                      <td className="py-3.5 px-6 text-zinc-400">{row.single}</td>
                      <td className="py-3.5 px-6 font-semibold text-blue-400 bg-blue-950/10">
                        {row.allInOne}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 5-Step Process Timeline */}
        <div className="space-y-8 border-t border-zinc-850 pt-16">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-blue-400 tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span>WORK PROCESS</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">5단계 표준 작업 프로세스</h2>
            <p className="text-xs sm:text-sm text-zinc-400">
              처음 외주를 의뢰하시는 분도 걱정 없도록 단계별 피드백과 검수 과정을 투명하게 공개합니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {PROCESS_STEPS.map((step, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-2xl font-black text-blue-400">{step.step}</span>
                    <span className="text-[11px] text-zinc-500 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                      {step.duration}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white">{step.title}</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">{step.desc}</p>
                </div>

                <div className="pt-3 border-t border-zinc-850 space-y-1 text-[11px] text-zinc-400">
                  {step.details.map((d, dIdx) => (
                    <div key={dIdx} className="flex items-start gap-1">
                      <span className="text-blue-500">·</span>
                      <span>{d}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-4xl mx-auto rounded-3xl bg-zinc-950 border border-zinc-850 p-8 md:p-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-blue-950/60 border border-blue-900/60 flex items-center justify-center text-blue-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">외주 계약 & 작업 FAQ</h3>
              <p className="text-xs text-zinc-400">작업 전 클라이언트가 가장 자주 묻는 질문 모음</p>
            </div>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-zinc-800/70 overflow-hidden bg-zinc-900/30 transition-colors"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-4 md:p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-zinc-900/60 transition-colors"
                  >
                    <span className="text-sm font-bold text-zinc-200">
                      Q. {faq.q}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-zinc-400 transition-transform duration-200 shrink-0 ${
                        isOpen ? 'rotate-180 text-blue-400' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-zinc-400 leading-relaxed border-t border-zinc-850/60 bg-zinc-950/40">
                      <p>{faq.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="p-8 md:p-12 rounded-3xl bg-gradient-to-r from-blue-950/60 to-zinc-900 border border-blue-900/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-white">필요한 작업 범위에 대한 견적이 궁금하신가요?</h3>
            <p className="text-xs sm:text-sm text-zinc-400">
              희망하시는 예산과 일정에 맞춰 가장 효과적인 구성안을 2시간 내로 전달해 드립니다.
            </p>
          </div>
          <button
            onClick={() => navigateTo('contact')}
            className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-600/30 whitespace-nowrap"
          >
            <span>맞춤 견적 문의하기</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
