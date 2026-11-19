/**
 * API 공통 유틸: 쿠키 파싱, 세션 발급/검증 미들웨어, 입력 검증, 에러 응답.
 */

import { createSessionToken, verifySessionToken, SESSION_TTL_MS } from './auth.js';

export const SESSION_COOKIE = 'soa_admin';

/**
 * Cookie 헤더를 파싱합니다. (cookie-parser 의존성을 늘리지 않기 위해 직접 구현)
 * @param {string | undefined} header
 * @returns {Record<string, string>}
 */
export function parseCookies(header) {
  /** @type {Record<string, string>} */
  const out = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx < 0) continue;
    const key = part.slice(0, idx).trim();
    if (!key) continue;
    const raw = part.slice(idx + 1).trim();
    try {
      out[key] = decodeURIComponent(raw);
    } catch {
      out[key] = raw;
    }
  }
  return out;
}

/** 세션 쿠키를 설정합니다. */
export function setSessionCookie(res, secret) {
  const token = createSessionToken(secret);
  const isProd = process.env.NODE_ENV === 'production';
  const attrs = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly', // JavaScript 로 읽을 수 없게 (XSS 로 토큰 탈취 방지)
    'SameSite=Strict', // CSRF 방어의 1차선: 다른 사이트에서 온 요청에는 쿠키가 붙지 않음
    `Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`,
  ];
  if (isProd) attrs.push('Secure');
  res.setHeader('Set-Cookie', attrs.join('; '));
}

/** 세션 쿠키를 만료시킵니다. */
export function clearSessionCookie(res) {
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`
  );
}

/**
 * 요청이 로그인 상태인지 확인합니다.
 * @param {import('express').Request} req
 * @param {Buffer} secret
 */
export function readSession(req, secret) {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[SESSION_COOKIE];
  if (!token) return null;
  return verifySessionToken(secret, token);
}

/**
 * 관리자 전용 라우트를 지키는 미들웨어를 만듭니다.
 * @param {Buffer} secret
 */
export function requireAdmin(secret) {
  return (req, res, next) => {
    const session = readSession(req, secret);
    if (!session) {
      res.status(401).json({ ok: false, error: 'unauthorized', message: '관리자 로그인이 필요합니다.' });
      return;
    }
    // 이후 핸들러에서 쓸 수 있게 남겨 둡니다.
    req.adminSession = session;
    next();
  };
}

/**
 * CSRF 방어: 쿠키를 쓰는 상태 변경 요청은 같은 출처에서만 허용합니다.
 *
 * [왜 프로토콜을 비교하지 않는가]
 *  Netlify/Vercel/Cloudflare/Nginx 같은 프록시 뒤에서는 TLS 가 앞단에서 종료되어
 *  서버가 보는 요청 URL 이 http 로 보일 수 있습니다. 이때 Origin(https)과
 *  프로토콜까지 비교하면 정상 요청이 403 이 되어 사이트가 망가집니다.
 *  출처를 결정하는 요소는 사실상 "호스트"이므로 host 기준으로 비교합니다.
 *
 * [Sec-Fetch-Site 를 먼저 보는 이유]
 *  최신 브라우저는 요청 출처를 브라우저가 직접 계산해 헤더로 알려줍니다.
 *  이 값은 페이지 스크립트가 임의로 바꿀 수 없어 Origin 보다 신뢰도가 높습니다.
 *  - same-origin : 우리 사이트 → 통과
 *  - cross-site / same-site : 다른 사이트(서브도메인 포함) → 거부
 *
 * SameSite=Strict 쿠키와 함께 2중 방어입니다.
 * @param {string[]} allowedOrigins 추가 허용 출처 (예: 별도 도메인의 관리자 콘솔)
 */
export function requireSameOrigin(allowedOrigins = []) {
  return (req, res, next) => {
    const method = req.method.toUpperCase();
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
      next();
      return;
    }

    const deny = () =>
      res.status(403).json({ ok: false, error: 'bad_origin', message: '허용되지 않은 출처의 요청입니다.' });

    const origin = req.headers.origin;
    const fetchSite = req.headers['sec-fetch-site'];

    // 1) 브라우저가 계산한 출처 정보를 우선 신뢰합니다.
    if (typeof fetchSite === 'string') {
      if (fetchSite === 'same-origin' || fetchSite === 'none') {
        next();
        return;
      }
      if (fetchSite === 'cross-site' || fetchSite === 'same-site') {
        // 허용 목록에 명시된 출처만 예외적으로 통과시킵니다.
        if (origin && matchesAllowed(origin, allowedOrigins)) {
          next();
          return;
        }
        deny();
        return;
      }
    }

    // 2) Origin 이 없는 요청 (브라우저 아닌 클라이언트: curl, 서버 간 호출).
    //    이들은 세션 쿠키를 갖고 있지 않으므로 requireAdmin 에서 막힙니다.
    if (!origin) {
      next();
      return;
    }

    // 3) Origin 헤더를 호스트 기준으로 비교합니다. (프로토콜 불일치는 무시)
    if (matchesAllowed(origin, allowedOrigins) || isSameHost(origin, req.headers['x-forwarded-host'] || req.headers.host)) {
      next();
      return;
    }

    deny();
  };
}

/** origin 문자열이 허용 목록에 있는지 (스킴/호스트 정규화 후 비교) */
function matchesAllowed(origin, allowedOrigins) {
  if (!Array.isArray(allowedOrigins) || allowedOrigins.length === 0) return false;
  const normalize = (value) => {
    try {
      const url = new URL(value);
      return `${url.protocol}//${url.host}`.toLowerCase();
    } catch {
      return null;
    }
  };
  const target = normalize(origin);
  if (!target) return false;
  return allowedOrigins.some((allowed) => normalize(allowed) === target);
}

/** Origin 의 호스트가 요청 호스트와 같은지 (포트/프로토콜 차이는 허용) */
function isSameHost(origin, hostHeader) {
  if (!hostHeader) return false;
  try {
    const url = new URL(origin);
    const originHost = url.host.toLowerCase();
    const requestHost = String(hostHeader).toLowerCase();

    if (originHost === requestHost) return true;

    // 프록시가 포트를 다르게 보는 경우(예: 앞단 443 → 뒤 3000)를 위해 호스트명만 비교합니다.
    const stripPort = (h) => h.replace(/:\d+$/, '');
    return stripPort(originHost) === stripPort(requestHost);
  } catch {
    return false;
  }
}

/** 문자열 정리: 앞뒤 공백 제거 + 길이 제한 */
export function cleanString(value, maxLength = 2000) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

/** 문자열 배열 정리 */
export function cleanStringArray(value, maxItems = 20, maxLength = 80) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v) => typeof v === 'string')
    .map((v) => v.trim().slice(0, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

const INQUIRY_STATUSES = ['신규', '검토중', '상담완료', '계약체결'];

/** 문의 상태 값이 허용된 것인지 확인합니다. */
export function isValidStatus(value) {
  return typeof value === 'string' && INQUIRY_STATUSES.includes(value);
}

export { INQUIRY_STATUSES };
