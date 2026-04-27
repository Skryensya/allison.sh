FROM node:22-alpine AS build

WORKDIR /app

ARG PUBLIC_SITE_URL
ARG PUBLIC_POSTHOG_TOKEN
ARG PUBLIC_POSTHOG_HOST

COPY package*.json ./
RUN npm ci

COPY . .
RUN BUILD_PUBLIC_SITE_URL="$PUBLIC_SITE_URL" \
  && BUILD_PUBLIC_POSTHOG_TOKEN="$PUBLIC_POSTHOG_TOKEN" \
  && BUILD_PUBLIC_POSTHOG_HOST="$PUBLIC_POSTHOG_HOST" \
  && set -a \
  && if [ -f .env ]; then . ./.env; fi \
  && set +a \
  && export PUBLIC_SITE_URL="${BUILD_PUBLIC_SITE_URL:-${PUBLIC_SITE_URL:-https://allison.sh}}" \
  && export PUBLIC_POSTHOG_TOKEN="${BUILD_PUBLIC_POSTHOG_TOKEN:-${PUBLIC_POSTHOG_TOKEN:-}}" \
  && export PUBLIC_POSTHOG_HOST="${BUILD_PUBLIC_POSTHOG_HOST:-${PUBLIC_POSTHOG_HOST:-https://us.i.posthog.com}}" \
  && echo "Building with PUBLIC_SITE_URL=${PUBLIC_SITE_URL}" \
  && if [ -n "$PUBLIC_POSTHOG_TOKEN" ]; then echo "Building with PostHog enabled"; else echo "Building with PostHog disabled: PUBLIC_POSTHOG_TOKEN is empty"; fi \
  && npm run build

FROM caddy:2-alpine AS runtime

WORKDIR /srv

COPY --from=build /app/dist ./
COPY Caddyfile /etc/caddy/Caddyfile

EXPOSE 3000
