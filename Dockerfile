# ---------- Build stage ----------
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---------- Production stage ----------
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev

RUN npx prisma generate

COPY --from=builder /app/dist ./dist

EXPOSE 3001

CMD ["node", "dist/server.js"]
