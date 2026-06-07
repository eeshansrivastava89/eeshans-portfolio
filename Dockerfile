# syntax = docker/dockerfile:1

# Build stage
FROM node:24-alpine AS builder

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm@10

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build — all secrets mounted at build time, not baked into image history.
# If a secret is absent (e.g. fork deploy without PostHog), the build still
# succeeds with analytics silently omitted.
RUN --mount=type=secret,id=GITHUB_TOKEN \
    --mount=type=secret,id=PUBLIC_POSTHOG_KEY \
    --mount=type=secret,id=PUBLIC_POSTHOG_HOST \
    --mount=type=secret,id=PUBLIC_POSTHOG_UI_HOST \
    --mount=type=secret,id=PUBLIC_ANALYTICS_ALLOWED_HOSTS \
    GITHUB_TOKEN="$(cat /run/secrets/GITHUB_TOKEN 2>/dev/null || true)" \
    PUBLIC_POSTHOG_KEY="$(cat /run/secrets/PUBLIC_POSTHOG_KEY 2>/dev/null || true)" \
    PUBLIC_POSTHOG_HOST="$(cat /run/secrets/PUBLIC_POSTHOG_HOST 2>/dev/null || true)" \
    PUBLIC_POSTHOG_UI_HOST="$(cat /run/secrets/PUBLIC_POSTHOG_UI_HOST 2>/dev/null || echo 'https://us.posthog.com')" \
    PUBLIC_ANALYTICS_ALLOWED_HOSTS="$(cat /run/secrets/PUBLIC_ANALYTICS_ALLOWED_HOSTS 2>/dev/null || true)" \
    pnpm run build

# Runtime stage — serve static files with Nginx
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Configure nginx
#
# IMPORTANT — the try_files order is `$uri $uri/index.html` (NOT
# `$uri/`). Serving `$uri/` triggers nginx to issue a trailing-slash
# 301 redirect, and that redirect uses nginx internal listener scheme
# (http://) instead of the scheme the Fly edge proxy received the request
# with (https://). Serving `$uri/index.html` directly avoids that redirect.
#
# `absolute_redirect off` is defense-in-depth: if nginx ever does emit a
# redirect, it will use a relative Location header (no scheme), which
# the browser resolves against the current page origin (https).
RUN echo 'server { \
    listen 8080; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    location / { \
        try_files $uri $uri/index.html /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 8080