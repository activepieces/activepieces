# Building Custom Pieces for Activepieces

This guide documents the common issues and solutions when building custom pieces for Activepieces.

## Action Naming Convention

### Pattern: `{Resource} - {Operation}`

Actions should follow this pattern for consistency and clarity:

**Format:**
- **name**: `{resource}_{operation}` (snake_case)
- **displayName**: `{Resource} - {Operation}` (Title Case with dash separator)

**Examples:**
- Loan operations: `Loan - Create`, `Loan - Retrieve`, `Loan - Update`, `Loan - Delete`
- Document operations: `Document - Create`, `Document - Retrieve`, `Document - List`, `Document - Update`
- Field operations: `Loan - Manage Field Locks`

**Benefits:**
- Groups related actions together in UI
- Clear resource identification
- Consistent user experience
- Easy to search and filter

**Example Implementation:**
```typescript
export const createLoan = createAction({
  name: 'loan_create',  // snake_case: resource_operation
  displayName: 'Loan - Create',  // Title Case with dash
  description: 'Create a new loan in Encompass',
  // ... rest of action definition
});
```

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

Use the correct import paths for HTTP client and **do NOT include file extensions for relative imports**:

**❌ Incorrect:**
```typescript
import { httpClient } from '@activepieces/pieces-framework';
import { myAction } from './lib/actions/my-action.js';  // NO extensions!
import { myAction } from './lib/actions/my-action.ts';  // NO extensions!
```

**✅ Correct:**
```typescript
import { httpClient } from '@activepieces/pieces-common';
import { myAction } from './lib/actions/my-action';  // No extension
```

**Note:** Do NOT include file extensions (`.js` or `.ts`) in relative imports. TypeScript will compile them correctly to CommonJS `require()` statements without extensions.

### 3. Auth Property Access

For CustomAuth, TypeScript needs explicit casting:

```typescript
const auth = context.auth as any;
const baseUrl = auth.baseUrl;
const organizationId = auth.organizationId;
```

## Complete Example: Working package.json

**CRITICAL:** Your source `package.json` should point to TypeScript files, but after building with Nx, the published `package.json` will point to compiled JavaScript files.

### Source package.json (before build):
```json
{
  "name": "@vqnguyen1/piece-fiserv-premier",
  "version": "0.0.10",
  "license": "MIT",
  "main": "src/index.ts",
  "peerDependencies": {
    "@activepieces/pieces-framework": "*",
    "@activepieces/pieces-common": "*",
    "@activepieces/shared": "*"
  },
  "dependencies": {}
}
```

### Published package.json (after Nx build):
```j⚠️ CRITICAL: Pieces Must Be Built with Nx

Activepieces requires **compiled JavaScript files**, not TypeScript source. Your package must contain `.js`, `.d.ts`, and `.js.map` files. You **MUST** use the Nx build system.

### Building with Nx (Required)

```bash
# Build with Nx (this compiles TypeScript and transforms package.json)
bunx nx build pieces-your-piece

# The output will be in: dist/packages/pieces/custom/your-piece/
# It will contain:
# - src/index.js (compiled JavaScript)
# - src/index.d.ts (TypeScript definitions)
# - src/lib/actions/*.js (compiled actions)
# - package.json (transformed to point to .js files)
# - README.md, logo files, etc.

# Navigate to built output
cd dist/packages/pieces/custom/your-piece

# Verify the files are JavaScript
ls -la src/  # Should see .js, .d.ts, .js.map files

# Publish
npm publish --access public
```

### What Nx Build Does:

1. ✅ Compiles TypeScript (.ts) to JavaScript (.js)
2. ✅ Generates type definition files (.d.ts)
3. ✅ Generates source maps (.js.map)
4. ✅ Transforms package.json to change:
   - `"main": "src/index.ts"` → `"main": "./src/index.js"`
   - Adds `"type": "commonjs"`
   - Adds `"types": "./src/index.d.ts"`
   - Adds proper `"exports"` field
   - Adds `"tslib"` dependency
5. ✅ Converts ES6 imports to CommonJS require() statements
6. ✅ Copies README, logo, and other assets

### ❌ Do NOT Ship TypeScript Source

Publishing TypeScript source files will fail with module resolution errors:
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '.../lib/actions/get-party'
```

Always build with Nx first!
# Copy compiled files and configs
cp -r dist/* dist-publish/src/
cp package.json README.md dist-publish/
cp -r assets dist-publish/ 2>/dev/null || true  # Copy assets if they exist

# Package from dist-publish
cd dist-publish
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
