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

> ℹ️ **서버 모드 / 정적 모드 두 가지로 동작합니다.**
>
> - **서버 모드** (`npm run dev`, `npm start`): 편집 내용과 문의가 `data/` 에 저장되어 **모든 방문자에게 반영**됩니다.
> - **정적 모드** (Netlify 등 `dist/` 만 배포): API 가 없으므로 브라우저 저장소만 사용합니다.
>   이 경우 편집 내용은 본인 브라우저에만 남고 문의는 접수되지 않습니다.
>   콘텐츠 공유·문의 수신이 필요하면 **Node 서버로 배포**하세요.

---

## 보안 관련 주의사항

- 관리자 비밀번호는 **서버에서만** 검증됩니다. 프론트엔드 번들에는 비밀번호도, 해시도 들어 있지 않습니다.
  검증은 `scrypt`(N=16384, r=8, p=1) 해시 + `timingSafeEqual` 비교로 이루어집니다.
- 로그인 성공 시 `HttpOnly; SameSite=Strict; Path=/` 세션 쿠키(`soa_admin`)가 발급됩니다.
  HMAC-SHA256 서명 + 12시간 만료이며, 브라우저 JS 로는 읽을 수 없습니다.
- 모든 쓰기 요청(PUT/PATCH/DELETE)은 **세션 검증 + same-origin 검사**를 통과해야 합니다.
- 로그인 10회/15분, 문의 5회/10분으로 요청을 제한합니다.
- 운영 배포 시 **반드시** 비밀번호를 교체하고 `SESSION_SECRET` 을 설정하세요.

```bash
npm run set-password -- 새비밀번호   # data/admin.json 의 해시 갱신
```

> ⚠️ **Netlify / Vercel / Cloudflare Pages** 는 정적 호스팅이므로 Express 서버가 실행되지 않습니다.
> 관리자 로그인·콘텐츠 저장·문의 수신은 동작하지 않습니다. 서버 기능이 필요하면
> Render / Railway / Fly.io / 자체 VPS 등 **Node 를 실행할 수 있는 호스트**에 `npm start` 로 배포하세요.

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

두 가지 방식이 있습니다. **관리자 로그인·콘텐츠 저장·문의 수신이 필요하면 A(서버) 로 배포해야 합니다.**

### A. Node 서버 배포 (권장 — 전체 기능 동작)

```bash
npm ci
npm run build
npm start          # PORT(기본 3000) 로 dist/ + API 를 함께 서빙
```

필수 환경 변수:

| 변수 | 설명 |
|---|---|
| `ADMIN_PASSWORD` | 관리자 비밀번호. **운영 시 반드시 변경** (미설정 시 기본값 `1012`) |
| `SESSION_SECRET` | 세션 서명 키 32자 이상. 미설정 시 `data/session.key` 에 생성되며, **재시작 시 세션이 유지되려면 고정해야 함** |
| `DATA_DIR` | 데이터 저장 경로 (기본 `./data`) |
| `NODE_ENV` | `production` 이면 세션 쿠키에 `Secure` 플래그가 붙음 |

> ⚠️ **가장 흔한 실수: 영속 디스크(볼륨) 미설정.**
> 저장소가 `data/` 를 컨테이너 임시 파일시스템에 두면 **재배포할 때마다 관리자가 편집한 콘텐츠와
> 접수된 문의가 전부 사라집니다.** 반드시 볼륨을 `DATA_DIR` 에 마운트하세요.

**Render (Blueprint)** — 저장소를 연결하면 `render.yaml` 이 자동 구성합니다.
`disk` 항목이 `/var/data` 를 `DATA_DIR` 로 마운트하므로 재배포 후에도 데이터가 유지됩니다.

```bash
# 최초 1회 비밀번호 설정 (배포 후 셸에서)
npm run set-password -- 새비밀번호
```

**Docker**

```bash
docker build -t soa-portfolio .
docker run -d -p 3000:3000 \
  -e ADMIN_PASSWORD='새비밀번호' \
  -e SESSION_SECRET='32자 이상의 임의 문자열' \
  -v soa-data:/app/data \
  soa-portfolio
```

**Railway / Fly.io / VPS** 도 동일합니다. 시작 명령 `node server/index.js`,
빌드 명령 `npm ci && npm run build`, 그리고 `DATA_DIR` 에 볼륨을 연결하면 됩니다.

### B. 정적 배포 (기능 제한)

```bash
npm run build      # → dist/
```

- **Netlify / Vercel / Cloudflare Pages** — 빌드 명령 `npm run build`, 출력 디렉터리 `dist`
- 해시 라우팅을 사용하므로 **SPA 리라이트 규칙이 필요하지 않습니다.**
- ⚠️ Express 가 실행되지 않으므로 **관리자 로그인·저장·문의가 동작하지 않습니다.**
  API 호출이 실패하면 사이트는 자동으로 기존 브라우저 저장 방식으로 폴백합니다.
  (방문자에게는 정상적으로 보이지만, 편집 내용은 편집자 브라우저에만 남습니다)

---

## 라이선스

© 2026 SO.A Creative Studio. All rights reserved.
포트폴리오 이미지 및 브랜드 자산의 무단 사용을 금합니다.
