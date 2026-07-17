# ADR 0001: Modular monolith and unified scanner PWA

## Status

Accepted.

## Context

The MVP must protect inventory invariants while supporting desktop operations and warehouse scanning. Splitting these workflows across services or separate native/web clients would increase deployment and consistency costs before throughput is known.

## Decision

Use a modular NestJS monolith backed by PostgreSQL. Use a single responsive Next.js PWA for desktop and scanner workflows. Stock-changing commands remain online-only and transactional. Redis and browser caches are never inventory systems of record.

## Consequences

- Domain modules must keep explicit boundaries even though they share a process and database.
- Scanner routes share contracts, authentication, and deployment with desktop routes.
- Native mobile development remains an option only if device integration or offline requirements justify it later.
