.PHONY: install dev build test test-cov lint docker-up docker-down

install:
	cd apps/api && python -m venv .venv && .venv/Scripts/pip install -r requirements.txt
	cd apps/web && npm install

dev-api:
	cd apps/api && .venv/Scripts/uvicorn app.main:app --reload --port 8000

dev-web:
	cd apps/web && npm run dev

test:
	PYTHONPATH=apps/api ./apps/api/.venv/Scripts/pytest tests -v

build:
	cd apps/web && npm run build

docker-up:
	docker compose up --build -d

docker-down:
	docker compose down
