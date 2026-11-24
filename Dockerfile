#build
FROM node:22-slim AS build
WORKDIR /app

# dependências do backend
COPY package.json package-lock.json ./
RUN npm ci

# dependências do frontend
COPY frontend/package.json frontend/package-lock.json ./frontend/
RUN npm --prefix frontend ci

# build do frontend e do backend
COPY . .
RUN npm --prefix frontend run build && npm run build

# execução
FROM node:22-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY --from=build /app/frontend/dist ./frontend/dist

USER node
EXPOSE 3000
CMD ["node", "dist/server.js"]