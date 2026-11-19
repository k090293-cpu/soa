import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  // 개발 모드에서 API 서버(기본 3001)로 /api, /media 요청을 넘깁니다.
  // 덕분에 프론트엔드는 항상 같은 출처(same-origin)의 /api 를 호출하면 되고,
  // 세션 쿠키(SameSite=Strict)도 그대로 동작합니다.
  const apiPort = process.env.VITE_API_PORT || '3001';
  const apiTarget = `http://127.0.0.1:${apiPort}`;

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      // 샌드박스/프리뷰 도메인에서 접속할 때 Vite 가 403("Blocked request") 으로
      // 막지 않도록 허용 호스트를 지정합니다. (앞의 점은 하위 도메인 전체 허용)
      allowedHosts: [
        'localhost',
        '.sandbox.novita.ai',
        '.e2b.dev',
        '.genspark.ai',
        '.trycloudflare.com',
      ],
      proxy: {
        '/api': { target: apiTarget, changeOrigin: false },
        '/media': { target: apiTarget, changeOrigin: false },
      },
    },
  };
});
