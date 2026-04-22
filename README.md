# 🏭 Production Order Tracker

A simple manufacturing production order tracker built to learn Docker, CI/CD, and Raspberry Pi deployment end-to-end.

**Stack:** Python (FastAPI) · React (Vite) · Docker · GitHub Actions · Raspberry Pi

---

## Quick Start (MacBook)

```bash
# 1. Clone or enter the project
cd pi-production-app

# 2. Start everything (first run downloads base images & builds)
docker compose up --build

# 3. Open your browser
#    Frontend:  http://localhost:5173
#    API docs:  http://localhost:8000/docs
```

Code changes in `backend/app/` and `frontend/src/` are reflected **instantly** (hot-reload).

---

## Project Structure

```
pi-production-app/
├── backend/
│   ├── app/
│   │   └── main.py          ← FastAPI app (all routes here)
│   ├── Dockerfile           ← dev + prod stages
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx          ← React app
│   │   └── index.css
│   ├── Dockerfile           ← dev + build + prod stages
│   ├── nginx.conf           ← serves the React build in production
│   └── vite.config.js
├── .github/
│   └── workflows/
│       ├── ci.yml           ← runs on every push (lint + build test)
│       └── release.yml      ← runs on version tags (build + push + deploy)
├── docker-compose.yml       ← local development
├── docker-compose.prod.yml  ← production / Raspberry Pi
├── Makefile                 ← shortcut commands
├── VERSION                  ← current version number
└── .env.example             ← environment variable template
```

---

## Common Commands

| What                         | Command                    |
|------------------------------|----------------------------|
| Start dev environment        | `make dev`                 |
| Stop containers              | `make stop`                |
| View logs                    | `make logs`                |
| Bump patch version           | `make bump-patch`          |
| Create & push release tag    | `make release`             |
| Clean everything             | `make clean`               |

---

## Releasing a New Version

```bash
# 1. Make your code changes
# 2. Bump the version
make bump-patch      # 1.0.0 → 1.0.1

# 3. Push the release tag — this triggers GitHub Actions
make release
```

GitHub Actions will automatically:
1. Build Docker images for `linux/amd64` (Mac/server) **and** `linux/arm64` (Raspberry Pi)
2. Push them to Docker Hub
3. SSH into the Pi and update the running containers

---

## One-Time Setup

### GitHub Secrets
Add these in **Settings → Secrets and variables → Actions**:

| Secret                | Value                                    |
|-----------------------|------------------------------------------|
| `DOCKER_HUB_USERNAME` | Your Docker Hub username                 |
| `DOCKER_HUB_TOKEN`    | Docker Hub access token (not password)   |
| `PI_HOST`             | IP address of your Raspberry Pi          |
| `PI_USER`             | SSH user on the Pi (usually `pi`)        |
| `PI_SSH_KEY`          | Private SSH key (Pi has the public key)  |

### Raspberry Pi First-Time Setup
```bash
# On the Pi:
ssh pi@<pi-ip>

# Install Docker
curl -sSL https://get.docker.com | sh
sudo usermod -aG docker pi

# Copy the production compose file to the Pi
scp docker-compose.prod.yml pi@<pi-ip>:~/pi-production-app/
scp .env.example pi@<pi-ip>:~/pi-production-app/.env

# Edit .env on the Pi
nano ~/pi-production-app/.env
# Set DOCKER_HUB_USERNAME and IMAGE_TAG=latest

# First deploy (pull & start)
cd ~/pi-production-app
docker compose -f docker-compose.prod.yml up -d
```

After this, all future deployments are automatic via `make release`.

---

## API Endpoints

| Method | Path                  | Description          |
|--------|-----------------------|----------------------|
| GET    | `/api/health`         | Health check         |
| GET    | `/api/orders`         | List all orders      |
| POST   | `/api/orders`         | Create a new order   |
| PATCH  | `/api/orders/{id}`    | Update order status  |
| DELETE | `/api/orders/{id}`    | Delete an order      |

Interactive API docs: [http://localhost:8000/docs](http://localhost:8000/docs)
