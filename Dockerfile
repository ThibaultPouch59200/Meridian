FROM node:22-alpine AS builder
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package*.json ./
RUN npm ci --registry https://registry.npmjs.org
COPY . .
RUN npm run build

FROM node:22-alpine
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --registry https://registry.npmjs.org
COPY --from=builder /app/.output ./.output
RUN mkdir -p /app/data
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
