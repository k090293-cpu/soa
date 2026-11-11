import React, { useState, useRef } from 'react';
import { Project, ProjectCategory, MediaItem } from '../../types';
import { processImageFile, processVideoFile, saveMediaGalleryToDB } from '../../utils/mediaStorage';
import {
  X,
  CheckCircle2,
  Upload,
  Video,
  Image as ImageIcon,
  Trash2,
  Star,
  Play,
  FileVideo,
  Plus,
  AlertCircle,
  Loader2,
  Sparkles
} from 'lucide-react';

interface ProjectFormModalProps {
  projectToEdit?: Project | null;
  onSave: (data: Omit<Project, 'id'>) => void;
  onClose: () => void;
}

export const ProjectFormModal: React.FC<ProjectFormModalProps> = ({
  projectToEdit,
  onSave,
  onClose,
}) => {
  const [title, setTitle] = useState(projectToEdit?.title || '');
  const [subtitle, setSubtitle] = useState(projectToEdit?.subtitle || '');
  const [category, setCategory] = useState<ProjectCategory>(projectToEdit?.category || 'web');
  const [client, setClient] = useState(projectToEdit?.client || '');
  const [year, setYear] = useState(projectToEdit?.year || '2026');
  const [summary, setSummary] = useState(projectToEdit?.summary || '');
  const [coverImage, setCoverImage] = useState(
    projectToEdit?.image || '/src/assets/images/portfolio_web_cosmetics_1794358690539.jpg'
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
        url: projectToEdit?.image || '/src/assets/images/portfolio_web_cosmetics_1794358690539.jpg',
        name: '대표 이미지',
        isCover: true,
      },
    ];
  });

  // Before & After upload states
  const [hasBeforeAfter, setHasBeforeAfter] = useState(!!projectToEdit?.beforeAfter);
  const [beforeImage, setBeforeImage] = useState(projectToEdit?.beforeAfter?.beforeImage || '');
  const [afterImage, setAfterImage] = useState(projectToEdit?.beforeAfter?.afterImage || '');
  const [beforeNotes, setBeforeNotes] = useState(projectToEdit?.beforeAfter?.beforeNotes || '기존: 산만한 정보 배치 및 모바일 가독성 저하');
  const [afterNotes, setAfterNotes] = useState(projectToEdit?.beforeAfter?.afterNotes || '개선 후: 에디토리얼 레이아웃과 데이터 시각화로 전환율 극대화');

  // Other metadata
  const [tagsStr, setTagsStr] = useState(projectToEdit?.tags.join(', ') || '상세페이지, 이커머스, 전환율 +120%');
  const [metricValue, setMetricValue] = useState(projectToEdit?.impactMetric?.value || '+148%');
  const [metricLabel, setMetricLabel] = useState(projectToEdit?.impactMetric?.label || '구매 전환율 (CVR)');
  const [metricDetail, setMetricDetail] = useState(projectToEdit?.impactMetric?.detail || '동일 카테고리 대비 성과 급증');
  const [overview, setOverview] = useState(projectToEdit?.overview || '');
  const [strategy, setStrategy] = useState(projectToEdit?.strategy || '');
  const [concept, setConcept] = useState(projectToEdit?.concept || '');
  const [deliverablesStr, setDeliverablesStr] = useState(
    projectToEdit?.deliverables.join('\n') || '풀사이즈 상세페이지 (PC/Mobile)\n메인 배너 세트'
  );
  const [toolsStr, setToolsStr] = useState(projectToEdit?.tools.join(', ') || 'Figma, Photoshop, Illustrator');
  const [featured, setFeatured] = useState(projectToEdit?.featured || false);

  // Upload status & Drag state
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const beforeFileInputRef = useRef<HTMLInputElement>(null);
  const afterFileInputRef = useRef<HTMLInputElement>(null);

  // Preset images for fast testing
  const presetImages = [
    { label: '웹/상세페이지 (Cosmetics)', url: '/src/assets/images/portfolio_web_cosmetics_1794358690539.jpg' },
    { label: '프로모션 키비주얼 (Tech/Audio)', url: '/src/assets/images/portfolio_promotion_tech_1794358691610.jpg' },
    { label: '영상/숏폼 모션 (Motion/Reels)', url: '/src/assets/images/portfolio_video_motion_1794358691788.jpg' },
    { label: '스튜디오 데스크 (Minimal Desk)', url: '/src/assets/images/hero_design_showcase_1794358690838.jpg' },
  ];

  // Handle Local File Upload (Images & Videos)
  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsProcessingFiles(true);

    const newMediaItems: MediaItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        if (file.type.startsWith('video/')) {
          const videoDataUrl = await processVideoFile(file);
          newMediaItems.push({
            id: `media-vid-${Date.now()}-${i}`,
            type: 'video',
            url: videoDataUrl,
            name: file.name,
            size: file.size,
            isCover: gallery.length === 0 && i === 0,
          });
        } else if (file.type.startsWith('image/')) {
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
  const handleSetCover = (id: string) => {
    setGallery((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          setCoverImage(item.url);
          return { ...item, isCover: true };
        }
        return { ...item, isCover: false };
      })
    );
  };

  // Remove media from gallery
  const handleRemoveMedia = (id: string) => {
    setGallery((prev) => {
      const filtered = prev.filter((item) => item.id !== id);
      if (filtered.length > 0 && !filtered.some((m) => m.isCover)) {
        filtered[0].isCover = true;
        setCoverImage(filtered[0].url);
      }
      return filtered;
    });
  };

  // Upload Before Image
  const handleBeforeFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const dataUrl = await processImageFile(file);
      setBeforeImage(dataUrl);
    }
  };

  // Upload After Image
  const handleAfterFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const dataUrl = await processImageFile(file);
      setAfterImage(dataUrl);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let categoryLabel = '01. WEB DESIGN';
    if (category === 'promotion') categoryLabel = '02. PROMOTION DESIGN';
    if (category === 'video') categoryLabel = '03. VIDEO DESIGN';

    const tags = tagsStr.split(',').map((t) => t.trim()).filter(Boolean);
    const deliverables = deliverablesStr.split('\n').map((d) => d.trim()).filter(Boolean);
    const tools = toolsStr.split(',').map((t) => t.trim()).filter(Boolean);

    // Primary cover image fallback
    const selectedCover = gallery.find((m) => m.isCover && m.type === 'image') || gallery.find((m) => m.type === 'image') || gallery[0];
    const finalCoverUrl = selectedCover?.url || coverImage;

    // Check if there is a video in the gallery for video preview
    const videoItem = gallery.find((m) => m.type === 'video');

    onSave({
      title: title.trim(),
      subtitle: subtitle.trim(),
      category,
      categoryLabel,
      client: client.trim(),
      year: year.trim(),
      summary: summary.trim(),
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
      impactMetric: {
        value: metricValue.trim(),
        label: metricLabel.trim(),
        detail: metricDetail.trim(),
      },
      overview: overview.trim() || '신규 프로젝트 개요입니다.',
      strategy: strategy.trim() || '목적에 부합하는 시각적 계층 구조 설계.',
      concept: concept.trim() || 'Editorial Modernism',
      scope: ['기획', '디자인', '검수'],
      deliverables: deliverables.length ? deliverables : ['최종 결과물 소스'],
      tools: tools.length ? tools : ['Figma'],
      featured,
      beforeAfter: hasBeforeAfter && beforeImage && afterImage ? {
        beforeImage,
        afterImage,
        beforeNotes,
        afterNotes,
      } : undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-4xl bg-[#0e0f14] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-[#0e0f14]/90">
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
          {/* SECTION 1: Local Multi-Image & Video Uploader */}
          <div className="p-5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                  <Upload className="w-4 h-4" />
                  <span>내 컴퓨터 이미지 & 동영상 다중 첨부 (Gallery)</span>
                </span>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  JPG, PNG, GIF, WebP 이미지 및 MP4, WebM 영상 파일을 여러 장 선택하여 업로드하세요.
                </p>
              </div>
              <span className="text-xs font-mono text-zinc-400">
                첨부됨: <strong className="text-blue-400">{gallery.length}개</strong>
              </span>
            </div>

            {/* Drag & Drop Upload Zone */}
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
                accept="image/*,video/*"
                onChange={(e) => handleFilesSelected(e.target.files)}
                className="hidden"
              />

              {isProcessingFiles ? (
                <div className="flex flex-col items-center justify-center space-y-2 py-3">
                  <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                  <span className="text-xs text-zinc-300 font-medium">선택한 미디어 파일을 최적화 처리 중입니다...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-2 py-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-950/50 border border-blue-900/60 flex items-center justify-center text-blue-400">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      클릭하여 내 컴퓨터에서 파일 선택 또는 여기로 드래그
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      사진 여러 장 동시 선택 가능 · 동영상(MP4/WebM) 첨부 지원
                    </span>
                  </div>
                </div>
              )}
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
                          <video
                            src={media.url}
                            className="w-full h-full object-cover"
                            muted
                            playsInline
                          />
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
                <option value="web">01. WEB DESIGN (웹/상세페이지)</option>
                <option value="promotion">02. PROMOTION DESIGN (프로모션/배너)</option>
                <option value="video">03. VIDEO DESIGN (숏폼/영상)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">부제목 (한 줄 핵심 설명)</label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="예: 프리미엄 보태니컬 세럼 론칭 상세페이지 & 커머스 UI"
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-blue-500"
              required
            />
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

          {/* SECTION 3: Impact Metric */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
            <span className="text-xs font-bold text-blue-400">성과 지표 (Impact Metric)</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] text-zinc-400">수치 (Value)</label>
                <input
                  type="text"
                  value={metricValue}
                  onChange={(e) => setMetricValue(e.target.value)}
                  placeholder="+148%"
                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-white"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-zinc-400">지표명 (Label)</label>
                <input
                  type="text"
                  value={metricLabel}
                  onChange={(e) => setMetricLabel(e.target.value)}
                  placeholder="구매 전환율"
                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-white"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-zinc-400">세부 설명 (Detail)</label>
                <input
                  type="text"
                  value={metricDetail}
                  onChange={(e) => setMetricDetail(e.target.value)}
                  placeholder="카테고리 평균 대비 성과"
                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-white"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: Before & After Upload (Optional) */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasBeforeAfter}
                  onChange={(e) => setHasBeforeAfter(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-900 text-blue-600 focus:ring-0"
                />
                <span className="text-xs font-bold text-zinc-200">Before & After 비교 슬라이더 포함</span>
              </label>
              <span className="text-[11px] text-zinc-500">개선 전후를 드래그 슬라이더로 보여줍니다</span>
            </div>

            {hasBeforeAfter && (
              <div className="space-y-3 pt-2 border-t border-zinc-850">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Before Upload */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-semibold text-zinc-400">Before (개선 전 이미지)</span>
                    <input
                      ref={beforeFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleBeforeFileSelected}
                      className="hidden"
                    />
                    <div
                      onClick={() => beforeFileInputRef.current?.click()}
                      className="border border-dashed border-zinc-800 rounded-lg p-3 text-center cursor-pointer hover:border-zinc-700 bg-zinc-900/40"
                    >
                      {beforeImage ? (
                        <img src={beforeImage} alt="Before" className="h-20 w-auto mx-auto rounded object-cover" />
                      ) : (
                        <div className="text-[11px] text-zinc-400 py-2">클릭하여 Before 이미지 업로드</div>
                      )}
                    </div>
                    <input
                      type="text"
                      value={beforeNotes}
                      onChange={(e) => setBeforeNotes(e.target.value)}
                      placeholder="개선 전 문제점 메모"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300"
                    />
                  </div>

                  {/* After Upload */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-semibold text-blue-400">After (개선 후 완성 이미지)</span>
                    <input
                      ref={afterFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAfterFileSelected}
                      className="hidden"
                    />
                    <div
                      onClick={() => afterFileInputRef.current?.click()}
                      className="border border-dashed border-blue-900/60 rounded-lg p-3 text-center cursor-pointer hover:border-blue-800 bg-blue-950/20"
                    >
                      {afterImage ? (
                        <img src={afterImage} alt="After" className="h-20 w-auto mx-auto rounded object-cover" />
                      ) : (
                        <div className="text-[11px] text-blue-300 py-2">클릭하여 After 완성 이미지 업로드</div>
                      )}
                    </div>
                    <input
                      type="text"
                      value={afterNotes}
                      onChange={(e) => setAfterNotes(e.target.value)}
                      placeholder="개선 후 디자인 솔루션 메모"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 5: Summary, Overview, Strategy */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">요약 설명 (카드 노출용)</label>
            <textarea
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="프로젝트의 주요 내용과 핵심 성과를 2줄 내외로 기술하세요."
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>

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

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">산출물 목록 (줄바꿈으로 구분)</label>
            <textarea
              rows={2}
              value={deliverablesStr}
              onChange={(e) => setDeliverablesStr(e.target.value)}
              placeholder="상세페이지 PC/Mobile&#10;SNS 배너 5종"
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-blue-500"
            />
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
