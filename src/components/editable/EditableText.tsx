import React, { useCallback, useEffect, useRef, useState } from 'react';
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

/** 값이 비어 있을 때 클릭 가능하도록 넣는 폭 없는 문자 */
const ZWSP = '\u200b';

/**
 * contentEditable 영역에서 편집 대상 텍스트만 읽어옵니다.
 * - UI 요소([data-ui])는 제외합니다.
 * - <br>, 블록 요소는 줄바꿈으로 변환합니다.
 */
const readEditableText = (el: HTMLElement): string => {
  let out = '';
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      out += node.nodeValue ?? '';
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const element = node as HTMLElement;
    if (element.hasAttribute('data-ui')) return;
    if (element.tagName === 'BR') {
      out += '\n';
      return;
    }
    const isBlock = element.tagName === 'DIV' || element.tagName === 'P';
    if (isBlock && out && !out.endsWith('\n')) out += '\n';
    element.childNodes.forEach(walk);
    if (isBlock && !out.endsWith('\n')) out += '\n';
  };
  el.childNodes.forEach(walk);
  return out
    .replace(/\u00a0/g, ' ')
    .replace(new RegExp(ZWSP, 'g'), '')
    .replace(/\n+$/g, '');
};

/**
 * 홈 화면에서 관리자가 글자를 직접 클릭해 수정할 수 있게 해주는 컴포넌트.
 * - 편집 모드(isHomeInlineEditMode)가 켜져 있을 때만 클릭 편집이 활성화됩니다.
 * - 편집 중에는 contentEditable 로 전환하고, blur 시 onSave 로 저장합니다.
 *
 * ⚠️ 반드시 지켜야 하는 두 가지 (과거 버그 원인)
 *  1) React 가 렌더한 자식 노드를 textContent 등으로 직접 덮어쓰면
 *     "removeChild ... is not a child of this node" 오류로 화면 전체가 사라집니다.
 *     → DOM 텍스트를 직접 조작하지 않고, 모드 전환 시 key 로 트리를 교체합니다.
 *  2) contentEditable 안에 배지 같은 자식 요소를 넣으면 캐럿 위치가 틀어져
 *     타이핑이 문장 맨 앞에 삽입됩니다.
 *     → 편집 중에는 contentEditable 안에 "텍스트만" 넣고, 배지는 바깥에 그립니다.
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

  // 편집 모드가 꺼지면 편집 상태도 종료
  useEffect(() => {
    if (!isHomeInlineEditMode && isEditing) setIsEditing(false);
  }, [isHomeInlineEditMode, isEditing]);

  // 편집 진입 시 포커스 + 캐럿을 맨 끝으로 (DOM 텍스트는 건드리지 않습니다)
  useEffect(() => {
    if (!isEditing) return;
    const el = ref.current;
    if (!el) return;
    el.focus();
    const sel = window.getSelection();
    if (!sel) return;
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
  }, [isEditing]);

  const startEditing = () => {
    if (!isHomeInlineEditMode || isEditing) return;
    originalRef.current = value || '';
    setIsEditing(true);
  };

  const commit = useCallback(() => {
    const el = ref.current;
    if (!el) {
      setIsEditing(false);
      return;
    }
    const next = readEditableText(el).replace(/\s+$/g, '');
    setIsEditing(false);
    if (next !== originalRef.current) {
      onSave(next);
    }
  }, [onSave]);

  const cancel = () => {
    setIsEditing(false);
  };

  const Tag = as as React.ElementType;

  const editableClass = isHomeInlineEditMode
    ? isEditing
      ? 'ring-2 ring-blue-500 bg-blue-500/10 rounded-md outline-none transition-shadow cursor-text'
      : 'outline outline-1 outline-dashed outline-blue-500/40 hover:outline-blue-400/80 hover:bg-blue-500/5 rounded-md transition-shadow cursor-text'
    : '';

  // 편집 중에는 텍스트만, 보기 모드에서는 값 그대로 (빈 값이면 클릭 가능하도록 ZWSP)
  const text = value && value.length > 0 ? value : isEditing || isHomeInlineEditMode ? ZWSP : '';

  const editableEl = (
    <Tag
      // 모드 전환 시 노드를 통째로 교체해 React 의 stale 참조를 원천 차단합니다.
      key={isEditing ? 'editing' : 'view'}
      ref={ref as React.Ref<HTMLElement>}
      className={`${className} ${editableClass}`}
      style={style}
      contentEditable={isEditing}
      suppressContentEditableWarning
      data-editable={`home:${label}`}
      onClick={isHomeInlineEditMode && !isEditing ? startEditing : undefined}
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
      {text}
    </Tag>
  );

  // 방문자 모드에서는 여분의 DOM 을 만들지 않습니다.
  if (!isHomeInlineEditMode) return editableEl;

  return (
    <span
      className={`relative ${as === 'span' ? 'inline-block' : 'block'} max-w-full`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {editableEl}

      {/* 편집 모드 표시 배지 (contentEditable 바깥) */}
      {hovered && !isEditing && (
        <span
          data-ui="badge"
          aria-hidden
          className="pointer-events-none absolute -top-2.5 -right-1 translate-x-full bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap flex items-center gap-1 shadow-md z-20"
        >
          <Pencil className="w-2.5 h-2.5" />
          {label}
        </span>
      )}

      {isEditing && (
        <span
          data-ui="badge"
          aria-hidden
          className="pointer-events-none absolute -top-6 left-0 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap z-20"
        >
          수정 중 · 바깥 클릭 시 저장
        </span>
      )}
    </span>
  );
};
