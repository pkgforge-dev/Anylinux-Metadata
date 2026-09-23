.PHONY: all install test validate export sync import schema clean help serve

SHELL := /bin/bash
RUNNER := $(shell which bun >/dev/null 2>&1 && echo "bun" || echo "npm")

all: test validate

install:
	@if [ "$(RUNNER)" = "bun" ]; then \
		echo "Installing dependencies with Bun..."; \
		bun install; \
	else \
		echo "Installing dependencies with npm..."; \
		npm install; \
	fi

test:
	@if [ "$(RUNNER)" = "bun" ]; then \
		bun test; \
	else \
		npm test; \
	fi

validate:
	@if [ "$(RUNNER)" = "bun" ]; then \
		bun run scripts/validate.ts; \
	else \
		npm run validate:node; \
	fi

export:
	@if [ "$(RUNNER)" = "bun" ]; then \
		bun run scripts/export-catalog.ts; \
	else \
		npm run export:node; \
	fi

sync:
	@if [ "$(RUNNER)" = "bun" ]; then \
		bun run scripts/sync-upstream.ts; \
	else \
		npm run sync:node; \
	fi

import:
	@if [ "$(RUNNER)" = "bun" ]; then \
		bun run scripts/import-pla.ts; \
	else \
		npm run import:node; \
	fi

schema:
	@if [ "$(RUNNER)" = "bun" ]; then \
		bun run scripts/generate-schema.ts; \
	else \
		npm run generate-schema; \
	fi

clean:
	@rm -rf dist .cache web/catalog.json web/status.json web/catalog-data.js web/icons
	@echo "Cleaned build, cache, and generated web artifacts."

serve:
	@if [ "$(RUNNER)" = "bun" ]; then \
		bun run scripts/serve.ts; \
	else \
		npm run serve:node; \
	fi

help:
	@echo "AnyLinux Metadata Build Targets:"
	@echo "  make install   - Install project dependencies"
	@echo "  make test      - Run automated schema test suite"
	@echo "  make validate  - Validate all application manifests"
	@echo "  make export    - Compile catalog.json and appstream.xml.gz"
	@echo "  make sync      - Synchronize backlog with upstream and Flathub"
	@echo "  make import    - Ingest metadata from Portable-Linux-Apps"
	@echo "  make schema    - Regenerate JSON Schema from TypeScript definitions"
	@echo "  make clean     - Remove dist/ and .cache/ artifacts"
