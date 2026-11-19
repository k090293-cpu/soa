/**
 * 정적 배포(Netlify) 환경 검증 스크립트
 *
 * 검증 항목
 *  1) 문의 폼이 완전히 사라졌는가 (contact 페이지에 input/textarea/form 없음)
 *  2) 잘못된 비밀번호는 거부되는가
 *  3) 9392 로 관리자 로그인이 되는가
 *  4) 로그인 후 대시보드 탭이 열리는가
 *  5) 관리자 편집 내용이 localStorage 에 저장되는가
 *  6) 새로고침 후에도 로그인 세션이 유지되는가 (sessionStorage)
 *  7) 5개 라우트 × 6개 해상도에서 가로 오버플로/JS 에러가 없는가
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:4173';
const PASSWORD = process.env.ADMIN_PASSWORD || '9392';

const results = [];
const ok = (name, extra = '') => results.push({ pass: true, name, extra });
const ng = (name, extra = '') => results.push({ pass: false, name, extra });

const browser = await chromium.launch({
  executablePath: '/home/user/.cache/ms-playwright/chromium-1148/chrome-linux/chrome',
  args: ['--no-sandbox'],
});

const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const jsErrors = [];
page.on('pageerror', (e) => jsErrors.push(String(e)));
page.on('console', (m) => {
  if (m.type() === 'error') jsErrors.push(m.text());
});

/* ── 1) contact 페이지: 문의 폼 부재 ─────────────────────────────────── */
await page.goto(`${BASE}/#contact`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);

const formInfo = await page.evaluate(() => {
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const inputs = [...document.querySelectorAll('input, textarea, select, form')].filter(visible);
  return {
    count: inputs.length,
    tags: inputs.map((e) => e.tagName.toLowerCase()),
    hasMailto: !!document.querySelector('a[href^="mailto:"]'),
    hasTel: !!document.querySelector('a[href^="tel:"]'),
    bodyText: document.body.innerText,
  };
});

if (formInfo.count === 0) ok('문의 폼 제거됨 (input/textarea/form 0개)');
else ng('문의 폼이 아직 남아 있음', JSON.stringify(formInfo.tags));

if (formInfo.hasMailto) ok('이메일 링크(mailto) 존재');
else ng('이메일 링크 없음');

if (formInfo.hasTel) ok('전화 링크(tel) 존재');
else ng('전화 링크 없음');

/* ── 2) 잘못된 비밀번호 거부 ─────────────────────────────────────────── */
await page.evaluate(() => window.scrollTo(0, 0));
await page.click('button[title="관리자 로그인"]');
await page.waitForSelector('input[type="password"]', { timeout: 5000 });

const offlineBanner = await page.evaluate(() => document.body.innerText.includes('정적 배포 모드로 동작 중입니다'));
if (offlineBanner) ok('정적 배포 안내 문구 표시됨 (거짓 "사용 불가" 문구 아님)');
else ng('정적 배포 안내 문구 없음');

await page.fill('input[type="password"]', '0000');
await page.click('button[type="submit"]');
await page.waitForTimeout(1500);

const stillLogin = await page.evaluate(() => !!document.querySelector('input[type="password"]'));
const wrongMsg = await page.evaluate(() => document.body.innerText.includes('일치하지 않습니다'));
if (stillLogin && wrongMsg) ok('잘못된 비밀번호 거부됨 (오류 메시지 표시)');
else ng('잘못된 비밀번호 처리 이상', `stillLogin=${stillLogin} msg=${wrongMsg}`);

/* ── 3) 9392 로그인 ─────────────────────────────────────────────────── */
await page.fill('input[type="password"]', PASSWORD);
await page.click('button[type="submit"]');
await page.waitForTimeout(2500);

const loggedIn = await page.evaluate(() => !document.querySelector('input[type="password"]'));
if (loggedIn) ok(`비밀번호 ${PASSWORD} 로그인 성공`);
else ng(`비밀번호 ${PASSWORD} 로그인 실패`);

/* ── 4) 대시보드 탭 확인 ────────────────────────────────────────────── */
const dashTabs = await page.evaluate(() => {
  const t = document.body.innerText;
  return {
    content: t.includes('메뉴 & 카테고리 관리'),
    preview: t.includes('전체 홈 실시간 뷰어'),
    projects: t.includes('포트폴리오'),
    noInquiryTab: !t.includes('문의 관리') && !t.includes('접수된 문의'),
  };
});
if (dashTabs.content && dashTabs.preview) ok('관리자 대시보드 탭 렌더링됨');
else ng('대시보드 탭 렌더링 실패', JSON.stringify(dashTabs));
if (dashTabs.noInquiryTab) ok('문의 관리 탭 제거됨');
else ng('문의 관리 탭이 아직 남아 있음');

/* ── 5) 편집 내용 저장(localStorage) ────────────────────────────────── */
const before = await page.evaluate(() => {
  const raw = localStorage.getItem('soa_menu_content_v2');
  return raw ? JSON.parse(raw) : null;
});

// 사이트 설정 탭에서 카카오 ID 변경 → 저장
await page.evaluate(() => {
  const btns = [...document.querySelectorAll('button')];
  const target = btns.find((b) => b.innerText.includes('스튜디오 설정'));
  if (target) target.click();
});
await page.waitForTimeout(800);

const settingsInputFound = await page.evaluate(() => {
  const labels = [...document.querySelectorAll('label')];
  const kakaoLabel = labels.find((l) => l.innerText.includes('카카오'));
  return !!kakaoLabel;
});

if (settingsInputFound) {
  await page.evaluate(() => {
    const labels = [...document.querySelectorAll('label')];
    const kakaoLabel = labels.find((l) => l.innerText.includes('카카오'));
    const input = kakaoLabel?.parentElement?.querySelector('input') || kakaoLabel?.querySelector('input');
    if (input) {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(input, 'e2e-test-kakao');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
  await page.waitForTimeout(600);

  // 저장 버튼
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button')];
    const save = btns.find((b) => /저장/.test(b.innerText));
    if (save) save.click();
  });
  await page.waitForTimeout(1200);

  const after = await page.evaluate(() => {
    const raw = localStorage.getItem('soa_studio_config_v2');
    return raw ? JSON.parse(raw) : null;
  });
  if (after && after.kakao === 'e2e-test-kakao') ok('관리자 편집 내용이 localStorage 에 저장됨');
  else ng('편집 내용 저장 실패', JSON.stringify(after?.kakao));
} else {
  ng('스튜디오 설정 탭에서 카카오 입력란을 찾지 못함');
}

/* ── 6) 새로고침 후 세션 유지 ───────────────────────────────────────── */
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
await page.click('button[title="관리자 대시보드 열기"], button[title="관리자 로그인"]');
await page.waitForTimeout(1500);
const sessionKept = await page.evaluate(() => !document.querySelector('input[type="password"]'));
if (sessionKept) ok('새로고침 후에도 관리자 세션 유지됨 (sessionStorage)');
else ng('새로고침 후 세션 만료됨');

/* ── 7) 라우트 × 해상도 반응형 검사 ─────────────────────────────────── */
await page.evaluate(() => sessionStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1000);

const routes = ['home', 'about', 'works', 'service', 'contact'];
const widths = [375, 414, 768, 1024, 1280, 1920];
const problems = [];

for (const w of widths) {
  await page.setViewportSize({ width: w, height: 900 });
  for (const r of routes) {
    await page.goto(`${BASE}/#${r}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(450);
    const res = await page.evaluate(() => ({
      scrollW: document.documentElement.scrollWidth,
      clientW: document.documentElement.clientWidth,
    }));
    const overflow = res.scrollW - res.clientW;
    if (overflow > 2) problems.push(`${w}px #${r} 오버플로 ${overflow}px`);
  }
}

if (problems.length === 0) ok(`6개 해상도 × 5개 라우트 가로 오버플로 없음`);
else ng('가로 오버플로 발견', problems.join(' | '));

if (jsErrors.length === 0) ok('JS 에러 없음');
else ng(`JS 에러 ${jsErrors.length}건`, jsErrors.slice(0, 3).join(' | '));

await browser.close();

/* ── 리포트 ─────────────────────────────────────────────────────────── */
console.log('\n──────── 검증 결과 ────────');
let failed = 0;
for (const r of results) {
  if (!r.pass) failed += 1;
  console.log(`${r.pass ? '✅' : '❌'} ${r.name}${r.extra ? `  →  ${r.extra}` : ''}`);
}
console.log('───────────────────────────');
console.log(failed === 0 ? `\n🎉 전부 통과 (${results.length}건)` : `\n⚠️  실패 ${failed}건 / 전체 ${results.length}건`);
process.exit(failed === 0 ? 0 : 1);
