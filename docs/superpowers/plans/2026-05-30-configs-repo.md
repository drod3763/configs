# configs repo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the `drod3763/configs` monorepo, publish 6 shared config packages to npm, add 6 companion reusable GitHub Actions workflows, then update agentic-tools to consume them.

**Architecture:** Bun workspaces monorepo with each config package in `packages/<name>/`. Packages are config-only (no build step) — plain JS/JSON/YAML files published directly. GitHub Actions workflows use `on: workflow_call` for reuse across repos.

**Tech Stack:** Bun 1.3, TypeScript ESLint, Prettier 3, markdownlint-cli2, Vitest 2, @commitlint/cli, GitHub Actions

---

## File Map

**Created in `/Users/derick/Projects/configs/`:**

| File | Purpose |
|---|---|
| `package.json` | Bun workspaces root |
| `.gitignore` | Ignore node_modules, coverage, dist |
| `packages/eslint-config/package.json` | `@drod3763/eslint-config` manifest |
| `packages/eslint-config/index.mjs` | Flat config array + testOverride export |
| `packages/tsconfig/package.json` | `@drod3763/tsconfig` manifest |
| `packages/tsconfig/base.json` | Base TS compiler options |
| `packages/tsconfig/test.json` | Test overlay (noEmit, rootDir: ".") |
| `packages/prettier-config/package.json` | `@drod3763/prettier-config` manifest |
| `packages/prettier-config/index.mjs` | Prettier config object |
| `packages/markdownlint-config/package.json` | `@drod3763/markdownlint-config` manifest |
| `packages/markdownlint-config/index.yaml` | markdownlint rules (MD013/041/060 off) |
| `packages/vitest-config/package.json` | `@drod3763/vitest-config` manifest |
| `packages/vitest-config/index.mjs` | Base defineConfig (node, v8 coverage) |
| `packages/commitlint-config/package.json` | `@drod3763/commitlint-config` manifest |
| `packages/commitlint-config/index.mjs` | Conventional commit rules |
| `.github/workflows/lint.yml` | Reusable: eslint |
| `.github/workflows/typecheck.yml` | Reusable: tsc --noEmit |
| `.github/workflows/format-check.yml` | Reusable: prettier --check |
| `.github/workflows/markdownlint.yml` | Reusable: markdownlint-cli2 |
| `.github/workflows/test.yml` | Reusable: vitest run --coverage |
| `.github/workflows/commitlint.yml` | Reusable: commitlint on PR commits |

**Modified in `/Users/derick/Projects/agentic-tools/`:**

| File | Change |
|---|---|
| `package.json` | Replace inline devDeps with published packages |
| `eslint.config.mjs` | Extend `@drod3763/eslint-config` |
| `.prettierrc` → deleted | Move to `"prettier"` key in package.json |
| `.markdownlint-cli2.yaml` | Extend `@drod3763/markdownlint-config` |
| `plugins/truenas/tsconfig.json` | Extend `@drod3763/tsconfig/base.json` |
| `plugins/truenas/tsconfig.test.json` | Keep extending local tsconfig.json |
| `plugins/truenas/vitest.config.ts` | mergeConfig with `@drod3763/vitest-config` |

---

## Task 1: Scaffold Root Monorepo

**Files:**
- Create: `package.json`
- Create: `.gitignore`

- [ ] **Step 1: Create root package.json**

```json
{
  "name": "configs",
  "private": true,
  "workspaces": ["packages/*"]
}
```

Save to `/Users/derick/Projects/configs/package.json`.

- [ ] **Step 2: Create .gitignore**

```
node_modules
coverage
dist
*.tsbuildinfo
```

Save to `/Users/derick/Projects/configs/.gitignore`.

- [ ] **Step 3: Commit**

```bash
cd /Users/derick/Projects/configs
git add package.json .gitignore
git commit -m "chore: scaffold root monorepo"
```

---

## Task 2: eslint-config Package

**Files:**
- Create: `packages/eslint-config/package.json`
- Create: `packages/eslint-config/index.mjs`

The shared config exports a flat config array (rules only, no file globs or project paths — consuming repos add those). Also exports a named `testOverride` for disabling explicit return types in test files.

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@drod3763/eslint-config",
  "version": "1.0.0",
  "type": "module",
  "exports": {
    ".": "./index.mjs"
  },
  "publishConfig": {
    "access": "public"
  },
  "peerDependencies": {
    "eslint": ">=9.0.0",
    "typescript-eslint": ">=8.0.0"
  }
}
```

Save to `packages/eslint-config/package.json`.

- [ ] **Step 2: Create index.mjs**

```js
import tseslint from "typescript-eslint";

const config = tseslint.config(
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/explicit-function-return-type": "error",
      complexity: ["warn", { max: 10 }],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          varsIgnorePattern: "^_",
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
    },
  },
);

export default config;

export const testOverride = {
  rules: {
    "@typescript-eslint/explicit-function-return-type": "off",
  },
};
```

Save to `packages/eslint-config/index.mjs`.

- [ ] **Step 3: Smoke test — verify export shape**

```bash
node --input-type=module << 'EOF'
import config from '/Users/derick/Projects/configs/packages/eslint-config/index.mjs';
console.assert(Array.isArray(config), "config must be an array");
console.log("eslint-config: OK,", config.length, "entries");
EOF
```

Expected output: `eslint-config: OK, N entries` (no assertion errors).

- [ ] **Step 4: Commit**

```bash
cd /Users/derick/Projects/configs
git add packages/eslint-config/
git commit -m "feat(eslint-config): add @drod3763/eslint-config"
```

---

## Task 3: tsconfig Package

**Files:**
- Create: `packages/tsconfig/package.json`
- Create: `packages/tsconfig/base.json`
- Create: `packages/tsconfig/test.json`

`base.json` — general TS options for bun-based NodeNext projects. `test.json` — extends base, adds `noEmit: true` and `rootDir: "."` for test runs that span src + scripts.

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@drod3763/tsconfig",
  "version": "1.0.0",
  "exports": {
    "./base.json": "./base.json",
    "./test.json": "./test.json"
  },
  "publishConfig": {
    "access": "public"
  }
}
```

Save to `packages/tsconfig/package.json`.

- [ ] **Step 2: Create base.json**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["bun-types"]
  }
}
```

Save to `packages/tsconfig/base.json`.

- [ ] **Step 3: Create test.json**

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "noEmit": true,
    "rootDir": "."
  }
}
```

Save to `packages/tsconfig/test.json`.

- [ ] **Step 4: Smoke test — validate JSON parses**

```bash
node -e "
  const base = JSON.parse(require('fs').readFileSync('/Users/derick/Projects/configs/packages/tsconfig/base.json', 'utf8'));
  const test = JSON.parse(require('fs').readFileSync('/Users/derick/Projects/configs/packages/tsconfig/test.json', 'utf8'));
  console.assert(base.compilerOptions.strict === true, 'strict must be true');
  console.assert(test.compilerOptions.noEmit === true, 'noEmit must be true');
  console.log('tsconfig: OK');
"
```

Expected: `tsconfig: OK`

- [ ] **Step 5: Commit**

```bash
cd /Users/derick/Projects/configs
git add packages/tsconfig/
git commit -m "feat(tsconfig): add @drod3763/tsconfig"
```

---

## Task 4: prettier-config Package

**Files:**
- Create: `packages/prettier-config/package.json`
- Create: `packages/prettier-config/index.mjs`

Prettier resolves the config by loading the package's main export. With `"prettier": "@drod3763/prettier-config"` in a consuming repo's package.json, Prettier imports this package and uses the default export as config.

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@drod3763/prettier-config",
  "version": "1.0.0",
  "type": "module",
  "exports": {
    ".": "./index.mjs"
  },
  "publishConfig": {
    "access": "public"
  },
  "peerDependencies": {
    "prettier": ">=3.0.0"
  }
}
```

Save to `packages/prettier-config/package.json`.

- [ ] **Step 2: Create index.mjs**

```js
export default {
  embeddedLanguageFormatting: "off",
};
```

Save to `packages/prettier-config/index.mjs`.

- [ ] **Step 3: Smoke test**

```bash
node --input-type=module << 'EOF'
import config from '/Users/derick/Projects/configs/packages/prettier-config/index.mjs';
console.assert(config.embeddedLanguageFormatting === "off", "embeddedLanguageFormatting must be off");
console.log("prettier-config: OK");
EOF
```

Expected: `prettier-config: OK`

- [ ] **Step 4: Commit**

```bash
cd /Users/derick/Projects/configs
git add packages/prettier-config/
git commit -m "feat(prettier-config): add @drod3763/prettier-config"
```

---

## Task 5: markdownlint-config Package

**Files:**
- Create: `packages/markdownlint-config/package.json`
- Create: `packages/markdownlint-config/index.yaml`

No `"type": "module"` — this package exports a YAML file, not an ES module. markdownlint-cli2 resolves `extends: "@drod3763/markdownlint-config"` by loading the package's `main` field.

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@drod3763/markdownlint-config",
  "version": "1.0.0",
  "main": "index.yaml",
  "exports": {
    ".": "./index.yaml"
  },
  "publishConfig": {
    "access": "public"
  },
  "peerDependencies": {
    "markdownlint-cli2": ">=0.17.0"
  }
}
```

Save to `packages/markdownlint-config/package.json`.

- [ ] **Step 2: Create index.yaml**

```yaml
MD013: false  # line-length — prose and skill docs have long lines
MD041: false  # first-line-heading — not all docs start with h1
MD060: false  # table-column-style — compact separators are fine
```

Save to `packages/markdownlint-config/index.yaml`.

- [ ] **Step 3: Smoke test — file is valid YAML**

```bash
node -e "
  const fs = require('fs');
  const content = fs.readFileSync('/Users/derick/Projects/configs/packages/markdownlint-config/index.yaml', 'utf8');
  console.assert(content.includes('MD013'), 'MD013 rule must be present');
  console.log('markdownlint-config: OK');
"
```

Expected: `markdownlint-config: OK`

- [ ] **Step 4: Commit**

```bash
cd /Users/derick/Projects/configs
git add packages/markdownlint-config/
git commit -m "feat(markdownlint-config): add @drod3763/markdownlint-config"
```

---

## Task 6: vitest-config Package

**Files:**
- Create: `packages/vitest-config/package.json`
- Create: `packages/vitest-config/index.mjs`

Exports a base `defineConfig` result. Consuming repos use `mergeConfig` to layer project-specific settings (include/exclude paths, poolOptions) on top.

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@drod3763/vitest-config",
  "version": "1.0.0",
  "type": "module",
  "exports": {
    ".": "./index.mjs"
  },
  "publishConfig": {
    "access": "public"
  },
  "peerDependencies": {
    "@vitest/coverage-v8": ">=2.0.0",
    "vitest": ">=2.0.0"
  }
}
```

Save to `packages/vitest-config/package.json`.

- [ ] **Step 2: Create index.mjs**

```js
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      reportsDirectory: "coverage",
    },
  },
});
```

Save to `packages/vitest-config/index.mjs`.

- [ ] **Step 3: Smoke test — requires vitest to be installed**

This package has vitest as a peer dep. Install it locally first, then verify:

```bash
cd /Users/derick/Projects/configs/packages/vitest-config
bun add -d vitest @vitest/coverage-v8
node --input-type=module << 'EOF'
import config from '/Users/derick/Projects/configs/packages/vitest-config/index.mjs';
console.assert(config.test.environment === "node", "environment must be node");
console.assert(config.test.coverage.provider === "v8", "provider must be v8");
console.log("vitest-config: OK");
EOF
```

Expected: `vitest-config: OK`

- [ ] **Step 4: Commit**

```bash
cd /Users/derick/Projects/configs
git add packages/vitest-config/
git commit -m "feat(vitest-config): add @drod3763/vitest-config"
```

---

## Task 7: commitlint-config Package

**Files:**
- Create: `packages/commitlint-config/package.json`
- Create: `packages/commitlint-config/index.mjs`

Enforces conventional commits: `feat|fix|docs|chore|refactor|test`, optional scope, subject lowercase, no trailing period, max 72 chars.

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@drod3763/commitlint-config",
  "version": "1.0.0",
  "type": "module",
  "exports": {
    ".": "./index.mjs"
  },
  "publishConfig": {
    "access": "public"
  },
  "peerDependencies": {
    "@commitlint/cli": ">=19.0.0"
  }
}
```

Save to `packages/commitlint-config/package.json`.

- [ ] **Step 2: Create index.mjs**

```js
export default {
  rules: {
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "docs", "chore", "refactor", "test"],
    ],
    "type-case": [2, "always", "lower-case"],
    "type-empty": [2, "never"],
    "scope-case": [2, "always", "lower-case"],
    "subject-case": [2, "never", ["upper-case", "pascal-case", "start-case"]],
    "subject-full-stop": [2, "never", "."],
    "subject-empty": [2, "never"],
    "header-max-length": [2, "always", 72],
  },
};
```

Save to `packages/commitlint-config/index.mjs`.

- [ ] **Step 3: Smoke test**

```bash
node --input-type=module << 'EOF'
import config from '/Users/derick/Projects/configs/packages/commitlint-config/index.mjs';
const types = config.rules["type-enum"][2];
console.assert(types.includes("feat"), "feat must be allowed");
console.assert(types.includes("fix"), "fix must be allowed");
console.assert(!types.includes("wip"), "wip must not be allowed");
console.log("commitlint-config: OK, types:", types.join(", "));
EOF
```

Expected: `commitlint-config: OK, types: feat, fix, docs, chore, refactor, test`

- [ ] **Step 4: Commit**

```bash
cd /Users/derick/Projects/configs
git add packages/commitlint-config/
git commit -m "feat(commitlint-config): add @drod3763/commitlint-config"
```

---

## Task 8: Bun Install + Verify Workspaces

- [ ] **Step 1: Install all workspace deps from root**

```bash
cd /Users/derick/Projects/configs
bun install
```

Expected: `bun.lock` created, `node_modules` at root and in any packages that have devDeps.

- [ ] **Step 2: Verify workspaces are linked**

```bash
cd /Users/derick/Projects/configs
bun pm ls
```

Expected: lists all 6 `@drod3763/*` packages.

- [ ] **Step 3: Commit bun.lock**

```bash
cd /Users/derick/Projects/configs
git add bun.lock
git commit -m "chore: install workspace dependencies"
```

---

## Task 9: GitHub Actions Workflows

**Files:**
- Create: `.github/workflows/lint.yml`
- Create: `.github/workflows/typecheck.yml`
- Create: `.github/workflows/format-check.yml`
- Create: `.github/workflows/markdownlint.yml`
- Create: `.github/workflows/test.yml`
- Create: `.github/workflows/commitlint.yml`

All workflows use `on: workflow_call`. Consuming repos reference them via `uses: drod3763/configs/.github/workflows/<name>.yml@main`. They assume the consuming repo uses bun and has the corresponding config package as a devDep.

- [ ] **Step 1: Create lint.yml**

```yaml
name: Lint

on:
  workflow_call:

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: bunx eslint .
```

Save to `.github/workflows/lint.yml`.

- [ ] **Step 2: Create typecheck.yml**

```yaml
name: Typecheck

on:
  workflow_call:
    inputs:
      tsconfig:
        type: string
        default: tsconfig.json
        description: Path to tsconfig file

jobs:
  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: bunx tsc --noEmit --project ${{ inputs.tsconfig }}
```

Save to `.github/workflows/typecheck.yml`.

- [ ] **Step 3: Create format-check.yml**

```yaml
name: Format Check

on:
  workflow_call:

jobs:
  format-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: bunx prettier --check .
```

Save to `.github/workflows/format-check.yml`.

- [ ] **Step 4: Create markdownlint.yml**

```yaml
name: Markdownlint

on:
  workflow_call:

jobs:
  markdownlint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: bunx markdownlint-cli2
```

Save to `.github/workflows/markdownlint.yml`.

- [ ] **Step 5: Create test.yml**

```yaml
name: Test

on:
  workflow_call:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: bunx vitest run --coverage
```

Save to `.github/workflows/test.yml`.

- [ ] **Step 6: Create commitlint.yml**

Lints all commit messages added in the PR. The calling workflow must pass the base and head SHAs as inputs — `github.event.pull_request` context is not available inside a `workflow_call` job.

```yaml
name: Commitlint

on:
  workflow_call:
    inputs:
      base-sha:
        type: string
        required: true
        description: Base commit SHA (PR base)
      head-sha:
        type: string
        required: true
        description: Head commit SHA (PR head)

jobs:
  commitlint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: bunx commitlint --from ${{ inputs.base-sha }} --to ${{ inputs.head-sha }} --verbose
```

Consuming repo calls it like:

```yaml
uses: drod3763/configs/.github/workflows/commitlint.yml@main
with:
  base-sha: ${{ github.event.pull_request.base.sha }}
  head-sha: ${{ github.event.pull_request.head.sha }}
```

Save to `.github/workflows/commitlint.yml`.

- [ ] **Step 7: Commit workflows**

```bash
cd /Users/derick/Projects/configs
git add .github/
git commit -m "feat: add reusable GitHub Actions workflows"
```

---

## Task 10: Create GitHub Remote + Push

- [ ] **Step 1: Create the GitHub repo**

```bash
cd /Users/derick/Projects/configs
gh repo create drod3763/configs --public --source=. --remote=origin --push
```

Expected: repo created at `https://github.com/drod3763/configs`, all commits pushed.

- [ ] **Step 2: Verify push**

```bash
gh repo view drod3763/configs --web
```

Confirms repo is live with all commits.

---

## Task 11: npm Auth + Publish All Packages

You must be logged in to npm with the `@drod3763` scope before publishing.

- [ ] **Step 1: Log in to npm**

```bash
npm login
```

Follow the browser prompt. When complete:

```bash
npm whoami
```

Expected: `drod3763`

- [ ] **Step 2: Publish eslint-config**

```bash
cd /Users/derick/Projects/configs/packages/eslint-config
bun publish --access public
```

Expected: `+ @drod3763/eslint-config@1.0.0`

- [ ] **Step 3: Publish tsconfig**

```bash
cd /Users/derick/Projects/configs/packages/tsconfig
bun publish --access public
```

Expected: `+ @drod3763/tsconfig@1.0.0`

- [ ] **Step 4: Publish prettier-config**

```bash
cd /Users/derick/Projects/configs/packages/prettier-config
bun publish --access public
```

Expected: `+ @drod3763/prettier-config@1.0.0`

- [ ] **Step 5: Publish markdownlint-config**

```bash
cd /Users/derick/Projects/configs/packages/markdownlint-config
bun publish --access public
```

Expected: `+ @drod3763/markdownlint-config@1.0.0`

- [ ] **Step 6: Publish vitest-config**

```bash
cd /Users/derick/Projects/configs/packages/vitest-config
bun publish --access public
```

Expected: `+ @drod3763/vitest-config@1.0.0`

- [ ] **Step 7: Publish commitlint-config**

```bash
cd /Users/derick/Projects/configs/packages/commitlint-config
bun publish --access public
```

Expected: `+ @drod3763/commitlint-config@1.0.0`

- [ ] **Step 8: Verify all packages are live on npm**

```bash
npm info @drod3763/eslint-config version
npm info @drod3763/tsconfig version
npm info @drod3763/prettier-config version
npm info @drod3763/markdownlint-config version
npm info @drod3763/vitest-config version
npm info @drod3763/commitlint-config version
```

Expected: all print `1.0.0`.

---

## Task 12: Update agentic-tools to Consume Published Packages

**Working directory:** `/Users/derick/Projects/agentic-tools`

- [ ] **Step 1: Install published packages as devDeps**

```bash
cd /Users/derick/Projects/agentic-tools
bun add -d @drod3763/eslint-config @drod3763/prettier-config @drod3763/markdownlint-config
```

```bash
cd /Users/derick/Projects/agentic-tools/plugins/truenas
bun add -d @drod3763/tsconfig @drod3763/vitest-config
```

- [ ] **Step 2: Update eslint.config.mjs**

Replace the entire file:

```js
import sharedConfig, { testOverride } from "@drod3763/eslint-config";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["**/dist/**", "**/node_modules/**"],
  },
  {
    files: ["plugins/truenas/src/**/*.ts", "plugins/truenas/scripts/**/*.ts"],
    extends: sharedConfig,
    languageOptions: {
      parserOptions: {
        project: [
          "./plugins/truenas/tsconfig.json",
          "./plugins/truenas/tsconfig.test.json",
        ],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ["plugins/truenas/**/*.test.ts"],
    ...testOverride,
  },
);
```

- [ ] **Step 3: Update package.json — move prettier config**

Remove `.prettierrc`. In `package.json`, add:

```json
{
  "prettier": "@drod3763/prettier-config"
}
```

Delete `.prettierrc`:

```bash
cd /Users/derick/Projects/agentic-tools
rm .prettierrc
```

- [ ] **Step 4: Update .markdownlint-cli2.yaml**

Replace the entire file:

```yaml
config:
  extends: "@drod3763/markdownlint-config"

globs:
  - "**/*.md"

ignores:
  - "node_modules"
  - "plugins/truenas/node_modules"
```

- [ ] **Step 5: Update plugins/truenas/tsconfig.json**

Replace the entire file:

```json
{
  "extends": "@drod3763/tsconfig/base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"],
  "exclude": ["src/**/*.test.ts"]
}
```

- [ ] **Step 6: Update plugins/truenas/vitest.config.ts**

Replace the entire file:

```ts
import { mergeConfig } from "vitest/config";
import { tmpdir } from "node:os";
import { join } from "node:path";
import baseConfig from "@drod3763/vitest-config";

// Node 25+ added built-in localStorage (WinterCG compat). MSW's cookieStore
// accesses it at import time, which emits a warning unless --localstorage-file
// is set. The flag is Node 25+ only — older versions reject it as unknown.
const nodeMajor = parseInt(process.versions.node.split(".")[0], 10);
const localstorageExecArgv =
  nodeMajor >= 25
    ? [`--localstorage-file=${join(tmpdir(), "vitest-truenas-localstorage")}`]
    : [];

export default mergeConfig(baseConfig, {
  test: {
    poolOptions: {
      forks: { execArgv: localstorageExecArgv },
    },
    coverage: {
      include: ["src/**/*.ts"],
      exclude: ["src/index.ts", "src/**/*.test.ts"],
    },
  },
});
```

- [ ] **Step 7: Run the full test suite to verify nothing broke**

```bash
cd /Users/derick/Projects/agentic-tools
bun run lint && bun run lint:md && bun run format:check && bun run typecheck && bun run test
```

Expected: all pass with no errors.

- [ ] **Step 8: Commit agentic-tools updates**

```bash
cd /Users/derick/Projects/agentic-tools
git add package.json eslint.config.mjs .markdownlint-cli2.yaml plugins/truenas/tsconfig.json plugins/truenas/vitest.config.ts
git rm .prettierrc
git commit -m "chore: consume @drod3763 shared configs"
```
