/**
 * base64 Data URL 을 Blobs 저장소로 분리합니다.
 *
 * [왜 서버에서도 하나]
 *  - 브라우저가 이미지를 개별 업로드(POST /api/media)하는 것이 기본 경로입니다.
 *    (Netlify Functions 요청 본문 한도 6MB 를 콘텐츠 저장과 섞지 않기 위해서)
 *  - 하지만 예전 저장본이나 다른 경로로 data: URL 이 섞여 들어올 수 있습니다.
 *    그대로 저장하면 방문자가 수십 MB JSON 을 받게 되므로, 저장 직전에 한 번 더 걸러 냅니다.
 *  - 파일명은 내용 해시(SHA-256)라서 같은 이미지는 한 번만 저장됩니다.
 */

const MIN_OFFLOAD_LENGTH = 1024;

const MIME_EXT = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
};

const DATA_URL_RE = /^data:([\w.+-]+\/[\w.+-]+);base64,([A-Za-z0-9+/=\s]+)$/;

/** 바이트 배열 → hex */
const toHex = (buf) => Buffer.from(buf).toString('hex');

/** SHA-256 해시의 앞 32자를 파일명으로 씁니다. */
async function contentHash(buffer) {
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return toHex(new Uint8Array(digest)).slice(0, 32);
}

/**
 * 미디어 저장소에 base64 를 저장하고 공개 경로를 돌려줍니다.
 * @param {{ setBytes: (k: string, v: Uint8Array) => Promise<void> }} store
 * @param {string} dataUrl
 */
export async function saveDataUrl(store, dataUrl) {
  const match = DATA_URL_RE.exec(dataUrl);
  if (!match) return dataUrl;

  const mime = match[1].toLowerCase();
  const ext = MIME_EXT[mime];
  if (!ext) return dataUrl; // 지원하지 않는 형식은 원본 유지

  let buffer;
  try {
    buffer = Buffer.from(match[2].replace(/\s/g, ''), 'base64');
  } catch {
    return dataUrl;
  }
  if (buffer.length === 0) return dataUrl;

  const hash = await contentHash(buffer);
  const fileName = `${hash}.${ext}`;
  const served = `/api/media/${fileName}`;

  try {
    await store.setBytes(fileName, new Uint8Array(buffer));
  } catch {
    return dataUrl; // 저장 실패 시 데이터를 잃지 않도록 원본 유지
  }
  return served;
}

/**
 * 객체 전체를 순회하며 data: URL 을 저장소 경로로 바꾼 사본을 돌려줍니다.
 * @param {object} store
 * @param {unknown} value
 */
export async function offloadDataUrls(store, value) {
  /** 같은 요청 안에서 같은 이미지를 반복 저장하지 않도록 캐시 */
  const cache = new Map();

  const walk = async (node) => {
    if (typeof node === 'string') {
      if (node.length < MIN_OFFLOAD_LENGTH) return node;
      if (!DATA_URL_RE.test(node)) return node;
      const cached = cache.get(node);
      if (cached) return cached;
      const saved = await saveDataUrl(store, node);
      cache.set(node, saved);
      return saved;
    }
    if (Array.isArray(node)) {
      const out = new Array(node.length);
      for (let i = 0; i < node.length; i += 1) out[i] = await walk(node[i]);
      return out;
    }
    if (node && typeof node === 'object') {
      const out = {};
      for (const key of Object.keys(node)) out[key] = await walk(node[key]);
      return out;
    }
    return node;
  };

  return walk(value);
}

/** MIME 타입 → 확장자 역매핑 (서빙 시 Content-Type 결정용) */
export function mimeForFile(fileName) {
  const ext = String(fileName).split('.').pop()?.toLowerCase() || '';
  const found = PAIR_EXT[ext];
  return found || 'application/octet-stream';
}

const PAIR_EXT = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  mp4: 'video/mp4',
  webm: 'video/webm',
};
