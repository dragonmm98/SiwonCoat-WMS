# Fulfill WMS

A warehouse management system MVP built as a NestJS modular monolith with a responsive Next.js scanner PWA.

## Prerequisites

- Node.js 24+
- pnpm 11+
- Docker with Compose

## Local setup

```bash
cp .env.example .env
pnpm install
docker compose up -d postgres redis minio
pnpm --filter @wms/database db:generate
pnpm --filter @wms/database db:migrate
pnpm --filter @wms/database db:seed
pnpm dev
```

- Web/PWA: http://localhost:3000
- API: http://localhost:4000/api/v1
- OpenAPI: http://localhost:4000/docs

### Open from another device on Wi-Fi

Start the app normally, find your computer's private Wi-Fi address, then open
`http://<wifi-ip>:3000` on the other device. Browser API requests use the same
frontend origin under `/wms-data`; Next.js forwards them internally to port
`4000`, so the other device does not need to connect to the API port directly.

Make sure both devices are on the same network and that the computer firewall
allows incoming connections to port `3000`. For production with a separate API,
set `NEXT_PUBLIC_API_URL` to the public API URL and set `WEB_ORIGIN` to the
allowed frontend origin (or a comma-separated list of origins).

For an ngrok preview, tunnel only the frontend (`ngrok http 3000`). The frontend
proxies `/wms-data` to the local API, so port `4000` does not need a second
tunnel. Next.js development assets allow `*.ngrok-free.app` by default in this
repository; add any other tunnel hostname to the comma-separated
`ALLOWED_DEV_ORIGINS` environment variable and restart the web dev server. On
ngrok's free tier, select **Visit Site** once before the application can load.
- MinIO console: http://localhost:9001

The seed creates warehouse `SEL-01`, receiving/storage locations, and one lot-tracked demo SKU with barcode `880000000001`.

The API and web preview can be started separately with `pnpm --filter @wms/api dev` and `pnpm --filter web dev`. Scanner workflows are available at `/scan` and accept keyboard-wedge barcode input.

Camera access requires a secure browser context. `http://localhost:3000` works on the same computer, but phones opening a LAN IP over plain HTTP will block the camera. For local phone testing, run `pnpm --filter web dev:https`, accept/trust the development certificate on the phone, and open the displayed HTTPS network address. Production deployments must use HTTPS.

## Current implementation

- monorepo and local service foundation;
- installable responsive operations/scanner PWA shell;
- PostgreSQL schema for topology, catalog, balances, ledger, orders, tasks, audit, idempotency, and outbox;
- warehouse and SKU REST endpoints with validation and OpenAPI;
- health/readiness endpoints and seed fixtures;
- architecture and inventory-invariant decisions.

See [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) for the remaining delivery sequence.
