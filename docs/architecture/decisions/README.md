# Architecture decision records

One file per significant decision, numbered in order. A record is never rewritten to change its meaning: add a new one that supersedes it.

| ADR | Title | Status |
| --- | --- | --- |
| [0001](ADR-0001-monorepo-and-tooling.md) | pnpm monorepo and tooling | Accepted |
| [0002](ADR-0002-api-on-cloudflare-workers-with-hono.md) | API on Cloudflare Workers with Hono, replacing NestJS | Accepted |
| [0003](ADR-0003-neon-postgres-via-hyperdrive.md) | Neon PostgreSQL with Drizzle, connected through Hyperdrive | Accepted, spike partly done |
| [0004](ADR-0004-media-on-cloudflare-r2.md) | Media on Cloudflare R2 | Accepted |
| [0005](ADR-0005-authentication-provider.md) | Authentication with self-hosted Better Auth | Accepted |

## Template

```markdown
# ADR-NNNN: Title

- Status: Proposed | Accepted | Superseded by ADR-NNNN
- Date: YYYY-MM-DD

## Context
## Decision
## Consequences
## Alternatives considered
```
