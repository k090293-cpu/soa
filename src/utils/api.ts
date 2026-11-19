/**
 * 서버 API 클라이언트.
 *
 * [동작 환경]
 *  · 기본 배포(Netlify): /api/* 가 Netlify Functions 로 연결됩니다.
 *    → 관리자 수정 내용이 모든 방문자에게 반영됩니다.
 *  · 서버가 없는 배포(`npm run build:static`): 모든 호출이 조용히 실패하고
 *    호출한 쪽이 브라우저 로컬 값으로 대체합니다. (사이트는 그대로 보입니다)
 *
 * [설계 원칙]
 *  · 어떤 경우에도 "사이트가 안 보이는" 상황을 만들지 않습니다. 실패는 null/기본값으로 흡수합니다.
 *  · 큰 이미지는 콘텐츠 저장과 분리해 POST /api/media 로 먼저 올립니다.
 *    (Netlify Functions 요청 본문 한도 약 6MB 를 넘기지 않기 위해서)
 */

import type { Project, ProjectInquiry, SiteMenuContent, StudioConfig, InquiryStatus } from '../types';

/** 서버가 살아 있는지 알 수 있는지 여부를 담은 결과 */
export interface RemoteContent {
  projects: Project[] | null;
  menuContent: SiteMenuContent | null;
  config: StudioConfig | null;
  updatedAt: string | null;
}

export interface LoginResult {
  ok: boolean;
  /** 사용자에게 그대로 보여줄 메시지 */
  message?: string;
  /** 429 응답 시 대기해야 하는 초 */
  retryAfter?: number;
  /**
   * 서버에 아예 닿지 못한 경우(정적 배포 / 네트워크 오류).
   * 이때만 호출한 쪽이 브라우저 로컬 검증으로 한 번 더 시도합니다.
   */
  offline?: boolean;
}

/** 서버 저장 결과. 서버가 정리한(이미지가 URL 로 바뀐) 콘텐츠를 함께 돌려줍니다. */
export interface SaveContentResult {
  ok: boolean;
  message?: string;
  unauthorized?: boolean;
  offline?: boolean;
  /**
   * 서버에 실제로 저장된 형태.
   * base64 가 `/api/media/<hash>.<ext>` 로 치환되어 있습니다.
   * 클라이언트가 이 값으로 상태를 갱신하면, 다음 저장 때 같은 이미지를 다시 올리지 않습니다.
   */
  saved?: {
    projects: Project[] | null;
    menuContent: SiteMenuContent | null;
    config: StudioConfig | null;
  };
  updatedAt?: string;
}

const JSON_HEADERS = { 'Content-Type': 'application/json' };

/**
 * 서버 없이 빌드했는지 (비상용 폴백).
 * GitHub Pages 처럼 함수를 쓸 수 없는 곳에 올릴 때만 true 가 됩니다.
 */
const STATIC_SITE = import.meta.env.VITE_STATIC_SITE === '1';

/**
 * 서버를 이번 세션에서 쓸 수 없다고 판단했는지 (서킷 브레이커).
 * 함수 배포 전이거나 장애일 때 매 요청마다 콘솔 에러가 쌓이는 것을 막습니다.
 */
let serverUnavailable = STATIC_SITE;

/** UI 에서 "서버 저장 가능" 여부를 표시할 때 사용 */
export const isServerEnabled = () => !serverUnavailable;

/** 서버가 응답하지 않는다고 표시 (테스트/재시도용) */
export const markServerUnavailable = () => {
  serverUnavailable = true;
};

/** 응답이 JSON 인지 확인하고 파싱합니다. JSON 이 아니면 null. */
async function parseJson(res: Response): Promise<Record<string, unknown> | null> {
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) return null;
  try {
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * JSON GET 요청. 서버가 없거나 응답이 JSON 이 아니면 null.
 * (정적 호스팅에서 index.html 이 200 으로 돌아오는 경우도 여기서 걸러집니다)
 */
async function requestJson<T>(path: string, init?: RequestInit): Promise<T | null> {
  if (serverUnavailable) return null;
  try {
    const res = await fetch(path, {
      credentials: 'same-origin',
      cache: 'no-store',
      ...init,
      headers: { ...(init?.headers || {}) },
    });

    const data = await parseJson(res);
    if (!data) {
      // JSON 이 아니면 서버가 없는 것으로 봅니다.
      serverUnavailable = true;
      return null;
    }
    return data as T;
  } catch {
    serverUnavailable = true;
    return null;
  }
}

/* ── data URL 분리 업로드 ───────────────────────────────────────────────── */

/** 이 길이보다 긴 data: URL 만 업로드 대상으로 봅니다. (작은 아이콘은 그대로) */
const MIN_UPLOAD_LENGTH = 1024;
const DATA_URL_RE = /^data:([\w.+-]+\/[\w.+-]+);base64,([A-Za-z0-9+/=\s]+)$/;

/**
 * 콘텐츠 안의 긴 data: URL 을 서버 미디어 저장소로 올리고,
 * URL 로 치환한 사본을 돌려줍니다.
 *
 * [왜 필요한가]
 *  관리자 화면은 이미지를 base64 data URL 로 다룹니다. 그대로 PUT 하면
 *  사진 몇 장만으로도 요청 본문 한도(약 6MB)를 넘겨 저장이 실패합니다.
 *  그래서 이미지는 개별 업로드하고, 콘텐츠에는 짧은 URL 만 넣습니다.
 */
async function offloadDataUrlsToServer<T>(value: T): Promise<{ result: T; changed: boolean; failed: boolean }> {
  if (serverUnavailable) return { result: value, changed: false, failed: true };

  /** 같은 요청 안에서 같은 이미지를 두 번 올리지 않도록 캐시 */
  const cache = new Map<string, string | null>();
  let changed = false;
  let failed = false;

  const upload = async (dataUrl: string): Promise<string> => {
    if (cache.has(dataUrl)) return cache.get(dataUrl) ?? dataUrl;

    try {
      const res = await fetch('/api/media', {
        method: 'POST',
        credentials: 'same-origin',
        headers: JSON_HEADERS,
        body: JSON.stringify({ dataUrl }),
      });
      const data = await parseJson(res);
      const url = typeof data?.url === 'string' ? data.url : null;

      if (res.ok && url) {
        cache.set(dataUrl, url);
        changed = true;
        return url;
      }

      // 업로드 실패 → 원본 유지 (데이터를 잃지 않는 쪽을 우선)
      failed = true;
      cache.set(dataUrl, null);
      return dataUrl;
    } catch {
      failed = true;
      cache.set(dataUrl, null);
      return dataUrl;
    }
  };

  const walk = async (node: unknown): Promise<unknown> => {
    if (typeof node === 'string') {
      if (node.length < MIN_UPLOAD_LENGTH) return node;
      if (!DATA_URL_RE.test(node)) return node;
      return upload(node);
    }
    if (Array.isArray(node)) {
      const out: unknown[] = new Array(node.length);
      // 순차 처리: 모바일에서 동시 업로드로 대역폭이 막히는 것을 피합니다.
      for (let i = 0; i < node.length; i += 1) out[i] = await walk(node[i]);
      return out;
    }
    if (node && typeof node === 'object') {
      const out: Record<string, unknown> = {};
      for (const key of Object.keys(node as Record<string, unknown>)) {
        out[key] = await walk((node as Record<string, unknown>)[key]);
      }
      return out;
    }
    return node;
  };

  const result = (await walk(value)) as T;
  return { result, changed, failed };
}

/* ── 공개 API ──────────────────────────────────────────────────────────── */

export const api = {
  /** 서버 콘텐츠를 가져옵니다. 서버가 없으면 null. */
  async getContent(): Promise<RemoteContent | null> {
    const data = await requestJson<{
      ok: boolean;
      projects: Project[] | null;
      menuContent: SiteMenuContent | null;
      config: StudioConfig | null;
      updatedAt: string | null;
    }>('/api/content');

    if (!data || !data.ok) return null;
    // 저장본이 없어도(모두 null) 서버는 살아 있는 것이므로 객체를 돌려줍니다.
    return {
      projects: (data.projects as Project[] | null) ?? null,
      menuContent: (data.menuContent as SiteMenuContent | null) ?? null,
      config: (data.config as StudioConfig | null) ?? null,
      updatedAt: data.updatedAt ?? null,
    };
  },

  /**
   * 콘텐츠를 서버에 저장합니다. (관리자 전용)
   *
   * 1) 이미지(base64)는 먼저 /api/media 로 올려 URL 로 바꿉니다.
   * 2) URL 로 정리된 콘텐츠를 PUT 합니다.
   * 3) 서버가 저장한 형태를 그대로 돌려주어, 클라이언트가 상태를 맞출 수 있게 합니다.
   */
  async saveContent(payload: {
    projects: Project[];
    menuContent: SiteMenuContent;
    config: StudioConfig;
  }): Promise<SaveContentResult> {
    if (serverUnavailable) {
      return { ok: false, offline: true, message: '서버에 연결할 수 없습니다. 변경 내용은 이 브라우저에만 저장됩니다.' };
    }

    // 1) 이미지 업로드 + URL 치환
    const { result: light, failed } = await offloadDataUrlsToServer(payload);

    // 2) 본문 저장
    try {
      const res = await fetch('/api/content', {
        method: 'PUT',
        credentials: 'same-origin',
        headers: JSON_HEADERS,
        body: JSON.stringify(light),
      });

      const data = await parseJson(res);

      if (res.status === 401) {
        return { ok: false, unauthorized: true, message: '관리자 로그인이 필요합니다. 다시 로그인해 주세요.' };
      }
      if (res.status === 404 || !data) {
        serverUnavailable = true;
        return { ok: false, offline: true, message: '서버에 연결할 수 없습니다. 변경 내용은 이 브라우저에만 저장됩니다.' };
      }
      if (!res.ok) {
        return {
          ok: false,
          message:
            (typeof data.message === 'string' && data.message) ||
            '서버 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.',
        };
      }

      return {
        ok: true,
        updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : undefined,
        saved: {
          projects: (data.projects as Project[] | null) ?? null,
          menuContent: (data.menuContent as SiteMenuContent | null) ?? null,
          config: (data.config as StudioConfig | null) ?? null,
        },
        // 일부 이미지 업로드가 실패했지만 본문은 저장된 경우, 사용자에게 알립니다.
        message: failed
          ? '일부 이미지를 서버에 올리지 못해 브라우저에만 보관했습니다. 네트워크 확인 후 다시 저장해 주세요.'
          : undefined,
      };
    } catch {
      serverUnavailable = true;
      return { ok: false, offline: true, message: '서버에 연결할 수 없습니다. 변경 내용은 이 브라우저에만 저장됩니다.' };
    }
  },

  /** 현재 세션(로그인 상태)을 확인합니다. 서버가 없으면 false. */
  async getSession(): Promise<boolean> {
    const data = await requestJson<{ authenticated: boolean }>('/api/auth/session');
    return Boolean(data?.authenticated);
  },

  /** 관리자 로그인 (비밀번호는 서버에서만 검증됩니다). */
  async login(password: string): Promise<LoginResult> {
    if (serverUnavailable) return { ok: false, offline: true, message: '서버에 연결할 수 없습니다.' };
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: JSON_HEADERS,
        body: JSON.stringify({ password }),
      });

      const data = await parseJson(res);

      if (res.status === 429) {
        const retryAfter = Number(res.headers.get('Retry-After') || 0);
        return {
          ok: false,
          message:
            (typeof data?.message === 'string' && data.message) ||
            '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.',
          retryAfter,
        };
      }
      if (res.status === 404 || !data) {
        serverUnavailable = true;
        return { ok: false, offline: true, message: '서버에 연결할 수 없습니다.' };
      }
      if (!res.ok) {
        return {
          ok: false,
          message: (typeof data.message === 'string' && data.message) || '비밀번호가 일치하지 않습니다.',
        };
      }
      return { ok: true };
    } catch {
      serverUnavailable = true;
      return { ok: false, offline: true, message: '서버에 연결할 수 없습니다.' };
    }
  },

  async logout(): Promise<void> {
    if (serverUnavailable) return;
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    } catch {
      /* 로그아웃 실패는 무시 (로컬 상태는 어차피 초기화) */
    }
  },

  /**
   * 공개 문의 접수.
   *
   * 이 사이트는 문의 폼을 쓰지 않습니다(직접 연락 채널 안내).
   * 다만 문의 기능을 다시 켤 경우를 위해 계약만 유지합니다.
   */
  async createInquiry(
    payload: Record<string, unknown>
  ): Promise<{ ok: boolean; message?: string; offline?: boolean }> {
    if (serverUnavailable) {
      return { ok: false, offline: true, message: '현재 서버에 연결할 수 없습니다.' };
    }
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        credentials: 'same-origin',
        headers: JSON_HEADERS,
        body: JSON.stringify(payload),
      });

      const data = await parseJson(res);
      if (!data) {
        serverUnavailable = true;
        return { ok: false, offline: true, message: '현재 서버에 연결할 수 없습니다.' };
      }
      if (res.status === 429) {
        return {
          ok: false,
          message: (typeof data.message === 'string' && data.message) || '잠시 후 다시 시도해 주세요.',
        };
      }
      if (!res.ok) {
        return { ok: false, message: (typeof data.message === 'string' && data.message) || '문의 접수에 실패했습니다.' };
      }
      return { ok: true };
    } catch {
      return { ok: false, offline: true, message: '현재 서버에 연결할 수 없습니다.' };
    }
  },

  /** 문의 목록 (관리자 전용) */
  async listInquiries(): Promise<ProjectInquiry[] | null> {
    const data = await requestJson<{ ok: boolean; inquiries: ProjectInquiry[] }>('/api/inquiries');
    if (!data || !data.ok) return null;
    return data.inquiries;
  },

  async updateInquiry(
    id: string,
    patch: { status?: InquiryStatus; adminNote?: string }
  ): Promise<boolean> {
    if (serverUnavailable) return false;
    try {
      const res = await fetch(`/api/inquiries/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: JSON_HEADERS,
        body: JSON.stringify(patch),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async deleteInquiry(id: string): Promise<boolean> {
    if (serverUnavailable) return false;
    try {
      const res = await fetch(`/api/inquiries/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      return res.ok;
    } catch {
      return false;
    }
  },
};
