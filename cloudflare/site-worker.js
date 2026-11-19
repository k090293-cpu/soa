/**
 * SOA 포트폴리오 — Cloudflare Worker (정적 사이트 + /api)
 *
 * ── 구성 ─────────────────────────────────────────────────────────────────
 *  · 정적 파일 : env.ASSETS (Vite 빌드 결과물)
 *  · 콘텐츠    : D1 (관리자가 고친 작품/문구/설정 JSON)
 *  · 이미지    : R2 (관리자가 업로드한 사진)
 *
 * ── 왜 이 구조인가 ───────────────────────────────────────────────────────
 *  관리자 수정 내용이 "모든 방문자"에게 보이려면 브라우저 밖에 저장해야 합니다.
 *  정적 파일은 그대로 Worker 자산으로 서빙하고, 데이터만 D1/R2 에 둡니다.
 *
 * ── 보안 ─────────────────────────────────────────────────────────────────
 *  · 비밀번호는 PBKDF2-SHA256 해시로만 비교 (평문 저장 없음)
 *  · 세션은 HMAC 서명 쿠키(HttpOnly) — 브라우저가 위조할 수 없습니다
 *  · 쓰기(PUT/POST)는 모두 세션 필요
 *
 * ── 라우팅 ───────────────────────────────────────────────────────────────
 *  GET  /api/health        상태 확인
 *  GET  /api/content       콘텐츠 읽기 (공개)
 *  PUT  /api/content       콘텐츠 저장 (관리자)
 *  GET  /api/auth/session  로그인 상태
 *  POST /api/auth/login    로그인
 *  POST /api/auth/logout   로그아웃
 *  POST /api/media         이미지 업로드 (관리자)
 *  GET  /api/media/:key    이미지 서빙 (공개)
 *  그 외                    → env.ASSETS
 */

/* ── 상수 ───────────────────────────────────────────────────────────────── */

/** 클라이언트의 로컬 폴백과는 별개입니다(서버가 응답하면 이 값이 기준). */
const PBKDF2_SALT = 'soa-cf-admin-v1';
const PBKDF2_ITERATIONS = 120_000;
/** 비밀번호 '9392' 의 PBKDF2-SHA256 해시 (평문은 어디에도 저장하지 않습니다) */
const PASSWORD_HASH = 'c0326cc4bf8c6cda8cff0d1872301e7593134e0293d3bacbb847955b81370492';

/** 세션 서명 키 — 환경변수(SOA_SESSION_SECRET)가 있으면 그것을, 없으면 위 해시에서 유도 */
const SESSION_COOKIE = 'soa_admin';
const SESSION_TTL_SEC = 12 * 60 * 60;

/** 요청 본문 한도 (Worker 메모리 보호) */
const MAX_BODY_BYTES = 6 * 1024 * 1024;

const CONTENT_ID = 'main';
const BACKUP_ID = 'main-backup';

/* ── 유틸 ───────────────────────────────────────────────────────────────── */

const enc = new TextEncoder();

const toHex = (buf) =>
  [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

/** 길이 차이로 정보가 새지 않는 문자열 비교 */
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...headers,
    },
  });
}

/* ── 비밀번호 ───────────────────────────────────────────────────────────── */

async function deriveHash(password) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode(PBKDF2_SALT), iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    key,
    256
  );
  return toHex(bits);
}

async function verifyPassword(password) {
  if (typeof password !== 'string' || password.length === 0 || password.length > 200) return false;
  return safeEqual(await deriveHash(password), PASSWORD_HASH);
}

/* ── 세션 토큰 (HMAC 서명) ──────────────────────────────────────────────── */

async function signingKey(env) {
  const secret = env.SOA_SESSION_SECRET && env.SOA_SESSION_SECRET.length >= 16
    ? env.SOA_SESSION_SECRET
    : `soa-session-v1:${PASSWORD_HASH}`;
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

const b64url = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes)))
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

function b64urlDecode(str) {
  const s = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = s.length % 4 ? '='.repeat(4 - (s.length % 4)) : '';
  return atob(s + pad);
}

async function sign(env, payloadB64) {
  const key = await signingKey(env);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payloadB64));
  return b64url(sig);
}

async function createSessionToken(env) {
  const payload = b64url(enc.encode(JSON.stringify({
    iat: Date.now(),
    exp: Date.now() + SESSION_TTL_SEC * 1000,
    jti: toHex(crypto.getRandomValues(new Uint8Array(8))),
  })));
  return `${payload}.${await sign(env, payload)}`;
}

async function verifySessionToken(env, token) {
  if (typeof token !== 'string' || !token.includes('.')) return false;
  const [payloadB64, signature] = token.split('.');
  if (!payloadB64 || !signature) return false;
  if (!safeEqual(await sign(env, payloadB64), signature)) return false;
  try {
    const payload = JSON.parse(b64urlDecode(payloadB64));
    return typeof payload.exp === 'number' && Date.now() < payload.exp;
  } catch {
    return false;
  }
}

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    if (!key) continue;
    try {
      out[key] = decodeURIComponent(part.slice(idx + 1).trim());
    } catch {
      out[key] = part.slice(idx + 1).trim();
    }
  }
  return out;
}

async function isAuthed(request, env) {
  const cookies = parseCookies(request.headers.get('cookie') || '');
  return verifySessionToken(env, cookies[SESSION_COOKIE]);
}

function sessionCookieValue(token) {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=${SESSION_TTL_SEC}`;
}

function clearedCookieValue() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0`;
}

/* ── 레이트리밋 (인스턴스 메모리) ───────────────────────────────────────── */

const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 10;
const attempts = new Map();

function clientKey(request) {
  return request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown';
}

function rateLimited(key) {
  const now = Date.now();
  const e = attempts.get(key);
  if (!e || now - e.start > WINDOW_MS) return false;
  return e.count >= MAX_ATTEMPTS;
}

function recordFailure(key) {
  const now = Date.now();
  const e = attempts.get(key);
  if (!e || now - e.start > WINDOW_MS) attempts.set(key, { start: now, count: 1 });
  else e.count += 1;
  if (attempts.size > 500) {
    for (const [k, v] of attempts) if (now - v.start > WINDOW_MS) attempts.delete(k);
  }
}

/* ── 미디어 (R2) ────────────────────────────────────────────────────────── */

const MIME_EXT = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
};

const EXT_MIME = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  mp4: 'video/mp4',
  webm: 'video/webm',
};

const DATA_URL_RE = /^data:([\w.+-]+\/[\w.+-]+);base64,([A-Za-z0-9+/=\s]+)$/;
const MIN_OFFLOAD = 1024;

/** base64 → Uint8Array */
function b64ToBytes(b64) {
  const bin = atob(b64.replace(/\s/g, ''));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

/** data URL 을 R2 에 저장하고 공개 경로를 돌려줍니다. */
async function saveDataUrl(env, dataUrl) {
  const m = DATA_URL_RE.exec(dataUrl);
  if (!m) return dataUrl;
  const mime = m[1].toLowerCase();
  const ext = MIME_EXT[mime];
  if (!ext) return dataUrl;

  let bytes;
  try {
    bytes = b64ToBytes(m[2]);
  } catch {
    return dataUrl;
  }
  if (bytes.length === 0) return dataUrl;

  const digest = await crypto.subtle.digest('SHA-256', bytes);
  const key = `${toHex(digest).slice(0, 32)}.${ext}`;

  try {
    await env.MEDIA.put(key, bytes, { httpMetadata: { contentType: mime } });
  } catch {
    return dataUrl; // 저장 실패 시 데이터를 잃지 않도록 원본 유지
  }
  return `/api/media/${key}`;
}

/** 객체 전체를 순회하며 data: URL 을 R2 경로로 바꿉니다. */
async function offloadDataUrls(env, value) {
  const cache = new Map();

  const walk = async (node) => {
    if (typeof node === 'string') {
      if (node.length < MIN_OFFLOAD || !DATA_URL_RE.test(node)) return node;
      if (cache.has(node)) return cache.get(node);
      const saved = await saveDataUrl(env, node);
      cache.set(node, saved);
      return saved;
    }
    if (Array.isArray(node)) {
      const out = new Array(node.length);
      for (let i = 0; i < node.length; i += 1) out[i] = await walk(node[i]);
      return out;
    }
    if (node && typeof node === 'object') {
      const out = {};
      for (const k of Object.keys(node)) out[k] = await walk(node[k]);
      return out;
    }
    return node;
  };

  return walk(value);
}

/* ── 콘텐츠 (D1) ────────────────────────────────────────────────────────── */

async function readContent(env) {
  try {
    const row = await env.DB.prepare('SELECT payload FROM content WHERE id = ?1').bind(CONTENT_ID).first();
    if (!row || !row.payload) return null;
    return JSON.parse(row.payload);
  } catch {
    return null;
  }
}

async function writeContent(env, payload) {
  const updatedAt = new Date().toISOString();

  // 덮어쓰기 전 직전 값을 백업 (관리자 실수 대비, 최근 1개만 유지)
  try {
    await env.DB.prepare('INSERT OR REPLACE INTO content (id, payload, updated_at) VALUES (?1, ?2, ?3)')
      .bind(BACKUP_ID, JSON.stringify({ ...payload, updatedAt }), updatedAt)
      .run();
  } catch {
    /* 백업 실패는 저장을 막지 않습니다 */
  }

  await env.DB.prepare('INSERT OR REPLACE INTO content (id, payload, updated_at) VALUES (?1, ?2, ?3)')
    .bind(CONTENT_ID, JSON.stringify({ ...payload, updatedAt }), updatedAt)
    .run();

  return updatedAt;
}

/* ── API 라우터 ─────────────────────────────────────────────────────────── */

async function handleApi(request, env, url) {
  const path = url.pathname.replace(/\/+$/, '') || '/';
  const method = request.method.toUpperCase();

  /* 상태 확인 */
  if (path === '/api/health' && method === 'GET') {
    return json({ ok: true, backend: 'cf-d1-r2' });
  }

  /* ── 인증 ── */
  if (path === '/api/auth/session' && method === 'GET') {
    return json({ authenticated: await isAuthed(request, env) });
  }

  if (path === '/api/auth/login' && method === 'POST') {
    const key = clientKey(request);
    if (rateLimited(key)) {
      return json(
        { ok: false, error: 'too_many_attempts', message: '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.' },
        429,
        { 'Retry-After': '600' }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, error: 'invalid_request', message: '요청 형식이 올바르지 않습니다.' }, 400);
    }

    const password = typeof body?.password === 'string' ? body.password : '';
    if (!password) {
      return json({ ok: false, error: 'invalid_request', message: '비밀번호를 입력해 주세요.' }, 400);
    }

    if (!(await verifyPassword(password))) {
      recordFailure(key);
      return json({ ok: false, error: 'invalid_credentials', message: '비밀번호가 일치하지 않습니다.' }, 401);
    }

    attempts.delete(key);
    const res = json({ ok: true, authenticated: true });
    res.headers.append('Set-Cookie', sessionCookieValue(await createSessionToken(env)));
    return res;
  }

  if (path === '/api/auth/logout' && method === 'POST') {
    const res = json({ ok: true });
    res.headers.append('Set-Cookie', clearedCookieValue());
    return res;
  }

  /* ── 콘텐츠 ── */
  if (path === '/api/content' && method === 'GET') {
    const data = await readContent(env);
    if (!data) {
      return json({ ok: true, projects: null, menuContent: null, config: null, updatedAt: null });
    }
    return json({
      ok: true,
      projects: data.projects ?? null,
      menuContent: data.menuContent ?? null,
      config: data.config ?? null,
      updatedAt: data.updatedAt ?? null,
    });
  }

  if (path === '/api/content' && method === 'PUT') {
    if (!(await isAuthed(request, env))) {
      return json({ ok: false, error: 'unauthorized', message: '관리자 로그인이 필요합니다.' }, 401);
    }

    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) {
      return json({ ok: false, error: 'payload_too_large', message: '저장할 내용이 너무 큽니다.' }, 413);
    }
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      return json({ ok: false, error: 'invalid_json', message: '요청 형식이 올바르지 않습니다.' }, 400);
    }

    const { projects, menuContent, config } = body || {};
    if (!Array.isArray(projects) || !menuContent || typeof menuContent !== 'object' || !config || typeof config !== 'object') {
      return json({ ok: false, error: 'invalid_payload', message: '저장할 콘텐츠 형식이 올바르지 않습니다.' }, 400);
    }

    // 남아 있는 base64 를 R2 로 분리 (JSON 비대화 방지)
    const lightProjects = await offloadDataUrls(env, projects);
    const lightMenu = await offloadDataUrls(env, menuContent);

    const updatedAt = await writeContent(env, {
      projects: lightProjects,
      menuContent: lightMenu,
      config,
    });

    // 정리된 형태를 그대로 돌려줘 클라이언트가 상태를 맞출 수 있게 합니다
    return json({ ok: true, updatedAt, projects: lightProjects, menuContent: lightMenu, config });
  }

  /* ── 미디어 ── */
  if (path === '/api/media' && method === 'POST') {
    if (!(await isAuthed(request, env))) {
      return json({ ok: false, error: 'unauthorized', message: '관리자 로그인이 필요합니다.' }, 401);
    }

    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) {
      return json({ ok: false, error: 'payload_too_large', message: '이미지가 너무 큽니다.' }, 413);
    }
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      return json({ ok: false, error: 'invalid_json', message: '요청 형식이 올바르지 않습니다.' }, 400);
    }

    const dataUrl = typeof body?.dataUrl === 'string' ? body.dataUrl : '';
    if (!dataUrl.startsWith('data:')) {
      return json({ ok: false, error: 'invalid_request', message: '이미지 데이터가 없습니다.' }, 400);
    }

    const saved = await saveDataUrl(env, dataUrl);
    if (!saved.startsWith('/api/media/')) {
      return json({ ok: false, error: 'unsupported', message: '지원하지 않는 이미지 형식입니다.' }, 400);
    }
    return json({ ok: true, url: saved });
  }

  if (path.startsWith('/api/media/') && method === 'GET') {
    const key = path.slice('/api/media/'.length);
    // 경로 조작 방지
    if (!/^[A-Za-z0-9._-]+$/.test(key)) return json({ ok: false, error: 'not_found' }, 404);

    const object = await env.MEDIA.get(key);
    if (!object) return json({ ok: false, error: 'not_found' }, 404);

    const ext = key.split('.').pop()?.toLowerCase() || '';
    return new Response(object.body, {
      status: 200,
      headers: {
        'Content-Type': object.httpMetadata?.contentType || EXT_MIME[ext] || 'application/octet-stream',
        // 파일명이 내용 해시이므로 오래 캐시해도 안전합니다
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  }

  return json({ ok: false, error: 'not_found', message: '존재하지 않는 API 경로입니다.' }, 404);
}

/* ── 엔트리 ─────────────────────────────────────────────────────────────── */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
      try {
        return await handleApi(request, env, url);
      } catch (err) {
        console.error('[api] 처리되지 않은 오류:', err);
        return json({ ok: false, error: 'internal_error', message: '서버 오류가 발생했습니다.' }, 500);
      }
    }

    /*
     * 정적 파일 서빙 + SPA 폴백.
     *
     * [왜 Worker 에서 직접 폴백하는가]
     *  assets 설정의 `not_found_handling: single-page-application` 을 쓰면
     *  매칭되지 않는 모든 요청이 index.html 로 처리되어 /api 까지 삼켜질 수 있습니다.
     *  그래서 /api 는 위에서 먼저 처리하고, 여기서는
     *  "정적 파일 → 없으면 index.html" 순서로 직접 판단합니다.
     *  이렇게 하면 /#works 뿐 아니라 /works 같은 딥링크도 항상 열립니다.
     */
    const asset = await env.ASSETS.fetch(request);
    if (asset.status !== 404) return asset;

    // 없는 경로 → SPA 진입점
    try {
      const indexUrl = new URL('/index.html', url.origin);
      const fallback = await env.ASSETS.fetch(new Request(indexUrl.toString(), request));
      if (fallback.status === 200) {
        return new Response(fallback.body, {
          status: 200,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=0, must-revalidate',
          },
        });
      }
    } catch {
      /* 폴백 실패 시 원래 404 를 그대로 돌려줍니다 */
    }

    return asset;
  },
};
