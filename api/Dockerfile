# pnpm n'est pas dans les images node:* — installé en version pinnée, jamais via corepack
# (dont les clés de signature cassent le build sur les images un peu anciennes).
FROM node:24-alpine AS build
WORKDIR /app
RUN npm i -g pnpm@10.26.1
COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile
COPY tsconfig.json ./
COPY src ./src
RUN pnpm run build

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
RUN npm i -g pnpm@10.26.1
COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile --prod && pnpm store prune
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]
