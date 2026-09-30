FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY packages ./packages
COPY apps/api ./apps/api
RUN npm install
RUN npm run build --workspace=packages/shared-types
RUN npm run build --workspace=packages/crypto
RUN npm run build --workspace=packages/watermark
RUN npm run build --workspace=packages/ledger
RUN npm run build --workspace=packages/database
RUN npm run build --workspace=packages/config
RUN npm run build --workspace=apps/api

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app /app
EXPOSE 4000
CMD ["npm", "run", "start:prod", "--workspace=apps/api"]
