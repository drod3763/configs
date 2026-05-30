# configs repo design

**Date:** 2026-05-30
**Status:** Approved

## Goal

A standalone monorepo (`drod3763/configs`) that publishes shared developer tooling configs as public npm packages and companion reusable GitHub Actions workflows. Consuming repos install the packages and optionally call the workflows to enforce the same standards everywhere.

## Scope

In:
- npm packages: eslint-config, tsconfig, prettier-config, markdownlint-config
- Reusable GitHub Actions workflows that exercise those packages

Out:
- Language configs (rustfmt, clippy) → dotfiles repo
- General-purpose GitHub Actions workflows not tied to these configs

## Repository Structure

```
configs/
├── packages/
│   ├── eslint-config/          # @drod3763/eslint-config
│   │   ├── package.json
│   │   └── index.mjs
│   ├── tsconfig/               # @drod3763/tsconfig
│   │   ├── package.json
│   │   ├── base.json
│   │   └── test.json           # extends base, noEmit, includes test files
│   ├── prettier-config/        # @drod3763/prettier-config
│   │   ├── package.json
│   │   └── index.mjs
│   └── markdownlint-config/    # @drod3763/markdownlint-config
│       ├── package.json
│       └── index.yaml
├── .github/
│   └── workflows/
│       ├── lint.yml             # reusable: eslint
│       ├── typecheck.yml        # reusable: tsc
│       ├── format-check.yml     # reusable: prettier --check
│       └── markdownlint.yml     # reusable: markdownlint-cli2
├── package.json                 # bun workspaces: ["packages/*"]
└── bun.lock
```

## npm Packages

### Shared package.json fields

Every package includes:

```json
{
  "name": "@drod3763/<name>",
  "version": "1.0.0",
  "type": "module",
  "publishConfig": { "access": "public" }
}
```

### @drod3763/eslint-config

Exports a flat config array via `index.mjs`. Seeded from agentic-tools:

- `typescript-eslint` recommended
- `@typescript-eslint/explicit-function-return-type: error`
- `complexity: ["warn", { max: 10 }]`
- `@typescript-eslint/no-unused-vars` with `^_` ignore patterns
- Test file overlay: disables `explicit-function-return-type`

Peer deps: `eslint`, `typescript-eslint`.

### @drod3763/tsconfig

Two exported configs:

- `base.json` — `ES2022`, `NodeNext` module/resolution, `strict`, `esModuleInterop`, `skipLibCheck`, `bun-types`
- `test.json` — extends base, `noEmit: true`, includes test files

Consuming repos: `"extends": "@drod3763/tsconfig/base.json"`.

### @drod3763/prettier-config

Single export: `{ "embeddedLanguageFormatting": "off" }`.

Consuming repos reference via `package.json`:
```json
{ "prettier": "@drod3763/prettier-config" }
```

### @drod3763/markdownlint-config

Exports `index.yaml`. Seeded from agentic-tools: MD013/MD041/MD060 off.

Package does NOT use `"type": "module"` — it's a YAML file, not ESM. Requires `"main": "index.yaml"` in package.json so markdownlint-cli2 resolves it correctly.

Consuming repos: `extends: "@drod3763/markdownlint-config"` in `.markdownlint-cli2.yaml`.

## Reusable GitHub Actions Workflows

Each workflow uses `on: workflow_call` with sensible input defaults. Consuming repos:

```yaml
uses: drod3763/configs/.github/workflows/lint.yml@main
```

| Workflow | Tool | Notes |
|---|---|---|
| `lint.yml` | eslint | installs `@drod3763/eslint-config` |
| `typecheck.yml` | tsc | installs `@drod3763/tsconfig` |
| `format-check.yml` | prettier | installs `@drod3763/prettier-config` |
| `markdownlint.yml` | markdownlint-cli2 | installs `@drod3763/markdownlint-config` |

## Publishing

- Registry: npm public (`registry.npmjs.org`)
- Scope: `@drod3763`
- Command: `bun publish` from each package directory
- Versioning: independent per package (not synchronized)
- CI: publish triggered manually or on tag push (e.g., `eslint-config@1.0.1`)

## Seeding

Initial content migrated from `drod3763/agentic-tools`:
- `eslint.config.mjs` → `packages/eslint-config/index.mjs`
- `plugins/truenas/tsconfig.json` → `packages/tsconfig/base.json`
- `plugins/truenas/tsconfig.test.json` → `packages/tsconfig/test.json`
- `.prettierrc` → `packages/prettier-config/index.mjs`
- `.markdownlint-cli2.yaml` → `packages/markdownlint-config/index.yaml`

After publishing, agentic-tools updates its configs to extend from the new packages.
