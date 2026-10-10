# ADR-0002: API on Cloudflare Workers with Hono, replacing NestJS

- Status: Accepted (confirmed by the owner, 2026-10-10)
- Date: 2026-10-10

## Context

The product proposal recommends a NestJS REST API. The owner has since decided to deploy on Cloudflare Workers with Neon.

These two choices pull against each other. NestJS is built around a long-lived Node process: an HTTP adapter (Express or Fastify), decorator metadata resolved at boot, and a dependency-injection container constructed on startup. Workers run short-lived isolates on the workerd runtime with bounded startup time, bundle size and CPU time, and only partial Node compatibility. NestJS on Workers is not a supported or common deployment, and making it work means carrying compatibility shims on the critical path of every request.

The proposal also says the stack must not change silently. This record is the explicit change.

## Decision

Build the API with **Hono** on Cloudflare Workers.

- Routes and validation with `@hono/zod-openapi`, which produces the OpenAPI document from the same Zod schemas that validate requests.
- The NestJS module boundaries from the proposal are kept as plain folders (`modules/<name>/routes.ts`, `service.ts`, `schemas.ts`). Dependencies are passed explicitly; there is no DI container.
- Guards become Hono middleware and small permission helpers called by services.
- Authentication was later settled in ADR-0005 (Better Auth); the original note here about verifying a provider JWT with `jose` no longer applies.
- One Worker for the whole API.

## Consequences

- The API runs natively on the target platform with small bundles and fast cold starts.
- Zod schemas are shared with the mobile app's forms through `packages/shared`.
- We lose NestJS conventions and its ecosystem of ready-made modules. Structure has to be maintained by discipline and review; the layout is documented in the architecture overview.
- Every dependency must be checked for Workers compatibility before it is adopted.
- Hono also runs on Node, Bun and Deno, so leaving Cloudflare later means replacing bindings (Hyperdrive, R2, Queues), not rewriting the API.

## Alternatives considered

- **NestJS on Cloudflare Containers or another Node host.** Keeps the proposal's framework but gives up the Workers deployment the owner asked for, and adds a container to operate.
- **NestJS on Workers through Node compatibility.** Would need a spike to prove, with ongoing risk from startup cost and bundle size. Not worth it for an MVP.
- **Plain Workers fetch handler or itty-router.** Less structure and no OpenAPI integration.

If the owner prefers to keep NestJS, the hosting decision has to change with it; supersede this record rather than mixing the two.
