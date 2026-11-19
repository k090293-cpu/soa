/**
 * SO.A 포트폴리오 API 서버.
 *
 * [이 서버가 생긴 이유]
 *  기존에는 모든 데이터가 "방문자 브라우저의 localStorage" 에만 있었습니다.
 *  그래서 (1) 관리자가 고친 내용이 다른 사람에게 보이지 않고,
 *         (2) 문의 폼이 제출돼도 관리자 브라우저에만 남아 사실상 유실되며,
 *         (3) 관리자 비밀번호가 JS 번들에 평문으로 들어 있었습니다.
 *  이 서버는 위 세 가지를 해결합니다.
 *
 * [보안 원칙]
 *  - 콘텐츠 읽기(GET)만 공개하고, 모든 쓰기(PUT/PATCH/DELETE)는 서명 세션 쿠키로 보호합니다.
 *  - 비밀번호는 서버에만 존재하며 scrypt 해시로 비교합니다.
 *  - 문의 작성(POST)은 공개지만 요청 제한(rate limit)과 입력 길이 제한을 겁니다.
 */

import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs/promises';

import express from 'express';
import dotenv from 'dotenv';

import { JsonStore } from './lib/store.js';
import { hashPassword, isPasswordHash, loadSessionSecret, verifyPassword, RateLimiter } from './lib/auth.js';
import { MediaStore } from './lib/media.js';
import {
  clearSessionCookie,
  cleanString,
  cleanStringArray,
  isValidStatus,
  readSession,
  requireAdmin,
  requireSameOrigin,
  setSessionCookie,
} from './lib/http.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(ROOT, 'data');
const MEDIA_DIR = path.join(DATA_DIR, 'media');
const PORT = Number(process.env.PORT || 3000);

/* ── 저장소 준비 ─────────────────────────────────────────────────────────── */

const contentStore = new JsonStore(path.join(DATA_DIR, 'content.json'), () => ({
  // null 은 "아직 서버에 저장된 값이 없음" 을 뜻합니다.
  // 이때 프론트엔드는 번들에 들어 있는 기본 콘텐츠를 그대로 사용합니다.
  projects: null,
  menuContent: null,
  config: null,
  updatedAt: null,
}));

const inquiryStore = new JsonStore(path.join(DATA_DIR, 'inquiries.json'), () => []);
const credentialsStore = new JsonStore(path.join(DATA_DIR, 'admin.json'), () => ({
  passwordHash: null,
  updatedAt: null,
}));

const mediaStore = new MediaStore(MEDIA_DIR);

/* ── 시크릿 / 비밀번호 초기화 ────────────────────────────────────────────── */

const sessionSecret = await loadSessionSecret(DATA_DIR);

/** 환경변수 비밀번호가 있으면 해시로 만들어 저장합니다. (최초 1회 부트스트랩) */
async function ensureAdminPassword() {
  const envPassword = (process.env.ADMIN_PASSWORD || '').trim();
  const creds = await credentialsStore.read();

  if (isPasswordHash(creds.passwordHash)) return;

  // 해시가 아직 없을 때만 부트스트랩합니다.
  const initial = envPassword || '1012';
  await credentialsStore.write({
    passwordHash: await hashPassword(initial),
    updatedAt: new Date().toISOString(),
  });

  if (!envPassword) {
    console.warn(
      '\n' +
        '⚠️  관리자 비밀번호가 기본값(1012)으로 설정되었습니다.\n' +
        '    실제 운영 전에 반드시 다음 중 하나를 수행하세요:\n' +
        '      1) .env 에 ADMIN_PASSWORD=새비밀번호 를 설정\n' +
        '      2) npm run set-password -- 새비밀번호\n' +
        '    (설정 후 data/admin.json 의 해시가 갱신됩니다)\n'
    );
  }
}

await ensureAdminPassword();

/* ── 앱 구성 ─────────────────────────────────────────────────────────────── */

const app = express();
app.disable('x-powered-by');

// Netlify/Vercel 같은 프록시 뒤에서도 실제 프로토콜/호스트를 알 수 있게 합니다.
app.set('trust proxy', 1);

// 이미지 base64 가 본문에 실리므로 넉넉히 잡습니다. (초과 시 413)
app.use(express.json({ limit: process.env.JSON_LIMIT || '25mb' }));

// 공통 보안 헤더
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  next();
});

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// 로그인 무차별 대입 방지: IP 당 15분에 10회
const loginLimiter = new RateLimiter({ windowMs: 15 * 60 * 1000, max: 10 });
// 문의 스팸 방지: IP 당 10분에 5건
const inquiryLimiter = new RateLimiter({ windowMs: 10 * 60 * 1000, max: 5 });

const clientKey = (req) => (req.ip || req.socket?.remoteAddress || 'unknown').toString();

/* ── 헬스체크 ───────────────────────────────────────────────────────────── */

app.get('/api/health', (req, res) => {
  res.json({ ok: true, uptime: Math.round(process.uptime()) });
});

/* ── 인증 ───────────────────────────────────────────────────────────────── */

app.get('/api/auth/session', (req, res) => {
  const session = readSession(req, sessionSecret);
  res.json({ authenticated: Boolean(session) });
});

app.post('/api/auth/login', requireSameOrigin(allowedOrigins), async (req, res) => {
  const key = clientKey(req);
  const limit = loginLimiter.consume(key);
  if (!limit.allowed) {
    res.setHeader('Retry-After', Math.ceil(limit.retryAfterMs / 1000));
    res.status(429).json({
      ok: false,
      error: 'too_many_attempts',
      message: '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.',
    });
    return;
  }

  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!password || password.length > 200) {
    res.status(400).json({ ok: false, error: 'invalid_request', message: '비밀번호를 입력해 주세요.' });
    return;
  }

  const creds = await credentialsStore.read();
  const valid = await verifyPassword(password, creds.passwordHash);

  if (!valid) {
    // 남은 시도 횟수를 알려주지 않습니다. (공격자에게 힌트를 주지 않기 위해)
    res.status(401).json({ ok: false, error: 'invalid_credentials', message: '비밀번호가 일치하지 않습니다.' });
    return;
  }

  loginLimiter.reset(key);
  setSessionCookie(res, sessionSecret);
  res.json({ ok: true, authenticated: true });
});

app.post('/api/auth/logout', requireSameOrigin(allowedOrigins), (req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

/* ── 콘텐츠 (공개 읽기 / 관리자 쓰기) ───────────────────────────────────── */

app.get('/api/content', async (req, res, next) => {
  try {
    const data = await contentStore.read();
    // 방문자 캐시가 오래 굳지 않도록 짧게 잡고, ETag 로 재검증합니다.
    res.setHeader('Cache-Control', 'no-cache');
    res.json({
      ok: true,
      projects: data.projects,
      menuContent: data.menuContent,
      config: data.config,
      updatedAt: data.updatedAt,
    });
  } catch (err) {
    next(err);
  }
});

app.put('/api/content', requireSameOrigin(allowedOrigins), requireAdmin(sessionSecret), async (req, res, next) => {
  try {
    const { projects, menuContent, config } = req.body || {};
    if (!Array.isArray(projects) || !menuContent || typeof menuContent !== 'object' || !config || typeof config !== 'object') {
      res.status(400).json({ ok: false, error: 'invalid_payload', message: '저장할 콘텐츠 형식이 올바르지 않습니다.' });
      return;
    }

    // base64 이미지를 파일로 분리한 뒤 저장합니다.
    const lightProjects = await mediaStore.offload(projects);
    const lightMenu = await mediaStore.offload(menuContent);

    await contentStore.backup();
    const updatedAt = new Date().toISOString();
    await contentStore.write({
      projects: lightProjects,
      menuContent: lightMenu,
      config,
      updatedAt,
    });

    res.json({ ok: true, updatedAt });
  } catch (err) {
    next(err);
  }
});

/* ── 문의 (공개 작성 / 관리자 조회·수정·삭제) ───────────────────────────── */

app.post('/api/inquiries', requireSameOrigin(allowedOrigins), async (req, res, next) => {
  try {
    const key = clientKey(req);
    const limit = inquiryLimiter.consume(key);
    if (!limit.allowed) {
      res.setHeader('Retry-After', Math.ceil(limit.retryAfterMs / 1000));
      res.status(429).json({
        ok: false,
        error: 'too_many_requests',
        message: '문의가 너무 많이 접수되었습니다. 잠시 후 다시 시도해 주세요.',
      });
      return;
    }

    const body = req.body || {};
    const clientName = cleanString(body.clientName, 80);
    const contact = cleanString(body.contact, 60);
    const email = cleanString(body.email, 160);
    const description = cleanString(body.description, 4000);

    // 서버에서도 최소 검증을 다시 합니다. (클라이언트 검증은 우회될 수 있음)
    if (!clientName) {
      res.status(400).json({ ok: false, error: 'invalid_request', message: '성함 또는 담당자명을 입력해 주세요.' });
      return;
    }
    if (!contact) {
      res.status(400).json({ ok: false, error: 'invalid_request', message: '연락처를 입력해 주세요.' });
      return;
    }
    if (!email || !email.includes('@')) {
      res.status(400).json({ ok: false, error: 'invalid_request', message: '올바른 이메일 주소를 입력해 주세요.' });
      return;
    }
    if (!description) {
      res.status(400).json({ ok: false, error: 'invalid_request', message: '프로젝트 내용을 입력해 주세요.' });
      return;
    }

    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const createdAt = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

    const inquiry = {
      id: `inq-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      createdAt,
      clientName,
      company: cleanString(body.company, 100) || undefined,
      contact,
      email,
      categories: cleanStringArray(body.categories, 10, 40),
      budget: cleanString(body.budget, 60),
      schedule: cleanString(body.schedule, 80),
      description,
      referenceUrl: cleanString(body.referenceUrl, 500) || undefined,
      status: '신규',
      adminNote: undefined,
    };

    const list = await inquiryStore.read();
    // 최신 문의가 위로 오도록 정렬해 저장합니다.
    list.unshift(inquiry);
    await inquiryStore.write(list);

    res.status(201).json({ ok: true, id: inquiry.id });
  } catch (err) {
    next(err);
  }
});

app.get('/api/inquiries', requireAdmin(sessionSecret), async (req, res, next) => {
  try {
    const list = await inquiryStore.read();
    res.setHeader('Cache-Control', 'no-store');
    res.json({ ok: true, inquiries: list });
  } catch (err) {
    next(err);
  }
});

app.patch('/api/inquiries/:id', requireSameOrigin(allowedOrigins), requireAdmin(sessionSecret), async (req, res, next) => {
  try {
    const { id } = req.params;
    const list = await inquiryStore.read();
    const index = list.findIndex((item) => item.id === id);
    if (index < 0) {
      res.status(404).json({ ok: false, error: 'not_found', message: '해당 문의를 찾을 수 없습니다.' });
      return;
    }

    const body = req.body || {};
    const next = { ...list[index] };

    if (body.status !== undefined) {
      if (!isValidStatus(body.status)) {
        res.status(400).json({ ok: false, error: 'invalid_status', message: '허용되지 않은 상태 값입니다.' });
        return;
      }
      next.status = body.status;
    }
    if (body.adminNote !== undefined) {
      next.adminNote = cleanString(body.adminNote, 2000) || undefined;
    }

    list[index] = next;
    await inquiryStore.write(list);
    res.json({ ok: true, inquiry: next });
  } catch (err) {
    next(err);
  }
});

app.delete('/api/inquiries/:id', requireSameOrigin(allowedOrigins), requireAdmin(sessionSecret), async (req, res, next) => {
  try {
    const { id } = req.params;
    const list = await inquiryStore.read();
    const filtered = list.filter((item) => item.id !== id);
    if (filtered.length === list.length) {
      res.status(404).json({ ok: false, error: 'not_found', message: '해당 문의를 찾을 수 없습니다.' });
      return;
    }
    await inquiryStore.write(filtered);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

/* ── 미디어 파일 서빙 ───────────────────────────────────────────────────── */

app.use(
  '/media',
  express.static(MEDIA_DIR, {
    // 파일명이 내용 해시이므로 오래 캐시해도 안전합니다.
    maxAge: '365d',
    immutable: true,
    fallthrough: true,
  })
);

/* ── 정적 파일 (빌드 결과물) ────────────────────────────────────────────── */

const distDir = path.join(ROOT, 'dist');
const hasDist = await fs
  .access(path.join(distDir, 'index.html'))
  .then(() => true)
  .catch(() => false);

if (hasDist) {
  app.use(express.static(distDir, { index: false, maxAge: '1h' }));

  // 해시 라우팅 SPA 이므로 어떤 경로로 들어와도 index.html 을 돌려줍니다.
  // (API 와 /media 는 위에서 이미 처리됐습니다)
  app.get(/^(?!\/api\/|\/media\/).*/, (req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res
      .status(503)
      .type('text/plain; charset=utf-8')
      .send('빌드 결과물이 없습니다. 먼저 `npm run build` 를 실행하세요.');
  });
}

/* ── 에러 처리 ───────────────────────────────────────────────────────────── */

app.use((err, req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  // 본문이 너무 큰 경우 (413)
  if (err && err.type === 'entity.too.large') {
    res.status(413).json({
      ok: false,
      error: 'payload_too_large',
      message: '업로드 용량이 너무 큽니다. 이미지를 줄이거나 개수를 나눠서 저장해 주세요.',
    });
    return;
  }
  if (err && err.type === 'entity.parse.failed') {
    res.status(400).json({ ok: false, error: 'invalid_json', message: '요청 형식이 올바르지 않습니다.' });
    return;
  }

  console.error('[api] 처리되지 않은 오류:', err);
  // 내부 오류 내용은 클라이언트에 노출하지 않습니다.
  res.status(500).json({ ok: false, error: 'internal_error', message: '서버 오류가 발생했습니다.' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  SO.A 서버 실행 중  →  http://localhost:${PORT}`);
  console.log(`  데이터 디렉터리     →  ${DATA_DIR}`);
  if (!hasDist) console.log('  (개발 모드: Vite 개발 서버를 함께 실행하세요)\n');
});
