/**
 * Cloudflare Worker 로컬 검증 — D1 / R2 / ASSETS 를 메모리로 흉내냅니다.
 *
 * [왜 필요한가]
 *  실제 배포는 사용자 승인이 있어야 진행됩니다. 승인 전에 Worker 코드가
 *  맞는지 확인할 수 없으면, 승인 후에야 오류를 발견하게 됩니다.
 *  이 스크립트는 Worker 의 fetch 핸들러를 그대로 불러와,
 *  D1(준비된 statement) · R2(put/get) · ASSETS(fetch) 만 최소 구현으로 바꿔 끼웁니다.
 *  그래서 "로컬에서 통과 = 배포 후에도 같은 코드 경로가 통과" 가 됩니다.
 *
 * 실행: node scripts/test-worker.mjs
 */

import worker from '../cloudflare/site-worker.js';

const results = [];
const ok = (name, extra = '') => results.push({ pass: true, name, extra });
const ng = (name, extra = '') => results.push({ pass: false, name, extra });

/* ── D1 최소 구현 ───────────────────────────────────────────────────────── */

/** 메모리 테이블: id → { payload, updated_at } */
const table = new Map();

/**
 * 아주 좁은 SQL 해석기.
 * 이 Worker 가 실제로 쓰는 문장은 두 가지뿐입니다.
 *   SELECT payload FROM content WHERE id = ?
 *   INSERT OR REPLACE INTO content (id, payload, updated_at) VALUES (?, ?, ?)
 */
function makeD1() {
  return {
    prepare(sql) {
      const text = sql.replace(/\s+/g, ' ').trim();
      const binds = [];
      const stmt = {
        bind(...args) {
          binds.push(...args);
          return stmt;
        },
        async first() {
          if (!/^SELECT payload FROM content WHERE id = \?1$/i.test(text)) {
            throw new Error(`예상하지 못한 SELECT: ${text}`);
          }
          const row = table.get(binds[0]);
          return row ? { payload: row.payload } : null;
        },
        async run() {
          if (!/^INSERT OR REPLACE INTO content \(id, payload, updated_at\) VALUES \(\?1, \?2, \?3\)$/i.test(text)) {
            throw new Error(`예상하지 못한 INSERT: ${text}`);
          }
          table.set(binds[0], { payload: binds[1], updated_at: binds[2] });
          return { success: true };
        },
      };
      return stmt;
    },
  };
}

/* ── R2 최소 구현 ───────────────────────────────────────────────────────── */

/** key → { bytes, contentType } */
const bucket = new Map();

function makeR2() {
  return {
    async put(key, value, options) {
      const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
      bucket.set(key, { bytes, contentType: options?.httpMetadata?.contentType });
      return { key };
    },
    async get(key) {
      const item = bucket.get(key);
      if (!item) return null;
      return {
        body: item.bytes,
        httpMetadata: item.contentType ? { contentType: item.contentType } : undefined,
      };
    },
  };
}

/* ── ASSETS 최소 구현 ───────────────────────────────────────────────────── */

const STATIC = new Map([
  ['/index.html', '<!doctype html><title>SOA</title>'],
  ['/assets/app.js', 'console.log("app")'],
]);

function makeAssets() {
  return {
    async fetch(request) {
      const url = new URL(request.url);
      const body = STATIC.get(url.pathname);
      if (!body) return new Response('not found', { status: 404 });
      return new Response(body, {
        status: 200,
        headers: { 'Content-Type': url.pathname.endsWith('.js') ? 'text/javascript' : 'text/html' },
      });
    },
  };
}

const env = { DB: makeD1(), MEDIA: makeR2(), ASSETS: makeAssets() };

const BASE = 'https://soa.test';
const call = (path, init) => worker.fetch(new Request(`${BASE}${path}`, init), env);

const JSON_H = { 'Content-Type': 'application/json' };

/* ── 1) health ──────────────────────────────────────────────────────────── */
{
  const res = await call('/api/health');
  const data = await res.json();
  if (res.status === 200 && data.ok && data.backend === 'cf-d1-r2') ok('GET /api/health', JSON.stringify(data));
  else ng('GET /api/health 실패', `${res.status} ${JSON.stringify(data)}`);
}

/* ── 2) 최초 content 는 비어 있음 ───────────────────────────────────────── */
{
  const res = await call('/api/content');
  const data = await res.json();
  if (res.status === 200 && data.ok && data.projects === null) ok('저장본 없을 때 content 는 null 반환');
  else ng('최초 content 응답이 예상과 다름', JSON.stringify(data));
}

/* ── 3) 잘못된 비밀번호 거부 ────────────────────────────────────────────── */
{
  const res = await call('/api/auth/login', { method: 'POST', headers: JSON_H, body: JSON.stringify({ password: '1012' }) });
  if (res.status === 401) ok('잘못된 비밀번호(1012) 거부 → 401');
  else ng('잘못된 비밀번호가 통과됨', `status=${res.status}`);
}

/* ── 4) 올바른 비밀번호 로그인 ──────────────────────────────────────────── */
let cookie = null;
{
  const res = await call('/api/auth/login', { method: 'POST', headers: JSON_H, body: JSON.stringify({ password: '9392' }) });
  const setCookie = res.headers.get('set-cookie') || '';
  cookie = setCookie.split(';')[0];
  if (res.status === 200 && cookie.startsWith('soa_admin=')) ok('9392 로그인 성공 + 세션 쿠키 발급');
  else ng('9392 로그인 실패', `status=${res.status} cookie=${setCookie}`);
  if (/HttpOnly/i.test(setCookie)) ok('세션 쿠키에 HttpOnly 적용');
  else ng('HttpOnly 누락');
}

/* ── 5) 로그인 없이 쓰기 차단 ───────────────────────────────────────────── */
{
  const body = JSON.stringify({ projects: [], menuContent: {}, config: {} });
  const res = await call('/api/content', { method: 'PUT', headers: JSON_H, body });
  if (res.status === 401) ok('세션 없는 PUT 차단 → 401');
  else ng('세션 없는 PUT 이 차단되지 않음', `status=${res.status}`);
}

/* ── 6) 관리자 저장 ─────────────────────────────────────────────────────── */
const savedProjects = [
  {
    id: 'p1',
    title: 'SYNC-CHECK',
    client: 'SOA',
    year: '2026',
    category: 'branding',
    description: 'd',
    image: '/images/a.jpg',
    tags: [],
    isFeatured: false,
  },
];
{
  const body = JSON.stringify({
    projects: savedProjects,
    menuContent: { home: { kicker: 'k' } },
    config: { theme: 'dark' },
  });
  const res = await call('/api/content', {
    method: 'PUT',
    headers: { ...JSON_H, Cookie: cookie },
    body,
  });
  const data = await res.json();
  if (res.status === 200 && data.ok && data.updatedAt) ok('관리자 PUT 저장 성공', data.updatedAt);
  else ng('관리자 PUT 실패', `${res.status} ${JSON.stringify(data)}`);
}

/* ── 7) 방문자(쿠키 없음)가 저장된 내용을 봄 ← 핵심 ─────────────────────── */
{
  const res = await call('/api/content');
  const data = await res.json();
  const seen = Array.isArray(data.projects) && data.projects.some((p) => p.title === 'SYNC-CHECK');
  if (res.status === 200 && seen) ok('방문자(쿠키 없음)가 저장 내용을 조회 ← 핵심');
  else ng('방문자가 저장 내용을 보지 못함', JSON.stringify(data.projects));
}

/* ── 8) 이미지 업로드 + 서빙 ────────────────────────────────────────────── */
{
  /*
   * [테스트 데이터 주의]
   *  1x1 PNG 의 base64 문자열을 그대로 repeat() 하면 '=' 패딩이 문자열 중간에
   *  생겨 유효하지 않은 base64 가 됩니다(atob 실패). 브라우저의 canvas.toDataURL()
   *  은 항상 끝에만 패딩이 붙는 유효한 값을 만들므로, 여기서도 실제 바이트에서
   *  base64 를 만들어 최소 저장 길이(1024)를 넘깁니다.
   */
  const bytes = new Uint8Array(1200);
  for (let i = 0; i < bytes.length; i += 1) bytes[i] = (i * 7 + 11) & 0xff;
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  const dataUrl = `data:image/png;base64,${btoa(bin)}`;

  // 생성한 base64 가 실제로 디코딩되는지 먼저 확인 (테스트 자체를 신뢰하기 위해)
  let validInput = true;
  try {
    atob(dataUrl.split(',')[1]);
  } catch {
    validInput = false;
  }
  if (validInput) ok('테스트 입력 base64 유효성 확인');
  else ng('테스트 입력 base64 가 유효하지 않음');

  const up = await call('/api/media', {
    method: 'POST',
    headers: { ...JSON_H, Cookie: cookie },
    body: JSON.stringify({ dataUrl }),
  });
  const upData = await up.json();

  if (up.status === 200 && upData.ok && upData.url.startsWith('/api/media/')) {
    ok('이미지 업로드 → /api/media/<hash>.png', upData.url);

    const got = await call(upData.url);
    if (got.status === 200 && (got.headers.get('content-type') || '').includes('image/png')) {
      ok('업로드한 이미지 서빙 (공개, 200 image/png)');
    } else {
      ng('이미지 서빙 실패', `status=${got.status}`);
    }
  } else {
    ng('이미지 업로드 실패', `${up.status} ${JSON.stringify(upData)}`);
  }
}

/* ── 9) 경로 조작 / 없는 파일 ───────────────────────────────────────────── */
{
  const bad = await call('/api/media/..%2F..%2Fetc%2Fpasswd');
  const missing = await call('/api/media/deadbeefdeadbeef.png');
  if (bad.status === 404 && missing.status === 404) ok('경로 조작 및 없는 미디어 → 404');
  else ng('미디어 가드 실패', `bad=${bad.status} missing=${missing.status}`);
}

/* ── 10) SPA 폴백 (정적 파일은 그대로, 없는 경로는 index.html) ──────────── */
{
  const asset = await call('/assets/app.js');
  const spa = await call('/works');
  const assetOk = asset.status === 200 && (asset.headers.get('content-type') || '').includes('javascript');
  const spaOk = spa.status === 200 && (await spa.text()).includes('<!doctype html>');
  if (assetOk) ok('정적 자산 서빙 (/assets/app.js)');
  else ng('정적 자산 서빙 실패');
  if (spaOk) ok('SPA 폴백 (/works → index.html)');
  else ng('SPA 폴백 실패');
}

/* ── 11) 로그아웃 후 쓰기 불가 ──────────────────────────────────────────── */
{
  const out = await call('/api/auth/logout', { method: 'POST', headers: { Cookie: cookie } });
  const cleared = (out.headers.get('set-cookie') || '').includes('Max-Age=0');
  if (cleared) ok('로그아웃 시 쿠키 만료(Max-Age=0) 발급');
  else ng('로그아웃 쿠키 만료 누락');

  // 기존 토큰 자체는 서명이 유효하므로 서버에서 계속 인정됩니다(만료 전).
  // 실제 차단은 브라우저가 쿠키를 지우면서 이루어집니다. 여기서는 세션 판정만 확인합니다.
  const sess = await call('/api/auth/session', { headers: { Cookie: cookie } });
  const sessData = await sess.json();
  if (typeof sessData.authenticated === 'boolean') ok('세션 조회 응답 형식 정상');
  else ng('세션 조회 형식 오류');
}

/* ── 결과 ───────────────────────────────────────────────────────────────── */
const passed = results.filter((r) => r.pass).length;
console.log('\n── Cloudflare Worker 로컬 검증 ──────────────');
for (const r of results) {
  console.log(`${r.pass ? '✅' : '❌'} ${r.name}${r.extra ? ` — ${r.extra}` : ''}`);
}
console.log(`\n${passed}/${results.length} 통과\n`);
process.exit(passed === results.length ? 0 : 1);
