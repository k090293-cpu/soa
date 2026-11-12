import React from 'react';
import { TESTIMONIALS } from '../data/servicesData';
import { ShieldCheck, TrendingUp, Quote } from 'lucide-react';
import { SiteText } from './editable/SiteText';

/** 3대 작업 원칙 기본 문구 (편집 시 textOverrides 로 대체됩니다) */
const PRINCIPLES_FALLBACK = [
  {
    title: '약속된 마감 기한 100% 엄수',
    desc: '런칭 지연은 곧 기업의 매출 손실입니다. 계약 전 확정된 마일스톤 데드라인을 어떠한 경우에도 최우선으로 지킵니다.',
  },
  {
    title: '실제 구매 전환에 기여하는 설계',
    desc: '디자이너의 자기만족용 예술이 아닌, 고객의 행동 유도(CTA)와 상품 신뢰를 얻어내는 상업적 설득 구조를 만듭니다.',
  },
  {
    title: '영구 소장 가능한 원본 소스 제공',
    desc: '납품 후에도 클라이언트 내부 마케팅팀이 텍스트나 가격을 자체 수정할 수 있도록 정돈된 원본 소스를 제공합니다.',
  },
];

export const Trust: React.FC = () => {
  return (
    <section className="py-20 md:py-28 border-t border-zinc-850 bg-zinc-950/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-blue-400">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <SiteText tkey="trust.kicker" fallback="06. TRUST & PROOF" label="TRUST 킥커" />
          </div>

          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight whitespace-pre-line">
            <SiteText
              tkey="trust.title"
              fallback={'클라이언트가 신뢰하고\n다시 찾는 이유'}
              label="TRUST 제목"
              multiline
            />
          </h2>

          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
            <SiteText
              tkey="trust.subtitle"
              fallback="과장된 수치 없이, 실제 협업한 브랜드 디렉터와 마케팅 담당자들의 생생한 후기와 변함없는 3대 작업 원칙을 확인하세요."
              label="TRUST 설명"
              multiline
            />
          </p>
        </div>

        {/* 3 Client Testimonials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {TESTIMONIALS.map((t, idx) => (
            <div
              key={t.id}
              className="p-7 md:p-8 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                <Quote className="w-6 h-6 text-blue-500/60" />
                <p className="text-sm text-zinc-300 leading-relaxed font-normal">
                  &ldquo;
                  <SiteText
                    tkey={`trust.testimonial.${idx}.quote`}
                    fallback={t.quote}
                    label={`후기 ${idx + 1} 내용`}
                    multiline
                  />
                  &rdquo;
                </p>
              </div>

              <div className="pt-4 border-t border-zinc-850 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <strong className="text-white font-semibold">
                      <SiteText
                        tkey={`trust.testimonial.${idx}.client`}
                        fallback={t.client}
                        label={`후기 ${idx + 1} 작성자`}
                      />
                    </strong>
                    <span className="text-zinc-500 ml-1.5">
                      ·{' '}
                      <SiteText
                        tkey={`trust.testimonial.${idx}.company`}
                        fallback={t.company}
                        label={`후기 ${idx + 1} 회사`}
                      />
                    </span>
                  </div>
                  <span className="text-[11px] text-zinc-400">
                    <SiteText
                      tkey={`trust.testimonial.${idx}.role`}
                      fallback={t.role}
                      label={`후기 ${idx + 1} 직함`}
                    />
                  </span>
                </div>
                <div className="inline-flex items-center gap-1.5 text-xs text-blue-400 font-semibold bg-blue-950/40 px-2.5 py-1 rounded border border-blue-900/40">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <SiteText
                    tkey={`trust.testimonial.${idx}.result`}
                    fallback={t.result}
                    label={`후기 ${idx + 1} 성과`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Studio 3 Core Work Principles */}
        <div className="rounded-2xl bg-zinc-900/40 border border-zinc-800 p-8 md:p-10">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
              <SiteText
                tkey="trust.principles.title"
                fallback="PORTFOLIO_SO.A 3대 작업 원칙"
                label="원칙 섹션 제목"
              />
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              <SiteText
                tkey="trust.principles.subtitle"
                fallback="신뢰는 화려한 말보다 확실한 실행에서 나옵니다."
                label="원칙 섹션 설명"
                multiline
              />
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PRINCIPLES_FALLBACK.map((p, idx) => (
              <div key={idx} className="space-y-2 p-4 rounded-xl bg-zinc-950/60 border border-zinc-850">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-blue-400">0{idx + 1}.</span>
                  <h4 className="text-sm font-bold text-zinc-200">
                    <SiteText
                      tkey={`trust.principle.${idx}.title`}
                      fallback={p.title}
                      label={`원칙 ${idx + 1} 제목`}
                    />
                  </h4>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed pl-5">
                  <SiteText
                    tkey={`trust.principle.${idx}.desc`}
                    fallback={p.desc}
                    label={`원칙 ${idx + 1} 설명`}
                    multiline
                  />
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
