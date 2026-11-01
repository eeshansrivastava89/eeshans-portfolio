# syntax = docker/dockerfile:1

# Build stage
FROM node:24-alpine AS builder

WORKDIR /app

# Public build arguments inlined by Astro at build time.
# These are public client-side values (they ship in the HTML),
# so build-arg is appropriate. If absent, analytics is silently omitted.
ARG PUBLIC_POSTHOG_KEY
ARG PUBLIC_POSTHOG_HOST
ARG PUBLIC_POSTHOG_UI_HOST
ARG PUBLIC_ANALYTICS_ALLOWED_HOSTS

ENV PUBLIC_POSTHOG_KEY=$PUBLIC_POSTHOG_KEY
ENV PUBLIC_POSTHOG_HOST=$PUBLIC_POSTHOG_HOST
ENV PUBLIC_POSTHOG_UI_HOST=$PUBLIC_POSTHOG_UI_HOST
ENV PUBLIC_ANALYTICS_ALLOWED_HOSTS=$PUBLIC_ANALYTICS_ALLOWED_HOSTS

# Install pnpm globally
RUN npm install -g pnpm@10

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build. GITHUB_TOKEN is a real secret — passed via Docker build secret.
RUN --mount=type=secret,id=GITHUB_TOKEN \
    GITHUB_TOKEN="$(cat /run/secrets/GITHUB_TOKEN 2>/dev/null || true)" \
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
# The final fallback MUST be `=404`, not `/index.html`. Falling back to
# index.html served the homepage with a 200 for every unmatched URL, so
# any nonexistent path looked real to crawlers (soft 404) and clients got
# the homepage instead of an error. `error_page 404` routes the miss to
# the 404 page Astro builds, with a real 404 status.
RUN echo 'server { \
    listen 8080; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    error_page 404 /404.html; \
    location / { \
        try_files $uri $uri/index.html =404; \
    } \
    \
    location ~ ^/posts(/.*)?$ { \
        return 301 /writing/; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 8080