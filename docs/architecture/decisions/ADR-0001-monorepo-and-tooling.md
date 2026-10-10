# ADR-0001: pnpm monorepo and tooling

- Status: Accepted
- Date: 2026-10-10

## Context

The repository is empty. The product needs a mobile app and an API that deploy independently but share request and response contracts. A website and admin console will join later.

## Decision

- One TypeScript monorepo using pnpm workspaces: `apps/mobile`, `services/api`, `packages/shared`, `packages/config`.
- TypeScript strict mode everywhere, pinned to 6.0.x: Expo SDK 57 and typescript-eslint do not yet support TypeScript 7. ESLint and Prettier configured once in `packages/config`.
- `packages/shared` holds Zod schemas and inferred types only. It may not import anything that is server-only or React Native-only.
- API tests: Vitest with `@cloudflare/vitest-plugin` (the renamed successor of `@cloudflare/vitest-pool-workers`), so tests run in the real Workers runtime.
- Mobile tests: Jest with `jest-expo` and React Native Testing Library. Maestro for end-to-end flows is optional and deferred.
- CI on GitHub Actions: format, lint, typecheck, tests, build. A bundle-size check for the Worker is intended but not yet implemented.
- A task runner such as Turborepo is added only when CI time justifies it.

## Consequences

- One place for contracts, so the mobile client and the API cannot drift silently.
- Expo needs care in a pnpm monorepo. If Metro resolution becomes a problem, the fallback is the hoisted node linker, recorded here as an amendment.
- Two test runners. Accepted, because each is the supported path for its platform.

## Alternatives considered

- Separate repositories: more overhead for a one-developer team and no shared contracts.
- npm or Yarn workspaces: workable; pnpm chosen for strict dependency isolation and speed.
