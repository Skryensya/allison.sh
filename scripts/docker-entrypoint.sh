#!/bin/sh
set -eu

POSTHOG_HOST="${PUBLIC_POSTHOG_HOST:-https://us.i.posthog.com}"
POSTHOG_TOKEN="${PUBLIC_POSTHOG_TOKEN:-}"

escape_js() {
  printf '%s' "$1" | sed "s/\\\\/\\\\\\\\/g; s/'/\\\\'/g"
}

cat > /srv/posthog-env.js <<EOF
window.__POSTHOG_ENV__ = {
  token: '$(escape_js "$POSTHOG_TOKEN")',
  host: '$(escape_js "$POSTHOG_HOST")',
};
EOF

if [ -n "$POSTHOG_TOKEN" ]; then
  echo "Runtime PostHog enabled"
else
  echo "Runtime PostHog disabled: PUBLIC_POSTHOG_TOKEN is empty"
fi

exec "$@"
