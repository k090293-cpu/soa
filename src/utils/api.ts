/**
 * 서버 API 클라이언트.
 *
 * [설계 원칙]
 *  - 서버를 붙일 수 없는 환경(정적 호스팅만 쓰는 경우)에서도 사이트가 그대로 보여야 합니다.
 *    그래서 모든 호출은 "실패하면 null/기본값" 으로 조용히 떨어지고, 호출한 쪽이
 *    로컬(번들 기본값)로 자연스럽게 대체합니다.
 *  - 쿠키 기반 세션이므로 모든 요청에 credentials: 'same-origin' 을 붙입니다.
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
}

const JSON_HEADERS = { 'Content-Type': 'application/json' };

/**
 * JSON 요청을 보냅니다. 네트워크 실패/비 JSON 응답은 null 로 흡수합니다.
 * (서버가 없는 정적 배포에서 콘솔이 에러로 도배되지 않게 하려는 목적도 있습니다)
 */
async function requestJson<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(path, {
      credentials: 'same-origin',
      ...init,
      headers: { ...(init?.headers || {}) },
    });

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      // 서버가 없는 정적 호스팅에서는 index.html 이 돌아옵니다.
      return null;
    }
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

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
    return {
      projects: data.projects ?? null,
      menuContent: data.menuContent ?? null,
      config: data.config ?? null,
      updatedAt: data.updatedAt ?? null,
    };
  },

  /** 콘텐츠를 서버에 저장합니다. (관리자 전용) */
  async saveContent(payload: {
    projects: Project[];
    menuContent: SiteMenuContent;
    config: StudioConfig;
  }): Promise<{ ok: boolean; message?: string; unauthorized?: boolean }> {
    try {
      const res = await fetch('/api/content', {
        method: 'PUT',
        credentials: 'same-origin',
        headers: JSON_HEADERS,
        body: JSON.stringify(payload),
      });

      if (res.status === 401) return { ok: false, unauthorized: true, message: '관리자 로그인이 필요합니다.' };

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        return { ok: false, message: data?.message || '저장에 실패했습니다.' };
      }
      return { ok: true };
    } catch {
      return { ok: false, message: '서버에 연결할 수 없습니다.' };
    }
  },

  /** 현재 세션(로그인 상태)을 확인합니다. 서버가 없으면 false. */
  async getSession(): Promise<boolean> {
    const data = await requestJson<{ authenticated: boolean }>('/api/auth/session');
    return Boolean(data?.authenticated);
  },

  /** 관리자 로그인 (비밀번호는 서버에서만 검증됩니다). */
  async login(password: string): Promise<LoginResult> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: JSON_HEADERS,
        body: JSON.stringify({ password }),
      });

      const data = await res.json().catch(() => null);

      if (res.status === 429) {
        const retryAfter = Number(res.headers.get('Retry-After') || 0);
        return {
          ok: false,
          message: data?.message || '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.',
          retryAfter,
        };
      }
      if (res.status === 404 || !data) {
        return { ok: false, message: '서버에 연결할 수 없습니다. 관리자 기능을 사용하려면 서버가 실행 중이어야 합니다.' };
      }
      if (!res.ok) {
        return { ok: false, message: data?.message || '비밀번호가 일치하지 않습니다.' };
      }
      return { ok: true };
    } catch {
      return { ok: false, message: '서버에 연결할 수 없습니다. 네트워크 상태를 확인해 주세요.' };
    }
  },

  async logout(): Promise<void> {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    } catch {
      /* 로그아웃 실패는 무시 (로컬 상태는 어차피 초기화) */
    }
  },

  /** 문의 접수 (공개). 실패 사유를 사용자에게 그대로 보여줍니다. */
  async createInquiry(payload: Record<string, unknown>): Promise<{ ok: boolean; message?: string }> {
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        credentials: 'same-origin',
        headers: JSON_HEADERS,
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (res.status === 429) {
        return { ok: false, message: data?.message || '문의가 너무 많이 접수되었습니다. 잠시 후 다시 시도해 주세요.' };
      }
      if (!res.ok) {
        return { ok: false, message: data?.message || '문의 접수에 실패했습니다.' };
      }
      return { ok: true };
    } catch {
      return { ok: false, message: '서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.' };
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
