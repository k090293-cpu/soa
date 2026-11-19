/**
 * 영상 링크(YouTube / Vimeo) 해석 유틸.
 *
 * ── 왜 링크 방식인가 ─────────────────────────────────────────────────────
 *  예전에는 관리자 화면에서 mp4 파일을 직접 업로드했는데,
 *  영상은 용량이 커서 브라우저 저장소(IndexedDB)를 금방 채우고,
 *  정적 배포(Netlify)에서는 아예 공유도 되지 않았습니다.
 *  그래서 영상은 YouTube/Vimeo 에 올린 뒤 "링크만" 입력하도록 바꿨습니다.
 *
 * ── 썸네일 우선 재생 ─────────────────────────────────────────────────────
 *  링크만 있으면 재생 전에 보여줄 그림이 없습니다.
 *  그래서 영상 ID 로 썸네일 주소를 만들어 넣고, 클릭했을 때만 재생합니다.
 *  (무거운 iframe 을 페이지 로드 시점에 여러 개 띄우지 않아 속도도 좋아집니다)
 */

export type VideoProvider = 'youtube' | 'vimeo' | 'file';

export interface VideoInfo {
  provider: VideoProvider;
  /** YouTube / Vimeo 영상 ID (직접 파일이면 null) */
  videoId: string | null;
  /** iframe 에 넣을 재생 주소, 또는 직접 파일 URL */
  embedUrl: string;
  /** 재생 전에 보여줄 썸네일 (모르면 null → 호출부가 대체 UI 를 그립니다) */
  thumbnail: string | null;
}

/** YouTube 영상 ID 는 11자 (영문·숫자·-·_) */
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
/** 영상 파일 확장자 */
const VIDEO_FILE = /\.(mp4|webm|ogg|ogv|mov|m4v)(\?|#|$)/i;

/** 사람이 읽을 이름 */
export const VIDEO_PROVIDER_LABEL: Record<VideoProvider, string> = {
  youtube: 'YouTube',
  vimeo: 'Vimeo',
  file: '직접 링크',
};

/** YouTube 재생 주소 — nocookie 도메인을 써서 추적 쿠키를 줄입니다. */
const youtubeEmbed = (id: string) =>
  `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&playsinline=1&autoplay=1`;

/**
 * YouTube 썸네일.
 * hqdefault.jpg(480×360)는 모든 영상에 반드시 생성되므로 404 위험이 없습니다.
 * (maxresdefault 는 고화질 업로드 영상에만 있어서 자주 깨집니다)
 */
const youtubeThumb = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

/** Vimeo 재생 주소 — dnt=1 로 추적을 끕니다. */
const vimeoEmbed = (id: string) => `https://player.vimeo.com/video/${id}?autoplay=1&dnt=1`;

const youtubeInfo = (id: string): VideoInfo => ({
  provider: 'youtube',
  videoId: id,
  embedUrl: youtubeEmbed(id),
  thumbnail: youtubeThumb(id),
});

const vimeoInfo = (id: string): VideoInfo => ({
  provider: 'vimeo',
  videoId: id,
  // Vimeo 썸네일 주소는 API 를 거쳐야 알 수 있어 여기서는 null 로 둡니다.
  // (VideoPlayer 가 oEmbed 로 한 번 조회하고, 실패하면 대체 UI 를 그립니다)
  embedUrl: vimeoEmbed(id),
  thumbnail: null,
});

/** 호스트에서 www./m. 접두사 제거 */
const bareHost = (hostname: string) => hostname.replace(/^(www|m|player)\./i, '');

/** YouTube URL → 영상 ID */
function extractYoutubeId(url: URL): string | null {
  const host = bareHost(url.hostname);

  // youtu.be/VIDEO_ID
  if (host === 'youtu.be') {
    const id = url.pathname.slice(1).split('/')[0];
    return YOUTUBE_ID.test(id) ? id : null;
  }

  if (host !== 'youtube.com' && host !== 'youtube-nocookie.com' && host !== 'music.youtube.com') {
    return null;
  }

  // youtube.com/watch?v=VIDEO_ID
  if (url.pathname === '/watch') {
    const v = url.searchParams.get('v');
    return v && YOUTUBE_ID.test(v) ? v : null;
  }

  // youtube.com/(embed|shorts|v|live)/VIDEO_ID
  const match = url.pathname.match(/\/(?:embed|shorts|v|live)\/([A-Za-z0-9_-]{11})/);
  return match ? match[1] : null;
}

/** Vimeo URL → 영상 ID */
function extractVimeoId(url: URL): string | null {
  const host = bareHost(url.hostname);
  if (host !== 'vimeo.com') return null;
  // vimeo.com/76979871 · vimeo.com/channels/staffpicks/76979871 · player.vimeo.com/video/76979871
  const match = url.pathname.match(/(\d{5,})/);
  return match ? match[1] : null;
}

/**
 * 붙여넣은 문자열을 해석합니다. 해석할 수 없으면 null.
 *
 * 지원 입력:
 *   · https://www.youtube.com/watch?v=XXXXXXXXXXX
 *   · https://youtu.be/XXXXXXXXXXX
 *   · https://www.youtube.com/shorts/XXXXXXXXXXX
 *   · https://vimeo.com/76979871
 *   · 영상 ID 만 (XXXXXXXXXXX / 76979871)
 *   · 직접 mp4/webm 링크
 */
export function parseVideoUrl(input: string): VideoInfo | null {
  const raw = (input || '').trim();
  if (!raw) return null;

  // 1) 직접 파일 — blob:/data: 는 예전 업로드 영상과의 호환용입니다.
  if (/^(blob:|data:)/i.test(raw)) {
    return { provider: 'file', videoId: null, embedUrl: raw, thumbnail: null };
  }

  // 2) 스킴이 없는 입력은 https 로 보정해서 해석합니다. (youtu.be/xxx 같은 형태)
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;

  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return null;
  }

  // 3) 직접 파일 링크 (mp4/webm ...)
  if (VIDEO_FILE.test(url.pathname)) {
    return { provider: 'file', videoId: null, embedUrl: raw, thumbnail: null };
  }

  const youtubeId = extractYoutubeId(url);
  if (youtubeId) return youtubeInfo(youtubeId);

  const vimeoId = extractVimeoId(url);
  if (vimeoId) return vimeoInfo(vimeoId);

  // 4) URL 이 아니라 "ID 만" 붙여넣은 경우
  if (!raw.includes('/') && !raw.includes('.') && !raw.includes(' ')) {
    if (/^\d{5,}$/.test(raw)) return vimeoInfo(raw);
    if (YOUTUBE_ID.test(raw)) return youtubeInfo(raw);
  }

  return null;
}

/**
 * Vimeo 썸네일을 oEmbed 로 한 번 조회합니다. (Vimeo 는 썸네일 주소를 규칙으로 알 수 없음)
 * 실패해도 조용히 null 을 돌려주고, 화면은 대체 UI 를 그립니다.
 */
export async function fetchVimeoThumbnail(videoId: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(`https://vimeo.com/${videoId}`)}`,
      { mode: 'cors' }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { thumbnail_url?: string };
    return data.thumbnail_url || null;
  } catch {
    return null;
  }
}

/** 영상 링크인지 간단히 판별 (관리자 폼 검증용) */
export const isSupportedVideoUrl = (input: string) => parseVideoUrl(input) !== null;
