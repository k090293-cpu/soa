import React, { useState, useEffect } from 'react';
import { useStudio } from '../context/StudioContext';
import { CheckCircle2, Mail, Phone, MessageSquare, Copy, Check, Send, AlertCircle } from 'lucide-react';
import { EditableText } from './editable/EditableText';
import { SiteText } from './editable/SiteText';

/**
 * 입력창 안내문구(placeholder) 편집기.
 * - 실제 placeholder 값은 textOverrides 맵에서 읽어옵니다.
 * - 편집 모드에서만 입력창 아래에 수정용 한 줄이 나타납니다. (방문자 화면은 그대로)
 */
const PlaceholderEditor: React.FC<{ k: string; fallback: string }> = ({ k, fallback }) => {
  const { siteText, setSiteText, isHomeInlineEditMode } = useStudio();
  if (!isHomeInlineEditMode) return null;
  return (
    <div className="mt-1 flex items-start gap-1 text-[10px] text-blue-300/80">
      <span className="opacity-60 shrink-0">안내문구</span>
      <EditableText
        value={siteText(k, fallback)}
        onSave={(v) => setSiteText(k, v)}
        label={`${k} 안내문구`}
        className="flex-1"
        multiline
      />
    </div>
  );
};

export const Contact: React.FC = () => {
  const {
    addInquiry,
    config,
    selectedInquiryCategory,
    setSelectedInquiryCategory,
    menuContent,
    updateContactContent,
    siteText,
    setSiteText,
    isHomeInlineEditMode,
  } = useStudio();
  const contactData = menuContent.contact;

  // Form states
  const [clientName, setClientName] = useState('');
  const [company, setCompany] = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [categories, setCategories] = useState<string[]>(['상세페이지']);
  const [budget, setBudget] = useState('300만원 ~ 500만원');
  const [schedule, setSchedule] = useState('2주 ~ 1개월 이내');
  const [description, setDescription] = useState('');
  const [referenceUrl, setReferenceUrl] = useState('');
  const [agreedPrivacy, setAgreedPrivacy] = useState(true);

  // Status feedback
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedEmail, setCopiedEmail] = useState(false);

  // If a user clicked "이 프로젝트/서비스 문의하기", auto-select that category
  useEffect(() => {
    if (selectedInquiryCategory) {
      if (!categories.includes(selectedInquiryCategory)) {
        setCategories((prev) => [...prev, selectedInquiryCategory]);
      }
    }
  }, [selectedInquiryCategory]);

  const toggleCategory = (cat: string) => {
    if (categories.includes(cat)) {
      if (categories.length > 1) {
        setCategories(categories.filter((c) => c !== cat));
      }
    } else {
      setCategories([...categories, cat]);
    }
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(config.email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!clientName.trim()) {
      setErrorMessage('성함 또는 담당자명을 입력해 주세요.');
      return;
    }
    if (!contact.trim()) {
      setErrorMessage('연락처(휴대폰 번호)를 입력해 주세요.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('올바른 이메일 주소를 입력해 주세요.');
      return;
    }
    if (!description.trim()) {
      setErrorMessage('원하시는 프로젝트 작업 내용을 간단히 적어주세요.');
      return;
    }
    if (!agreedPrivacy) {
      setErrorMessage('개인정보 수집 및 이용에 동의해 주세요.');
      return;
    }

    // Save inquiry to context/localStorage
    addInquiry({
      clientName: clientName.trim(),
      company: company.trim() || undefined,
      contact: contact.trim(),
      email: email.trim(),
      categories,
      budget,
      schedule,
      description: description.trim(),
      referenceUrl: referenceUrl.trim() || undefined,
    });

    setSubmittedSuccess(true);
    // Reset form
    setClientName('');
    setCompany('');
    setContact('');
    setEmail('');
    setDescription('');
    setReferenceUrl('');
    setSelectedInquiryCategory(null);
  };

  const availableCategories = [
    '상세페이지',
    '웹 배너',
    '프로모션',
    '숏폼 영상',
    '올인원 패키지',
  ];

  const budgetOptions = [
    '100만원 ~ 300만원',
    '300만원 ~ 500만원',
    '500만원 ~ 1,000만원',
    '1,000만원 이상 (대규모)',
  ];

  const scheduleOptions = [
    '급행 (1주 이내)',
    '2주 ~ 1개월 이내',
    '1개월 이상 / 론칭 예정',
    '일정 협의 희망',
  ];

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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column (5 cols): Direct Info & Channels */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-8 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-6">
              <h3 className="text-lg font-bold text-white">
                <SiteText tkey="contact.leftTitle" fallback="직접 문의 및 빠른 상담" label="채널 제목" multiline />
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                <SiteText
                  tkey="contact.leftDesc"
                  fallback="폼 작성이 번거로우시거나 유선 상담이 필요하신 경우 아래 채널로 편하게 연락주세요."
                  label="채널 설명"
                  multiline
                />
              </p>

              {/* Direct channels */}
              <div className="space-y-4 pt-2">
                {/* Email */}
                <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-850 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-950/60 border border-blue-900/40 flex items-center justify-center text-blue-400 shrink-0">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[11px] text-zinc-500">
                        <SiteText tkey="contact.channel.email.label" fallback="공식 이메일" label="이메일 라벨" />
                      </div>
                      <div className="text-xs font-semibold text-zinc-200">{config.email}</div>
                    </div>
                  </div>
                  <button
                    onClick={handleCopyEmail}
                    className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs transition-colors cursor-pointer flex items-center gap-1"
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
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-950/60 border border-blue-900/40 flex items-center justify-center text-blue-400 shrink-0">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[11px] text-zinc-500">
                        <SiteText tkey="contact.channel.phone.label" fallback="유선 연락처" label="전화 라벨" />
                      </div>
                      <div className="text-xs font-semibold text-zinc-200">{config.phone}</div>
                    </div>
                  </div>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    <SiteText tkey="contact.channel.phone.hours" fallback="평일 10:00 - 19:00" label="상담 시간" />
                  </span>
                </div>

                {/* Kakao */}
                <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-850 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-yellow-950/40 border border-yellow-800/40 flex items-center justify-center text-yellow-400 shrink-0">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-[11px] text-zinc-500">
                        <SiteText tkey="contact.channel.kakao.label" fallback="카카오톡 채널 상담" label="카카오 라벨" />
                      </div>
                      <div className="text-xs font-semibold text-zinc-200">ID: {config.kakao}</div>
                    </div>
                  </div>
                  <span className="text-[11px] text-yellow-400 font-medium">
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

          {/* Right Column (7 cols): High-Conversion Interactive Inquiry Form */}
          <div className="lg:col-span-7">
            <div className="p-8 md:p-10 rounded-2xl bg-zinc-900/60 border border-zinc-800 relative">
              {/* Success Notification Modal Overlay */}
              {submittedSuccess && (
                <div className="absolute inset-0 bg-zinc-950/95 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center p-8 text-center space-y-4 z-20">
                  <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                    <CheckCircle2 className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">
                    <SiteText tkey="contact.success.title" fallback="문의가 성공적으로 접수되었습니다" label="접수완료 제목" multiline />
                  </h3>
                  <p className="text-sm text-zinc-300 max-w-md leading-relaxed">
                    <SiteText
                      tkey="contact.success.before"
                      fallback="작성해주신 의뢰 내용과 요구사항을 면밀히 검토 중입니다. 남겨주신 연락처("
                      label="접수완료 설명1"
                      multiline
                    />
                    <strong className="text-blue-400">{contact}</strong>
                    <SiteText
                      tkey="contact.success.after"
                      fallback=") 또는 이메일로 2시간 이내에 1:1 상담 회신을 드리겠습니다."
                      label="접수완료 설명2"
                      multiline
                    />
                  </p>
                  <button
                    onClick={() => setSubmittedSuccess(false)}
                    className="mt-4 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    <SiteText tkey="contact.success.button" fallback="확인 및 추가 문의 작성" label="접수완료 버튼" />
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Error Banner */}
                {errorMessage && (
                  <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 flex items-center gap-2 text-xs text-red-300">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* 1. Name & Company */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1">
                      <SiteText tkey="contact.form.name.label" fallback="성함 / 담당자명" label="성함 라벨" />
                      <span className="text-blue-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder={siteText('contact.form.name.ph', '예: 홍길동 팀장')}
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
                      required
                    />
                    <PlaceholderEditor k="contact.form.name.ph" fallback="예: 홍길동 팀장" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">
                      <SiteText tkey="contact.form.company.label" fallback="회사명 / 브랜드명 (선택)" label="회사명 라벨" />
                    </label>
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder={siteText('contact.form.company.ph', '예: 임팩트 코스메틱')}
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    <PlaceholderEditor k="contact.form.company.ph" fallback="예: 임팩트 코스메틱" />
                  </div>
                </div>

                {/* 2. Contact Phone & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1">
                      <SiteText tkey="contact.form.phone.label" fallback="연락처 (휴대폰)" label="연락처 라벨" />
                      <span className="text-blue-400">*</span>
                    </label>
                    <input
                      type="tel"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder={siteText('contact.form.phone.ph', '예: 010-1234-5678')}
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
                      required
                    />
                    <PlaceholderEditor k="contact.form.phone.ph" fallback="예: 010-1234-5678" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1">
                      <SiteText tkey="contact.form.email.label" fallback="이메일 주소" label="이메일 라벨" />
                      <span className="text-blue-400">*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={siteText('contact.form.email.ph', '예: contact@brand.com')}
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
                      required
                    />
                    <PlaceholderEditor k="contact.form.email.ph" fallback="예: contact@brand.com" />
                  </div>
                </div>

                {/* 3. Category Multi-select */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                    <SiteText tkey="contact.form.category.label" fallback="의뢰 분야 (복수 선택 가능)" label="분야 라벨" />
                    <span className="text-[11px] text-zinc-500">
                      <SiteText tkey="contact.form.category.selected" fallback="선택된 항목:" label="선택 항목 라벨" />{' '}
                      {categories.join(', ')}
                    </span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {availableCategories.map((cat, idxCat) => {
                      const isSelected = categories.includes(cat);
                      return (
                        <button
                          type="button"
                          key={cat}
                          onClick={() => toggleCategory(cat)}
                          className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-blue-600 text-white font-semibold shadow-sm'
                              : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:text-white hover:border-zinc-700'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-zinc-600'}`} />
                          <span>
                            <SiteText
                              tkey={`contact.form.categoryItem.${idxCat}`}
                              fallback={cat}
                              label={`분야 ${idxCat + 1}`}
                            />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Budget & Schedule Selectors */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">
                      <SiteText tkey="contact.form.budget.label" fallback="예상 예산 범위" label="예산 라벨" />
                    </label>
                    <select
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 transition-colors"
                    >
                      {budgetOptions.map((opt, oIdx) => (
                        <option key={opt} value={opt} className="bg-zinc-900 text-white">
                          {siteText(`contact.form.budgetOpt.${oIdx}`, opt)}
                        </option>
                      ))}
                    </select>
                    {isHomeInlineEditMode && (
                      <div className="mt-1 space-y-0.5">
                        {budgetOptions.map((opt, oIdx) => (
                          <div key={opt} className="flex items-center gap-1 text-[10px] text-blue-300/80">
                            <span className="opacity-60 shrink-0">옵션{oIdx + 1}</span>
                            <EditableText
                              value={siteText(`contact.form.budgetOpt.${oIdx}`, opt)}
                              onSave={(v) => setSiteText(`contact.form.budgetOpt.${oIdx}`, v)}
                              label={`예산 옵션${oIdx + 1}`}
                              className="flex-1"
                              multiline
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-zinc-300">
                      <SiteText tkey="contact.form.schedule.label" fallback="희망 작업 일정" label="일정 라벨" />
                    </label>
                    <select
                      value={schedule}
                      onChange={(e) => setSchedule(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 transition-colors"
                    >
                      {scheduleOptions.map((opt, oIdx) => (
                        <option key={opt} value={opt} className="bg-zinc-900 text-white">
                          {siteText(`contact.form.scheduleOpt.${oIdx}`, opt)}
                        </option>
                      ))}
                    </select>
                    {isHomeInlineEditMode && (
                      <div className="mt-1 space-y-0.5">
                        {scheduleOptions.map((opt, oIdx) => (
                          <div key={opt} className="flex items-center gap-1 text-[10px] text-blue-300/80">
                            <span className="opacity-60 shrink-0">옵션{oIdx + 1}</span>
                            <EditableText
                              value={siteText(`contact.form.scheduleOpt.${oIdx}`, opt)}
                              onSave={(v) => setSiteText(`contact.form.scheduleOpt.${oIdx}`, v)}
                              label={`일정 옵션${oIdx + 1}`}
                              className="flex-1"
                              multiline
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 5. Project Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1">
                    <SiteText tkey="contact.form.desc.label" fallback="작업 내용 및 요청사항" label="내용 라벨" />
                    <span className="text-blue-400">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={siteText(
                      'contact.form.desc.ph',
                      '제품 특징, 타겟 고객, 원하시는 스타일 또는 해결하고자 하는 문제점을 편하게 작성해 주세요.',
                    )}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 transition-colors leading-relaxed"
                    required
                  />
                  <PlaceholderEditor
                    k="contact.form.desc.ph"
                    fallback="제품 특징, 타겟 고객, 원하시는 스타일 또는 해결하고자 하는 문제점을 편하게 작성해 주세요."
                  />
                </div>

                {/* 6. Reference link */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">
                    <SiteText tkey="contact.form.ref.label" fallback="참고 레퍼런스 URL (선택)" label="레퍼런스 라벨" />
                  </label>
                  <input
                    type="url"
                    value={referenceUrl}
                    onChange={(e) => setReferenceUrl(e.target.value)}
                    placeholder={siteText(
                      'contact.form.ref.ph',
                      'https://behance.net/gallery/... 또는 인스타그램/웹사이트 링크',
                    )}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                  <PlaceholderEditor
                    k="contact.form.ref.ph"
                    fallback="https://behance.net/gallery/... 또는 인스타그램/웹사이트 링크"
                  />
                </div>

                {/* 7. Privacy Agreement Checkbox */}
                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={agreedPrivacy}
                      onChange={(e) => setAgreedPrivacy(e.target.checked)}
                      className="rounded border-zinc-700 bg-zinc-950 text-blue-600 focus:ring-0 focus:ring-offset-0 w-4 h-4"
                    />
                    <span className="text-xs text-zinc-400">
                      <SiteText
                        tkey="contact.form.privacy.before"
                        fallback="프로젝트 상담 및 견적 안내를 위한"
                        label="동의 문구1"
                      />{' '}
                      <span className="text-zinc-300 underline underline-offset-2">
                        <SiteText tkey="contact.form.privacy.link" fallback="개인정보 수집 및 이용" label="동의 링크문구" />
                      </span>
                      <SiteText tkey="contact.form.privacy.after" fallback="에 동의합니다." label="동의 문구2" />
                    </span>
                  </label>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  className="w-full py-4 px-6 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-600/30 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <SiteText tkey="contact.form.submit" fallback="프로젝트 무료 견적 및 상담 요청하기" label="전송 버튼" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
