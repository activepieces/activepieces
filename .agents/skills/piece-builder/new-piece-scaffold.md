# New-Piece Scaffold Files

Copy-ready templates for the four config files a new piece needs. Only "New piece" mode reaches here — add-action and bug-fix modes skip Step 3 entirely.

## `package.json`

```json
{
    "name": "@activepieces/piece-<name>",
    "version": "0.0.1",
    "main": "./dist/src/index.js",
    "types": "./dist/src/index.d.ts",
    "scripts": {
        "build": "tsc -p tsconfig.lib.json && cp package.json dist/",
        "lint": "eslint 'src/**/*.ts'"
    },
    "dependencies": {
        "@activepieces/pieces-common": "workspace:*",
        "@activepieces/pieces-framework": "workspace:*",
        "@activepieces/shared": "workspace:*",
        "tslib": "2.6.2"
    }
}
```

Add third-party SDKs to `dependencies` with a pinned version (e.g. `"stripe": "18.2.1"`).

## `.eslintrc.json`

```json
{
    "extends": ["../../../../.eslintrc.json"],
    "ignorePatterns": ["!**/*"],
    "overrides": [
        { "files": ["*.ts", "*.tsx", "*.js", "*.jsx"], "rules": {} },
        { "files": ["*.ts", "*.tsx"], "rules": {} },
        { "files": ["*.js", "*.jsx"], "rules": {} }
    ]
}
```

## `tsconfig.json`

```json
{
    "extends": "../../../../tsconfig.base.json",
    "compilerOptions": {
        "module": "commonjs",
        "forceConsistentCasingInFileNames": true,
        "strict": true,
        "noImplicitOverride": true,
        "noPropertyAccessFromIndexSignature": true,
        "noImplicitReturns": true,
        "noFallthroughCasesInSwitch": true
    },
    "files": [],
    "include": [],
    "references": [{ "path": "./tsconfig.lib.json" }]
}
```

## `tsconfig.lib.json`

```json
{
    "extends": "./tsconfig.json",
    "compilerOptions": {
        "rootDir": ".",
        "baseUrl": ".",
        "paths": {},
        "outDir": "./dist",
        "declaration": true,
        "types": ["node"]
    },
    "include": ["src/**/*.ts"],
    "exclude": ["jest.config.ts", "src/**/*.spec.ts", "src/**/*.test.ts"]
}
```
