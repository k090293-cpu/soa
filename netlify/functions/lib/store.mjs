/**
 * 저장소 추상화 — Netlify Blobs (운영) / 로컬 파일 (개발·테스트).
 *
 * [왜 추상화하는가]
 *  - 운영(Netlify)에서는 @netlify/blobs 를 씁니다. 별도 DB 없이 영속 저장이 됩니다.
 *  - 그런데 Blobs 는 Netlify 런타임 컨텍스트(NETLIFY_BLOBS_CONTEXT)가 있어야만 동작합니다.
 *    로컬에서 함수 로직을 그대로 테스트하려고 하면 그 컨텍스트가 없어 매번 실패합니다.
 *  - 그래서 "컨텍스트가 있으면 Blobs, 없으면 로컬 파일" 로 자동 분기합니다.
 *    덕분에 같은 핸들러 코드를 로컬 테스트 서버에서도 100% 동일하게 검증할 수 있습니다.
 */

import { mkdir, readFile, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';
// 정적 import 를 씁니다. Netlify 의 번들러(esbuild)가 동적 import 를 인라인하지 못해
// 배포 후 모듈을 찾지 못하는 경우가 있기 때문입니다.
// (로컬 파일 모드에서는 이 모듈을 호출하지 않으므로 비용이 없습니다)
import { getStore } from '@netlify/blobs';

/** 로컬 파일 백엔드가 쓸 디렉터리 (테스트에서 경로를 바꿀 수 있음) */
const LOCAL_DIR = process.env.SOA_LOCAL_STORE_DIR || path.join(process.cwd(), '.soa-store');

/** Blobs 를 쓸 수 있는 환경인지 판별합니다. */
function canUseBlobs() {
  return Boolean(process.env.NETLIFY_BLOBS_CONTEXT);
}

let blobsModulePromise = null;
/** @netlify/blobs 를 지연 로드합니다. (로컬 파일 모드에서는 아예 불러오지 않음) */
async function loadBlobs() {
  if (!blobsModulePromise) {
    blobsModulePromise = import('@netlify/blobs');
  }
  return blobsModulePromise;
}

/* ── 로컬 파일 백엔드 ───────────────────────────────────────────────── */

/** 키를 안전한 파일명으로 바꿉니다. (`content/main` → `content__main`) */
function keyToPath(storeName, key) {
  const safe = `${storeName}__${key}`.replace(/[^a-zA-Z0-9._-]/g, '_');
  return path.join(LOCAL_DIR, safe);
}

async function localGetText(storeName, key) {
  try {
    return await readFile(keyToPath(storeName, key), 'utf8');
  } catch {
    return null;
  }
}

async function localSetText(storeName, key, value) {
  await mkdir(LOCAL_DIR, { recursive: true });
  await writeFile(keyToPath(storeName, key), value, 'utf8');
}

async function localGetBytes(storeName, key) {
  try {
    const buf = await readFile(keyToPath(storeName, key));
    return new Uint8Array(buf);
  } catch {
    return null;
  }
}

async function localSetBytes(storeName, key, bytes) {
  await mkdir(LOCAL_DIR, { recursive: true });
  await writeFile(keyToPath(storeName, key), bytes);
}

async function localDelete(storeName, key) {
  try {
    await unlink(keyToPath(storeName, key));
  } catch {
    /* 없으면 무시 */
  }
}

/* ── 공개 API ───────────────────────────────────────────────────────── */

/** 저장소 이름을 받아 텍스트/바이너리 읽기·쓰기·삭제를 제공합니다. */
export async function openStore(name) {
  if (canUseBlobs()) {
    const { getStore } = await loadBlobs();
    const store = getStore(name);

    return {
      kind: 'blobs',
      async getText(key) {
        try {
          const value = await store.get(key, { type: 'text' });
          return typeof value === 'string' ? value : null;
        } catch {
          return null;
        }
      },
      async setText(key, value) {
        await store.set(key, value);
      },
      async getBytes(key) {
        try {
          const value = await store.get(key, { type: 'arrayBuffer' });
          return value ? new Uint8Array(value) : null;
        } catch {
          return null;
        }
      },
      async setBytes(key, bytes) {
        await store.set(key, bytes);
      },
      async delete(key) {
        try {
          await store.delete(key);
        } catch {
          /* 없으면 무시 */
        }
      },
    };
  }

  return {
    kind: 'file',
    getText: (key) => localGetText(name, key),
    setText: (key, value) => localSetText(name, key, value),
    getBytes: (key) => localGetBytes(name, key),
    setBytes: (key, bytes) => localSetBytes(name, key, bytes),
    delete: (key) => localDelete(name, key),
  };
}

/** 현재 어떤 백엔드를 쓰는지 (진단용) */
export function storeBackend() {
  return canUseBlobs() ? 'netlify-blobs' : 'local-file';
}
