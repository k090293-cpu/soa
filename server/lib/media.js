/**
 * 콘텐츠에 섞여 들어오는 base64 Data URL 이미지를 실제 파일로 분리합니다.
 *
 * [왜 필요한가]
 *  - 관리자 패널은 업로드한 이미지를 data:image/jpeg;base64,... 형태로 다룹니다.
 *  - 이걸 그대로 JSON 에 저장하면 파일 하나가 수십 MB 가 되고, 매 요청마다 그 전체를
 *    내려받아야 해서 방문자 로딩이 느려집니다.
 *  - 그래서 저장 직전에 파일로 꺼내고(/media/xxxx.jpg), JSON 에는 짧은 경로만 남깁니다.
 *
 * [중복 처리]
 *  - 내용 해시(SHA-256)를 파일명으로 쓰므로, 같은 이미지를 여러 번 저장해도 파일은 하나입니다.
 */

import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

/** 이 길이보다 짧은 data: URL 은 그대로 둡니다. (아이콘 등) */
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

/**
 * 문자열을 순회하며 base64 data URL 을 파일로 옮깁니다.
 * @param {unknown} value
 * @param {(dataUrl: string) => Promise<string>} save 콜백: data URL → 서빙 경로
 */
async function walk(value, save) {
  if (typeof value === 'string') {
    if (value.length < MIN_OFFLOAD_LENGTH) return value;
    if (!DATA_URL_RE.test(value)) return value;
    return save(value);
  }
  if (Array.isArray(value)) {
    const out = new Array(value.length);
    for (let i = 0; i < value.length; i++) out[i] = await walk(value[i], save);
    return out;
  }
  if (value && typeof value === 'object') {
    /** @type {Record<string, unknown>} */
    const out = {};
    for (const key of Object.keys(value)) out[key] = await walk(value[key], save);
    return out;
  }
  return value;
}

export class MediaStore {
  /** @param {string} dir 파일을 저장할 디렉터리 */
  constructor(dir) {
    this.dir = dir;
    /** @type {Map<string, string>} data URL 해시 → 서빙 경로 (요청 1회 처리 중 재사용) */
    this.cache = new Map();
  }

  async ensureDir() {
    await fs.mkdir(this.dir, { recursive: true });
  }

  /**
   * data URL 을 파일로 저장하고 서빙 경로를 돌려줍니다.
   * @param {string} dataUrl
   */
  async saveDataUrl(dataUrl) {
    const match = DATA_URL_RE.exec(dataUrl);
    if (!match) return dataUrl;

    const mime = match[1].toLowerCase();
    const ext = MIME_EXT[mime];
    // 지원하지 않는 형식(예: 폰트)은 원본 유지
    if (!ext) return dataUrl;

    const buffer = Buffer.from(match[2].replace(/\s/g, ''), 'base64');
    if (buffer.length === 0) return dataUrl;

    const hash = crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 32);
    const fileName = `${hash}.${ext}`;
    const served = `/media/${fileName}`;

    const cached = this.cache.get(hash);
    if (cached) return cached;

    await this.ensureDir();
    const filePath = path.join(this.dir, fileName);
    try {
      // 이미 있으면 다시 쓰지 않습니다. (같은 이미지 반복 저장 시 디스크 절약)
      await fs.access(filePath);
    } catch {
      await fs.writeFile(filePath, buffer);
    }

    this.cache.set(hash, served);
    return served;
  }

  /** 객체 전체에서 data URL 을 파일로 분리한 사본을 돌려줍니다. */
  async offload(value) {
    this.cache.clear();
    return walk(value, (dataUrl) => this.saveDataUrl(dataUrl));
  }
}

/** 값 안에 저장되지 않은 data: URL 이 남아 있는지 확인합니다. (검증용) */
export function countDataUrls(value) {
  let count = 0;
  const visit = (v) => {
    if (typeof v === 'string') {
      if (v.length >= MIN_OFFLOAD_LENGTH && DATA_URL_RE.test(v)) count++;
      return;
    }
    if (Array.isArray(v)) {
      v.forEach(visit);
      return;
    }
    if (v && typeof v === 'object') Object.values(v).forEach(visit);
  };
  visit(value);
  return count;
}
