import React, { useRef, useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import { HomeLayer, HomeLayerType } from '../../types';
import { processImageFile } from '../../utils/mediaStorage';
import {
  Layers,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Type,
  Image as ImageIcon,
  Badge,
  Crosshair,
  Copy,
} from 'lucide-react';

/** 새 레이어 기본값 */
const createDefaultLayer = (type: HomeLayerType): Omit<HomeLayer, 'id'> => {
  const base = {
    type,
    content:
      type === 'image'
        ? ''
        : type === 'badge'
        ? 'NEW · 신규 프로젝트 접수 중'
        : '새 레이어 문구를 입력하세요',
    x: 8,
    y: 12,
    width: type === 'image' ? 32 : 40,
    fontSize: type === 'badge' ? 13 : 28,
    color: type === 'badge' ? '#3b82f6' : '#ffffff',
    align: 'left' as const,
    rotation: 0,
    opacity: 100,
    visible: true,
    bold: true,
  };
  return base;
};

export const LayerPanel: React.FC = () => {
  const {
    menuContent,
    addHomeLayer,
    updateHomeLayer,
    deleteHomeLayer,
    moveHomeLayer,
    resetHomeLayers,
    selectedHomeLayerId,
    setSelectedHomeLayerId,
    isHomeInlineEditMode,
    setIsHomeInlineEditMode,
  } = useStudio();

  const layers = menuContent.home.layers || [];
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [pendingUploadTarget, setPendingUploadTarget] = useState<string | null>(null);

  const handleAddLayer = (type: HomeLayerType) => {
    if (type === 'image') {
      // 이미지 레이어: 파일 선택 → 선택한 레이어에 URL 채우기
      setPendingUploadTarget('new');
      fileInputRef.current?.click();
      return;
    }
    const id = addHomeLayer(createDefaultLayer(type));
    setSelectedHomeLayerId(id);
    setIsHomeInlineEditMode(true);
  };

  const handleReplaceImage = (layerId: string) => {
    setPendingUploadTarget(layerId);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImageError(null);
    if (!file.type.startsWith('image/')) {
      setImageError('이미지 파일만 업로드할 수 있습니다.');
      return;
    }
    try {
      const dataUrl = await processImageFile(file);
      if (pendingUploadTarget === 'new') {
        const id = addHomeLayer({ ...createDefaultLayer('image'), content: dataUrl });
        setSelectedHomeLayerId(id);
      } else if (pendingUploadTarget) {
        updateHomeLayer(pendingUploadTarget, { content: dataUrl });
      }
      setIsHomeInlineEditMode(true);
    } catch (err) {
      console.error('레이어 이미지 업로드 실패', err);
      setImageError('이미지를 불러오지 못했습니다. 다른 파일로 시도해 주세요.');
    } finally {
      setPendingUploadTarget(null);
    }
  };

  const typeMeta: Record<HomeLayerType, { label: string; icon: React.ElementType; color: string }> = {
    text: { label: 'TEXT', icon: Type, color: 'text-blue-400' },
    badge: { label: 'BADGE', icon: Badge, color: 'text-amber-400' },
    image: { label: 'IMAGE', icon: ImageIcon, color: 'text-emerald-400' },
  };

  return (
    <div className="space-y-4">
      {/* 헤더 + 편집 모드 토글 */}
      <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
            <div>
              <strong className="text-white text-xs block">홈 직접 편집 · 커스텀 레이어</strong>
              <span className="text-[11px] text-zinc-400">
                홈이 옆에 표시됩니다. 글자를 클릭해 바로 수정하고, 레이어를 추가/이동/삭제하세요.
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsHomeInlineEditMode(!isHomeInlineEditMode)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 ${
              isHomeInlineEditMode
                ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>{isHomeInlineEditMode ? '직접 편집 ON' : '직접 편집 OFF'}</span>
          </button>
        </div>

        {imageError && (
          <p className="text-[11px] text-red-400 bg-red-950/40 border border-red-900/60 rounded-lg px-2.5 py-1.5">
            {imageError}
          </p>
        )}

        {/* 레이어 추가 버튼 */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <button
            onClick={() => handleAddLayer('text')}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <Type className="w-3.5 h-3.5" />
            <span>텍스트 레이어</span>
          </button>
          <button
            onClick={() => handleAddLayer('badge')}
            className="px-3 py-1.5 bg-amber-950/60 hover:bg-amber-900/70 text-amber-300 border border-amber-800/80 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <Badge className="w-3.5 h-3.5" />
            <span>배지 레이어</span>
          </button>
          <button
            onClick={() => handleAddLayer('image')}
            className="px-3 py-1.5 bg-emerald-950/60 hover:bg-emerald-900/70 text-emerald-300 border border-emerald-800/80 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <ImageIcon className="w-3.5 h-3.5" />
            <span>이미지 레이어</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {layers.length > 0 && (
            <button
              onClick={() => {
                if (confirm(`레이어 ${layers.length}개를 모두 삭제하시겠습니까?`)) resetHomeLayers();
              }}
              className="ml-auto px-2.5 py-1.5 bg-zinc-900 hover:bg-red-950 text-zinc-500 hover:text-red-400 border border-zinc-800 text-[11px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>전체 삭제</span>
            </button>
          )}
        </div>
      </div>

      {/* 레이어 목록 */}
      {layers.length === 0 ? (
        <div className="p-10 text-center rounded-2xl bg-zinc-950 border border-dashed border-zinc-850 space-y-2">
          <Layers className="w-6 h-6 text-zinc-600 mx-auto" />
          <p className="text-xs text-zinc-500">아직 만든 레이어가 없습니다.</p>
          <p className="text-[11px] text-zinc-600">
            위 버튼으로 텍스트·배지·이미지 레이어를 추가해 홈 화면 위에 배치해 보세요.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] text-zinc-500">
            <span>레이어 목록 · 총 {layers.length}개</span>
            <span>홈에서 드래그해 위치를 옮길 수 있습니다</span>
          </div>

          {layers.map((layer, idx) => {
            const meta = typeMeta[layer.type];
            const Icon = meta.icon;
            const isSelected = selectedHomeLayerId === layer.id;
            return (
              <div
                key={layer.id}
                className={`p-3 rounded-xl border transition-colors ${
                  isSelected
                    ? 'bg-blue-950/30 border-blue-700/70'
                    : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {/* 레이어 요약 행 */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedHomeLayerId(isSelected ? null : layer.id)}
                    className="flex items-center gap-2 flex-1 min-w-0 text-left cursor-pointer"
                  >
                    <span
                      className={`w-6 h-6 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 ${meta.color}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <span className="min-w-0">
                      <span className="text-[10px] font-mono text-zinc-500 block leading-none">
                        {meta.label} #{idx + 1}
                      </span>
                      <span className="text-xs text-zinc-200 truncate block">
                        {layer.type === 'image'
                          ? layer.content
                            ? '업로드된 이미지'
                            : '이미지 미선택'
                          : layer.content || '(빈 문구)'}
                      </span>
                    </span>
                  </button>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => updateHomeLayer(layer.id, { visible: !layer.visible })}
                      className="p-1.5 rounded text-zinc-500 hover:text-white hover:bg-zinc-800 cursor-pointer"
                      title={layer.visible ? '숨기기' : '표시'}
                    >
                      {layer.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => moveHomeLayer(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1.5 rounded text-zinc-500 hover:text-white hover:bg-zinc-800 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      title="앞으로 (위로)"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveHomeLayer(idx, 'down')}
                      disabled={idx === layers.length - 1}
                      className="p-1.5 rounded text-zinc-500 hover:text-white hover:bg-zinc-800 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      title="뒤로 (아래로)"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    {layer.type === 'image' && (
                      <button
                        onClick={() => handleReplaceImage(layer.id)}
                        className="p-1.5 rounded text-zinc-500 hover:text-white hover:bg-zinc-800 cursor-pointer"
                        title="이미지 교체"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        const { id: _omit, ...rest } = layer;
                        const newId = addHomeLayer({
                          ...rest,
                          x: Math.min(rest.x + 4, 90),
                          y: Math.min(rest.y + 4, 150),
                        });
                        setSelectedHomeLayerId(newId);
                      }}
                      className="p-1.5 rounded text-zinc-500 hover:text-white hover:bg-zinc-800 cursor-pointer"
                      title="레이어 복제"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('이 레이어를 삭제하시겠습니까?')) {
                          deleteHomeLayer(layer.id);
                          if (isSelected) setSelectedHomeLayerId(null);
                        }
                      }}
                      className="p-1.5 rounded text-zinc-500 hover:text-red-400 hover:bg-red-950 cursor-pointer"
                      title="레이어 삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 선택된 레이어 상세 편집 */}
                {isSelected && (
                  <div className="mt-3 pt-3 border-t border-zinc-800 space-y-3">
                    {/* 문구 */}
                    {layer.type !== 'image' && (
                      <div className="space-y-1">
                        <label className="text-[11px] text-zinc-400">문구</label>
                        <textarea
                          value={layer.content}
                          onChange={(e) => updateHomeLayer(layer.id, { content: e.target.value })}
                          rows={2}
                          className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-blue-500 resize-y"
                        />
                      </div>
                    )}

                    {/* 이미지 URL */}
                    {layer.type === 'image' && (
                      <div className="space-y-1">
                        <label className="text-[11px] text-zinc-400">이미지</label>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleReplaceImage(layer.id)}
                            className="px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-[11px] rounded-lg cursor-pointer"
                          >
                            파일 선택
                          </button>
                          <input
                            type="text"
                            value={layer.content.startsWith('data:') ? '(업로드된 파일)' : layer.content}
                            onChange={(e) => updateHomeLayer(layer.id, { content: e.target.value })}
                            placeholder="또는 이미지 URL 입력"
                            className="flex-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-200 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                    )}

                    {/* 슬라이더 그룹 */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-500 flex justify-between">
                          <span>가로 위치</span>
                          <span className="font-mono">{layer.x.toFixed(0)}%</span>
                        </label>
                        <input
                          type="range"
                          min={-20}
                          max={120}
                          value={layer.x}
                          onChange={(e) => updateHomeLayer(layer.id, { x: Number(e.target.value) })}
                          className="w-full accent-blue-500 cursor-pointer"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-500 flex justify-between">
                          <span>세로 위치</span>
                          <span className="font-mono">{layer.y.toFixed(0)}%</span>
                        </label>
                        <input
                          type="range"
                          min={-20}
                          max={200}
                          value={layer.y}
                          onChange={(e) => updateHomeLayer(layer.id, { y: Number(e.target.value) })}
                          className="w-full accent-blue-500 cursor-pointer"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-500 flex justify-between">
                          <span>너비</span>
                          <span className="font-mono">{layer.width.toFixed(0)}%</span>
                        </label>
                        <input
                          type="range"
                          min={5}
                          max={100}
                          value={layer.width}
                          onChange={(e) => updateHomeLayer(layer.id, { width: Number(e.target.value) })}
                          className="w-full accent-blue-500 cursor-pointer"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-500 flex justify-between">
                          <span>글자 크기</span>
                          <span className="font-mono">{layer.fontSize}px</span>
                        </label>
                        <input
                          type="range"
                          min={9}
                          max={72}
                          value={layer.fontSize}
                          onChange={(e) => updateHomeLayer(layer.id, { fontSize: Number(e.target.value) })}
                          className="w-full accent-blue-500 cursor-pointer"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-500 flex justify-between">
                          <span>회전</span>
                          <span className="font-mono">{layer.rotation}°</span>
                        </label>
                        <input
                          type="range"
                          min={-45}
                          max={45}
                          value={layer.rotation}
                          onChange={(e) => updateHomeLayer(layer.id, { rotation: Number(e.target.value) })}
                          className="w-full accent-blue-500 cursor-pointer"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-zinc-500 flex justify-between">
                          <span>투명도</span>
                          <span className="font-mono">{layer.opacity}%</span>
                        </label>
                        <input
                          type="range"
                          min={10}
                          max={100}
                          value={layer.opacity}
                          onChange={(e) => updateHomeLayer(layer.id, { opacity: Number(e.target.value) })}
                          className="w-full accent-blue-500 cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* 스타일 옵션 */}
                    <div className="flex flex-wrap items-center gap-2">
                      {layer.type !== 'image' && (
                        <label className="flex items-center gap-1.5 text-[11px] text-zinc-400 cursor-pointer">
                          <span>색상</span>
                          <input
                            type="color"
                            value={layer.color}
                            onChange={(e) => updateHomeLayer(layer.id, { color: e.target.value })}
                            className="w-7 h-7 rounded border border-zinc-700 bg-transparent cursor-pointer"
                          />
                        </label>
                      )}

                      <div className="flex items-center gap-1 p-0.5 bg-zinc-900 border border-zinc-800 rounded-lg">
                        {(['left', 'center', 'right'] as const).map((a) => (
                          <button
                            key={a}
                            onClick={() => updateHomeLayer(layer.id, { align: a })}
                            className={`px-2 py-1 text-[10px] rounded cursor-pointer ${
                              layer.align === a ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            {a === 'left' ? '좌' : a === 'center' ? '중앙' : '우'}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => updateHomeLayer(layer.id, { bold: !layer.bold })}
                        className={`px-2 py-1 text-[10px] font-bold rounded-lg border cursor-pointer ${
                          layer.bold
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                        }`}
                      >
                        B
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
