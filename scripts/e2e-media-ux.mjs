/**
 * 영상/이미지 미디어 UX 검증
 *
 * 검증 항목
 *  1) 상세 모달에서 영상은 "썸네일"이 먼저 보이고 iframe/video 가 없어야 한다 (로드 전)
 *  2) 썸네일 클릭 시 그때 재생(iframe/video)이 붙는다
 *  3) 이미지 클릭 시 라이트박스가 열리고 큰 이미지가 보인다
 *  4) 라이트박스에서 좌우 버튼(또는 방향키)으로 다음 미디어로 넘어간다
 *  5) ESC 로 라이트박스가 닫힌다
 *  6) 작업물 카드에 VIDEO 배지가 표시된다
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:4173';
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

// 외부 임베드(YouTube 등)는 샌드박스 네트워크에서 막힐 수 있으므로 요청을 흉내만 냅니다.
await page.route('**/*youtube*/**', (r) => r.fulfill({ status: 200, body: '' }));
await page.route('**/*vimeo*/**', (r) => r.fulfill({ status: 200, body: '' }));
await page.route('**/*ytimg*/**', (r) =>
  r.fulfill({ status: 200, contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360"/>' })
);

/* ── 1) 영상 프로젝트 상세 열기 ───────────────────────────────────────── */
await page.goto(`${BASE}/#works`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

// VIDEO 배지 확인
const videoBadge = await page.evaluate(() =>
  [...document.querySelectorAll('span')].some((s) => s.textContent?.trim() === 'VIDEO')
);
if (videoBadge) ok('작업물 카드에 VIDEO 배지 표시됨');
else ng('작업물 카드에 VIDEO 배지 없음');

// URBAN RHYTHM(영상 프로젝트) 카드 클릭
const opened = await page.evaluate(() => {
  const card = [...document.querySelectorAll('article')].find((a) =>
    a.innerText.toUpperCase().includes('URBAN RHYTHM')
  );
  if (!card) return false;
  card.click();
  return true;
});
if (!opened) ng('영상 프로젝트 카드를 찾지 못함');
await page.waitForTimeout(1500);

/* ── 2) 재생 전: 썸네일만, iframe/video 없음 ──────────────────────────── */
// 영상 프로젝트의 갤러리는 [대표 이미지, 영상] 순서이므로 모달은 이미지로 열립니다.
// 영상 썸네일(VID)을 선택한 뒤 "재생 전 상태"를 검사합니다.
const videoSelected = await page.evaluate(() => {
  const strip = [...document.querySelectorAll('button')].filter(
    (b) => b.innerText.replace(/\s+/g, '').toUpperCase() === 'VID'
  );
  const target = strip[strip.length - 1];
  if (!target) return false;
  target.click();
  return true;
});
await page.waitForTimeout(900);

if (videoSelected) ok('영상 썸네일(VID) 선택 가능');
else ng('영상 썸네일(VID)을 찾지 못함');

const beforePlay = await page.evaluate(() => {
  const modal = document.querySelector('.fixed.inset-0.z-50');
  const root = modal || document.body;
  return {
    iframes: root.querySelectorAll('iframe').length,
    videos: root.querySelectorAll('video').length,
    playBtn: !!root.querySelector('button[aria-label*="재생"]'),
  };
});

if (beforePlay.iframes === 0 && beforePlay.videos === 0) {
  ok('재생 전에는 iframe/video 를 로드하지 않음 (가벼운 로딩)');
} else {
  ng('재생 전인데 영상이 이미 로드됨', JSON.stringify(beforePlay));
}
if (beforePlay.playBtn) ok('영상 썸네일 위에 재생 버튼 표시됨');
else ng('재생 버튼 없음');

/* ── 3) 썸네일 클릭 → 그때 재생 ───────────────────────────────────────── */
const playClicked = await page.evaluate(() => {
  const btn = document.querySelector('button[aria-label*="재생"]');
  if (!btn) return false;
  btn.click();
  return true;
});
await page.waitForTimeout(1200);

const afterPlay = await page.evaluate(() => ({
  iframes: document.querySelectorAll('iframe').length,
  videos: document.querySelectorAll('video').length,
}));

if (playClicked && (afterPlay.iframes > 0 || afterPlay.videos > 0)) {
  ok('썸네일 클릭 시 재생 시작됨 (iframe/video 생성)');
} else {
  ng('썸네일 클릭 후에도 재생기가 생성되지 않음', JSON.stringify(afterPlay));
}

/* ── 4) 이미지 프로젝트에서 라이트박스 ────────────────────────────────── */
await page.goto(`${BASE}/#works`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);

const opened2 = await page.evaluate(() => {
  const card = [...document.querySelectorAll('article')].find((a) =>
    a.innerText.toUpperCase().includes('AURÉLIA')
  );
  if (!card) return false;
  card.click();
  return true;
});
if (!opened2) ng('이미지 프로젝트 카드를 찾지 못함');
await page.waitForTimeout(1500);

// 현재 보이는 이미지(크게 보기 버튼) 클릭
const zoomClicked = await page.evaluate(() => {
  const btn = document.querySelector('button[aria-label*="크게 보기"]');
  if (!btn) return false;
  btn.click();
  return true;
});
await page.waitForTimeout(900);

const lightbox = await page.evaluate(() => {
  const dlg = document.querySelector('[aria-label="미디어 크게 보기"]');
  if (!dlg) return { open: false };
  return {
    open: true,
    hasLargeImg: !!dlg.querySelector('img'),
    counter: dlg.textContent?.match(/(\d+)\s*\/\s*(\d+)/)?.[0] || '',
    navButtons: dlg.querySelectorAll('button[aria-label*="미디어"]').length,
  };
});

if (zoomClicked && lightbox.open) ok('이미지 클릭 시 라이트박스가 열림');
else ng('라이트박스가 열리지 않음', JSON.stringify(lightbox));

if (lightbox.open && lightbox.hasLargeImg) ok('라이트박스에 큰 이미지 표시됨');
else ng('라이트박스에 이미지가 없음');

/* ── 5) 라이트박스 좌우 넘김 ──────────────────────────────────────────── */
if (lightbox.open) {
  const beforeCounter = await page.evaluate(
    () => document.querySelector('[aria-label="미디어 크게 보기"]')?.textContent?.match(/(\d+)\s*\/\s*(\d+)/)?.[0] || ''
  );

  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(600);
  const afterCounter = await page.evaluate(
    () => document.querySelector('[aria-label="미디어 크게 보기"]')?.textContent?.match(/(\d+)\s*\/\s*(\d+)/)?.[0] || ''
  );

  if (beforeCounter && afterCounter && beforeCounter !== afterCounter) {
    ok('방향키로 다음 미디어로 넘어감', `${beforeCounter} → ${afterCounter}`);
  } else {
    ng('좌우 넘김이 동작하지 않음', `${beforeCounter} → ${afterCounter}`);
  }

  /* ── 6) ESC 로 닫기 ─────────────────────────────────────────────── */
  await page.keyboard.press('Escape');
  await page.waitForTimeout(600);
  const closed = await page.evaluate(
    () => !document.querySelector('[aria-label="미디어 크게 보기"]')
  );
  if (closed) ok('ESC 로 라이트박스 닫힘');
  else ng('ESC 로 닫히지 않음');
}

if (jsErrors.length === 0) ok('JS 에러 없음');
else ng(`JS 에러 ${jsErrors.length}건`, jsErrors.slice(0, 2).join(' | '));

await browser.close();

console.log('\n──────── 미디어 UX 검증 ────────');
let failed = 0;
for (const r of results) {
  if (!r.pass) failed += 1;
  console.log(`${r.pass ? '✅' : '❌'} ${r.name}${r.extra ? `  →  ${r.extra}` : ''}`);
}
console.log('────────────────────────────────');
console.log(failed === 0 ? `\n🎉 전부 통과 (${results.length}건)` : `\n⚠️  실패 ${failed}건 / 전체 ${results.length}건`);
process.exit(failed === 0 ? 0 : 1);
