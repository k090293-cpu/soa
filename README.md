# PORTFOLIO_SO.A

> 보이는 디자인을 넘어, 성과를 만드는 웹디자인 & 영상 콘텐츠 스튜디오 포트폴리오

**SO.A**는 웹디자인(상세페이지 · 배너 · 프로모션)부터 영상 콘텐츠(숏폼 · 릴스 · 모션 그래픽)까지
브랜드의 가치를 시각적으로 전달하는 올인원 디자인 스튜디오입니다.
이 저장소는 스튜디오의 포트폴리오 사이트이자, **코드 수정 없이 콘텐츠를 직접 편집할 수 있는 관리자 패널**을 포함한 웹 애플리케이션입니다.

---

## 주요 기능

### 방문자용 페이지
| 페이지 | 경로 | 설명 |
|---|---|---|
| HOME | `#home` | 히어로 · KPI · 대표 프로젝트 · 프로세스 소개 |
| ABOUT | `#about` | 스튜디오 소개 · 철학 · 강점 |
| WORKS | `#works` | 카테고리별 포트폴리오 · 상세 케이스 스터디 모달 |
| SERVICE | `#service` | 서비스 항목 · 범위 · 산출물 · 기간 안내 |
| CONTACT | `#contact` | 프로젝트 문의 폼 · 연락처 |

- **해시 기반 라우팅** — 별도 라우터 없이 `window.location.hash`로 페이지 전환 (뒤로가기/새로고침 지원)
- **케이스 스터디 모달** — 프로젝트 개요, 전략, 컨셉, 성과 지표, 산출물, 사용 툴 표시
- **비포 & 애프터 슬라이더** — 리디자인 성과를 드래그로 비교
- **반응형 디자인** — 모바일 / 태블릿 / 데스크톱 대응, Pretendard 폰트 적용

### 관리자 패널
상단 헤더의 자물쇠 아이콘 또는 푸터 링크로 접근합니다.

- **프로젝트 CRUD** — 케이스 스터디 추가 · 수정 · 삭제 · 복제 · 순서 변경
- **미디어 갤러리 업로드** — 이미지/영상을 브라우저에서 자동 압축 후 IndexedDB에 저장
- **메뉴 콘텐츠 편집기** — 히어로 문구, KPI, 소개글, 서비스 항목, 카테고리, 네비게이션 메뉴를 UI에서 직접 편집
- **문의(inquiry) 관리** — 유입된 프로젝트 문의 확인, 상태 변경(`신규` → `검토중` → `상담완료` → `계약체결`), 관리자 메모
- **스플릿 프리뷰 에디터** — 편집과 동시에 홈 화면 미리보기

---

## 기술 스택

| 구분 | 사용 기술 |
|---|---|
| 프레임워크 | React 19 |
| 빌드 도구 | Vite 8 |
| 언어 | TypeScript 7 |
| 스타일링 | Tailwind CSS 4 |
| 애니메이션 | Motion (Framer Motion) |
| 아이콘 | Lucide React |
| 상태 관리 | React Context API |
| 저장소 | localStorage + IndexedDB |

---

## 시작하기

### 요구 사항

- **Node.js 20 이상** (개발 환경 검증: v22)
- npm

### 설치 및 실행

```bash
# 1. 저장소 클론
git clone https://github.com/k090293-cpu/soa.git
cd soa

# 2. 의존성 설치
npm install

# 3. 개발 서버 실행 (http://localhost:3000)
npm run dev
```

### 사용 가능한 스크립트

```bash
npm run dev      # 개발 서버 (포트 3000, 0.0.0.0 바인딩)
npm run build    # 프로덕션 빌드 → dist/
npm run preview  # 빌드 결과물 미리보기
npm run lint     # 타입 체크 (tsc --noEmit)
npm run clean    # dist/ 및 server.js 삭제
```

### 환경 변수

`.env.example`를 참고하여 `.env` 파일을 생성할 수 있습니다.

```bash
cp .env.example .env
```

> **참고**: 현재 `src/` 코드는 `GEMINI_API_KEY` / `APP_URL`을 실제로 참조하지 않습니다.
> `.env.example`은 AI Studio 프로젝트 템플릿에서 유래한 파일이며, 향후 AI 기능 연동을 위한 자리입니다.
> `.env` 파일은 `.gitignore`에 의해 커밋되지 않습니다.

---

## 프로젝트 구조

```
soa/
├── index.html                  # 진입 HTML (메타태그 · Pretendard 폰트)
├── vite.config.ts              # Vite 설정 (@ → 루트 경로 별칭)
├── tsconfig.json
├── package.json
├── metadata.json               # 앱 메타데이터
└── src/
    ├── main.tsx                # React 진입점
    ├── App.tsx                 # 전체 레이아웃 · 페이지 라우팅 · 모달 마운트
    ├── index.css               # Tailwind 엔트리
    ├── types/index.ts          # 도메인 타입 정의 (Project, Inquiry, Config …)
    ├── context/
    │   └── StudioContext.tsx   # 전역 상태 · localStorage/IndexedDB 동기화 · 관리자 인증
    ├── data/
    │   ├── initialProjects.ts  # 초기 프로젝트 · 문의 · 스튜디오 설정 데이터
    │   └── servicesData.ts     # 서비스 · 카테고리 · 메뉴 기본 콘텐츠
    ├── utils/
    │   └── mediaStorage.ts     # IndexedDB 저장 · 이미지 압축 유틸
    ├── pages/                  # HomePage · AboutPage · WorksPage · ServicePage · ContactPage
    ├── components/
    │   ├── Header.tsx  Footer.tsx  Hero.tsx  Works.tsx  Services.tsx
    │   ├── About.tsx  Process.tsx  Trust.tsx  Contact.tsx
    │   ├── ProjectDetailModal.tsx  BeforeAfterSlider.tsx  FloatingCTA.tsx
    │   └── admin/
    │       ├── AdminModal.tsx          # 관리자 대시보드 (프로젝트 · 문의 관리)
    │       ├── ProjectFormModal.tsx    # 프로젝트 입력 폼
    │       └── MenuContentEditor.tsx   # 메뉴/콘텐츠 에디터
    └── assets/images/          # 포트폴리오 이미지
```

---

## 데이터 저장 방식

이 프로젝트는 **별도 백엔드 서버 없이** 브라우저 저장소만으로 데이터를 유지합니다.

| 저장소 | 용도 | 저장 키 |
|---|---|---|
| `localStorage` | 프로젝트 목록, 문의, 스튜디오 설정, 메뉴 콘텐츠 | `soa_studio_projects_v2` 등 |
| `sessionStorage` | 관리자 로그인 세션 | `soa_studio_admin_session_v2` |
| `IndexedDB` | 고해상도 이미지 · 영상 갤러리 (용량 큰 미디어) | `soa_portfolio_media_db_v1` |

업로드된 이미지는 캔버스로 최대 1920px / JPEG 88% 품질로 자동 압축된 뒤 저장됩니다.

> ⚠️ **중요**: 데이터는 **사용자 브라우저에만** 저장됩니다.
> 따라서 다른 기기·브라우저에서는 편집 내용이 보이지 않으며, 시크릿 모드 종료 또는 브라우저 데이터 삭제 시 초기화됩니다.
> 실제 운영 환경에서 콘텐츠를 영구 보존하고 여러 사용자에게 공유하려면 **백엔드 API + 데이터베이스 연동이 필요합니다.**

---

## 보안 관련 주의사항

> **이 저장소는 포트폴리오 데모이며, 관리자 인증은 실제 보안 기능이 아닙니다.**

- 관리자 비밀번호(`1012`)는 `src/context/StudioContext.tsx`에 **평문 하드코딩**되어 있고, UI 하단에도 표시됩니다.
- 로그인 여부는 `sessionStorage` 플래그로만 판단하므로, 누구나 개발자 도구로 우회할 수 있습니다.
- 관리자 패널에서의 변경 사항은 **본인 브라우저에만** 반영되므로 외부 침해 위험은 없지만,
  실제 서비스로 전환할 경우 **서버 측 인증(예: 세션/JWT)과 권한 검증**을 반드시 구현해야 합니다.

운영 배포 시 권장 사항:

1. 관리자 인증을 서버 사이드로 이전
2. 문의 폼 데이터를 서버(DB)에 저장 — 현재는 브라우저에만 저장됨
3. 환경 변수 및 API 키는 서버에서만 관리

---

## 커스터마이징

| 변경 대상 | 파일 |
|---|---|
| 브랜드명 · 연락처 · 상태 배너 | `src/data/initialProjects.ts` → `INITIAL_STUDIO_CONFIG` |
| 초기 포트폴리오 프로젝트 | `src/data/initialProjects.ts` → `INITIAL_PROJECTS` |
| 서비스 항목 · 카테고리 · 메뉴 | `src/data/servicesData.ts` |
| 색상 · 타이포그래피 | `src/index.css` (Tailwind 4 테마) |
| 사이트 제목 · OG 태그 | `index.html` |

> 초기 데이터 파일을 수정해도 **이미 localStorage에 저장된 데이터가 우선**합니다.
> 반영하려면 브라우저 저장소를 초기화하거나 관리자 패널의 **초기화(Reset)** 기능을 사용하세요.

---

## 배포

정적 사이트이므로 `npm run build` 결과물(`dist/`)을 어떤 정적 호스팅에도 배포할 수 있습니다.

```bash
npm run build
```

- **Vercel / Netlify / Cloudflare Pages** — 빌드 명령 `npm run build`, 출력 디렉터리 `dist`
- 해시 라우팅을 사용하므로 **SPA 리라이트(rewrite) 규칙이 필요하지 않습니다.**

---

## 라이선스

© 2026 SO.A Creative Studio. All rights reserved.
포트폴리오 이미지 및 브랜드 자산의 무단 사용을 금합니다.
