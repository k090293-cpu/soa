/**
 * SOA 포트폴리오 API — Netlify Functions (v2, Request/Response).
 *
 * ── 역할 ─────────────────────────────────────────────────────────────────
 *  이 사이트는 Netlify 정적 배포를 유지합니다. 다만 아래 두 가지만 서버가 필요했습니다.
 *    1) 관리자가 고친 내용을 "모든 방문자"가 볼 수 있게 저장
 *    2) 관리자 비밀번호 검증을 브라우저 밖에서 수행
 *  그래서 정적 배포는 그대로 두고, /api/* 경로만 이 함수로 연결합니다.
 *  저장소는 Netlify Blobs(별도 DB 불필요)를 씁니다.
 *
 * ── 라우팅 ───────────────────────────────────────────────────────────────
 *   GET  /api/health          상태 확인
 *   GET  /api/content         콘텐츠 읽기 (공개)
 *   PUT  /api/content         콘텐츠 저장 (관리자)
 *   GET  /api/auth/session    로그인 상태
 *   POST /api/auth/login      로그인
 *   POST /api/auth/logout     로그아웃
 *   POST /api/media           이미지 업로드 (관리자) → { url }
 *   GET  /api/media/:file     이미지 서빙 (공개)
 *
 * ── 보안 ─────────────────────────────────────────────────────────────────
 *  · 쓰기(PUT/POST)는 모두 서명 쿠키 세션을 요구합니다.
 *  · 비밀번호는 PBKDF2-SHA256(310,000회)로 비교하며 평문을 저장하지 않습니다.
 *  · 로그인은 IP 기준으로 시도 횟수를 제한합니다.
 */

import { openStore, storeBackend } from './lib/store.mjs';
import { offloadDataUrls, saveDataUrl, mimeForFile } from './lib/media.mjs';
import {
  isAuthenticated,
  verifyPassword,
  sessionCookie,
  clearedCookie,
  rateLimitState,
  recordFailure,
  recordSuccess,
} from './lib/auth.mjs';

const CONTENT_STORE = 'soa-content';
const MEDIA_STORE = 'soa-media';
const CONTENT_KEY = 'main';
const CONTENT_BACKUP_KEY = 'main-backup';

/** Netlify Functions 요청 본문 한도(약 6MB)보다 여유 있게 잡습니다. */
const MAX_BODY_BYTES = 5.5 * 1024 * 1024;

const jsonHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
};

const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...jsonHeaders, ...headers },
  });

/**
 * 요청 URL 에서 API 하위 경로를 뽑아냅니다.
 *
 * Netlify 는 리다이렉트 설정에 따라 request.url 을
 *   (a) 브라우저가 요청한 원래 경로 (/api/content) 로 주기도 하고
 *   (b) 함수 경로 (/.netlify/functions/api/content) 로 주기도 합니다.
 * 어느 쪽이어도 동작하도록 두 형태를 모두 정규화합니다.
 */
function apiPath(request) {
  const url = new URL(request.url);
  let p = url.pathname;

  const marker = '/.netlify/functions/api';
  const idx = p.indexOf(marker);
  if (idx !== -1) {
    p = p.slice(idx + marker.length);
    // 함수 경로 뒤에 다시 /api 가 붙는 경우까지 제거
    if (p.startsWith('/api')) p = p.slice(4);
  } else if (p.startsWith('/api')) {
    p = p.slice(4);
  }

  if (!p || p === '') p = '/';
  if (!p.startsWith('/')) p = `/${p}`;
  return { path: p.replace(/\/+$/, '') || '/', url };
}

/** 클라이언트 식별자 (레이트리밋용) */
function clientKey(request) {
  return (
    request.headers.get('x-nf-client-connection-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

/** 요청 본문을 안전하게 읽습니다. (크기 초과는 null) */
async function readJsonBody(request) {
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return { tooLarge: true };
  if (!text) return { data: null };
  try {
    return { data: JSON.parse(text) };
  } catch {
    return { invalid: true };
  }
}

/** 저장된 콘텐츠를 읽습니다. 없거나 깨졌으면 null. */
async function readContent() {
  const store = await openStore(CONTENT_STORE);
  const raw = await store.getText(CONTENT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/* ── 라우터 ─────────────────────────────────────────────────────────────── */

export default async (request) => {
  const { path, url } = apiPath(request);
  const method = request.method.toUpperCase();
  /*
   * 쿠키 Secure 플래그.
   * 운영(Netlify)은 항상 https 이므로 true 입니다.
   * 로컬 http 테스트에서는 Secure 가 붙으면 브라우저가 쿠키를 버려서 로그인이 안 되므로
   * 요청 스킴을 보고 결정합니다.
   */
  const secureCookie = url.protocol === 'https:';

  try {
    /* 상태 확인 */
    if (path === '/health' && method === 'GET') {
      return json({ ok: true, backend: storeBackend() });
    }

    /* ── 인증 ── */
    if (path === '/auth/session' && method === 'GET') {
      return json({ authenticated: isAuthenticated(request) });
    }

    if (path === '/auth/login' && method === 'POST') {
      const key = clientKey(request);
      const limit = rateLimitState(key);
      if (limit.blocked) {
        return json(
          { ok: false, error: 'too_many_attempts', message: '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.' },
          429,
          { 'Retry-After': String(limit.retryAfter || 600) }
        );
      }

      const { data, tooLarge, invalid } = await readJsonBody(request);
      if (tooLarge || invalid) {
        return json({ ok: false, error: 'invalid_request', message: '요청 형식이 올바르지 않습니다.' }, 400);
      }

      const password = typeof data?.password === 'string' ? data.password : '';
      if (!password) {
        return json({ ok: false, error: 'invalid_request', message: '비밀번호를 입력해 주세요.' }, 400);
      }

      if (!verifyPassword(password)) {
        recordFailure(key);
        // 남은 시도 횟수는 알려주지 않습니다. (공격자에게 힌트를 주지 않기 위해)
        return json({ ok: false, error: 'invalid_credentials', message: '비밀번호가 일치하지 않습니다.' }, 401);
      }

      recordSuccess(key);
      return json({ ok: true, authenticated: true }, 200, { 'Set-Cookie': sessionCookie(secureCookie) });
    }

    if (path === '/auth/logout' && method === 'POST') {
      return json({ ok: true }, 200, { 'Set-Cookie': clearedCookie(secureCookie) });
    }

    /* ── 콘텐츠 ── */
    if (path === '/content' && method === 'GET') {
      const data = await readContent();
      if (!data) {
        // 서버에 저장본이 없으면 프론트엔드 번들 기본값을 그대로 쓰게 합니다.
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

    if (path === '/content' && method === 'PUT') {
      if (!isAuthenticated(request)) {
        return json({ ok: false, error: 'unauthorized', message: '관리자 로그인이 필요합니다.' }, 401);
      }

      const { data, tooLarge, invalid } = await readJsonBody(request);
      if (tooLarge) {
        return json({ ok: false, error: 'payload_too_large', message: '저장할 내용이 너무 큽니다.' }, 413);
      }
      if (invalid) {
        return json({ ok: false, error: 'invalid_json', message: '요청 형식이 올바르지 않습니다.' }, 400);
      }

      const projects = data?.projects;
      const menuContent = data?.menuContent;
      const config = data?.config;
      if (!Array.isArray(projects) || !menuContent || typeof menuContent !== 'object' || !config || typeof config !== 'object') {
        return json({ ok: false, error: 'invalid_payload', message: '저장할 콘텐츠 형식이 올바르지 않습니다.' }, 400);
      }

      // 혹시 남아 있는 base64 를 미디어 저장소로 분리합니다. (JSON 비대화 방지)
      const media = await openStore(MEDIA_STORE);
      const lightProjects = await offloadDataUrls(media, projects);
      const lightMenu = await offloadDataUrls(media, menuContent);

      const store = await openStore(CONTENT_STORE);

      // 덮어쓰기 전에 직전 내용을 백업합니다. (관리자 실수 대비, 최근 1개만 유지)
      const previous = await store.getText(CONTENT_KEY);
      if (previous) {
        try {
          JSON.parse(previous);
          await store.setText(CONTENT_BACKUP_KEY, previous);
        } catch {
          /* 이전 값이 깨졌으면 백업하지 않습니다 */
        }
      }

      const updatedAt = new Date().toISOString();
      await store.setText(
        CONTENT_KEY,
        JSON.stringify({ projects: lightProjects, menuContent: lightMenu, config, updatedAt })
      );

      /*
       * 저장된(정리된) 형태를 그대로 돌려줍니다.
       * 클라이언트는 이 값으로 자기 상태를 갱신해, 다음 저장 때 같은 이미지를
       * 다시 base64 로 올리는 일이 없게 합니다.
       */
      return json({
        ok: true,
        updatedAt,
        projects: lightProjects,
        menuContent: lightMenu,
        config,
      });
    }

    /* ── 미디어 ── */
    if (path === '/media' && method === 'POST') {
      if (!isAuthenticated(request)) {
        return json({ ok: false, error: 'unauthorized', message: '관리자 로그인이 필요합니다.' }, 401);
      }

      const { data, tooLarge, invalid } = await readJsonBody(request);
      if (tooLarge) {
        return json({ ok: false, error: 'payload_too_large', message: '이미지가 너무 큽니다. 더 작은 파일을 사용해 주세요.' }, 413);
      }
      if (invalid) {
        return json({ ok: false, error: 'invalid_json', message: '요청 형식이 올바르지 않습니다.' }, 400);
      }

      const dataUrl = typeof data?.dataUrl === 'string' ? data.dataUrl : '';
      if (!dataUrl.startsWith('data:')) {
        return json({ ok: false, error: 'invalid_request', message: '이미지 데이터가 없습니다.' }, 400);
      }

      const media = await openStore(MEDIA_STORE);
      const saved = await saveDataUrl(media, dataUrl);
      if (!saved.startsWith('/api/media/')) {
        return json({ ok: false, error: 'unsupported', message: '지원하지 않는 이미지 형식입니다.' }, 400);
      }
      return json({ ok: true, url: saved });
    }

    if (path.startsWith('/media/') && method === 'GET') {
      const fileName = path.slice('/media/'.length);
      // 경로 조작 방지: 파일명에는 영숫자·점·하이픈만 허용
      if (!/^[A-Za-z0-9._-]+$/.test(fileName)) {
        return json({ ok: false, error: 'not_found' }, 404);
      }

      const media = await openStore(MEDIA_STORE);
      const bytes = await media.getBytes(fileName);
      if (!bytes) return json({ ok: false, error: 'not_found' }, 404);

      return new Response(bytes, {
        status: 200,
        headers: {
          'Content-Type': mimeForFile(fileName),
          // 파일명이 내용 해시이므로 내용이 바뀌지 않습니다 → 오래 캐시해도 안전
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Content-Length': String(bytes.byteLength),
        },
      });
    }

    return json({ ok: false, error: 'not_found', message: '존재하지 않는 API 경로입니다.' }, 404);
  } catch (err) {
    console.error('[api] 처리되지 않은 오류:', err);
    return json({ ok: false, error: 'internal_error', message: '서버 오류가 발생했습니다.' }, 500);
  }
};

/*
 * 경로 연결은 netlify.toml 의 리다이렉트가 담당합니다.
 *   [[redirects]] from = "/api/*" to = "/.netlify/functions/api/:splat"
 *
 * 함수 안에서 `export const config = { path: '/api/*' }` 로도 등록할 수 있지만,
 * 리다이렉트와 동시에 쓰면 같은 요청이 두 번 매칭되어 루프가 생길 수 있습니다.
 * 그래서 한 가지 방식(리다이렉트)만 사용합니다.
 */
