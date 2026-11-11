import { NavMenuItem, WorksCategoryItem, AboutStrengthItem, SiteMenuContent } from '../types';

export interface ServiceItem {
  id: string;
  number: string;
  title: string;
  englishTitle: string;
  tagline: string;
  scopeList: string[];
  deliverables: string[];
  estimatedPeriod: string;
  recommendedFor: string;
  popular?: boolean;
}

export const SERVICES_LIST: ServiceItem[] = [
  {
    id: 'detail-page',
    number: '01',
    title: '상품 상세페이지 & 랜딩페이지',
    englishTitle: 'E-COMMERCE DETAIL & LANDING PAGE',
    tagline: '단순한 스펙 나열이 아닌, 소비자의 결제를 이끄는 스토리텔링과 비주얼 설계',
    scopeList: [
      '시장 분석 및 타겟 심리 기반 카피라이팅',
      '와디즈 / 텀블벅 / 스마트스토어 / 자사몰 맞춤 기획',
      '고급 제품 목업 및 임상/스펙 인포그래픽 제작',
      '모바일 100% 가독성 보장 반응형 슬라이싱',
    ],
    deliverables: ['풀 해상도 상세페이지 (PC & Mobile)', '주요 섹션별 분할 슬라이스 파일', '원본 편집 소스 (Figma 또는 PSD)'],
    estimatedPeriod: '영업일 기준 5일 ~ 10일',
    recommendedFor: '신제품 론칭을 앞둔 뷰티/패션/푸드/가전 브랜드, 크라우드 펀딩 메이커',
    popular: true,
  },
  {
    id: 'web-banner',
    number: '02',
    title: '웹배너 & 디지털 광고 소재',
    englishTitle: 'DISPLAY & PERFORMANCE BANNER KIT',
    tagline: '시선을 멈추고 즉각적인 클릭(CTR)을 유도하는 고효율 광고 비주얼',
    scopeList: [
      'Meta (인스타그램·페이스북) 피드 및 스토리 규격',
      'Google GDN / 카카오 모먼트 / 네이버 GFA 규격 세트',
      'A/B 테스트를 위한 카피 & 컬러 베리에이션',
      '시선 집중 모션 GIF 배너 제작 (옵션)',
    ],
    deliverables: ['채널별 최적화 배너 5~20종 세트', 'A/B 테스트용 카피 베리에이션', '고해상도 웹 최적화 이미지 포맷 (WebP/PNG)'],
    estimatedPeriod: '영업일 기준 2일 ~ 4일',
    recommendedFor: '퍼포먼스 마케팅 집행 기업, 시즌 할인 및 이벤트 광고주',
  },
  {
    id: 'promotion-campaign',
    number: '03',
    title: '프로모션 & 이벤트 기획 디자인',
    englishTitle: 'PROMOTION & CAMPAIGN KEY VISUAL',
    tagline: '브랜드 가치를 각인시키고 참여를 이끌어내는 캠페인 비주얼 시스템',
    scopeList: [
      '캠페인 메인 키비주얼(KV) 아트워크 개발',
      '이벤트 기획전 웹페이지 및 앱 팝업 디자인',
      'SNS 바이럴 홍보 콘텐츠 & 인플루언서 킷',
      '오프라인 POP 및 출력용 인쇄물 연계 (옵션)',
    ],
    deliverables: ['메인 캠페인 키비주얼 원본', '프로모션 이벤트 랜딩 웹페이지', '온·오프라인 파생 광고 소재 일체'],
    estimatedPeriod: '영업일 기준 7일 ~ 14일',
    recommendedFor: '시즌 캠페인, 브랜드 창립 기념 이벤트, 대규모 세일전 기획팀',
  },
  {
    id: 'video-design',
    number: '04',
    title: '숏폼 영상 & 모션 그래픽',
    englishTitle: 'SHORT-FORM REELS & BRAND MOTION',
    tagline: '초반 1.5초 이탈을 방지하고 스크롤을 멈추게 만드는 감각적인 영상 콘텐츠',
    scopeList: [
      '유튜브 쇼츠 / 인스타그램 릴스 / 틱톡 세로형 9:16 최적화',
      '비트 씽크 컷편집, 컬러 그레이딩, 사운드 믹싱',
      '키네틱 타이포그래피 및 로고 모션 그래픽',
      '제품 셀링 포인트 하이라이트 영상 제작',
    ],
    deliverables: ['최종 마스터 영상 (4K / Full HD)', '소셜 미디어 규격별 포맷', '자막 및 음원 라이선스 인증'],
    estimatedPeriod: '영업일 기준 4일 ~ 8일',
    recommendedFor: 'Z세대 타겟 브랜드, SNS 공식 계정 바이럴 및 광고 영상이 필요한 기업',
    popular: true,
  },
  {
    id: 'brand-content',
    number: '05',
    title: '웹 + 영상 올인원 브랜드 패키지',
    englishTitle: 'ALL-IN-ONE BRAND LAUNCH PACKAGE',
    tagline: '광고 영상부터 상세페이지까지 끊김 없는 통일된 브랜드 비주얼 아이덴티티',
    scopeList: [
      '신규 브랜드/제품 론칭에 필요한 비주얼 일괄 구축',
      '상세페이지 + 숏폼 영상 + 론칭 배너 20종 동시 진행',
      '영상과 웹페이지 간의 유기적 톤앤매너 싱크',
      '개별 의뢰 대비 최대 25% 예산 절감 효과',
    ],
    deliverables: ['상세페이지 1종 + 숏폼 2편 + 배너 15종 + 키비주얼', '통합 원본 소스 및 브랜드 비주얼 가이드'],
    estimatedPeriod: '영업일 기준 14일 ~ 20일',
    recommendedFor: '신규 브랜드를 론칭하거나 리브랜딩을 진행하는 스타트업 및 중견 기업',
  },
];

export interface ProcessStep {
  step: string;
  title: string;
  englishTitle: string;
  duration: string;
  desc: string;
  details: string[];
}

export const PROCESS_STEPS: ProcessStep[] = [
  {
    step: '01',
    title: '문의 접수 및 분석',
    englishTitle: 'INQUIRY & BRIEF',
    duration: '접수 당일',
    desc: '의뢰 내용, 브랜드 타겟층, 희망 일정 및 참고 레퍼런스를 면밀히 분석합니다.',
    details: ['프로젝트 기본 요건 확인', '1:1 전담 디자이너 매칭', '24시간 이내 1차 견적 및 가능 일정 안내'],
  },
  {
    step: '02',
    title: '전략 컨설팅 & 계약',
    englishTitle: 'CONSULTING & SCOPE',
    duration: '1~2일 소요',
    desc: '단순 외주가 아닌 파트너 관점에서 최적의 제작 범위와 견적을 협의합니다.',
    details: ['상세 기획 방향성 및 레퍼런스 확정', '일정 마일스톤 및 견적서 발행', '표준 전자 계약서 체결 및 착수금 정산'],
  },
  {
    step: '03',
    title: '디자인 및 영상 제작',
    englishTitle: 'CREATIVE PRODUCTION',
    duration: '3~7일 소요',
    desc: '브랜드 가치와 전환율을 극대화하는 메인 시안을 체계적으로 제작합니다.',
    details: ['카피라이팅 및 구조 와이어프레임', '메인 키비주얼 및 초안 시안 도출', '모션 컷편집 및 인터랙션 구현'],
  },
  {
    step: '04',
    title: '피드백 및 정밀 보정',
    englishTitle: 'FEEDBACK & POLISH',
    duration: '2~3일 소요',
    desc: '클라이언트와의 긴밀한 소통으로 디테일 수정 사항을 빠르고 정확하게 반영합니다.',
    details: ['1차 시안 공유 및 피드백 청취', '상세 문구 및 그래픽 요소 보정 (2회 기본 제공)', '완성도 최종 검수'],
  },
  {
    step: '05',
    title: '최종 납품 및 사후 지원',
    englishTitle: 'DELIVERY & ARCHIVE',
    duration: '완료일',
    desc: '현업에서 즉시 사용 가능한 최적화 규격 파일과 원본 소스를 전달합니다.',
    details: ['웹 최적화 경량화 파일 + 인쇄/고화질 원본 납품', '세금계산서 발행 및 최종 검수 서명', '오픈 후 긴급 텍스트 수정 7일간 무상 지원'],
  },
];

export interface Testimonial {
  id: string;
  client: string;
  company: string;
  role: string;
  project: string;
  quote: string;
  result: string;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 'test-1',
    client: '박성현 대표',
    company: '아우렐리아 코리아',
    role: 'Brand Founder',
    project: '프리미엄 뷰티 상세페이지 & 론칭 배너',
    quote: '그동안 많은 외주 디자이너와 일해봤지만, 제품의 철학을 이렇게 깊이 이해하고 고급스러운 비주얼로 풀어내는 스튜디오는 처음이었습니다. 론칭 첫 주에 목표 매출을 가뿐히 넘겼습니다.',
    result: '구매 전환율 +148% 달성',
  },
  {
    id: 'test-2',
    client: '정유라 마케팅 팀장',
    company: '루멘 드링크',
    role: 'Growth Marketing Lead',
    project: '스파클링 제로 소다 시즌 프로모션 배너 24종',
    quote: '기획 의도를 찰떡같이 파악하시고 일정을 단 하루도 어기지 않으셨습니다. 특히 메타 광고 클릭률이 이전 분기 대비 3배 이상 폭증하여 내부 마케팅팀 모두 만족했습니다.',
    result: 'ROAS 420% 기록',
  },
  {
    id: 'test-3',
    client: '김도윤 디렉터',
    company: '어반리듬',
    role: 'Creative Director',
    project: '스트리트웨어 숏폼 릴스 & 모션 비디오',
    quote: '단순한 영상 편집이 아니라, 비트에 맞춘 모션 타이포그래피와 색감 톤앤매너가 예술이었습니다. 릴스 하나로 380만 조회수를 찍으며 브랜드 팔로워가 4만 명 급증했습니다.',
    result: '380만+ 유기적 조회수',
  },
];

export const TRUST_STATS = [
  { value: '140+', label: '누적 완료 프로젝트', sub: '웹디자인 & 영상 콘텐츠' },
  { value: '98.4%', label: '고객 만족 및 재의뢰율', sub: '기한 엄수 및 퀄리티 신뢰' },
  { value: '4.2x', label: '평균 광고 ROAS 달성', sub: '전환 중심 크리에이티브' },
  { value: '100%', label: '마감 일정 준수율', sub: '약속된 딜리버리 데드라인' },
];

export const FAQS = [
  {
    q: '외주 디자인 의뢰가 처음인데 무엇을 준비해야 하나요?',
    a: '제품 사진, 제품 특징(소구점), 희망하시는 벤치마킹 레퍼런스 링크 1~2개만 알려주시면 충분합니다. 기획안이 구체적이지 않아도 스튜디오에서 카피라이팅과 레이아웃 구조를 함께 잡아드립니다.',
  },
  {
    q: '수정은 몇 회까지 가능한가요?',
    a: '기본 2회의 꼼꼼한 피드백 라운드가 포함되어 있습니다. 최초 협의된 기획안 범위 내에서의 디테일 조정(텍스트, 색상, 배치 등)은 신속하게 반영해 드립니다.',
  },
  {
    q: '원본 파일(Figma, PSD, 프리미어 등)도 제공되나요?',
    a: '네, 최종 결제 완료 후 클라이언트가 향후에도 자유롭게 유지보수하실 수 있도록 텍스트 수정이 가능한 원본 작업 파일 일체를 클라우드 링크로 전달해 드립니다.',
  },
  {
    q: '작업 기간은 보통 얼마나 걸리나요?',
    a: '배너 세트는 2~4일, 숏폼 영상은 4~7일, 상세페이지는 5~10일 정도 소요됩니다. 급한 론칭 일정의 경우 익스프레스 패스트트랙(일정 단축) 옵션 협의도 가능합니다.',
  },
  {
    q: '세금계산서 발행 및 계약서 작성이 가능한가요?',
    a: '네, 정식 사업자 등록 스튜디오로서 전자세금계산서 발행(부VAT 별도)과 표준 용역 계약서 작성이 100% 가능합니다.',
  },
];

export const INITIAL_NAV_MENUS: NavMenuItem[] = [
  { id: 'nav-home', label: 'HOME', page: 'home', enabled: true },
  { id: 'nav-about', label: 'ABOUT', page: 'about', enabled: true },
  { id: 'nav-works', label: 'WORKS', page: 'works', enabled: true },
  { id: 'nav-service', label: 'SERVICE', page: 'service', enabled: true },
  { id: 'nav-contact', label: 'CONTACT', page: 'contact', enabled: true },
];

export const INITIAL_WORKS_CATEGORIES: WorksCategoryItem[] = [
  { id: 'cat-web', key: 'web', label: '01. WEB DESIGN', desc: '상세페이지 · 배너 · UI/UX' },
  { id: 'cat-promotion', key: 'promotion', label: '02. PROMOTION DESIGN', desc: '이벤트 · 광고 소재 · 프로모션' },
  { id: 'cat-video', key: 'video', label: '03. VIDEO DESIGN', desc: '숏폼 · 릴스 · 모션 그래픽' },
];

export const INITIAL_ABOUT_STRENGTHS: AboutStrengthItem[] = [
  {
    id: 'str-1',
    number: '01',
    title: '고전환 웹디자인 & 상세페이지',
    desc: '단순히 보기 좋은 디자인이 아닌, 소비자의 시선 동선과 구매 심리를 계산한 스토리텔링 상세페이지와 프로모션 웹페이지를 기획·디자인합니다.',
  },
  {
    id: 'str-2',
    number: '02',
    title: '숏폼 영상 & 감각적 모션 그래픽',
    desc: '인스타그램 릴스, 틱톡, 유튜브 쇼츠의 초반 1.5초 훅(Hook) 설계와 비트 싱크 컷편집, 키네틱 타이포그래피로 유기적 바이럴과 높은 완청률을 달성합니다.',
  },
  {
    id: 'str-3',
    number: '03',
    title: '웹 + 영상 비주얼 일체화 (Synergy)',
    desc: '광고 영상으로 유입된 고객이 상세페이지에서 동일한 톤앤매너와 프리미엄 감각을 경험하여 이탈 없이 최종 결제로 이어지도록 브랜드 비주얼을 단일화합니다.',
  },
  {
    id: 'str-4',
    number: '04',
    title: '기획부터 제작까지 원스톱 디렉팅',
    desc: '기획자가 없어도 문제없습니다. 제품 핵심 소구점 분석, 카피라이팅, 와이어프레임부터 고화질 목업 및 납품까지 원스톱으로 책임집니다.',
  },
  {
    id: 'str-5',
    number: '05',
    title: '철저한 마감 기한 및 커뮤니케이션',
    desc: '약속된 일정은 반드시 준수합니다. 실시간 피드백 루프와 투명한 진행 공유를 통해 런칭 일정에 차질이 없도록 안심 협업을 보장합니다.',
  },
  {
    id: 'str-6',
    number: '06',
    title: '데이터 기반 성과 중심 디자인',
    desc: '감각에만 의존하지 않고 실제 광고 클릭률(CTR), 구매 전환율(CVR), 영상 시청 지속 시간 등의 실무 데이터를 바탕으로 개선점을 설계합니다.',
  },
];

export const INITIAL_MENU_CONTENT: SiteMenuContent = {
  navMenus: INITIAL_NAV_MENUS,
  worksCategories: INITIAL_WORKS_CATEGORIES,
  home: {
    heroKicker: 'PORTFOLIO_SO.A / WEB & MOTION STUDIO',
    heroHeadline: 'DESIGN THAT MAKES AN IMPACT.',
    heroSubheadline: '보이는 디자인을 넘어, 실제 성과와 매출을 만드는 디자인. 웹디자인(상세페이지·배너·프로모션)부터 시선을 장악하는 영상 콘텐츠(숏폼·릴스·모션)까지, 브랜드의 가치를 시각적으로 전달하는 올인원 디자인 솔루션을 제공합니다.',
    capabilities: ['01. WEB DESIGN', '02. PROMOTION DESIGN', '03. VIDEO & SHORT-FORM'],
    kpis: [
      { id: 'kpi-1', value: '140+', label: '누적 완료 프로젝트', sub: '웹디자인 & 영상 콘텐츠' },
      { id: 'kpi-2', value: '98.4%', label: '고객 만족 및 재의뢰율', sub: '기한 엄수 및 퀄리티 신뢰' },
      { id: 'kpi-3', value: '4.2x', label: '평균 광고 ROAS 달성', sub: '전환 중심 크리에이티브' },
      { id: 'kpi-4', value: '100%', label: '마감 일정 준수율', sub: '약속된 딜리버리 데드라인' },
    ],
  },
  about: {
    headerTitle: '"DESIGN THAT MAKES AN IMPACT."',
    headerSubtitle: '디자이너 SO.A 소개',
    introNarrative: '안녕하세요. 웹디자인과 영상 콘텐츠의 경계를 허물고, 브랜드의 가치를 시각적으로 전달하여 실제 비즈니스 매출과 구매 전환을 만들어내는 크리에이티브 디자이너 SO.A입니다.',
    philosophyTitle: '단순히 예쁜 그래픽을 넘어, 고객의 결제 행동을 움직이는 디자인.',
    philosophyText1: '웹디자인과 영상디자인을 별개의 영역으로 분리하여 외주를 맡길 경우, 광고 영상으로 유입된 고객이 상세페이지에서 이질감을 느끼고 이탈하는 문제가 빈번히 발생합니다.',
    philosophyText2: 'PORTFOLIO_SO.A는 광고 소재(배너·숏폼 영상)의 훅(Hook) 설계부터 상세페이지의 임상 설득, 그리고 이벤트 프로모션 웹페이지까지 하나의 일관된 브랜드 경험으로 완성합니다.',
    philosophyText3: '클라이언트의 시간과 마케팅 예산이 낭비되지 않도록, 첫 미팅부터 산출물 납품까지 군더더기 없는 커뮤니케이션과 100% 일정 준수를 원칙으로 작업합니다.',
    strengths: INITIAL_ABOUT_STRENGTHS,
  },
  services: SERVICES_LIST,
  contact: {
    headerTitle: 'PROJECT INQUIRY & CONSULTATION.',
    headerSubtitle: '1:1 맞춤 견적 및 일정 제안',
    introDescription: '귀사의 브랜드에 필요한 웹디자인과 영상 콘텐츠, 지금 상담을 시작해 보세요. 영업일 기준 평균 2시간 이내에 전담 디자이너 SO.A가 직접 1:1 맞춤 견적과 착수 일정을 안내해 드립니다.',
    responsePledge: '평일 업무 시간 내 접수된 모든 문의는 담당 디자이너가 직접 검토 후 2시간 내로 회신드립니다.',
  },
};

