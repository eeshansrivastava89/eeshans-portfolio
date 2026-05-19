# syntax = docker/dockerfile:1

# Build stage
FROM node:24-alpine AS builder

WORKDIR /app

# Public build arguments inlined by Astro at build time.
ARG PUBLIC_POSTHOG_KEY
ARG PUBLIC_POSTHOG_HOST

ENV PUBLIC_POSTHOG_KEY=$PUBLIC_POSTHOG_KEY
ENV PUBLIC_POSTHOG_HOST=$PUBLIC_POSTHOG_HOST

# Install pnpm globally
RUN npm install -g pnpm@10

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build. GITHUB_TOKEN is required at build time for GitHub GraphQL data.
RUN --mount=type=secret,id=GITHUB_TOKEN \
    GITHUB_TOKEN="$(cat /run/secrets/GITHUB_TOKEN)" pnpm run build

# Runtime stage — serve static files with Nginx
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Configure nginx
#
# IMPORTANT — the try_files order is `$uri $uri/index.html` (NOT
# `$uri $uri/`). Serving `$uri/` triggers nginx to issue a trailing-slash
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
    port_in_redirect off; \
    absolute_redirect off; \
    \
    location / { \
        try_files $uri $uri/index.html /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 8080