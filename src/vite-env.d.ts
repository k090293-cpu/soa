/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * '1' 이면 서버가 없는 정적 배포용 빌드입니다.
   * 이 값이 켜지면 클라이언트가 /api 요청을 아예 보내지 않습니다.
   * (방문자 콘솔에 404 가 쌓이는 것을 막기 위한 빌드 타임 플래그)
   */
  readonly VITE_STATIC_SITE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
