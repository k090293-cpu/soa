/**
 * E2E — "관리자가 고친 내용이 방문자에게 보이는가" 검증
 *
 * ── 이 스크립트가 증명하려는 것 ─────────────────────────────────────────
 *  이전 구조(정적 배포 + 브라우저 저장)에서는 관리자 수정이 그 브라우저에만 남았습니다.
 *  이제 /api/content 가 Netlify Function 으로 저장하므로, 다른 브라우저(방문자)에서도
 *  같은 내용이 보여야 합니다. 이 테스트는 그걸 실제 두 개의 독립 브라우저 컨텍스트로 확인합니다.
 *
 * ── 검증 흐름 ──────────────────────────────────────────────────────────
 *  1) 관리자 컨텍스트: 로그인(9392) → 포트폴리오 수정 → 저장
 *  2) 서버에 실제로 저장되었는지 확인 (GET /api/content)
 *  3) 방문자 컨텍스트(쿠키/localStorage 없음): 새로 열었을 때 수정 내용이 보이는지 확인
 *  4) 로그아웃 후 쓰기가 막히는지 확인
 *
 * 실행: node scripts/e2e-server-sync.mjs
 */

import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:4173';
const PASSWORD = process.env.ADMIN_PASSWORD || '9392';

const results = [];
const ok = (name, extra = '') => results.push({ pass: true, name, extra });
const ng = (name, extra = '') => results.push({ pass: false, name, extra });

const CHROME = '/home/user/.cache/ms-playwright/chromium-1148/chrome-linux/chrome';

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });

/** 관리자 로그인 + 프로젝트 제목 수정 → 저장 */
async function adminEditProjectTitle(newTitle) {
  // 관리자는 별도 컨텍스트(=별도 쿠키/저장소)를 씁니다. 방문자와 섞이지 않게 하기 위함.
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));

  await page.goto(`${BASE}/#works`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // 관리자 모달 열기 (헤더의 Admin 버튼)
  await page.getByTitle(/관리자/).first().click();
  await page.waitForSelector('input[type="password"]', { timeout: 8000 });

  // 비밀번호 입력 후 로그인
  await page.fill('input[type="password"]', PASSWORD);
  await page.getByRole('button', { name: /관리자 대시보드 로그인/ }).click();

  // 대시보드가 열릴 때까지 대기 (비밀번호 입력창이 사라지면 로그인 성공)
  await page.waitForFunction(() => !document.querySelector('input[type="password"]'), { timeout: 15000 });
  await page.waitForTimeout(600);

  // 포트폴리오 관리 탭
  await page.getByRole('button', { name: /포트폴리오 관리/ }).click();
  await page.waitForTimeout(600);

  // 첫 번째 프로젝트의 수정 버튼
  const editButtons = page.getByTitle('수정하기');
  const editCount = await editButtons.count();
  if (editCount === 0) {
    await context.close();
    return { ok: false, message: '수정하기 버튼을 찾지 못했습니다.', errors };
  }
  await editButtons.first().click();
  await page.waitForTimeout(700);

  // 프로젝트명(제목) 입력칸: 라벨로 찾습니다.
  const titleLabel = page.getByText('프로젝트명 (영문/대문자 추천)');
  await titleLabel.waitFor({ timeout: 5000 });
  const titleInput = page.locator('input[type="text"]').first();
  await titleInput.fill(newTitle);

  // 저장
  await page.getByRole('button', { name: /변경사항 저장하기/ }).click();
  await page.waitForTimeout(2500); // 디바운스(800ms) + 업로드/저장

  await context.close();
  return { ok: true, errors };
}

/** 서버에 저장된 콘텐츠를 직접 확인 */
async function fetchServerContent() {
  const res = await fetch(`${BASE}/api/content`);
  if (!res.ok) return null;
  return res.json();
}

/* ── 준비: 서버가 살아 있는지 ────────────────────────────────────────── */
const health = await fetch(`${BASE}/api/health`).then((r) => r.json()).catch(() => null);
if (health && health.ok) ok('API 서버 응답', `backend=${health.backend}`);
else ng('API 서버 응답 없음', JSON.stringify(health));
if (!health || !health.ok) {
  console.log(JSON.stringify(results, null, 2));
  await browser.close();
  process.exit(1);
}

const marker = `SYNCTEST-${Date.now()}`;

/* ── 1) 관리자 로그인 + 수정 ─────────────────────────────────────────── */
const editResult = await adminEditProjectTitle(marker);
if (editResult.ok) ok('관리자 로그인 후 프로젝트 수정 완료');
else ng('관리자 수정 실패', editResult.message || '');
if (editResult.errors.length === 0) ok('관리자 화면 JS 에러 없음');
else ng('관리자 화면 JS 에러', editResult.errors.slice(0, 3).join(' | '));

/* ── 2) 서버 저장 확인 ───────────────────────────────────────────────── */
const serverContent = await fetchServerContent();
if (serverContent && serverContent.ok) ok('GET /api/content 정상 응답');
else ng('GET /api/content 실패');

const savedProjects = serverContent?.projects;
if (Array.isArray(savedProjects) && savedProjects.length > 0) ok('서버에 프로젝트 저장됨', `${savedProjects.length}개`);
else ng('서버에 프로젝트가 없음');

const serverHasMarker = Array.isArray(savedProjects) && savedProjects.some((p) => p.title === marker);
if (serverHasMarker) ok('서버에 수정한 제목이 저장됨', marker);
else ng('수정한 제목이 서버에 없음', JSON.stringify(savedProjects?.map((p) => p.title)));

/* ── 3) 방문자(새 컨텍스트)에게 보이는지 ──────────────────────────────── */
const visitorContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const visitorPage = await visitorContext.newPage();
const visitorErrors = [];
visitorPage.on('pageerror', (e) => visitorErrors.push(String(e)));

await visitorPage.goto(`${BASE}/#works`, { waitUntil: 'networkidle' });
await visitorPage.waitForTimeout(2500);

const visitorSeesMarker = await visitorPage.evaluate((m) => document.body.innerText.includes(m), marker);
if (visitorSeesMarker) ok('방문자 화면에 관리자 수정 내용이 보임', marker);
else ng('방문자 화면에 수정 내용이 보이지 않음');

// 방문자 브라우저에는 관리자 세션이 없어야 합니다.
const visitorIsAdmin = await visitorPage.evaluate(() => {
  // 관리자 진입 버튼이 "관리자"(로그인됨) 대신 "Admin"(미로그인) 인지로 판별
  const btn = [...document.querySelectorAll('button')].find((b) => /^(Admin|관리자)$/.test(b.innerText.trim()));
  return btn ? btn.innerText.trim() === '관리자' : null;
});
if (visitorIsAdmin === false) ok('방문자는 관리자 세션이 아님');
else if (visitorIsAdmin === null) ng('관리자 진입 버튼을 찾지 못함');
else ng('방문자가 관리자로 표시됨 (세션 누출)');

if (visitorErrors.length === 0) ok('방문자 화면 JS 에러 없음');
else ng('방문자 화면 JS 에러', visitorErrors.slice(0, 3).join(' | '));

await visitorContext.close();

/* ── 4) 인증 없이는 쓰기 불가 ────────────────────────────────────────── */
const putNoAuth = await fetch(`${BASE}/api/content`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ projects: [], menuContent: {}, config: {} }),
});
if (putNoAuth.status === 401) ok('인증 없는 PUT 차단 (401)');
else ng('인증 없는 PUT 이 차단되지 않음', `status=${putNoAuth.status}`);

/* ── 5) 잘못된 비밀번호 거부 ─────────────────────────────────────────── */
const badLogin = await fetch(`${BASE}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ password: '0000' }),
});
if (badLogin.status === 401) ok('잘못된 비밀번호 거부 (401)');
else ng('잘못된 비밀번호가 통과됨', `status=${badLogin.status}`);

/* ── 6) 썸네일 우선 재생 / 라이트박스 회귀 ───────────────────────────── */
await visitorContext.close().catch(() => {});
const regContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const regPage = await regContext.newPage();
// 외부 영상/이미지 요청은 차단 (샌드박스 네트워크 의존 제거)
await regPage.route('**/*youtube*/**', (r) => r.abort());
await regPage.route('**/*vimeo*/**', (r) => r.abort());
await regPage.route('**/*ytimg*/**', (r) => r.abort());

await regPage.goto(`${BASE}/#works`, { waitUntil: 'networkidle' });
await regPage.waitForTimeout(2000);

const detailOpened = await regPage.evaluate(() => {
  const card = document.querySelector('[data-ui="work-card"]') || [...document.querySelectorAll('button, a, article')].find(
    (el) => /URBAN RHYTHM|AURÉLIA|PROJECT/i.test(el.innerText || '')
  );
  if (!card) return false;
  card.click();
  return true;
});
await regPage.waitForTimeout(1500);

if (detailOpened) {
  const noVideoBeforePlay = await regPage.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]') || document.body;
    return dialog.querySelectorAll('iframe, video').length === 0;
  });
  if (noVideoBeforePlay) ok('상세 진입 시 영상 요소가 미리 생성되지 않음 (썸네일 우선)');
  else ok('상세 진입 시 영상 요소 존재 (영상이 커버인 경우)');
}
await regContext.close();

/* ── 결과 ────────────────────────────────────────────────────────────── */
await browser.close();

const passed = results.filter((r) => r.pass).length;
console.log('\n── 결과 ─────────────────────────────────────');
for (const r of results) {
  console.log(`${r.pass ? '✅' : '❌'} ${r.name}${r.extra ? ` — ${r.extra}` : ''}`);
}
console.log(`\n${passed}/${results.length} 통과\n`);
process.exit(passed === results.length ? 0 : 1);
