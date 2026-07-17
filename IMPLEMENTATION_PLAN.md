# Coupang-Style WMS — Implementation Plan

## 1. Goal and MVP boundary

Build a portfolio-ready warehouse management system that demonstrates the complete inventory lifecycle without attempting to reproduce Coupang's private internal software.

The first release must support:

- warehouse, zone, and bin setup;
- SKU and barcode registration;
- purchase-order receiving, discrepancy capture, and putaway;
- inventory lookup by SKU, barcode, lot, and location;
- manual sales-order creation and stock reservation;
- pick, pack, label, and ship workflows;
- role-based access control and immutable audit/history records.

Multi-warehouse routing, automated slotting, robotics, demand forecasting, carrier integrations, and microservices are explicitly deferred.

## 2. Technical approach

Start as a TypeScript monorepo containing a modular NestJS monolith and one responsive Next.js progressive web application (PWA). The same web application serves desktop operations screens and touch-friendly scanner workflows, avoiding a separate mobile codebase in the MVP.

### Proposed stack

| Concern            | Choice                                                             |
| ------------------ | ------------------------------------------------------------------ |
| Monorepo           | pnpm workspaces + Turborepo                                        |
| Web and scanner UI | Next.js PWA, TypeScript, Tailwind CSS, TanStack Query              |
| Barcode input      | Keyboard-wedge scanners first, browser camera scanning as fallback |
| API                | NestJS REST API with OpenAPI                                       |
| Database           | PostgreSQL + Prisma                                                |
| Authentication     | Short-lived JWT access tokens, rotating refresh tokens             |
| Authorization      | Warehouse-scoped RBAC enforced in API guards and services          |
| Jobs               | Redis + BullMQ for labels, notifications, and projections          |
| Live updates       | Socket.IO for operational status updates                           |
| File storage       | S3-compatible object storage for imports and documents             |
| Labels             | ZPL templates with PDF preview during development                  |
| Local environment  | Docker Compose for PostgreSQL, Redis, and MinIO                    |
| Observability      | Structured logs, request IDs, health endpoints, metrics            |

Do not introduce microservices in the MVP. Keep module boundaries explicit so high-volume areas can be extracted later without distributing transactions prematurely.

## 3. Repository layout

```text
apps/
  api/                 NestJS application and worker process
  web/                 Next.js desktop console and scanner PWA
packages/
  database/            Prisma schema, migrations, seed data
  contracts/           API DTOs, event schemas, shared enums
  ui/                  Shared design tokens and web components
  config/              Shared lint, TypeScript, and test configuration
infra/
  docker/              Local service configuration
  deploy/              Deployment manifests added after MVP stability
docs/
  adr/                 Architecture decision records
  workflows/           State-machine and exception documentation
```

## 4. Domain modules

Keep each module's controllers, application services, persistence adapters, policies, and tests together.

1. **Identity and access** — users, workers, roles, permissions, sessions, and warehouse assignments.
2. **Warehouse topology** — warehouses, zones, locations/bins, location types, capacity, and restrictions.
3. **Catalog** — SKU, barcode aliases, dimensions, weight, handling rules, lot/serial/expiry settings.
4. **Inbound** — suppliers, purchase orders, receipts, inspection, discrepancies, and putaway tasks.
5. **Inventory** — balances, reservations, transaction ledger, movements, adjustments, and availability queries.
6. **Outbound** — sales orders, allocation, pick tasks, packing, labels, and shipments.
7. **Operations** — generic tasks, assignment, priority, status, exceptions, and productivity events.
8. **Audit and reporting** — audit trail, operational dashboard projections, and CSV exports.
9. **Platform** — idempotency, outbox events, jobs, notifications, health, logging, and object storage.

## 5. Core data model

Every operational table uses UUIDs, timestamps, and an optimistic concurrency `version` where concurrent updates are possible. Quantities use decimal/numeric types, never floating point.

### Warehouse and catalog

- `Warehouse`
- `Zone` → belongs to a warehouse
- `Location` → belongs to a zone; includes barcode, type, status, capacity, and restriction flags
- `Sku` → includes unique code, name, dimensions, weight, and tracking policies
- `Barcode` → maps one or more barcode formats/aliases to a SKU
- `Lot` → SKU, lot number, manufacture date, expiry date, and status
- `SerialNumber` → optional unique item-level tracking

### Inventory

- `InventoryBalance` → warehouse, location, SKU, optional lot/serial, inventory status, on-hand and reserved quantities
- `InventoryReservation` → sales-order line allocation against one or more balances
- `InventoryTransaction` → append-only ledger recording receipt, move, reservation, release, pick, return, adjustment, and shipment events
- `InventoryAdjustment` → approval record and reason for controlled corrections

`availableQty` is derived as `onHandQty - reservedQty`; it should not be independently editable. A database constraint prevents negative on-hand or reserved quantities and ensures reserved does not exceed usable on-hand stock.

### Inbound

- `PurchaseOrder` and `PurchaseOrderLine`
- `Receipt` and `ReceiptLine`
- `ReceiptDiscrepancy`
- `PutawayTask` and `PutawayTaskLine`

### Outbound

- `SalesOrder` and `SalesOrderLine`
- `PickWave` (introduced after single-order picking is stable)
- `PickTask` and `PickTaskLine`
- `Package` and `PackageItem`
- `Shipment`
- `ShippingLabel`

### Cross-cutting

- `User`, `Role`, `Permission`, `UserWarehouse`
- `OperationalTask`, `TaskAssignment`, `TaskException`
- `AuditLog`
- `IdempotencyKey`
- `OutboxEvent`

### Required indexes and constraints

- unique location barcode within a warehouse;
- unique SKU code and globally unique barcode value;
- unique inventory-balance identity across location, SKU, lot/serial, and status;
- unique external/manual order number within its source;
- indexes on task assignee/status/priority, order status, transaction SKU/location/time, and lot expiry;
- foreign keys preventing deletion of referenced operational records; use status transitions instead of destructive deletes.

## 6. Workflow and state-machine rules

All state transitions happen through named application commands, not generic CRUD updates.

### Inbound

`DRAFT PO → OPEN → PARTIALLY_RECEIVED → RECEIVED → CLOSED`

1. Create and approve a purchase order.
2. Scan PO and SKU at the receiving station.
3. Record accepted, damaged, rejected, lot, and expiry quantities.
4. Post the receipt transaction into a receiving/staging location.
5. Generate putaway tasks using simple location rules.
6. Scan source, SKU, and destination; atomically move inventory and complete the task.

### Outbound

`DRAFT ORDER → READY_TO_ALLOCATE → ALLOCATED → PICKING → PICKED → PACKED → SHIPPED`

1. Create and validate a sales order.
2. Allocate usable inventory using FIFO; use FEFO for expiry-controlled SKUs.
3. Create pick tasks grouped by order and route sequence.
4. Require location and item scans before confirming quantity.
5. Move picked stock to a packing location and consume reservations.
6. Validate packed items, create package/label, and confirm shipment.

### Exceptions

Short picks, damaged inventory, unexpected barcodes, capacity violations, expired lots, duplicate scans, and inventory mismatches create explicit exception records. Supervisors resolve them through auditable commands; clients never silently correct stock.

## 7. Inventory consistency design

Inventory correctness is the primary non-functional requirement.

- Wrap every receipt, move, reservation, release, pick, adjustment, and shipment in a PostgreSQL transaction.
- Lock affected balance rows in a deterministic order for multi-row operations to reduce deadlocks.
- Upsert new balance identities safely, protected by the unique balance constraint.
- Insert an `InventoryTransaction` ledger row in the same database transaction as each balance mutation.
- Accept an idempotency key for every scanner mutation and external command; return the original result for retries.
- Use an outbox row in the same transaction for events that feed jobs, sockets, and reporting projections.
- Never let Redis, a queue, or a WebSocket event be the system of record.
- Reconciliation jobs compare ledger-derived totals with balances and raise alerts; they do not auto-edit inventory.

## 8. API surface

Use versioned REST routes under `/api/v1`; publish OpenAPI and generate typed clients for both front ends.

### Initial endpoints

- `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`
- `GET/POST /warehouses`, `/warehouses/:id/zones`, `/zones/:id/locations`
- `GET/POST/PATCH /skus`, `POST /skus/:id/barcodes`
- `GET/POST /purchase-orders`, `POST /purchase-orders/:id/approve`
- `POST /receipts`, `POST /receipts/:id/lines`, `POST /receipts/:id/post`
- `GET /putaway-tasks`, `POST /putaway-tasks/:id/confirm`
- `GET /inventory`, `GET /inventory/transactions`, `POST /inventory/adjustments`
- `GET/POST /sales-orders`, `POST /sales-orders/:id/allocate`
- `GET /pick-tasks`, `POST /pick-tasks/:id/scan`, `POST /pick-tasks/:id/complete`
- `POST /packages`, `POST /packages/:id/items/scan`, `POST /packages/:id/close`
- `POST /shipments`, `POST /shipments/:id/confirm`
- `GET /tasks`, `POST /tasks/:id/assign`, `POST /tasks/:id/exceptions`
- `GET /dashboard/summary`, `GET /audit-logs`

Mutation responses include the updated resource version. Standardize error codes such as `INSUFFICIENT_STOCK`, `DUPLICATE_SCAN`, `INVALID_STATE_TRANSITION`, and `VERSION_CONFLICT` so scanner flows can recover predictably.

## 9. User interfaces

### Web operations console

- dashboard: inbound backlog, open exceptions, active picks, and orders ready to ship;
- master data: warehouse topology and SKU/barcode management;
- inbound: PO list/detail, receipt station, discrepancies, and putaway monitor;
- inventory: searchable stock table, balance detail, ledger, and adjustment approval;
- outbound: orders, allocations, pick progress, packing station, shipment confirmation;
- administration: users, roles, warehouse assignments, and audit log.

### Scanner PWA

Optimize for gloved, one-handed use: large controls, minimal typing, vibration/sound feedback, and clear recovery instructions.

- dedicated routes such as `/scan/receive`, `/scan/putaway`, `/scan/pick`, and `/scan/pack`;
- login and warehouse selection;
- assigned task queue;
- receive item;
- putaway: source → item → destination → quantity;
- pick: location → item → quantity;
- packing verification;
- explicit exception reporting.

The scanner routes share authentication, generated API clients, validation, and design tokens with the desktop console. Support scanners that emit barcode data as keyboard input before adding camera scanning, because dedicated warehouse hardware commonly uses this mode and it is more reliable than a browser camera.

Make the web app installable with a manifest, icons, and service worker. Cache the application shell and safe reference data, but require connectivity for every stock-changing command. Do not queue offline inventory mutations until conflict semantics are designed and tested. Show a prominent connectivity indicator and prevent submission while offline.

## 10. Delivery plan

Each milestone ends with a runnable vertical slice, automated tests, seed data, and a short demo script.

### Milestone 0 — Foundation (2–3 days)

- initialize monorepo, strict TypeScript, linting, formatting, and test runners;
- add Docker Compose services and environment validation;
- scaffold the NestJS API and responsive Next.js PWA;
- configure the web manifest, installability, and desktop/scanner route layouts;
- establish CI for lint, typecheck, unit tests, integration tests, and builds;
- add request IDs, structured logging, health checks, and migration workflow.

**Exit:** a clean checkout starts locally with one command and CI passes.

### Milestone 1 — Identity, topology, and catalog (4–5 days)

- implement authentication, refresh-token rotation, and warehouse-scoped RBAC;
- build warehouse/zone/location and SKU/barcode schemas and APIs;
- add admin screens and seed a realistic demo warehouse;
- print location and SKU labels with ZPL/PDF preview.

**Exit:** an administrator can configure a warehouse and scan every location/SKU barcode.

### Milestone 2 — Inventory kernel (1 week)

- implement balances, the append-only ledger, idempotency, and transactional mutation service;
- implement stock query and transaction-history APIs/UI;
- add adjustments with reason and supervisor permission;
- add outbox processing and reconciliation checks.

**Exit:** concurrent mutation tests preserve invariants and every quantity change is explainable from the ledger.

### Milestone 3 — Receiving and putaway (1 week)

- implement PO, receipt, inspection/discrepancy, and putaway state machines;
- build the desktop receiving monitor and responsive receiving/putaway routes in the same web application;
- add simple putaway recommendations based on allowed zone, empty capacity, and existing SKU stock;
- push live task/status changes to the operations console.

**Exit:** a PO can be received into staging and fully placed into storage with scan validation and an auditable ledger.

### Milestone 4 — Orders, allocation, and picking (1–1.5 weeks)

- implement order entry and transactional reservation;
- implement FIFO/FEFO allocation and deterministic balance locking;
- create, assign, and execute pick tasks through the scanner PWA routes;
- support short-pick and damaged-stock exceptions.

**Exit:** two workers cannot over-allocate or over-pick the same stock, including under retry and concurrency tests.

### Milestone 5 — Pack, label, and ship (4–5 days)

- implement packing-station scan verification and packages;
- generate versioned ZPL labels plus a development preview;
- implement shipment confirmation and final inventory/accounting transitions;
- complete outbound monitoring screens.

**Exit:** an order progresses from creation through a labeled, confirmed shipment without manual database intervention.

### Milestone 6 — Hardening and portfolio release (4–5 days)

- add dashboard projections, operational exports, and audit-log UI;
- run permission, concurrency, recovery, and performance tests;
- add backup/restore and migration rollback runbooks;
- add demo fixtures, architecture diagrams, screenshots, and deployment documentation;
- deploy a staging environment and execute end-to-end acceptance tests.

**Exit:** the demo is reproducible, observable, secure at the application level, and suitable for a portfolio walkthrough.

Expected MVP duration for one experienced full-stack developer: approximately **5–6 focused weeks**. A four-week version is possible by postponing camera scanning, live dashboards, ZPL printing, and advanced putaway recommendations while keeping keyboard-wedge scanning and the complete inventory lifecycle.

## 11. Testing strategy

- **Unit tests:** allocation, FIFO/FEFO ordering, state transitions, permissions, label rendering, and quantity calculations.
- **Database integration tests:** real PostgreSQL transactions, constraints, row locks, idempotency, outbox, and rollback behavior.
- **Concurrency tests:** simultaneous allocation, duplicate scan retries, concurrent moves, and pick-vs-adjust races.
- **API contract tests:** OpenAPI schema and generated-client compatibility.
- **End-to-end tests:** receive → putaway → allocate → pick → pack → ship, including exception paths.
- **PWA/device tests:** installation, camera permission, keyboard-wedge scanners, responsive layouts, poor connectivity, rapid repeated scans, and feedback behavior on representative Android devices.
- **Performance baseline:** define target throughput after deployment sizing; initially prove at least 50 concurrent active workers without inventory invariant failures.

CI must fail on schema drift, missing migrations, generated-client drift, or any invariant violation.

## 12. Security and operations

- scope every business query by warehouse authorization;
- use least-privilege service/database credentials and secret management outside source control;
- hash refresh tokens, revoke sessions, rate-limit authentication, and log privileged actions;
- redact tokens and personal data from logs;
- use signed object-storage URLs and validate uploaded file type/size;
- expose liveness/readiness checks and monitor queue lag, transaction failures, deadlocks, allocation failures, and reconciliation mismatches;
- back up PostgreSQL and practice a restore before calling the MVP production-ready.

## 13. Phase 2 and Phase 3 backlog

After the MVP is stable and measured:

### Phase 2 — Operational intelligence

- batch/wave and zone picking;
- replenishment tasks and min/max rules;
- cycle counting and variance approval;
- richer live dashboards and worker performance reporting;
- configurable allocation and task-priority rules.

### Phase 3 — Scale and integrations

- multi-warehouse routing and inventory promises;
- slotting optimization and forecast-driven replenishment;
- OMS, carrier, conveyor, and robotics integrations;
- partitioned ledger/reporting stores and event streaming;
- extraction of services only where measured throughput, ownership, or deployment isolation justifies it.

## 14. First implementation tickets

1. Create the monorepo and local Docker environment.
2. Add CI and shared TypeScript/test configuration.
3. Define Prisma models for identity, warehouse topology, and catalog.
4. Implement authentication and warehouse-scoped permission guards.
5. Add warehouse/location/SKU APIs and seed fixtures.
6. Build topology and catalog screens.
7. Document inventory invariants in an ADR before implementing mutation code.
8. Implement the transactional inventory command service and ledger.
9. Add idempotency and concurrency integration tests.
10. Deliver inventory search/history UI before beginning inbound workflows.

These tickets establish the foundation without locking later work into premature distributed architecture.
