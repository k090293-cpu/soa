import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
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
    },
  };
});
