import React, { useState } from 'react';
import { useStudio } from '../context/StudioContext';
import { CheckCircle2, Mail, Phone, MessageSquare, Copy, Check } from 'lucide-react';
import { EditableText } from './editable/EditableText';
import { SiteText } from './editable/SiteText';

/**
 * CONTACT 페이지.
 *
 * [변경 배경]
 *  예전에는 오른쪽에 긴 견적 문의 폼이 있었습니다. 그런데 이 사이트는 정적 호스팅으로
 *  배포되어 문의를 받아 줄 서버가 없고, 폼을 제출해도 내용이 유실되는 구조였습니다.
 *  그래서 폼을 없애고, 실제로 연락이 닿는 채널(이메일·전화·카카오)만 크게 보여 줍니다.
 *  덕분에 화면도 단순해지고 "보냈는데 답이 없다"는 상황도 생기지 않습니다.
 */
export const Contact: React.FC = () => {
  const { config, menuContent, updateContactContent } = useStudio();
  const contactData = menuContent.contact;

  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(config.email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <section id="contact" className="py-20 md:py-28 border-t border-zinc-850 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-blue-400">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <SiteText tkey="contact.kicker" fallback="07. CONTACT & ESTIMATE" label="CONTACT 상단 라벨" />
          </div>

          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight whitespace-pre-line" style={{ textWrap: 'balance' }}>
            <EditableText
              value={contactData.headerTitle}
              onSave={(v) => updateContactContent({ headerTitle: v })}
              label="CONTACT 제목"
              multiline
            />
          </h2>

          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed whitespace-pre-line">
            <EditableText
              value={contactData.introDescription}
              onSave={(v) => updateContactContent({ introDescription: v })}
              label="CONTACT 설명"
              multiline
            />
          </p>
        </div>

        {/* 채널 카드 — 폼 대신 이 3개가 화면의 중심입니다 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
          <div className="p-8 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-6 md:col-span-2">
            <h3 className="text-lg font-bold text-white">
              <SiteText tkey="contact.leftTitle" fallback="직접 문의 및 빠른 상담" label="채널 제목" multiline />
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              <SiteText
                tkey="contact.leftDesc"
                fallback="아래 채널로 편하게 연락 주시면 빠르게 답변드립니다."
                label="채널 설명"
                multiline
              />
            </p>

            {/* Direct channels */}
            <div className="space-y-4 pt-2">
              {/* Email */}
              <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-850 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-blue-950/60 border border-blue-900/40 flex items-center justify-center text-blue-400 shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] text-zinc-500">
                      <SiteText tkey="contact.channel.email.label" fallback="공식 이메일" label="이메일 라벨" />
                    </div>
                    <a
                      href={`mailto:${config.email}`}
                      className="text-xs font-semibold text-zinc-200 break-all hover:text-blue-400 transition-colors"
                    >
                      {config.email}
                    </a>
                  </div>
                </div>
                <button
                  onClick={handleCopyEmail}
                  className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                  title="이메일 복사"
                >
                  {copiedEmail ? <Check className="w-3.5 h-3.5 text-blue-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="text-[11px]">
                    {copiedEmail ? (
                      <SiteText tkey="contact.copyDone" fallback="복사됨" label="복사완료 라벨" />
                    ) : (
                      <SiteText tkey="contact.copy" fallback="복사" label="복사 라벨" />
                    )}
                  </span>
                </button>
              </div>

              {/* Phone */}
              <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-850 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-blue-950/60 border border-blue-900/40 flex items-center justify-center text-blue-400 shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] text-zinc-500">
                      <SiteText tkey="contact.channel.phone.label" fallback="유선 연락처" label="전화 라벨" />
                    </div>
                    <a
                      href={`tel:${config.phone.replace(/[^0-9+]/g, '')}`}
                      className="text-xs font-semibold text-zinc-200 break-all hover:text-blue-400 transition-colors"
                    >
                      {config.phone}
                    </a>
                  </div>
                </div>
                <span className="text-[11px] text-zinc-500 font-mono shrink-0">
                  <SiteText tkey="contact.channel.phone.hours" fallback="평일 10:00 - 19:00" label="상담 시간" />
                </span>
              </div>

              {/* Kakao */}
              <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-850 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-yellow-950/40 border border-yellow-800/40 flex items-center justify-center text-yellow-400 shrink-0">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] text-zinc-500">
                      <SiteText tkey="contact.channel.kakao.label" fallback="카카오톡 채널 상담" label="카카오 라벨" />
                    </div>
                    <div className="text-xs font-semibold text-zinc-200 break-all">ID: {config.kakao}</div>
                  </div>
                </div>
                <span className="text-[11px] text-yellow-400 font-medium shrink-0">
                  <SiteText tkey="contact.channel.kakao.status" fallback="실시간 상담 가능" label="카카오 상태" />
                </span>
              </div>
            </div>

            {/* Consultation pledge */}
            <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-900/30 text-xs space-y-1.5 text-zinc-300">
              <div className="flex items-center gap-1.5 font-bold text-blue-400">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                <SiteText tkey="contact.pledge.title" fallback="2시간 이내 1차 답변 보장" label="답변 보장 문구" />
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed whitespace-pre-line">
                {contactData.responsePledge}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
