/**
 * 정적 호스팅용 관리자 인증 (서버가 없을 때의 폴백).
 *
 * ── 왜 필요한가 ──────────────────────────────────────────────────────────
 *  Netlify / Vercel / Cloudflare Pages 는 정적 호스팅이라 Express 서버가 돌지 않습니다.
 *  그래서 서버 세션(/api/auth/login)을 쓸 수 없고, 관리자 로그인이 아예 불가능했습니다.
 *  이 모듈은 그 경우에만 쓰이는 브라우저 측 검증입니다.
 *
 * ── 보안상 정확한 이해 ───────────────────────────────────────────────────
 *  · 번들에는 비밀번호 평문이 들어가지 않습니다. PBKDF2-SHA256 해시만 들어갑니다.
 *  · 그러나 브라우저에서 검증한다는 사실 자체는 바꿀 수 없습니다.
 *    즉, 개발자 도구로 이 검증을 우회하면 편집 화면을 열 수 있습니다.
 *  · 따라서 이 폴백은 "실수 방지용 잠금" 이지 "보안 경계" 가 아닙니다.
 *  · 실제 보안이 필요하면 Node 서버로 배포하세요. 서버가 응답하면 이 모듈은 쓰이지 않습니다.
 */

/** PBKDF2 파라미터 — 해시를 만들 때와 검증할 때 반드시 같아야 합니다. */
const PBKDF2_ITERATIONS = 310_000;
const PBKDF2_SALT = 'soa-portfolio-local-admin-v1';
/** 비밀번호 '9392' 의 PBKDF2-SHA256 해시 (평문은 저장하지 않습니다) */
const PASSWORD_HASH = '20e6d50545c89dbd8cf2451931535f82865fdd34dd28e6f6685ce5ba648db337';

const SESSION_KEY = 'soa_admin_local_session';
/** 로컬 세션 유효 시간: 12시간 (서버 세션과 동일) */
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

const toHex = (buf: ArrayBuffer) =>
  Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

/** 길이 차이로 정보가 새지 않도록 항상 같은 시간을 쓰는 비교 */
const safeEqual = (a: string, b: string) => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};

/**
 * 입력한 비밀번호가 맞는지 확인합니다.
 * Web Crypto(crypto.subtle)를 쓰므로 HTTPS 또는 localhost 에서만 동작합니다.
 */
export async function verifyLocalPassword(password: string): Promise<boolean> {
  if (!password) return false;
  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt: enc.encode(PBKDF2_SALT), iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
      key,
      256
    );
    return safeEqual(toHex(bits), PASSWORD_HASH);
  } catch {
    // crypto.subtle 이 없는 환경(비 HTTPS)에서는 로그인을 허용하지 않습니다.
    return false;
  }
}

/** 로컬 관리자 세션이 아직 유효한지 확인합니다. */
export function hasLocalAdminSession(): boolean {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    const { exp } = JSON.parse(raw);
    if (typeof exp !== 'number' || Date.now() > exp) {
      sessionStorage.removeItem(SESSION_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/** 로컬 관리자 세션을 시작합니다. (탭을 닫으면 사라지도록 sessionStorage 사용) */
export function startLocalAdminSession(): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ exp: Date.now() + SESSION_TTL_MS }));
  } catch {
    /* 저장 실패는 무시 — 이번 화면에서는 로그인 상태가 유지됩니다 */
  }
}

/** 로컬 관리자 세션을 종료합니다. */
export function clearLocalAdminSession(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* 무시 */
  }
}
