/**
 * 관리자 인증 — PBKDF2 비밀번호 검증 + HMAC 서명 세션 쿠키.
 *
 * [설계 원칙]
 *  · 비밀번호 평문은 어디에도 저장하지 않습니다. PBKDF2-SHA256 해시만 비교합니다.
 *  · 세션은 서버가 HMAC 으로 서명한 쿠키(HttpOnly)입니다. 브라우저가 위조할 수 없습니다.
 *    (이전 정적 모드의 sessionStorage 플래그는 개발자 도구로 누구나 켤 수 있었습니다)
 *  · 서명 키는 SOA_SESSION_SECRET 환경변수를 우선 사용하고, 없으면 비밀번호 해시에서
 *    유도합니다. 따라서 별도 설정 없이도 바로 동작하며, 비밀번호를 바꾸면 기존
 *    세션이 자동으로 무효화됩니다.
 */

import { createHmac, pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto';

/* ── 비밀번호 ───────────────────────────────────────────────────────── */

/** 클라이언트(localAdmin.ts)와 반드시 동일해야 하는 파라미터 */
const PBKDF2_ITERATIONS = 310_000;
const PBKDF2_SALT = 'soa-portfolio-local-admin-v1';

/** 관리자 비밀번호 '9392' 의 PBKDF2-SHA256 해시 (기본값) */
const DEFAULT_PASSWORD_HASH = '20e6d50545c89dbd8cf2451931535f82865fdd34dd28e6f6685ce5ba648db337';

/**
 * 현재 유효한 비밀번호 해시.
 * ADMIN_PASSWORD 환경변수가 있으면 그것을 해시해서 씁니다(권장).
 * 없으면 위 기본값(9392)을 씁니다.
 */
function currentPasswordHash() {
  const envPassword = process.env.ADMIN_PASSWORD;
  if (envPassword && envPassword.length > 0) {
    return pbkdf2Sync(envPassword, PBKDF2_SALT, PBKDF2_ITERATIONS, 32, 'sha256').toString('hex');
  }
  return DEFAULT_PASSWORD_HASH;
}

/** 길이 차이로 정보가 새지 않는 비교 */
function safeEqualHex(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
  } catch {
    return false;
  }
}

/**
 * 입력한 비밀번호가 맞는지 확인합니다.
 * PBKDF2 파생에는 수십 ms 가 걸리므로, 호출 전에 반드시 레이트리밋을 적용하세요.
 */
export function verifyPassword(password) {
  if (typeof password !== 'string' || password.length === 0) return false;
  if (password.length > 200) return false;
  const derived = pbkdf2Sync(password, PBKDF2_SALT, PBKDF2_ITERATIONS, 32, 'sha256').toString('hex');
  return safeEqualHex(derived, currentPasswordHash());
}

/* ── 세션 토큰 ──────────────────────────────────────────────────────── */

export const SESSION_COOKIE = 'soa_admin';
/** 세션 유효 시간: 12시간 */
export const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

/** 서명 키 — 환경변수가 없으면 비밀번호 해시에서 유도합니다. */
function signingKey() {
  const explicit = process.env.SOA_SESSION_SECRET;
  if (explicit && explicit.length >= 16) return explicit;
  return `soa-session-v1:${currentPasswordHash()}`;
}

const b64url = (buf) => Buffer.from(buf).toString('base64url');

function sign(payloadB64) {
  return createHmac('sha256', signingKey()).update(payloadB64).digest('base64url');
}

/** 새 세션 토큰을 만듭니다. */
export function createSessionToken() {
  const payload = b64url(
    JSON.stringify({
      iat: Date.now(),
      exp: Date.now() + SESSION_TTL_MS,
      // 같은 초에 발급되어도 토큰이 겹치지 않도록 무작위 값을 섞습니다.
      jti: randomBytes(8).toString('hex'),
    })
  );
  return `${payload}.${sign(payload)}`;
}

/** 토큰이 위조되지 않았고 만료되지 않았는지 확인합니다. */
export function verifySessionToken(token) {
  if (typeof token !== 'string' || !token.includes('.')) return false;
  const [payloadB64, signature] = token.split('.');
  if (!payloadB64 || !signature) return false;

  const expected = sign(payloadB64);
  // 서명 비교도 타이밍 안전하게
  if (expected.length !== signature.length) return false;
  try {
    if (!timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) return false;
  } catch {
    return false;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    return typeof payload.exp === 'number' && Date.now() < payload.exp;
  } catch {
    return false;
  }
}

/* ── 쿠키 유틸 ──────────────────────────────────────────────────────── */

/** Cookie 헤더를 객체로 파싱합니다. */
export function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    if (!key) continue;
    out[key] = decodeURIComponent(part.slice(idx + 1).trim());
  }
  return out;
}

/** 요청에 유효한 관리자 세션이 있는지 확인합니다. */
export function isAuthenticated(request) {
  const cookies = parseCookies(request.headers.get('cookie') || '');
  return verifySessionToken(cookies[SESSION_COOKIE]);
}

/**
 * Set-Cookie 헤더 값 (로그인)
 *
 * @param {boolean} secure https 요청일 때만 Secure 를 붙입니다.
 *   운영(Netlify)은 항상 https 이므로 항상 붙습니다.
 *   로컬 http 테스트에서는 붙이면 브라우저가 쿠키를 저장하지 않아 로그인 검증이 불가능합니다.
 */
export function sessionCookie(secure = true) {
  return [
    `${SESSION_COOKIE}=${createSessionToken()}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    ...(secure ? ['Secure'] : []),
    `Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`,
  ].join('; ');
}

/** Set-Cookie 헤더 값 (로그아웃) */
export function clearedCookie(secure = true) {
  return [
    `${SESSION_COOKIE}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    ...(secure ? ['Secure'] : []),
    'Max-Age=0',
  ].join('; ');
}

/* ── 로그인 시도 제한 ───────────────────────────────────────────────── */

/**
 * 인스턴스 메모리 기반 레이트리밋.
 * 서버리스라 인스턴스마다 카운터가 따로지만, 무차별 대입 속도를 크게 떨어뜨리는
 * 목적에는 충분합니다. (PBKDF2 31만 회 + 시도 제한 조합)
 */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 10;
const attempts = new Map();

export function rateLimitState(key) {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now - entry.start > WINDOW_MS) {
    return { blocked: false, remaining: MAX_ATTEMPTS };
  }
  return {
    blocked: entry.count >= MAX_ATTEMPTS,
    remaining: Math.max(0, MAX_ATTEMPTS - entry.count),
    retryAfter: Math.ceil((entry.start + WINDOW_MS - now) / 1000),
  };
}

export function recordFailure(key) {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now - entry.start > WINDOW_MS) {
    attempts.set(key, { start: now, count: 1 });
  } else {
    entry.count += 1;
  }
  // 메모리 누수 방지: 10분 지난 항목은 정리
  if (attempts.size > 500) {
    for (const [k, v] of attempts) {
      if (now - v.start > WINDOW_MS) attempts.delete(k);
    }
  }
}

export function recordSuccess(key) {
  attempts.delete(key);
}
