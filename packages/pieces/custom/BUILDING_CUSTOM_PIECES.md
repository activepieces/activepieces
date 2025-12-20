# Building Custom Pieces for Activepieces

This guide documents the common issues and solutions when building custom pieces for Activepieces.

## Root Cause Issues

### Issue 1: Version Mismatch Between Container and npm Packages

**Problem:**
- Activepieces container shows version `0.74.3` (platform version)
- npm packages (`@activepieces/pieces-framework`, `@activepieces/shared`, etc.) have versions like `0.20.1`, `0.22.0`
- Building pieces with `^0.74.3` fails because these versions don't exist in npm registry

**Example Error:**
```
No matching version found for @activepieces/pieces-framework@^0.74.3
```

**Root Cause:**
The version `0.74.3` is the **Activepieces platform version**, not the individual package versions. The packages used internally have different version numbers (0.20.x, 0.22.x).

### Issue 2: Dependency Version Conflicts

**Problem:**
Installing a piece built with specific versions like `^0.74.3` fails when the container uses different internal package versions.

**Solution:**
Use `peerDependencies` with wildcard versions instead of `dependencies` with specific versions.

## Solution: Correct package.json Structure

### ❌ Incorrect (Causes Installation Failures)
```json
{
  "name": "@yourscope/piece-name",
  "version": "0.0.1",
  "dependencies": {
    "@activepieces/pieces-framework": "^0.74.3",
    "@activepieces/pieces-common": "^0.74.3",
    "@activepieces/shared": "^0.74.3"
  }
}
```

### ✅ Correct (Works with Any Container Version)
```json
{
  "name": "@yourscope/piece-name",
  "version": "0.0.1",
  "peerDependencies": {
    "@activepieces/pieces-framework": "*",
    "@activepieces/pieces-common": "*",
    "@activepieces/shared": "*"
  },
  "dependencies": {}
}
```

## Key Changes Required

### 1. Update package.json

Change from `dependencies` to `peerDependencies` with wildcards:

```json
{
  "peerDependencies": {
    "@activepieces/pieces-framework": "*",
    "@activepieces/pieces-common": "*",
    "@activepieces/shared": "*"
  }
}
```

### 2. Fix Imports

Use the correct import paths for HTTP client:

**❌ Incorrect:**
```typescript
import { httpClient } from '@activepieces/pieces-framework';
```

**✅ Correct:**
```typescript
import { httpClient } from '@activepieces/pieces-common';
```

### 3. Auth Property Access

For CustomAuth, TypeScript needs explicit casting:

```typescript
const auth = context.auth as any;
const baseUrl = auth.baseUrl;
const organizationId = auth.organizationId;
```

## Complete Example: Working package.json

```json
{
  "name": "@vqnguyen1/piece-gelato",
  "version": "0.0.3",
  "description": "Gelato API integration",
  "main": "src/index.ts",
  "author": "vqnguyen1",
  "license": "MIT",
  "peerDependencies": {
    "@activepieces/pieces-framework": "*",
    "@activepieces/pieces-common": "*",
    "@activepieces/shared": "*"
  },
  "dependencies": {}
}
```

## Building and Publishing

### Option 1: Manual Build (When Workspace Has Issues)

If the Nx workspace has TypeScript compilation errors in framework packages:

```bash
# Navigate to your piece
cd packages/pieces/custom/your-piece

# Create dist folder
rm -rf dist && mkdir -p dist

# Copy source files
cp -r src dist/
cp package.json README.md dist/

# Package from dist
cd dist
npm pack

# Publish (optional)
npm publish --access public
```

### Option 2: Using Nx (When Workspace is Healthy)

```bash
# Build with Nx
bunx nx build pieces-your-piece

# Package
cd dist/packages/pieces/custom/your-piece
npm pack

# Publish (optional)
npm publish --access public
```

## Testing Your Piece

Install via curl to your Activepieces container:

```bash
curl -X POST http://localhost/api/v1/pieces \
  -H "Content-Type: application/json" \
  -d '{
    "packageType": "REGISTRY",
    "pieceName": "@yourscope/piece-name",
    "pieceVersion": "0.0.1"
  }'
```

## Troubleshooting

### "No matching version found"
- Check that you're using `peerDependencies` with `"*"` wildcards
- Verify you're not using specific version numbers like `^0.74.3`

### "Cannot find module '@activepieces/pieces-framework'"
- Run `bun install` in the workspace root
- Check that peerDependencies are correctly defined

### "Cannot find name 'httpClient'"
- Import from `@activepieces/pieces-common` not `pieces-framework`
- Example: `import { httpClient } from '@activepieces/pieces-common';`

### Auth property access errors
- Cast context.auth to `any`: `const auth = context.auth as any;`
- Then access properties: `auth.baseUrl`, `auth.apiKey`, etc.

## Summary

The key takeaway: **Activepieces container version (0.74.3) ≠ npm package versions (0.20.x, 0.22.x)**

Always use:
1. `peerDependencies` with `"*"` wildcards
2. Import `httpClient` from `@activepieces/pieces-common`
3. Cast `context.auth` to `any` for property access
4. Package from source if workspace build fails

This ensures your pieces work across different Activepieces versions without version conflicts.
