/**
 * 대용량 이미지 / 영상을 IndexedDB 로 옮겨 localStorage 용량 초과를 막는 보관소.
 *
 * [왜 필요한가]
 *  - 프로젝트 이미지와 홈 이미지 오버라이드는 base64 Data URL 로 저장됩니다.
 *  - localStorage 한도는 브라우저당 약 5MB 인데, 사진 4~5장이면(base64 는 원본의 약 1.37배)
 *    금방 한도에 도달합니다.
 *  - 한도를 넘으면 localStorage.setItem 이 예외를 던지고, 그때까지의 관리자 수정 내용이
 *    통째로 저장되지 않습니다. (화면에는 반영되지만 새로고침하면 사라짐)
 *
 * [해결 방식]
 *  - 저장 직전에 긴 data: URL 을 IndexedDB 로 옮기고, localStorage 에는 짧은 참조 문자열만 남깁니다.
 *    예) data:image/jpeg;base64,AAAA...(약 900KB)  →  idb-media://1a2b3c  (약 20바이트)
 *  - 불러올 때 참조를 다시 data: URL 로 되돌립니다.
 *  - IndexedDB 를 쓸 수 없는 환경에서는 아무 것도 바꾸지 않으므로 기존 동작 그대로 안전합니다.
 */

const DB_NAME = 'soa_media_vault_v1';
const DB_VERSION = 1;
const STORE = 'media';

/** localStorage 에 남기는 참조 문자열 접두사 */
export const MEDIA_REF_PREFIX = 'idb-media://';

/** 이 길이보다 긴 data: URL 만 IndexedDB 로 옮깁니다. (작은 아이콘 등은 그대로 둠) */
const OFFLOAD_MIN_LENGTH = 8 * 1024;

/** 참조 → 실제 data URL */
const byRef = new Map<string, string>();
/**
 * data URL → 참조.
 * 같은 문자열 인스턴스에 대해서는 엔진이 해시를 캐시하므로 조회가 빠릅니다.
 * 드래그처럼 상태가 자주 바뀌는 상황에서 매번 수 MB 를 다시 해시하는 것을 막아 줍니다.
 */
const byUrl = new Map<string, string>();

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDB(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') {
        resolve(null);
        return;
      }
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'ref' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

/** FNV-1a 32bit — 내용 기반 짧은 키 */
function hashOf(str: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

/** 값이 이 보관소의 참조 문자열인지 확인합니다. */
export function isMediaRef(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith(MEDIA_REF_PREFIX);
}

/** 옮길 가치가 있는(충분히 긴) data: URL 인지 확인합니다. */
function isHeavyDataUrl(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.startsWith('data:') &&
    value.length > OFFLOAD_MIN_LENGTH
  );
}

/** IndexedDB 에 실제로 저장되었는지 여부를 돌려줍니다. */
async function saveToDB(ref: string, dataUrl: string): Promise<boolean> {
  const db = await openDB();
  if (!db) return false;
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put({ ref, dataUrl, savedAt: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    return true;
  } catch (e) {
    console.warn('[mediaVault] IndexedDB 저장 실패 — localStorage 에 그대로 보관합니다.', e);
    return false;
  }
}

async function readFromDB(ref: string): Promise<string | null> {
  const db = await openDB();
  if (!db) return null;
  try {
    return await new Promise<string | null>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(ref);
      req.onsuccess = () => {
        const row = req.result as { dataUrl?: string } | undefined;
        resolve(row?.dataUrl ?? null);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

/**
 * data URL 을 IndexedDB 에 넣고 참조 문자열을 돌려줍니다.
 * IndexedDB 저장에 실패하면 null 을 돌려주고, 호출한 쪽은 원본 data URL 을 그대로 보관합니다.
 * (참조만 남기고 실제 데이터를 잃어버리는 상황을 막기 위해 반드시 저장 완료를 기다립니다)
 */
async function putMedia(dataUrl: string): Promise<string | null> {
  const cached = byUrl.get(dataUrl);
  if (cached) return cached;

  const ref = `${MEDIA_REF_PREFIX}${hashOf(dataUrl)}`;
  const saved = await saveToDB(ref, dataUrl);
  if (!saved) return null;

  byUrl.set(dataUrl, ref);
  byRef.set(ref, dataUrl);
  return ref;
}

/** 참조 문자열을 실제 data URL 로 되돌립니다. 없으면 null. */
async function getMedia(ref: string): Promise<string | null> {
  const cached = byRef.get(ref);
  if (cached) return cached;

  const found = await readFromDB(ref);
  if (found) {
    byRef.set(ref, found);
    byUrl.set(found, ref);
  }
  return found;
}

type Transform = (value: string) => Promise<string | null>;

/** 객체/배열을 깊이 순회하며 문자열 값을 변환합니다. (변환 결과가 null 이면 원본 유지) */
async function walk(value: unknown, fn: Transform): Promise<unknown> {
  if (typeof value === 'string') {
    const next = await fn(value);
    return next === null ? value : next;
  }
  if (Array.isArray(value)) {
    const out: unknown[] = [];
    for (const item of value) out.push(await walk(item, fn));
    return out;
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>)) {
      out[key] = await walk((value as Record<string, unknown>)[key], fn);
    }
    return out;
  }
  return value;
}

/**
 * 저장용으로 가볍게 만든 사본을 돌려줍니다.
 * 긴 data: URL 이 참조 문자열로 바뀌므로 localStorage 에 안전하게 들어갑니다.
 */
export async function offloadMedia<T>(value: T): Promise<T> {
  return (await walk(value, async (s) => (isHeavyDataUrl(s) ? putMedia(s) : null))) as T;
}

/**
 * 참조 문자열을 실제 data: URL 로 되돌린 사본을 돌려줍니다.
 * IndexedDB 를 쓸 수 없거나 값이 없으면 원래 참조가 그대로 남습니다.
 */
export async function hydrateMedia<T>(value: T): Promise<T> {
  return (await walk(value, async (s) => (isMediaRef(s) ? getMedia(s) : null))) as T;
}

/**
 * 값 안에 이 보관소의 참조가 하나라도 들어 있는지 확인합니다.
 * (불필요한 상태 갱신을 피하기 위한 사전 검사용)
 */
export function containsMediaRef(value: unknown): boolean {
  if (typeof value === 'string') return isMediaRef(value);
  if (Array.isArray(value)) return value.some((v) => containsMediaRef(v));
  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>).some((k) =>
      containsMediaRef((value as Record<string, unknown>)[k])
    );
  }
  return false;
}

/** 현재 세션에서 참조를 즉시 해석합니다. (동기 — 이미 메모리에 올라온 경우만) */
export function peekMediaSync(ref: string): string | null {
  return byRef.get(ref) ?? null;
}
