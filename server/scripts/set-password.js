#!/usr/bin/env node
/**
 * 관리자 비밀번호를 재설정합니다.
 *
 * 사용법:
 *   npm run set-password -- 새비밀번호
 *
 * 비밀번호는 scrypt 해시로만 저장되며, 평문은 어디에도 남지 않습니다.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

import { JsonStore } from './lib/store.js';
import { hashPassword } from './lib/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(ROOT, 'data');

const store = new JsonStore(path.join(DATA_DIR, 'admin.json'), () => ({
  passwordHash: null,
  updatedAt: null,
}));

async function main() {
  let password = process.argv[2];

  if (!password) {
    const rl = readline.createInterface({ input: stdin, output: stdout });
    password = await rl.question('새 관리자 비밀번호를 입력하세요: ');
    rl.close();
  }

  password = (password || '').trim();

  if (password.length < 4) {
    console.error('❌ 비밀번호는 4자 이상이어야 합니다.');
    process.exit(1);
  }
  if (password.length > 200) {
    console.error('❌ 비밀번호가 너무 깁니다 (200자 이하).');
    process.exit(1);
  }

  await store.write({
    passwordHash: await hashPassword(password),
    updatedAt: new Date().toISOString(),
  });

  console.log('✅ 관리자 비밀번호가 변경되었습니다.');
  console.log('   (이미 로그인한 세션은 최대 12시간 후 만료됩니다. 즉시 로그아웃하려면 SESSION_SECRET 을 교체하세요.)');
}

main().catch((err) => {
  console.error('❌ 비밀번호 변경 실패:', err);
  process.exit(1);
});
