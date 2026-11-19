# ── 빌드 스테이지 ────────────────────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

# 의존성 레이어를 먼저 복사해 캐시를 활용합니다.
COPY package.json package-lock.json .npmrc ./
RUN npm ci

# 소스 복사 후 프론트엔드 빌드 (dist/ 생성)
COPY tsconfig.json vite.config.ts index.html ./
COPY public ./public
COPY src ./src
RUN npm run build

# ── 실행 스테이지 ────────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production

# 실행에 필요한 것만 가져옵니다 (devDependencies 제외).
COPY package.json package-lock.json .npmrc ./
RUN npm ci --omit=dev && npm cache clean --force

# 빌드 결과물 + API 서버
COPY --from=build /app/dist ./dist
COPY server ./server

# 데이터 디렉터리: 이 경로에 볼륨을 붙여야 콘텐츠/문의가 재배포 후에도 남습니다.
ENV DATA_DIR=/app/data
RUN mkdir -p /app/data

# root 가 아닌 사용자로 실행합니다.
RUN addgroup -S app && adduser -S app -G app && chown -R app:app /app
USER app

EXPOSE 3000

# 컨테이너가 죽으면 플랫폼이 재시작합니다.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server/index.js"]
