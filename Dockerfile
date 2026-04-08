FROM node:22-alpine AS build

WORKDIR /app

ARG PUBLIC_SITE_URL
ENV PUBLIC_SITE_URL=${PUBLIC_SITE_URL}

COPY package*.json ./
RUN npm ci

COPY . .
RUN echo "Building with PUBLIC_SITE_URL=${PUBLIC_SITE_URL}" && npm run build

FROM node:22-alpine AS runtime

WORKDIR /app

ENV HOST=0.0.0.0
ENV PORT=3000

COPY --from=build /app/dist ./dist

EXPOSE 3000

CMD ["npx", "serve", "dist", "-l", "3000"]
