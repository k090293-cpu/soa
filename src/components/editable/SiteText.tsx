import React from 'react';
import { useStudio } from '../../context/StudioContext';
import { EditableText } from './EditableText';

interface SiteTextProps {
  /** 오버라이드 저장 키 (예: 'hero.cta.primary', 'about.toolTitle') */
  tkey: string;
  /** 관리자가 아무것도 바꾸지 않았을 때 보여줄 기본 문구 */
  fallback: string;
  /** 편집 모드에서 마우스를 올리면 표시할 이름 */
  label?: string;
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'div';
  className?: string;
  style?: React.CSSProperties;
  multiline?: boolean;
}

/**
 * 홈 화면 어디에나 쓸 수 있는 편집 가능 문구.
 * 값은 StudioContext 의 textOverrides 맵에 저장되므로, 별도 타입 필드를 추가하지 않고도
 * 화면의 어떤 글자든 관리자 모드에서 직접 고칠 수 있습니다.
 */
export const SiteText: React.FC<SiteTextProps> = ({
  tkey,
  fallback,
  label,
  as = 'span',
  className = '',
  style,
  multiline = false,
}) => {
  const { siteText, setSiteText } = useStudio();
  return (
    <EditableText
      value={siteText(tkey, fallback)}
      onSave={(v) => setSiteText(tkey, v)}
      label={label || tkey}
      as={as}
      className={className}
      style={style}
      multiline={multiline}
    />
  );
};
