import React, { useEffect, useState } from 'react';
import { Play, Film } from 'lucide-react';
import {
  parseVideoUrl,
  fetchVimeoThumbnail,
  VIDEO_PROVIDER_LABEL,
  type VideoInfo,
} from '../../utils/videoEmbed';

interface VideoPlayerProps {
  /** YouTube / Vimeo 링크, 영상 ID, 또는 영상 파일 주소 */
  url: string;
  /** 재생 전에 보여줄 썸네일 (없으면 자동 생성/대체 UI) */
  thumbnail?: string;
  /** 접근성 라벨 · 대체 UI 에 쓰는 제목 */
  title: string;
  /** 영상 영역 비율 클래스 (기본 16:9) */
  aspectClassName?: string;
  /** 재생 시작 상태를 부모가 제어하고 싶을 때 (라이트박스에서 사용) */
  autoPlay?: boolean;
  className?: string;
}

/**
 * 영상 재생 컴포넌트 — **썸네일을 먼저 보여주고, 눌렀을 때만 재생**합니다.
 *
 * 왜 이렇게 하나:
 *  · 영상 링크(iframe)를 페이지 로드 시점에 바로 띄우면 영상이 여러 개일 때
 *    로딩이 크게 느려지고, YouTube 추천 영상 등 불필요한 요청이 발생합니다.
 *  · 썸네일만 먼저 그려 두고 클릭 시 iframe 을 붙이면
 *    첫 화면이 가볍고, 사용자가 원할 때만 재생됩니다.
 */
export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  url,
  thumbnail,
  title,
  aspectClassName = 'aspect-video',
  autoPlay = false,
  className = '',
}) => {
  const info: VideoInfo | null = React.useMemo(() => parseVideoUrl(url), [url]);

  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [vimeoThumb, setVimeoThumb] = useState<string | null>(null);

  // URL 이 바뀌면 재생 상태를 초기화합니다. (같은 컴포넌트가 다른 영상을 받을 수 있음)
  useEffect(() => {
    setIsPlaying(autoPlay);
  }, [url, autoPlay]);

  // Vimeo 는 썸네일 주소를 규칙으로 알 수 없어 oEmbed 로 한 번 조회합니다.
  useEffect(() => {
    if (!info || info.provider !== 'vimeo' || !info.videoId) return;
    if (thumbnail || info.thumbnail) return;

    let cancelled = false;
    void fetchVimeoThumbnail(info.videoId).then((thumb) => {
      if (!cancelled && thumb) setVimeoThumb(thumb);
    });
    return () => {
      cancelled = true;
    };
  }, [info, thumbnail]);

  /* ── 해석할 수 없는 링크: 링크를 그대로 열어 주는 대체 UI ───────────── */
  if (!info) {
    return (
      <div
        data-theme="dark"
        className={`${aspectClassName} w-full rounded-2xl border border-zinc-800 bg-zinc-950 flex flex-col items-center justify-center gap-3 p-6 text-center ${className}`}
      >
        <Film className="w-8 h-8 text-zinc-600" />
        <p className="text-xs text-zinc-400">영상 링크를 재생할 수 없습니다.</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2"
        >
          원본 링크 열기
        </a>
      </div>
    );
  }

  /* ── 재생 중 ──────────────────────────────────────────────────────── */
  if (isPlaying) {
    return (
      <div
        data-theme="dark"
        className={`${aspectClassName} w-full rounded-2xl overflow-hidden border border-zinc-800 bg-black ${className}`}
      >
        {info.provider === 'file' ? (
          <video
            key={info.embedUrl}
            src={info.embedUrl}
            controls
            autoPlay
            playsInline
            poster={thumbnail}
            className="w-full h-full object-contain bg-black"
          >
            <track kind="captions" />
          </video>
        ) : (
          <iframe
            key={info.embedUrl}
            src={info.embedUrl}
            title={title}
            className="w-full h-full"
            // YouTube/Vimeo 재생에 필요한 최소 권한만 허용합니다.
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        )}
      </div>
    );
  }

  /* ── 재생 전: 썸네일 + 재생 버튼 ──────────────────────────────────── */
  const poster = thumbnail || info.thumbnail || vimeoThumb;

  return (
    <button
      type="button"
      data-theme="dark"
      onClick={() => setIsPlaying(true)}
      aria-label={`${title} 재생`}
      className={`${aspectClassName} group relative w-full rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 cursor-pointer ${className}`}
    >
      {poster ? (
        <img
          src={poster}
          alt={`${title} 썸네일`}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
      ) : (
        /* 썸네일을 못 구한 경우 (예: Vimeo 조회 실패) — 깔끔한 대체 배경 */
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black flex items-center justify-center">
          <Film className="w-12 h-12 text-zinc-700" />
        </div>
      )}

      {/* 가독성을 위한 어두운 그라디언트 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/20" />

      {/* 중앙 재생 버튼 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/95 text-zinc-900 shadow-2xl transition-transform duration-300 group-hover:scale-110">
          <Play className="w-7 h-7 sm:w-8 sm:h-8 ml-1 fill-current" />
        </span>
      </div>

      {/* 하단: 재생 안내 + 제공자 표시 */}
      <div className="absolute bottom-0 inset-x-0 flex items-end justify-between gap-3 p-4 text-left">
        <span className="text-xs font-semibold text-white drop-shadow">
          영상 재생하기
        </span>
        <span className="text-[10px] font-mono text-zinc-300 bg-black/70 backdrop-blur-md px-2 py-1 rounded border border-zinc-700">
          {VIDEO_PROVIDER_LABEL[info.provider]}
        </span>
      </div>
    </button>
  );
};
