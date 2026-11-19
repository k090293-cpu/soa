import React, { useState, useRef, useMemo } from 'react';
import { Project, ProjectCategory, MediaItem } from '../../types';
import { useStudio } from '../../context/StudioContext';
import { processImageFile } from '../../utils/mediaStorage';
import { parseVideoUrl, VIDEO_PROVIDER_LABEL } from '../../utils/videoEmbed';
import { VideoPlayer } from '../media/VideoPlayer';
import {
  X,
  Upload,
  Trash2,
  Play,
  Plus,
  Loader2,
  Copy,
  Link2,
  Film,
  AlertCircle,
  Check
} from 'lucide-react';

interface ProjectFormModalProps {
  projectToEdit?: Project | null;
  onSave: (data: Omit<Project, 'id'>) => void;
  onClose: () => void;
  /**
   * 새 프로젝트 등록 시 기본으로 선택될 카테고리 key.
   * '카테고리별 포트폴리오 관리' 에서 특정 카테고리를 클릭한 뒤 등록하면
   * 그 카테고리가 그대로 선택된 상태로 폼이 열립니다.
   */
  defaultCategory?: string;
}

export const ProjectFormModal: React.FC<ProjectFormModalProps> = ({
  projectToEdit,
  onSave,
  onClose,
  defaultCategory,
}) => {
  const { menuContent, projects } = useStudio();

  // 관리자에서 관리하는 카테고리 목록 (동적)
  const categories = useMemo(() => {
    const list = menuContent.worksCategories || [];
    if (list.length > 0) return list;
    return [
      { id: 'cat-web', key: 'web', label: '01. WEB DESIGN' },
      { id: 'cat-promotion', key: 'promotion', label: '02. PROMOTION DESIGN' },
      { id: 'cat-video', key: 'video', label: '03. VIDEO DESIGN' },
    ];
  }, [menuContent.worksCategories]);

  const [title, setTitle] = useState(projectToEdit?.title || '');
  const [category, setCategory] = useState<ProjectCategory>(() => {
    // 1) 수정 모드: 기존 프로젝트 카테고리 유지
    if (projectToEdit?.category) return projectToEdit.category;
    // 2) 새 프로젝트: 관리자가 '카테고리별 관리'에서 클릭해 둔 카테고리를 그대로 씁니다.
    //    (그 카테고리가 실제 목록에 존재할 때만)
    if (defaultCategory && categories.some((c) => c.key === defaultCategory)) {
      return defaultCategory as ProjectCategory;
    }
    // 3) 그 외: 첫 번째 카테고리
    return (categories[0]?.key as ProjectCategory) || 'web';
  });
  const [client, setClient] = useState(projectToEdit?.client || '');
  const [year, setYear] = useState(projectToEdit?.year || '2026');
  const [coverImage, setCoverImage] = useState(
    projectToEdit?.image || '/images/portfolio_web_cosmetics_1794358690539.jpg'
  );

  // Multi-Media Gallery (Images & Videos)
  const [gallery, setGallery] = useState<MediaItem[]>(() => {
    if (projectToEdit?.gallery && projectToEdit.gallery.length > 0) {
      return projectToEdit.gallery;
    }
    // Default initial media item
    return [
      {
        id: `media-init-${Date.now()}`,
        type: 'image',
        url: projectToEdit?.image || '/images/portfolio_web_cosmetics_1794358690539.jpg',
        name: '대표 이미지',
        isCover: true,
      },
    ];
  });

  // Other metadata
  const [tagsStr, setTagsStr] = useState(projectToEdit?.tags.join(', ') || '상세페이지, 이커머스, 전환율 +120%');
  const [overview, setOverview] = useState(projectToEdit?.overview || '');
  const [strategy, setStrategy] = useState(projectToEdit?.strategy || '');
  const [concept, setConcept] = useState(projectToEdit?.concept || '');
  const [toolsStr, setToolsStr] = useState(projectToEdit?.tools.join(', ') || 'Figma, Photoshop, Illustrator');
  const [featured, setFeatured] = useState(projectToEdit?.featured || false);

  // Upload status & Drag state
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 기존 업로드 자료 복사(가져오기) 상태
  const [isCopyPanelOpen, setIsCopyPanelOpen] = useState(false);
  const [copySourceId, setCopySourceId] = useState<string>('');

  /*
   * 영상은 이제 파일 업로드가 아니라 링크로 등록합니다.
   *  · 영상 파일은 용량이 커서 브라우저 저장소를 금방 채웁니다.
   *  · 정적 배포에서는 업로드한 영상이 방문자에게 전달되지도 않습니다.
   *  · YouTube/Vimeo 링크는 용량 부담이 0 이고 재생 품질도 보장됩니다.
   */
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [videoNameInput, setVideoNameInput] = useState('');
  const [videoThumbInput, setVideoThumbInput] = useState('');
  const [videoError, setVideoError] = useState('');

  /** 입력 중인 링크의 해석 결과 (미리보기용) */
  const parsedVideoInput = useMemo(() => parseVideoUrl(videoUrlInput), [videoUrlInput]);

  // Preset images for fast testing
  const presetImages = [
    { label: '웹/상세페이지 (Cosmetics)', url: '/images/portfolio_web_cosmetics_1794358690539.jpg' },
    { label: '프로모션 키비주얼 (Tech/Audio)', url: '/images/portfolio_promotion_tech_1794358691610.jpg' },
    { label: '영상/숏폼 모션 (Motion/Reels)', url: '/images/portfolio_video_motion_1794358691788.jpg' },
    { label: '스튜디오 데스크 (Minimal Desk)', url: '/images/hero_design_showcase_1794358690838.jpg' },
  ];

  /** 영상 썸네일 주소 — 관리자 지정값 → 자동 생성값 순서로 사용합니다. */
  const videoThumbFor = (media: MediaItem): string | null => {
    if (media.type !== 'video') return media.url;
    if (media.thumbnail) return media.thumbnail;
    return parseVideoUrl(media.url)?.thumbnail ?? null;
  };

  /** 영상 링크를 갤러리에 추가합니다. */
  const handleAddVideoLink = () => {
    const raw = videoUrlInput.trim();
    const parsed = parseVideoUrl(raw);

    if (!parsed) {
      setVideoError(
        'YouTube 또는 Vimeo 영상 링크를 정확히 입력해 주세요. (예: https://youtu.be/XXXXXXXXXXX)'
      );
      return;
    }

    // 같은 영상을 두 번 등록하지 않도록 방어합니다.
    if (gallery.some((m) => m.type === 'video' && m.url.trim() === raw)) {
      setVideoError('이미 추가된 영상 링크입니다.');
      return;
    }

    const providerLabel = VIDEO_PROVIDER_LABEL[parsed.provider];
    const newItem: MediaItem = {
      id: `media-link-${Date.now()}`,
      type: 'video',
      url: raw,
      name: videoNameInput.trim() || `${providerLabel} 영상`,
      thumbnail: videoThumbInput.trim() || parsed.thumbnail || undefined,
    };

    setGallery((prev) => [...prev, newItem]);
    setVideoUrlInput('');
    setVideoNameInput('');
    setVideoThumbInput('');
    setVideoError('');
  };

  // 이미지 파일만 업로드합니다. (영상은 위의 링크 입력으로 등록)
  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsProcessingFiles(true);

    const newMediaItems: MediaItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // 영상 파일을 끌어다 놓은 경우: 저장소를 낭비하지 않도록 안내하고 건너뜁니다.
      if (file.type.startsWith('video/')) {
        setVideoError('영상은 파일 업로드 대신 아래 “영상 링크 추가”에 YouTube/Vimeo 링크를 넣어 주세요.');
        continue;
      }
      try {
        if (file.type.startsWith('image/')) {
          const imageDataUrl = await processImageFile(file);
          newMediaItems.push({
            id: `media-img-${Date.now()}-${i}`,
            type: 'image',
            url: imageDataUrl,
            name: file.name,
            size: file.size,
            isCover: gallery.length === 0 && i === 0,
          });
        }
      } catch (err) {
        console.error('Error processing uploaded file:', file.name, err);
      }
    }

    if (newMediaItems.length > 0) {
      setGallery((prev) => {
        const updated = [...prev, ...newMediaItems];
        // If no cover image yet, set the first image as cover
        const currentCover = updated.find((m) => m.isCover);
        if (!currentCover) {
          updated[0].isCover = true;
          setCoverImage(updated[0].url);
        }
        return updated;
      });

      // Update coverImage if it's the first upload
      if (!coverImage || coverImage === presetImages[0].url) {
        const firstImg = newMediaItems.find((m) => m.type === 'image');
        if (firstImg) setCoverImage(firstImg.url);
      }
    }

    setIsProcessingFiles(false);
  };

  // Set selected media as cover
  // 대표 커버(카드 썸네일)는 반드시 "이미지"여야 합니다.
  // 영상 링크를 커버로 지정하면 카드에 그림이 표시되지 않으므로 막습니다.
  const handleSetCover = (id: string) => {
    setGallery((prev) => {
      const target = prev.find((item) => item.id === id);
      if (!target || target.type !== 'image') return prev;
      setCoverImage(target.url);
      return prev.map((item) => ({ ...item, isCover: item.id === id }));
    });
  };

    // Remove media from gallery
  const handleRemoveMedia = (id: string) => {
    setGallery((prev) => {
      const filtered = prev.filter((item) => item.id !== id);
      // 대표 커버가 사라졌으면 이미지 중 첫 장을 새 커버로 지정합니다.
      if (filtered.length > 0 && !filtered.some((m) => m.isCover)) {
        const firstImage = filtered.find((m) => m.type === 'image');
        if (firstImage) {
          firstImage.isCover = true;
          setCoverImage(firstImage.url);
        }
      }
      return filtered;
    });
  };

  // 기존 업로드 자료 복사(가져오기)
  const copySourceProject = projects.find((p) => p.id === copySourceId) || null;

  const handleCopyMediaFrom = (sourceId: string) => {
    const source = projects.find((p) => p.id === sourceId);
    if (!source) return;
    const sourceMedia: MediaItem[] =
      source.gallery && source.gallery.length > 0
        ? source.gallery
        : [{ id: 'src-0', type: 'image', url: source.image, name: source.title, isCover: true }];

    const cloned: MediaItem[] = sourceMedia.map((m, i) => ({
      ...m,
      id: `copied-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
      isCover: false,
    }));

    setGallery((prev) => {
      const updated = [...prev, ...cloned];
      if (!updated.some((m) => m.isCover)) {
        updated[0].isCover = true;
        setCoverImage(updated[0].url);
      }
      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const matchedCategory = categories.find((c) => c.key === category);
    const categoryLabel = matchedCategory?.label || category.toUpperCase();

    const tags = tagsStr.split(',').map((t) => t.trim()).filter(Boolean);
    const tools = toolsStr.split(',').map((t) => t.trim()).filter(Boolean);

    // Primary cover image fallback
    const selectedCover = gallery.find((m) => m.isCover && m.type === 'image') || gallery.find((m) => m.type === 'image') || gallery[0];
    const finalCoverUrl = selectedCover?.url || coverImage;

    // Check if there is a video in the gallery for video preview
    const videoItem = gallery.find((m) => m.type === 'video');

    onSave({
      title: title.trim(),
      category,
      categoryLabel,
      client: client.trim(),
      year: year.trim(),
      image: finalCoverUrl,
      gallery: gallery.length > 0 ? gallery : [
        {
          id: `media-default-${Date.now()}`,
          type: 'image',
          url: finalCoverUrl,
          name: title.trim(),
          isCover: true,
        },
      ],
      videoPreviewUrl: videoItem ? videoItem.url : undefined,
      tags: tags.length ? tags : ['디자인', '브랜드'],
      overview: overview.trim() || '신규 프로젝트 개요입니다.',
      strategy: strategy.trim() || '목적에 부합하는 시각적 계층 구조 설계.',
      concept: concept.trim() || 'Editorial Modernism',
      scope: ['기획', '디자인', '검수'],
      tools: tools.length ? tools : ['Figma'],
      featured,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-4xl bg-[var(--app-surface)] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-[var(--app-surface-glass)]">
          <div>
            <h3 className="text-base font-bold text-white">
              {projectToEdit ? '포트폴리오 프로젝트 수정' : '새 포트폴리오 프로젝트 등록'}
            </h3>
            <p className="text-[11px] text-zinc-400">내 컴퓨터의 이미지 및 동영상 파일을 여러 장 직접 첨부할 수 있습니다.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-7 max-h-[82vh] overflow-y-auto">
          {/* SECTION 1: 이미지 업로드 + 영상 링크 등록 */}
          <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                  <Upload className="w-4 h-4" />
                  <span>배너·상세페이지 이미지 첨부</span>
                </span>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  JPG, PNG, GIF, WebP 이미지를 여러 장 선택해 첨부하세요. 여러 장이면 방문자가 좌우로 넘겨 볼 수 있습니다.
                </p>
              </div>
              <span className="text-xs font-mono text-zinc-400">
                첨부됨: <strong className="text-blue-400">{gallery.length}개</strong>
              </span>
            </div>

            {/* Drag & Drop Upload Zone (이미지 전용) */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                handleFilesSelected(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-150 ${
                isDragging
                  ? 'border-blue-500 bg-blue-950/20'
                  : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/30 hover:bg-zinc-900/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFilesSelected(e.target.files)}
                className="hidden"
              />

              {isProcessingFiles ? (
                <div className="flex flex-col items-center justify-center space-y-2 py-3">
                  <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                  <span className="text-xs text-zinc-300 font-medium">선택한 이미지를 최적화 처리 중입니다...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-2 py-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-950/50 border border-blue-900/60 flex items-center justify-center text-blue-400">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      클릭하여 이미지 선택 또는 여기로 드래그
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      사진 여러 장 동시 선택 가능 · 영상은 아래 링크로 등록
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 영상 링크 등록 (YouTube / Vimeo) */}
            <div className="pt-4 border-t border-zinc-850 space-y-3">
              <div>
                <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                  <Film className="w-4 h-4" />
                  <span>영상 링크 추가 (YouTube / Vimeo)</span>
                </span>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  영상은 파일 업로드 대신 YouTube·Vimeo 에 올린 뒤 링크만 붙여넣으세요. 썸네일이 먼저 보이고, 방문자가 누르면 재생됩니다.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Link2 className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={videoUrlInput}
                      onChange={(e) => {
                        setVideoUrlInput(e.target.value);
                        setVideoError('');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddVideoLink();
                        }
                      }}
                      placeholder="https://youtu.be/XXXXXXXXXXX 또는 https://vimeo.com/76979871"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddVideoLink}
                    disabled={!videoUrlInput.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0"
                  >
                    영상 링크 추가
                  </button>
                </div>

                {/* 링크를 입력하는 즉시 해석 결과를 알려 줍니다. */}
                {videoUrlInput.trim() && (
                  <p
                    className={`text-[11px] flex items-center gap-1.5 ${
                      parsedVideoInput ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {parsedVideoInput ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>{VIDEO_PROVIDER_LABEL[parsedVideoInput.provider]} 링크로 인식되었습니다.</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3 h-3" />
                        <span>YouTube 또는 Vimeo 링크 형식이 아닙니다.</span>
                      </>
                    )}
                  </p>
                )}

                {videoError && (
                  <p className="text-[11px] text-red-400 flex items-start gap-1.5">
                    <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                    <span>{videoError}</span>
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={videoNameInput}
                    onChange={(e) => setVideoNameInput(e.target.value)}
                    placeholder="영상 제목 (선택, 예: 캠페인 메인 필름)"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="text"
                    value={videoThumbInput}
                    onChange={(e) => setVideoThumbInput(e.target.value)}
                    placeholder="썸네일 이미지 주소 (선택, 비우면 자동)"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* 링크 미리보기 — 실제 방문자가 보게 될 모습 */}
                {parsedVideoInput && (
                  <div className="pt-1">
                    <p className="text-[10px] text-zinc-500 mb-1.5">미리보기 (방문자 화면과 동일)</p>
                    <div className="max-w-sm">
                      <VideoPlayer
                        url={videoUrlInput.trim()}
                        thumbnail={videoThumbInput.trim() || undefined}
                        title={videoNameInput.trim() || '영상 미리보기'}
                        aspectClassName="aspect-video"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Uploaded Gallery Thumbnails Grid */}
            {gallery.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="text-[11px] font-semibold text-zinc-400 flex items-center justify-between">
                  <span>첨부된 미디어 목록 (★ 대표 커버로 지정 가능)</span>
                  <span className="text-zinc-500">마우스 호버 시 삭제/커버 지정</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {gallery.map((media) => (
                    <div
                      key={media.id}
                      className={`relative rounded-xl overflow-hidden border group bg-zinc-900 aspect-video flex items-center justify-center ${
                        media.isCover ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-zinc-800'
                      }`}
                    >
                      {media.type === 'video' ? (
                        <div className="w-full h-full relative bg-black flex items-center justify-center">
                          {/* 영상은 video 태그로 로드하지 않고 썸네일 이미지를 씁니다.
                              (video 태그를 여러 개 두면 관리자 화면이 무거워집니다) */}
                          {videoThumbFor(media) ? (
                            <img
                              src={videoThumbFor(media)!}
                              alt={media.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <Film className="w-7 h-7 text-zinc-600" />
                          )}
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Play className="w-6 h-6 text-white drop-shadow" />
                          </div>
                          <span className="absolute bottom-1.5 left-1.5 bg-black/80 text-[10px] text-blue-400 font-mono px-1.5 py-0.5 rounded border border-blue-900">
                            VIDEO
                          </span>
                        </div>
                      ) : (
                        <div className="w-full h-full relative">
                          <img
                            src={media.url}
                            alt={media.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <span className="absolute bottom-1.5 left-1.5 bg-black/80 text-[10px] text-zinc-300 font-mono px-1.5 py-0.5 rounded border border-zinc-800">
                            IMG
                          </span>
                        </div>
                      )}

                      {/* Cover Badge */}
                      {media.isCover && (
                        <span className="absolute top-1.5 left-1.5 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
                          ★ 대표 커버
                        </span>
                      )}

                      {/* Hover Action Buttons */}
                      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                        {!media.isCover && (
                          <button
                            type="button"
                            onClick={() => handleSetCover(media.id)}
                            className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-medium rounded-lg transition-colors cursor-pointer"
                            title="대표 커버로 설정"
                          >
                            커버 설정
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveMedia(media.id)}
                          className="p-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-lg transition-colors cursor-pointer"
                          title="삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Presets (Optional) */}
            <div className="pt-2 border-t border-zinc-850 flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-zinc-500">샘플 프리셋 추가:</span>
              {presetImages.map((p, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => {
                    const newItem: MediaItem = {
                      id: `preset-${Date.now()}-${i}`,
                      type: 'image',
                      url: p.url,
                      name: p.label,
                      isCover: gallery.length === 0,
                    };
                    setGallery((prev) => [...prev, newItem]);
                  }}
                  className="text-[11px] px-2 py-0.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-white rounded border border-zinc-800 transition-colors"
                >
                  + {p.label}
                </button>
              ))}
            </div>

            {/* 기 존 업로드 자료 복사 (Copy from existing project) */}
            <div className="pt-3 border-t border-zinc-850 space-y-2.5">
              <button
                type="button"
                onClick={() => setIsCopyPanelOpen(!isCopyPanelOpen)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Copy className="w-3.5 h-3.5 text-blue-400" />
                  <span>기존 업로드 자료 복사해서 가져오기</span>
                </span>
                <span className="text-[11px] text-zinc-500">
                  {isCopyPanelOpen ? '접기 ▲' : '펼치기 ▼'}
                </span>
              </button>

              {isCopyPanelOpen && (
                <div className="p-3 rounded-lg bg-zinc-900/50 border border-zinc-800 space-y-2.5">
                  {projects.length === 0 ? (
                    <p className="text-[11px] text-zinc-500 text-center py-2">
                      복사할 기존 프로젝트가 없습니다.
                    </p>
                  ) : (
                    <>
                      <div className="space-y-1">
                        <label className="text-[11px] text-zinc-400">복사할 원본 프로젝트 선택</label>
                        <select
                          value={copySourceId}
                          onChange={(e) => setCopySourceId(e.target.value)}
                          className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white focus:outline-none focus:border-blue-500"
                        >
                          <option value="">— 프로젝트를 선택하세요 —</option>
                          {projects.map((p) => {
                            const cnt = p.gallery?.length || 1;
                            return (
                              <option key={p.id} value={p.id}>
                                {p.title} · {p.categoryLabel} ({cnt}개 미디어)
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      {copySourceProject && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-zinc-400">
                              가져올 미디어:{' '}
                              <strong className="text-blue-400">
                                {(copySourceProject.gallery?.length || 0) > 0 ? copySourceProject.gallery!.length : 1}개
                              </strong>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyMediaFrom(copySourceProject.id)}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold rounded transition-colors cursor-pointer"
                            >
                              이 미디어 전체 복사
                            </button>
                          </div>
                          <div className="flex items-center gap-2 overflow-x-auto pb-1">
                            {(copySourceProject.gallery && copySourceProject.gallery.length > 0
                              ? copySourceProject.gallery
                              : [{ id: 'preview', type: 'image' as const, url: copySourceProject.image, name: copySourceProject.title }]
                            ).map((m, i) => (
                              <div
                                key={i}
                                className="relative w-16 h-12 shrink-0 rounded overflow-hidden border border-zinc-700 bg-black"
                              >
                                {m.type === 'video' ? (
                                  <video src={m.url} className="w-full h-full object-cover" muted />
                                ) : (
                                  <img src={m.url} alt={m.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <p className="text-[10px] text-zinc-500 leading-relaxed">
                        ※ 복사된 미디어는 현재 프로젝트의 갤러리에 추가되며, 원본 프로젝트에는 영향이 없습니다.
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* SECTION 2: Project Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">프로젝트명 (영문/대문자 추천)</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예: AURÉLIA BOTANICALS"
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">카테고리</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProjectCategory)}
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                {categories.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                    {c.desc ? ` (${c.desc})` : ''}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-zinc-500">
                카테고리 목록은 [메뉴 & 카테고리 관리] 탭에서 추가·수정할 수 있습니다.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">클라이언트명</label>
              <input
                type="text"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                placeholder="예: Aurélia Paris Korea"
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">제작 연도</label>
              <input
                type="text"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2026"
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          {/* SECTION 5: Overview, Strategy */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">프로젝트 개요 (Overview)</label>
              <textarea
                rows={3}
                value={overview}
                onChange={(e) => setOverview(e.target.value)}
                placeholder="프로젝트 배경 및 목적"
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">디자인 전략 (Strategy)</label>
              <textarea
                rows={3}
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
                placeholder="기획 방향 및 해결 솔루션"
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* SECTION 5-2: Concept & Featured */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">디자인 콘셉트 (Concept)</label>
              <input
                type="text"
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                placeholder="예: Natural Luxury & Clinical Purity"
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="w-3.5 h-3.5 rounded accent-blue-600 cursor-pointer"
              />
              <span className="text-xs text-zinc-300">대표 프로젝트로 표시</span>
            </label>
          </div>

          {/* SECTION 6: Tags & Tools */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">태그 (쉼표로 구분)</label>
              <input
                type="text"
                value={tagsStr}
                onChange={(e) => setTagsStr(e.target.value)}
                placeholder="상세페이지, 이커머스, 전환율 +120%"
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">사용 툴 (쉼표로 구분)</label>
              <input
                type="text"
                value={toolsStr}
                onChange={(e) => setToolsStr(e.target.value)}
                placeholder="Figma, Photoshop, After Effects"
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
            <span className="text-xs text-zinc-400">
              {gallery.length}개의 미디어 에셋이 저장됩니다.
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isProcessingFiles}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-lg shadow-blue-600/30 flex items-center gap-2 disabled:opacity-50"
              >
                {isProcessingFiles && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{projectToEdit ? '변경사항 저장하기' : '프로젝트 등록 완료'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
