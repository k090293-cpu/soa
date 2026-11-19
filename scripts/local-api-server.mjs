/**
 * 로컬 통합 서버 — Netlify 배포를 그대로 흉내냅니다.
 *
 * [하는 일]
 *   1) `/api/*`  → netlify/functions/api.mjs (배포에서 도는 바로 그 핸들러)
 *   2) 나머지     → dist/ 정적 파일 (Netlify 의 publish 디렉터리와 동일)
 *   3) 없는 경로  → index.html (netlify.toml 의 SPA 리다이렉트와 동일)
 *
 * [왜 필요한가]
 *  실제 배포는 "정적 파일 + /api 함수"가 같은 오리진에서 동작합니다.
 *  쿠키(SameSite/HttpOnly)와 상대경로 fetch 는 오리진이 같아야만 검증되므로,
 *  로컬에서도 한 서버로 묶어야 배포 환경과 같은 조건이 됩니다.
 *
 *  netlify/functions/lib/store.mjs 는 NETLIFY_BLOBS_CONTEXT 가 없으면
 *  자동으로 로컬 파일 저장소(.soa-store)를 씁니다. Blobs 없이도 동작합니다.
 *
 * 사용법
 *   npm run build && node scripts/local-api-server.mjs
 *   PORT=4173 node scripts/local-api-server.mjs
 */

import http from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import handler from '../netlify/functions/api.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');

const PORT = Number(process.env.PORT || 4174);
const HOST = process.env.HOST || '0.0.0.0';

/** 확장자 → Content-Type */
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
};

/** Node 요청 → 표준 Request */
function toRequest(req) {
  const host = req.headers.host || `localhost:${PORT}`;
  const url = new URL(req.url, `http://${host}`);

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) value.forEach((v) => headers.append(key, v));
    else if (value !== undefined) headers.set(key, value);
  }

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
  return new Request(url, {
    method: req.method,
    headers,
    ...(hasBody ? { body: req, duplex: 'half' } : {}),
  });
}

/** 표준 Response → Node 응답 */
async function sendResponse(res, response) {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    // 같은 이름 헤더가 여러 개일 수 있어 set-cookie 는 append 로 처리합니다.
    if (key.toLowerCase() === 'set-cookie') res.appendHeader(key, value);
    else res.setHeader(key, value);
  });
  const buffer = Buffer.from(await response.arrayBuffer());
  res.end(buffer);
}

/** dist 에서 파일을 찾습니다. 없으면 null. */
async function resolveFile(pathname) {
  // 경로 조작 방지: dist 바깥으로 나가는 요청은 거부
  const safePath = path.normalize(pathname).replace(/^(\.\.[/\\])+/, '');
  const target = path.join(DIST, safePath);
  if (!target.startsWith(DIST)) return null;

  try {
    const info = await stat(target);
    if (info.isFile()) return target;
    if (info.isDirectory()) {
      const indexFile = path.join(target, 'index.html');
      try {
        const indexInfo = await stat(indexFile);
        if (indexInfo.isFile()) return indexFile;
      } catch {
        return null;
      }
    }
  } catch {
    return null;
  }
  return null;
}

async function serveStatic(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  res.statusCode = 200;
  res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
  createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || `localhost:${PORT}`}`);

    /* 1) API → Netlify Function 핸들러 */
    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
      const response = await handler(toRequest(req));
      await sendResponse(res, response);
      return;
    }

    /* 2) 정적 파일 */
    const file = await resolveFile(decodeURIComponent(url.pathname));
    if (file) {
      await serveStatic(res, file);
      return;
    }

    /* 3) SPA 폴백 (netlify.toml 의 /* → /index.html 과 동일) */
    const indexFile = path.join(DIST, 'index.html');
    try {
      const info = await stat(indexFile);
      if (info.isFile()) {
        await serveStatic(res, indexFile);
        return;
      }
    } catch {
      /* dist 가 없으면 안내 */
    }

    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('dist/ 가 없습니다. 먼저 `npm run build` 를 실행하세요.');
  } catch (err) {
    console.error('[local-api] 오류:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ ok: false, error: 'internal_error', message: String(err?.message || err) }));
  }
});

server.listen(PORT, HOST, () => {
  console.log(`[local-api] http://${HOST}:${PORT} — dist 정적 + /api(Netlify Function) 통합 서버`);
});
