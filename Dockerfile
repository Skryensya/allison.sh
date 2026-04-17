FROM node:22-alpine AS build

WORKDIR /app

ARG PUBLIC_SITE_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN BUILD_PUBLIC_SITE_URL="$PUBLIC_SITE_URL" \
  && set -a \
  && if [ -f .env ]; then . ./.env; fi \
  && set +a \
  && export PUBLIC_SITE_URL="${BUILD_PUBLIC_SITE_URL:-${PUBLIC_SITE_URL:-https://allison.sh}}" \
  && echo "Building with PUBLIC_SITE_URL=${PUBLIC_SITE_URL}" \
  && npm run build

FROM caddy:2-alpine AS runtime

WORKDIR /srv

COPY --from=build /app/dist ./
COPY Caddyfile /etc/caddy/Caddyfile

EXPOSE 3000
