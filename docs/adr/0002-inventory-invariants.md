# ADR 0002: Inventory invariants

## Status

Accepted before inventory command implementation.

## Invariants

1. On-hand and reserved quantities are never negative.
2. Reserved quantity never exceeds usable on-hand quantity.
3. Available quantity is derived as on-hand minus reserved; it is not independently stored or edited.
4. Every balance mutation and its append-only ledger entry commit in the same PostgreSQL transaction.
5. Retried scanner commands with the same idempotency key return the original outcome and never apply twice.
6. Multi-balance commands lock rows in deterministic identifier order.
7. Published events are created through the transactional outbox; a queue or WebSocket is never authoritative.
8. Corrections use reasoned, authorized adjustments rather than editing ledger history.
