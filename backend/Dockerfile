# ═══════════════════════════════════════════════════════════════════════════
#  Backend Dockerfile — two stages: dev (hot-reload) and prod (optimised)
#
#  Build the prod image:
#    docker build --target prod -t pi-production-backend:latest .
#
#  The same file works on both MacBook (amd64) and Raspberry Pi (arm64)
#  because we use a multi-platform base image.
# ═══════════════════════════════════════════════════════════════════════════

# ── Base: shared setup ───────────────────────────────────────────────────────
FROM python:3.12-slim AS base

# Don't write .pyc files; send logs straight to stdout (important in Docker)
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install dependencies into a separate layer so they are cached efficiently
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ── Dev stage ────────────────────────────────────────────────────────────────
# Used by docker-compose.yml (local development)
# • Mounts the host directory so code changes are reflected instantly
# • Runs uvicorn with --reload
FROM base AS dev

EXPOSE 8000

# The actual source code is mounted at runtime (see docker-compose.yml),
# but we still copy it so the image works without a volume mount.
COPY app/ ./app/

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# ── Prod stage ───────────────────────────────────────────────────────────────
# Used for production builds and Raspberry Pi deployment
# • No --reload; runs as root so it can write to /sys/class/gpio (GPIO control)
FROM base AS prod

COPY app/ ./app/

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
