# ═══════════════════════════════════════════════════════════════════════════
#  Makefile  —  shortcut commands for the project
#
#  Run any command with:   make <target>
#  Example:               make dev
# ═══════════════════════════════════════════════════════════════════════════

VERSION := $(shell cat VERSION)

.PHONY: help dev stop build logs clean release

## Show this help
help:
	@grep -E '^## ' Makefile | sed 's/## //'

## Start the app in development mode (hot-reload)
dev:
	docker compose up --build

## Stop all containers
stop:
	docker compose down

## Build production images (for local testing of the prod stage)
build:
	docker compose -f docker-compose.prod.yml build

## Tail logs from all running containers
logs:
	docker compose logs -f

## Remove containers, networks, and volumes
clean:
	docker compose down -v --remove-orphans

## Create a release tag and push it to Git (triggers the CI/CD pipeline)
## Usage: make release   (uses the version in the VERSION file)
release:
	@echo "Releasing version v$(VERSION)..."
	@git add VERSION
	@git commit -m "chore: bump version to $(VERSION)" || true
	@git tag v$(VERSION)
	@git push origin main --tags
	@echo "✅ Tag v$(VERSION) pushed — GitHub Actions will build and deploy."

## Bump patch version (1.0.0 → 1.0.1)
bump-patch:
	@NEW=$$(awk -F. '{print $$1"."$$2"."$$3+1}' VERSION); \
	echo $$NEW > VERSION; \
	echo "VERSION bumped to $$NEW"

## Bump minor version (1.0.0 → 1.1.0)
bump-minor:
	@NEW=$$(awk -F. '{print $$1"."$$2+1".0"}' VERSION); \
	echo $$NEW > VERSION; \
	echo "VERSION bumped to $$NEW"

## Bump major version (1.0.0 → 2.0.0)
bump-major:
	@NEW=$$(awk -F. '{print $$1+1".0.0"}' VERSION); \
	echo $$NEW > VERSION; \
	echo "VERSION bumped to $$NEW"
