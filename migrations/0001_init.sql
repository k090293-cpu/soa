-- 콘텐츠 저장 테이블
--
-- 관리자가 고친 작품 목록 / 홈 문구 / 사이트 설정을 JSON 한 덩어리로 보관합니다.
-- 왜 컬럼으로 나누지 않는가:
--   화면 구조(블록 순서·레이어·오버라이드)가 계속 바뀌므로 스키마 마이그레이션이
--   잦아집니다. 이 규모(관리자 1명, 읽기 위주)에서는 JSON 문서 하나가 더 단순하고
--   안전합니다. 대신 저장 직전에 이미지를 R2 로 분리해 본문을 작게 유지합니다.
CREATE TABLE IF NOT EXISTS content (
  id         TEXT PRIMARY KEY,
  payload    TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
