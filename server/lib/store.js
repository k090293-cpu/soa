/**
 * 아주 작은 JSON 파일 저장소.
 *
 * [왜 파일인가]
 *  - 이 포트폴리오는 관리자 1명이 가끔 콘텐츠를 고치는 규모입니다.
 *    별도 DB 서버를 두지 않아도 데이터 정합성을 지킬 수 있는 가장 단순한 방법이 파일입니다.
 *  - 대신 "쓰는 도중 전원이 꺼져도 원본이 깨지지 않는" 원자적 쓰기를 반드시 지킵니다.
 *
 * [원자적 쓰기]
 *  1) 같은 디렉터리에 임시 파일(.tmp)로 먼저 씁니다.
 *  2) 다 쓴 뒤 rename() 으로 한 번에 교체합니다.
 *  - rename 은 같은 파일시스템 안에서 원자적이므로, 읽는 쪽은 항상 "온전한 이전 버전" 또는
 *    "온전한 새 버전"만 보게 됩니다. 반쯤 쓰인 JSON 은 존재할 수 없습니다.
 */

import fs from 'node:fs/promises';
import path from 'node:path';

/** 문자열이 안전한 JSON 인지 확인 (깨진 파일을 그대로 덮어쓰지 않기 위한 방어) */
const tryParse = (raw) => {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
};

export class JsonStore {
  /**
   * @param {string} filePath 저장할 JSON 파일의 절대 경로
   * @param {() => unknown} defaultFactory 파일이 없을 때 사용할 기본값 생성 함수
   */
  constructor(filePath, defaultFactory) {
    this.filePath = filePath;
    this.defaultFactory = defaultFactory;
    this.dir = path.dirname(filePath);
  }

  async ensureDir() {
    await fs.mkdir(this.dir, { recursive: true });
  }

  /** 파일을 읽습니다. 없거나 깨졌으면 기본값을 돌려줍니다. */
  async read() {
    await this.ensureDir();
    try {
      const raw = await fs.readFile(this.filePath, 'utf8');
      const parsed = tryParse(raw);
      if (parsed === undefined) {
        // 깨진 파일은 지우지 않고 옆에 보관합니다. (수동 복구의 실마리를 남김)
        const brokenPath = `${this.filePath}.broken-${Date.now()}`;
        await fs.rename(this.filePath, brokenPath).catch(() => {});
        console.warn(`[store] ${this.filePath} 를 읽지 못해 ${brokenPath} 로 보관했습니다.`);
        return this.defaultFactory();
      }
      return parsed;
    } catch (err) {
      if (err && err.code === 'ENOENT') return this.defaultFactory();
      throw err;
    }
  }

  /** 원자적으로 씁니다. */
  async write(value) {
    await this.ensureDir();
    const tmp = path.join(this.dir, `.${path.basename(this.filePath)}.${process.pid}.tmp`);
    const payload = JSON.stringify(value);
    await fs.writeFile(tmp, payload, 'utf8');
    await fs.rename(tmp, this.filePath);
  }

  /**
   * 덮어쓰기 전에 직전 내용을 백업해 둡니다. (관리자 실수로 콘텐츠를 날리는 것을 대비)
   * 백업은 최근 1개만 유지해 디스크를 무한정 쓰지 않습니다.
   */
  async backup() {
    try {
      const raw = await fs.readFile(this.filePath, 'utf8');
      if (tryParse(raw) === undefined) return;
      const backupPath = `${this.filePath}.backup`;
      await fs.writeFile(backupPath, raw, 'utf8');
    } catch (err) {
      if (!err || err.code !== 'ENOENT') {
        console.warn('[store] 백업 생성 실패(무시하고 계속):', err?.message);
      }
    }
  }
}
