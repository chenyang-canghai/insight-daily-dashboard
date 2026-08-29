.PHONY: bootstrap dev generate-demo test build check

bootstrap:
	pnpm install --frozen-lockfile
	uv sync --all-extras --dev

dev:
	pnpm dev

generate-demo:
	pnpm generate:demo

test:
	pnpm test
	uv run pytest

build:
	pnpm build

check:
	pnpm check
	uv run ruff check python scripts tests/python
	uv run pytest
