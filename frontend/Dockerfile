# ═══════════════════════════════════════════════════════════════════════════
#  Frontend Dockerfile — three stages:
#    deps   → install node_modules
#    dev    → Vite dev server with hot-reload
#    build  → compile React to static files
#    prod   → Nginx serving the compiled static files
#
#  Usage:
#    Dev:  docker-compose up (uses dev stage via docker-compose.yml)
#    Prod: docker build --target prod -t pi-production-frontend:latest .
# ═══════════════════════════════════════════════════════════════════════════

# ── Stage 1: install dependencies ───────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app
COPY package.json ./
RUN npm install

# ── Stage 2: dev (hot-reload) ────────────────────────────────────────────────
FROM deps AS dev

COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev"]

# ── Stage 3: build static files ──────────────────────────────────────────────
FROM deps AS build

COPY . .
RUN npm run build
# Output goes to /app/dist

# ── Stage 4: prod (Nginx serving static files) ───────────────────────────────
# Uses a tiny Nginx image — no Node.js in production!
FROM nginx:1.27-alpine AS prod

# Copy our custom Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the compiled React app from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
