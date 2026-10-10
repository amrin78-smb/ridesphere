# RideSphere mobile app

Expo + React Native + Expo Router. See the [root README](../../README.md) for setup and `AGENTS.md` here for Expo-specific rules.

- `src/app/` — routes only. One file per tab: Explore, Rides, Community, Trips, Profile.
- `src/features/<name>/` — feature code (hooks, components) used by routes.
- `src/components/` — shared UI. `Screen` and `StateView` are the starting point for every screen.
- `src/lib/` — API client and query client.
- `src/theme/` — design tokens. Do not hard-code colours or spacing elsewhere.
