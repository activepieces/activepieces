# Wiring Checklist & Setup

## Wiring Steps (after implementing all files)

1. **Import every action** in `src/index.ts` and add to `actions: [...]`
2. **Import every trigger** in `src/index.ts` and add to `triggers: [...]`
3. **Export auth** from `src/index.ts` so actions/triggers can import it via `import { myAppAuth } from '../../'`
4. **Add `createCustomApiCallAction`** for power users (recommended)
5. **Register in `tsconfig.base.json`** at the repo root -- add to `compilerOptions.paths`:
   ```json
   "@activepieces/piece-<name>": [
     "packages/pieces/community/<name>/src/index.ts"
   ]
   ```
   Insert alphabetically among the other `@activepieces/piece-*` entries. **Build fails without this.**

---

## Config Files (for manual creation)

When the CLI is not available, copy these from an existing piece (e.g., `packages/pieces/community/qrcode/`) and update paths:

### package.json

```json
{
  "name": "@activepieces/piece-<name>",
  "version": "0.0.1",
  "dependencies": {}
}
```

Add any npm dependencies your piece needs (e.g., third-party SDKs).

### project.json

```json
{
  "name": "pieces-<name>",
  "$schema": "../../../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "packages/pieces/community/<name>/src",
  "projectType": "library",
  "release": {
    "version": {
      "currentVersionResolver": "git-tag",
      "preserveLocalDependencyProtocols": false,
      "manifestRootsToUpdate": ["dist/{projectRoot}"]
    }
  },
  "tags": [],
  "targets": {
    "build": {
      "executor": "@nx/js:tsc",
      "outputs": ["{options.outputPath}"],
      "options": {
        "outputPath": "dist/packages/pieces/community/<name>",
        "tsConfig": "packages/pieces/community/<name>/tsconfig.lib.json",
        "packageJson": "packages/pieces/community/<name>/package.json",
        "main": "packages/pieces/community/<name>/src/index.ts",
        "assets": ["packages/pieces/community/<name>/*.md"],
        "buildableProjectDepsInPackageJsonType": "dependencies",
        "updateBuildableProjectDepsInPackageJson": true,
        "clean": false
      },
      "dependsOn": ["^build", "prebuild"]
    },
    "nx-release-publish": {
      "options": { "packageRoot": "dist/{projectRoot}" }
    },
    "lint": {
      "executor": "@nx/eslint:lint",
      "outputs": ["{options.outputFile}"]
    },
    "prebuild": {
      "executor": "nx:run-commands",
      "options": {
        "cwd": "packages/pieces/community/<name>",
        "command": "bun install --no-save --silent"
      },
      "dependsOn": ["^build"]
    }
  }
}
```

### .eslintrc.json

```json
{
  "extends": ["../../../../.eslintrc.base.json"],
  "ignorePatterns": ["!**/*"],
  "overrides": [
    { "files": ["*.ts", "*.tsx", "*.js", "*.jsx"], "rules": {} },
    { "files": ["*.ts", "*.tsx"], "rules": {} },
    { "files": ["*.js", "*.jsx"], "rules": {} }
  ]
}
```

### tsconfig.json

```json
{
  "extends": "../../../../tsconfig.base.json",
  "compilerOptions": { "module": "commonjs" },
  "files": [],
  "include": [],
  "references": [{ "path": "./tsconfig.lib.json" }]
}
```

### tsconfig.lib.json

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "../../../../dist/out-tsc",
    "declaration": true,
    "types": ["node"]
  },
  "include": ["src/**/*.ts"],
  "exclude": ["jest.config.ts", "src/**/*.spec.ts", "src/**/*.test.ts"]
}
```

---

## Build and Verify

```bash
npx nx run-many -t build --projects=pieces-<name>
```

If errors occur, fix them and rebuild. Common issues:
- Missing import in `src/index.ts`
- Missing `tsconfig.base.json` path entry
- Incorrect type on `context.auth` (cast with `as string` for SecretText)
- Missing `sampleData` on triggers

---

## Local Development & Testing

Add your piece to `AP_DEV_PIECES` in `packages/server/api/.env`:

```
AP_DEV_PIECES=<name>
```

For multiple pieces:
```
AP_DEV_PIECES=<name>,google-sheets,slack
```

Then start the dev server:
```bash
npm start
```

Go to `localhost:4200`, sign in with `dev@ap.com` / `12345678`, and find your piece in the flow builder.

---

## CLI Commands (when node_modules are installed)

```bash
# Create a new piece
npm run cli pieces create

# Create a new action in an existing piece
npm run cli actions create

# Create a new trigger in an existing piece
npm run cli triggers create

# Build a piece as .tgz archive
npm run build-piece
```
