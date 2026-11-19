/**
 * 관리자 인증 — 비밀번호 검증 + 서명된 세션 쿠키.
 *
 * [기존 방식의 문제]
 *  - 예전에는 비밀번호('1012')가 프론트엔드 번들에 그대로 들어 있었습니다.
 *    번들은 누구나 내려받을 수 있으므로, 사실상 "공개된 비밀번호"였습니다.
 *  - 지금은 비밀번호가 서버에만 있고, 브라우저에는 "서명된 세션 쿠키"만 내려갑니다.
 *    쿠키는 위조할 수 없고(서명 검증), JavaScript 로 읽을 수도 없습니다(httpOnly).
 *
 * [사용하는 알고리즘]
 *  - 비밀번호: scrypt (메모리-하드 KDF) + 사용자별 salt, 비교는 timingSafeEqual
 *  - 세션 토큰: HMAC-SHA256(payload) — 서버 비밀키 없이는 만들 수 없음
 */

import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

/** scrypt 파라미터 — Node 기본값(N=16384, r=8, p=1)을 명시적으로 고정합니다. */
const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };

/** 세션 유효 기간 (12시간) */
export const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

const scryptAsync = (password, salt) =>
  new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p }, (err, key) => {
      if (err) reject(err);
      else resolve(key);
    });
  });

/** "scrypt$N$r$p$salt$hash" 형태의 문자열을 만듭니다. (비밀번호 재설정 스크립트에서 사용) */
export async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const key = await scryptAsync(password, salt);
  return ['scrypt', SCRYPT.N, SCRYPT.r, SCRYPT.p, salt.toString('base64'), key.toString('base64')].join('$');
}

/** 저장된 해시 형식인지 확인합니다. */
export function isPasswordHash(value) {
  return typeof value === 'string' && value.startsWith('scrypt$');
}

/**
 * 비밀번호를 검증합니다.
 * 어떤 경우에도 "일정한 시간"이 걸리도록, 저장된 해시가 없어도 더미 비교를 수행합니다.
 * (응답 시간 차이로 비밀번호 존재 여부를 알아내는 것을 막습니다)
 */
export async function verifyPassword(password, stored) {
  const candidate = typeof password === 'string' ? password : '';

  if (!isPasswordHash(stored)) {
    // 비교할 해시가 없더라도 동일한 비용의 연산을 수행합니다.
    await scryptAsync(candidate || 'x', crypto.randomBytes(16));
    return false;
  }

  const [, nRaw, rRaw, pRaw, saltB64, hashB64] = stored.split('$');
  const salt = Buffer.from(saltB64, 'base64');
  const expected = Buffer.from(hashB64, 'base64');

  const actual = await new Promise((resolve, reject) => {
    crypto.scrypt(
      candidate,
      salt,
      expected.length,
      { N: Number(nRaw), r: Number(rRaw), p: Number(pRaw) },
      (err, key) => (err ? reject(err) : resolve(key))
    );
  });

  if (actual.length !== expected.length) return false;
  return crypto.timingSafeEqual(actual, expected);
}

/** 서버 비밀키를 읽거나, 없으면 새로 만들어 파일에 보관합니다. */
export async function loadSessionSecret(dataDir) {
  const fromEnv = (process.env.SESSION_SECRET || '').trim();
  if (fromEnv.length >= 32) return Buffer.from(fromEnv, 'utf8');

  const secretPath = path.join(dataDir, 'session.key');
  try {
    const existing = (await fs.readFile(secretPath, 'utf8')).trim();
    if (existing.length >= 32) return Buffer.from(existing, 'utf8');
  } catch {
    /* 파일이 없으면 아래에서 새로 만듭니다 */
  }

  const generated = crypto.randomBytes(48).toString('base64url');
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(secretPath, generated, { mode: 0o600 });
  console.warn(
    '[auth] SESSION_SECRET 이 설정되지 않아 data/session.key 에 새 비밀키를 생성했습니다. ' +
      '여러 인스턴스로 운영한다면 반드시 SESSION_SECRET 환경변수를 공통으로 설정하세요.'
  );
  return Buffer.from(generated, 'utf8');
}

const b64url = (buf) => Buffer.from(buf).toString('base64url');

/** 세션 토큰 생성: base64url(payload).base64url(HMAC) */
export function createSessionToken(secret, subject = 'admin') {
  const payload = JSON.stringify({ sub: subject, iat: Date.now(), exp: Date.now() + SESSION_TTL_MS });
  const body = b64url(payload);
  const sig = b64url(crypto.createHmac('sha256', secret).update(body).digest());
  return `${body}.${sig}`;
}

/** 세션 토큰 검증. 유효하면 payload, 아니면 null. */
export function verifySessionToken(secret, token) {
  if (typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [body, sig] = parts;
  const expected = b64url(crypto.createHmac('sha256', secret).update(body).digest());

  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  // 길이가 다르면 timingSafeEqual 이 예외를 던지므로 먼저 확인합니다.
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  let payload;
  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  if (!payload || typeof payload.exp !== 'number' || payload.exp < Date.now()) return null;
  return payload;
}

/**
 * 고정 창(sliding window) 방식의 간단한 요청 제한기.
 * 메모리에만 두므로 인스턴스를 여러 개 띄우면 인스턴스별로 동작합니다.
 * (무차별 대입을 "불가능"하게 만드는 목적이 아니라 "충분히 비싸게" 만드는 목적)
 */
export class RateLimiter {
  constructor({ windowMs, max }) {
    this.windowMs = windowMs;
    this.max = max;
    /** @type {Map<string, number[]>} */
    this.hits = new Map();
    this.timer = setInterval(() => this.sweep(), Math.max(windowMs, 60_000));
    // 이 타이머가 프로세스를 붙잡지 않도록 합니다.
    if (typeof this.timer.unref === 'function') this.timer.unref();
  }

  sweep() {
    const now = Date.now();
    for (const [key, times] of this.hits) {
      const fresh = times.filter((t) => now - t < this.windowMs);
      if (fresh.length === 0) this.hits.delete(key);
      else this.hits.set(key, fresh);
    }
  }

  /** 소비를 시도합니다. 남은 횟수와 대기 시간을 돌려줍니다. */
  consume(key) {
    const now = Date.now();
    const times = (this.hits.get(key) || []).filter((t) => now - t < this.windowMs);
    if (times.length >= this.max) {
      const oldest = times[0];
      this.hits.set(key, times);
      return { allowed: false, retryAfterMs: Math.max(0, this.windowMs - (now - oldest)) };
    }
    times.push(now);
    this.hits.set(key, times);
    return { allowed: true, remaining: this.max - times.length };
  }

  /** 성공한 로그인은 실패 카운트를 초기화합니다. */
  reset(key) {
    this.hits.delete(key);
  }
}
