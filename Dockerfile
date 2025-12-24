# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Build args
ARG VITE_API_URL
ARG VITE_DASHBOARD_API_URL
ARG VITE_PRICING_API_URL
ARG VITE_STRAPI_URL

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_DASHBOARD_API_URL=$VITE_DASHBOARD_API_URL
ENV VITE_PRICING_API_URL=$VITE_PRICING_API_URL
ENV VITE_STRAPI_URL=$VITE_STRAPI_URL

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source
COPY . .

# Build
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Create nginx config for SPA routing on port 3333
RUN echo 'server { \
    listen 3333; \
    listen [::]:3333; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html; \
    gzip on; \
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript; \
    location / { \
    try_files $uri $uri/ /index.html; \
    } \
    }' > /etc/nginx/conf.d/default.conf

EXPOSE 3333

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3333 || exit 1

CMD ["nginx", "-g", "daemon off;"]
