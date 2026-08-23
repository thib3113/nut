# AGENTS.md — Instructions for AI Agents

This file provides guidance for AI agents working on the **nut-client** codebase — a Node.js/TypeScript client library for [Network UPS Tools (NUT)](https://networkupstools.org/), published on npm as `nut-client`.

---

## Quick Start

```bash
pnpm install              # install dependencies
pnpm run build            # type-check + bundle (esbuild) + emit declarations
pnpm run test             # run all tests (vitest)
pnpm run lint             # ESLint check
pnpm run lint:fix         # ESLint auto-fix
```

Always run `pnpm run build` and `pnpm run test` before proposing changes.

---

## Tech Stack

| Tool | Detail |
|---|---|
| TypeScript | strict mode |
| Node.js | >= 18 |
| Package manager | pnpm |
| Bundler | esbuild (dual ESM/CJS) |
| Test runner | Vitest + @vitest/coverage-v8 |
| Linting | ESLint (flat config) + Prettier |
| Docs | TypeDoc |
| CI/CD | GitHub Actions |

---

## Project Structure

```
src/
  index.ts              # barrel exports
  NUTClient.ts          # high-level client facade
  RawNUTClient.ts       # low-level TCP client, NUT protocol implementation
  Monitor.ts            # event-based UPS monitoring (TypedEmitter)
  UPS.ts                # UPS device representation
  Heartbeat.ts          # interval-based polling utility
  ENUTStatus.ts         # enum for UPS battery statuses
  NUTVariables.ts       # union types for all NUT variable names (~1100 lines)
  utils.ts              # parsing, error mapping, escaping utilities
  utils.internal.ts     # internal debug utility
  pkg.ts                # AUTO-GENERATED at build time — NEVER edit
  Errors/               # 25 custom error classes mapping to NUT protocol error codes

tests/
  NUTClient.tests.ts    # unit tests (mocked)
  Monitor.tests.ts      # unit tests (mocked)
  UPS.tests.ts          # unit tests (mocked)
  utils.tests.ts        # unit tests (mocked)
  utils.internal.tests.ts
  usage.tests.ts        # INTEGRATION tests — requires a running NUT server
  _scripts/setup.js     # pre-test connectivity check

lib/                    # build output (gitignored)
.github/                # CI/CD workflows, composite actions, Docker test image
esbuild.mjs             # build script for dual bundling
```

---

## Architecture

The client follows a **two-layer design**:

```
RawNUTClient  →  NUTClient  →  UPS
(TCP/protocol)   (facade)      (domain object)
```

- **RawNUTClient** handles raw TCP connections and NUT protocol commands. A command queue (`async/queue`, concurrency 1) serializes all protocol commands.
- **NUTClient** is the public-facing facade that wraps RawNUTClient and adds parsing/structure.
- **UPS** represents a single UPS device with typed access to variables.
- **Monitor** uses `TypedEmitter` for type-safe event emission.
- **25 custom error classes** in `src/Errors/` map to NUT protocol error codes.
- Minimal runtime dependencies: `async`, `debug`, `tiny-typed-emitter`.

---

## Rules

### MUST DO

- Use English for everything: code, comments, documentation, commit messages, and any other text.
- Run `pnpm run build` and `pnpm run test` before proposing changes.
- Follow existing code style — Prettier and ESLint are configured; run `pnpm run lint:fix` if unsure.
- Respect the two-layer architecture (`RawNUTClient` → `NUTClient` → `UPS`). Do not collapse layers or bypass the facade.
- Keep runtime dependencies minimal. Discuss before adding any new one.
- Use existing error classes from `src/Errors/` when adding new error handling. Create a new error class only if it maps to a distinct NUT protocol error.
- Write tests for new features and bug fixes.
- Maintain the dual ESM/CJS export contract — verify `package.json` `exports` field if touching build config.

### NEVER DO

- **Never edit `src/pkg.ts`** — it is auto-generated at build time from `package.json`.
- **Never edit files in `lib/`** — it is build output and gitignored.
- **Never modify `escapeCommandPart()` in `src/utils.ts` without extreme care** — it prevents NUT protocol command injection. Any regression here is a security vulnerability.
- **Never add runtime dependencies** without strong justification. The library has very few dependencies; keep it that way.
- **Never break the dual ESM/CJS export contract.**

---

## Testing

- **Unit tests** (mocked, no external services): `pnpm run test`
- **Integration test** (`tests/usage.tests.ts`): requires a running NUT server.
  - In CI: a Docker container built from `.github/tests/Dockerfile` (NUT from source with `dummy-ups` driver).
  - Locally: run a real NUT server or build the Docker image yourself.
- When adding tests, follow existing patterns: unit tests in `tests/*.tests.ts`, integration scenarios in `tests/usage.tests.ts`.
- If integration tests cannot run in your environment, clearly state which tests you ran and which you could not.

---

## Security

- `escapeCommandPart()` in `src/utils.ts` is the primary defense against NUT protocol command injection. Any change to command formatting must maintain or improve this protection.
- Never log or expose credentials in debug output. The `debug` package is used with namespace `DEBUG=nut-client:*` — anything logged there is potentially visible to end users.

---

## CI/CD

- You **may** modify CI configuration files under `.github/`.
- When modifying CI, ensure the Docker NUT test image still builds and all tests still pass.
- `CI.yml` — main pipeline: Node.js matrix, Docker NUT image, tests + coverage, ESLint, Codecov upload.
- `documentation.yml` — deploys TypeDoc to GitHub Pages on push to `main`.
- `release.yml` — publishes to npm on GitHub release creation.

---

## Code Style

- **Prettier**: semicolons, single quotes, print width 140, tab width 4, no trailing commas.
- **ESLint**: flat config with `@typescript-eslint/parser` + prettier integration.
- **TypeScript**: strict mode.
- **EditorConfig**: 4-space indent (2 for YAML/package.json), LF line endings.
- Run `pnpm run lint:fix` to auto-format before committing.

---

## Git

- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/) format (e.g., `fix(security): prevent command injection in LIST VAR handler`).
- Main branch is `main`.
- No git hooks configured.

---

## Dependencies

- Runtime dependencies are pinned and minimal.
- Dev dependencies are pinned via Renovate with a 3-day stability delay and auto-merge for minor/patch updates.
- Do not add `dependencies` without strong justification. Prefer `devDependencies` for anything build/test/doc-related.
