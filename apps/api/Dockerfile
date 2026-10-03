FROM node:20-slim AS builder
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
COPY packages ./packages
COPY apps/api ./apps/api
RUN npm install --ignore-scripts
RUN npm rebuild
RUN npm run build --workspace=packages/shared-types
RUN npm run build --workspace=packages/crypto
RUN npm run build --workspace=packages/watermark
RUN npm run build --workspace=packages/ledger
RUN npm run build --workspace=packages/database
RUN npm run build --workspace=packages/config
RUN npm run build --workspace=apps/api

FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app /app
EXPOSE 4000 10000
CMD ["npm", "run", "start:prod", "--workspace=apps/api"]
