import React, { useState } from 'react';
import { useStudio } from '../context/StudioContext';
import { PROCESS_STEPS } from '../data/servicesData';
import { ChevronDown, HelpCircle, Plus } from 'lucide-react';
import { EditableText } from './editable/EditableText';
import { HomeBlockShell } from './editable/HomeBlockShell';

export const Process: React.FC = () => {
  const {
    faqs,
    addFaq,
    updateFaq,
    deleteFaq,
    reorderFaq,
    isHomeInlineEditMode,
  } = useStudio();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <section id="process" className="py-20 md:py-28 border-t border-zinc-850">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-blue-400">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>05. WORKFLOW & PROCESS</span>
          </div>

          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight">
            체계적이고 투명한 작업 프로세스
          </h2>

          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
            처음 외주를 맡기시는 분도 안심하실 수 있도록 모든 단계를 투명하게 공유하며, 약속된 일정에 차질 없이 최고 퀄리티의 결과물을 완성합니다.
          </p>
        </div>

        {/* 5-Step Process Timeline Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative mb-20">
          {PROCESS_STEPS.map((step, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700 transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-2xl font-black text-blue-400 tracking-tight">
                    {step.step}
                  </span>
                  <span className="text-[11px] font-medium text-zinc-500 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                    {step.duration}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-[11px] font-mono font-medium text-zinc-500">{step.englishTitle}</div>
                  <h3 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors">
                    {step.title}
                  </h3>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">
                  {step.desc}
                </p>
              </div>

              <div className="pt-3 border-t border-zinc-850 space-y-1.5">
                {step.details.map((item, dIdx) => (
                  <div key={dIdx} className="flex items-start gap-1.5 text-[11px] text-zinc-400">
                    <span className="text-blue-500 mt-0.5">·</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto rounded-3xl bg-zinc-950 border border-zinc-800/80 p-8 md:p-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-9 h-9 rounded-xl bg-blue-950/60 border border-blue-900/60 flex items-center justify-center text-blue-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">자주 묻는 질문 (FAQ)</h3>
              <p className="text-xs text-zinc-400">외주 의뢰 전 가장 많이 문의주시는 질문들을 모았습니다.</p>
            </div>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              // 편집 모드에서는 항상 펼쳐서 질문/답변을 바로 수정할 수 있게 합니다.
              const isOpen = isHomeInlineEditMode || openFaq === idx;

              return (
                <HomeBlockShell
                  key={faq.id}
                  blockKey={`faq-${idx}`}
                  group="faq"
                  label={`Q&A ${idx + 1}`}
                  movable
                  deletable
                  compact
                  isFirst={idx === 0}
                  isLast={idx === faqs.length - 1}
                  onDelete={() => deleteFaq(faq.id)}
                  onMoveUp={() => reorderFaq(idx, 'up')}
                  onMoveDown={() => reorderFaq(idx, 'down')}
                  className="rounded-xl"
                >
                  <div className="rounded-xl border border-zinc-800/70 overflow-hidden bg-zinc-900/30 transition-colors">
                    <button
                      onClick={() => toggleFaq(idx)}
                      className="w-full p-4 md:p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-zinc-900/60 transition-colors"
                    >
                      <span className="text-sm font-bold text-zinc-200">
                        Q.{' '}
                        <EditableText
                          value={faq.q}
                          onSave={(v) => updateFaq(faq.id, { q: v })}
                          label={`Q&A ${idx + 1} 질문`}
                          multiline
                        />
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-zinc-400 transition-transform duration-200 shrink-0 ${
                          isOpen ? 'rotate-180 text-blue-400' : ''
                        }`}
                      />
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-zinc-400 leading-relaxed border-t border-zinc-850/60 bg-zinc-950/40">
                        <EditableText
                          value={faq.a}
                          onSave={(v) => updateFaq(faq.id, { a: v })}
                          label={`Q&A ${idx + 1} 답변`}
                          multiline
                        />
                      </div>
                    )}
                  </div>
                </HomeBlockShell>
              );
            })}
          </div>

          {/* 편집 모드: Q&A 추가 */}
          {isHomeInlineEditMode && (
            <button
              type="button"
              onClick={() => {
                addFaq();
                setOpenFaq(null);
              }}
              className="mt-4 w-full py-2.5 rounded-xl border border-dashed border-blue-500/50 text-blue-300 hover:text-white hover:bg-blue-600/20 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Q&A 항목 추가</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
