/**
 * 개발용 통합 실행기.
 *
 * `npm run dev` 한 번으로
 *   1) API 서버 (기본 3001 포트)
 *   2) Vite 개발 서버 (3000 포트, /api 와 /media 를 3001 로 프록시)
 * 두 개를 함께 띄웁니다. 별도 의존성(concurrently 등)을 추가하지 않기 위해 직접 구현했습니다.
 */

import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const API_PORT = process.env.API_PORT || '3001';

const children = [];

function start(name, command, args, env) {
  const child = spawn(command, args, {
    cwd: ROOT,
    env: { ...process.env, ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: false,
  });

  const prefix = `[${name}] `;
  const pipe = (stream, out) => {
    stream.setEncoding('utf8');
    let buffer = '';
    stream.on('data', (chunk) => {
      buffer += chunk;
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) out.write(prefix + line + '\n');
    });
  };

  pipe(child.stdout, process.stdout);
  pipe(child.stderr, process.stderr);

  child.on('exit', (code, signal) => {
    if (signal) return;
    console.log(`${prefix}종료 (code ${code})`);
  });

  children.push(child);
  return child;
}

const shutdown = () => {
  for (const child of children) {
    if (!child.killed) child.kill('SIGTERM');
  }
  setTimeout(() => process.exit(0), 300);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

console.log(`\n  개발 모드 시작 — API:${API_PORT} / WEB:3000\n`);

start('api', process.execPath, ['server/index.js'], { PORT: API_PORT });
start('web', process.execPath, [path.join(ROOT, 'node_modules/vite/bin/vite.js'), '--port=3000', '--host=0.0.0.0'], {
  // Vite 프록시가 붙을 API 주소
  VITE_API_PORT: API_PORT,
});
