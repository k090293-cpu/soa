import React, { useEffect, useRef, useState } from 'react';
import { useStudio } from '../../context/StudioContext';
import { Pencil } from 'lucide-react';

interface EditableTextProps {
  /** 현재 값 */
  value: string;
  /** 편집 완료 시 호출 (blur 또는 Ctrl/Cmd+Enter) */
  onSave: (next: string) => void;
  /** 편집 항목 이름 (툴팁에 표시) */
  label?: string;
  /** 렌더링할 태그 */
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'div';
  className?: string;
  style?: React.CSSProperties;
  /** 여러 줄 입력 여부 (Enter 저장 여부 결정) */
  multiline?: boolean;
}

/**
 * 홈 화면에서 관리자가 글자를 직접 클릭해 수정할 수 있게 해주는 컴포넌트.
 * - 편집 모드(isHomeInlineEditMode)가 켜져 있을 때만 클릭 편집이 활성화됩니다.
 * - 편집 중에는 contentEditable 로 전환하고, blur 시 onSave 로 저장합니다.
 */
export const EditableText: React.FC<EditableTextProps> = ({
  value,
  onSave,
  label = '문구',
  as = 'span',
  className = '',
  style,
  multiline = false,
}) => {
  const { isHomeInlineEditMode } = useStudio();
  const [isEditing, setIsEditing] = useState(false);
  const [hovered, setHovered] = useState(false);
  const ref = useRef<HTMLElement | null>(null);
  const originalRef = useRef<string>(value);

  // 편집 시작 시 커서를 끝으로 이동
  useEffect(() => {
    if (!isEditing || !ref.current) return;
    const el = ref.current;
    el.textContent = originalRef.current;
    el.focus();
    const sel = window.getSelection();
    if (sel) {
      const range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }, [isEditing]);

  // 편집 모드가 꺼지면 편집 상태도 종료
  useEffect(() => {
    if (!isHomeInlineEditMode && isEditing) setIsEditing(false);
  }, [isHomeInlineEditMode, isEditing]);

  const startEditing = () => {
    if (!isHomeInlineEditMode) return;
    originalRef.current = value || '';
    setIsEditing(true);
  };

  const commit = () => {
    const next = (ref.current?.innerText ?? '').replace(/\u00a0/g, ' ');
    setIsEditing(false);
    if (next !== originalRef.current) {
      onSave(next);
    }
  };

  const cancel = () => {
    setIsEditing(false);
  };

  const Tag = as as React.ElementType;

  const editWrapperClass = isHomeInlineEditMode
    ? `relative cursor-text rounded-md outline-none transition-shadow ${
        isEditing
          ? 'ring-2 ring-blue-500 bg-blue-500/10'
          : 'ring-1 ring-dashed ring-blue-500/40 hover:ring-blue-400/80 hover:bg-blue-500/5'
      }`
    : '';

  return (
    <Tag
      ref={ref as React.Ref<HTMLElement>}
      className={`${className} ${editWrapperClass}`}
      style={style}
      contentEditable={isEditing}
      suppressContentEditableWarning
      data-editable={`home:${label}`}
      onClick={isHomeInlineEditMode && !isEditing ? startEditing : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onBlur={isEditing ? commit : undefined}
      onKeyDown={
        isEditing
          ? (e: React.KeyboardEvent<HTMLElement>) => {
              e.stopPropagation();
              if (e.key === 'Escape') {
                e.preventDefault();
                cancel();
              } else if (e.key === 'Enter' && (!multiline || e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                (e.currentTarget as HTMLElement).blur();
              }
            }
          : undefined
      }
    >
      {isEditing ? null : value}
      {/* 편집 모드 표시 배지 */}
      {isHomeInlineEditMode && !isEditing && hovered && (
        <span
          className="pointer-events-none absolute -top-2.5 -right-1 translate-x-full bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap flex items-center gap-1 shadow-md z-20"
          aria-hidden
        >
          <Pencil className="w-2.5 h-2.5" />
          {label}
        </span>
      )}
      {isEditing && (
        <span className="pointer-events-none absolute -top-6 left-0 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap z-20">
          수정 중 · 바깥 클릭 시 저장
        </span>
      )}
    </Tag>
  );
};
