# configs

Shared developer config packages and reusable GitHub Actions workflows, published to npm under `@drod3763`.

## Packages

| Package | Version | Purpose |
|---|---|---|
| `@drod3763/eslint-config` | 1.0.0 | TypeScript ESLint flat config |
| `@drod3763/tsconfig` | 1.0.0 | TypeScript compiler options (base + test) |
| `@drod3763/prettier-config` | 1.0.0 | Prettier config |
| `@drod3763/markdownlint-config` | 1.0.0 | markdownlint-cli2 rules |
| `@drod3763/vitest-config` | 1.0.0 | Vitest base config with v8 coverage |
| `@drod3763/commitlint-config` | 1.0.0 | Conventional commit rules |

## Usage

### ESLint

```bash
bun add -d @drod3763/eslint-config eslint typescript-eslint
```

```js
// eslint.config.mjs
import sharedConfig, { testOverride } from "@drod3763/eslint-config";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["**/dist/**", "**/node_modules/**"] },
  {
    files: ["src/**/*.ts"],
    extends: sharedConfig,
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ["**/*.test.ts"],
    ...testOverride,
  },
);
```

### TypeScript

```bash
bun add -d @drod3763/tsconfig
```

```json
// tsconfig.json
{
  "extends": "@drod3763/tsconfig/base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

```json
// tsconfig.test.json
{
  "extends": "./tsconfig.json",
  "compilerOptions": { "noEmit": true, "rootDir": "." },
  "include": ["src/**/*.ts", "scripts/**/*.ts"],
  "exclude": []
}
```

### Prettier

```bash
bun add -d @drod3763/prettier-config prettier
```

```json
// package.json
{
  "prettier": "@drod3763/prettier-config"
}
```

### markdownlint

```bash
bun add -d @drod3763/markdownlint-config markdownlint-cli2
```

```yaml
# .markdownlint-cli2.yaml
config:
  extends: "@drod3763/markdownlint-config"
globs:
  - "**/*.md"
ignores:
  - "node_modules"
```

### Vitest

```bash
bun add -d @drod3763/vitest-config vitest @vitest/coverage-v8
```

```ts
// vitest.config.ts
import { mergeConfig } from "vitest/config";
import baseConfig from "@drod3763/vitest-config";

export default mergeConfig(baseConfig, {
  test: {
    coverage: {
      include: ["src/**/*.ts"],
      exclude: ["src/index.ts", "src/**/*.test.ts"],
    },
  },
});
```

### commitlint

```bash
bun add -d @drod3763/commitlint-config @commitlint/cli
```

```js
// commitlint.config.mjs
export default { extends: ["@drod3763/commitlint-config"] };
```

Allowed types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`

## Reusable Workflows

All workflows use `on: workflow_call`. Add to your repo's CI:

```yaml
jobs:
  lint:
    uses: drod3763/configs/.github/workflows/lint.yml@main

  typecheck:
    uses: drod3763/configs/.github/workflows/typecheck.yml@main

  format-check:
    uses: drod3763/configs/.github/workflows/format-check.yml@main

  markdownlint:
    uses: drod3763/configs/.github/workflows/markdownlint.yml@main

  test:
    uses: drod3763/configs/.github/workflows/test.yml@main

  commitlint:
    uses: drod3763/configs/.github/workflows/commitlint.yml@main
    with:
      base-sha: ${{ github.event.pull_request.base.sha }}
      head-sha: ${{ github.event.pull_request.head.sha }}
```

Workflows assume the consuming repo uses bun and has the relevant `@drod3763/*` packages as devDeps.

## Publishing

Packages are published via the [publish workflow](.github/workflows/publish.yml) using npm trusted publishing (OIDC — no stored token).

To publish locally:

```bash
# Configure bun auth once (global, not committed)
cat >> ~/.config/.bunfig.toml << 'EOF'
[install.scopes]
"@drod3763" = { registry = "https://registry.npmjs.org/", token = "YOUR_NPM_TOKEN" }
EOF

# Publish a package
cd packages/<name>
bun publish --access public
```
