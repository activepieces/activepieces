# Paywall Removal Guide - Enterprise Features

This document details how to remove paywall restrictions for ALL enterprise features in ActivePieces with a single file change. This enables full access to all premium functionality in self-hosted instances.

**Date:** 2025-12-26
**License:** MIT (modifications permitted)
**Approach:** Backend configuration override

---

## Overview

Instead of manually modifying multiple frontend files, this guide shows you how to enable **all** enterprise features by modifying the default platform plan configurations. This single change unlocks:

### All Enterprise Features

- ✅ **Pieces Management** - Apply tags, hide/show pieces, pin/unpin, install custom pieces (.tgz)
- ✅ **Templates Management** - Create, edit, delete custom templates
- ✅ **Analytics** - Access analytics and overview page
- ✅ **Custom Appearance** - Branding customization
- ✅ **Global Connections** - Share connections across projects
- ✅ **Audit Logs** - Track all platform activities
- ✅ **SSO** - Single Sign-On integration
- ✅ **Embedding** - Signing keys for embedded flows
- ✅ **Project Roles** - Custom project-level permissions
- ✅ **API Keys** - Platform API access
- ✅ **Environments** - Development, staging, production environments
- ✅ **Custom Roles** - Define custom user roles
- ✅ **Custom Domains** - Use your own domain
- ✅ **Agents** - AI agents functionality
- ✅ **Tables** - Database tables
- ✅ **Todos** - Task management
- ✅ **MCPs** - Model Context Protocol support

---

## The Simple Solution

### Single File to Modify

**File:** `packages/ee/shared/src/lib/billing/index.ts`

This file defines the default plan configurations that are applied when a platform is created. By enabling all features in both `STANDARD_CLOUD_PLAN` and `OPEN_SOURCE_PLAN`, all paywalls are automatically removed.

### Changes Required

Find the `STANDARD_CLOUD_PLAN` export (around line 66) and change all feature flags from `false` to `true`:

```typescript
export const STANDARD_CLOUD_PLAN: PlatformPlanWithOnlyLimits = {
    plan: 'standard',
    includedAiCredits: 200,
    aiCreditsOverageLimit: undefined,
    aiCreditsOverageState: AiOverageState.ALLOWED_BUT_OFF,
    activeFlowsLimit: 10,
    projectsLimit: 1,

    agentsEnabled: true,
    tablesEnabled: true,
    todosEnabled: true,
    mcpsEnabled: true,
    embeddingEnabled: true, // Changed from false
    globalConnectionsEnabled: true, // Changed from false
    customRolesEnabled: true, // Changed from false
    environmentsEnabled: true, // Changed from false
    analyticsEnabled: true,
    showPoweredBy: false,
    auditLogEnabled: true, // Changed from false
    managePiecesEnabled: true, // Changed from false
    manageTemplatesEnabled: true, // Changed from false
    customAppearanceEnabled: true, // Changed from false
    teamProjectsLimit: TeamProjectsLimit.ONE,
    projectRolesEnabled: true, // Changed from false
    customDomainsEnabled: true, // Changed from false
    apiKeysEnabled: true, // Changed from false
    ssoEnabled: true, // Changed from false
}
```

Then find the `OPEN_SOURCE_PLAN` export (around line 95) and make the same changes:

```typescript
export const OPEN_SOURCE_PLAN: PlatformPlanWithOnlyLimits = {
    embeddingEnabled: true, // Changed from false
    globalConnectionsEnabled: true, // Changed from false
    customRolesEnabled: true, // Changed from false
    mcpsEnabled: true,
    tablesEnabled: true,
    todosEnabled: true,
    agentsEnabled: true,
    includedAiCredits: 0,
    aiCreditsOverageLimit: undefined,
    aiCreditsOverageState: AiOverageState.NOT_ALLOWED,
    environmentsEnabled: true, // Changed from false
    analyticsEnabled: true,
    showPoweredBy: false,
    auditLogEnabled: true, // Changed from false
    managePiecesEnabled: true, // Changed from false
    manageTemplatesEnabled: true, // Changed from false
    customAppearanceEnabled: true, // Changed from false
    teamProjectsLimit: TeamProjectsLimit.NONE,
    projectRolesEnabled: true, // Changed from false
    customDomainsEnabled: true, // Changed from false
    apiKeysEnabled: true, // Changed from false
    ssoEnabled: true, // Changed from false
    stripeCustomerId: undefined,
    stripeSubscriptionId: undefined,
    stripeSubscriptionStatus: undefined,
}
```

**That's it!** One file, one change. All features are now enabled.

---

## How It Works

### Platform Plan Initialization

When ActivePieces starts:

1. **Platform Plan Service** (`packages/server/api/src/app/ee/platform/platform-plan/platform-plan.service.ts`) creates a platform plan for each platform
2. **Edition Detection** (`getInitialPlanByEdition()`) determines which default plan to use:
   - `COMMUNITY` or `ENTERPRISE` edition → `OPEN_SOURCE_PLAN`
   - `CLOUD` edition → `STANDARD_CLOUD_PLAN`
3. **Plan Applied** - The selected default plan configuration is saved to the database
4. **Frontend Checks** - React UI components check `platform.plan.<featureName>Enabled` flags
5. **All Features Enabled** - Since we set all flags to `true`, all features are accessible

### Why This Works

The frontend doesn't have hardcoded feature restrictions - it dynamically reads the platform plan from the backend. By changing the default plan configuration, we ensure that:

- **New platforms** get all features enabled from the start
- **Existing platforms** continue with their current plan (see migration section)
- **No frontend changes** needed - the UI automatically reflects the backend configuration
- **License keys** can still override settings if used

---

## Building and Deploying

### Local Development

```bash
# Clean any stale compiled files (important!)
cd packages/shared/src
find . -name "*.js" -delete
find . -name "*.js.map" -delete
find . -name "*.d.ts" -delete
cd ../../..

cd packages/pieces/community/framework/src
find . -name "*.js" -delete
find . -name "*.js.map" -delete
find . -name "*.d.ts" -delete
cd ../../../../..

cd packages/pieces/community/common/src
find . -name "*.js" -delete
find . -name "*.js.map" -delete
find . -name "*.d.ts" -delete
cd ../../../../..

# Reset NX cache
npx nx reset

# Build and test
npx nx build react-ui --configuration production
```

### Docker Deployment

```bash
# Build the Docker image
docker compose build

# Start the containers
docker compose up -d
```

---

## Existing Platform Migration

**Important:** This change only affects **newly created platforms**. If you already have an existing platform in your database, you need to update its plan.

### Option 1: Update Database Directly (Recommended)

Connect to your database and run:

```sql
-- For PostgreSQL
UPDATE platform_plan SET
    "embeddingEnabled" = true,
    "globalConnectionsEnabled" = true,
    "customRolesEnabled" = true,
    "environmentsEnabled" = true,
    "auditLogEnabled" = true,
    "managePiecesEnabled" = true,
    "manageTemplatesEnabled" = true,
    "customAppearanceEnabled" = true,
    "projectRolesEnabled" = true,
    "customDomainsEnabled" = true,
    "apiKeysEnabled" = true,
    "ssoEnabled" = true;

-- For SQLite
UPDATE platform_plan SET
    embeddingEnabled = 1,
    globalConnectionsEnabled = 1,
    customRolesEnabled = 1,
    environmentsEnabled = 1,
    auditLogEnabled = 1,
    managePiecesEnabled = 1,
    manageTemplatesEnabled = 1,
    customAppearanceEnabled = 1,
    projectRolesEnabled = 1,
    customDomainsEnabled = 1,
    apiKeysEnabled = 1,
    ssoEnabled = 1;
```

### Option 2: Delete and Recreate Platform

**Warning:** This will delete all your data!

```bash
# Stop containers
docker compose down -v

# Remove database volumes
docker volume rm activepieces_postgres_data  # or activepieces_sqlite_data

# Start fresh
docker compose up -d
```

The new platform will be created with all features enabled.

### Option 3: Create Migration Script

Create a custom migration that updates existing platforms:

```typescript
// packages/server/api/src/app/database/migration/postgres/YOUR_TIMESTAMP-EnableAllFeatures.ts
import { MigrationInterface, QueryRunner } from 'typeorm'

export class EnableAllFeatures1234567890123 implements MigrationInterface {
    name = 'EnableAllFeatures1234567890123'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            UPDATE platform_plan SET
                "embeddingEnabled" = true,
                "globalConnectionsEnabled" = true,
                "customRolesEnabled" = true,
                "environmentsEnabled" = true,
                "auditLogEnabled" = true,
                "managePiecesEnabled" = true,
                "manageTemplatesEnabled" = true,
                "customAppearanceEnabled" = true,
                "projectRolesEnabled" = true,
                "customDomainsEnabled" = true,
                "apiKeysEnabled" = true,
                "ssoEnabled" = true
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Optionally implement rollback
    }
}
```

---

## Testing the Changes

After deploying, verify that all features are accessible:

### 1. Check Platform Plan

Navigate to Platform Settings and verify all features show as "Enabled" (not "Upgrade").

### 2. Test Individual Features

**Pieces Management:**
- Go to Platform → Pieces
- Select pieces and click "Apply Tags"
- Click "Install Piece" and verify ".tgz archive" option is available
- Hide/show and pin/unpin pieces

**Templates:**
- Go to Platform → Templates
- Create a new template
- Edit and delete templates

**Analytics:**
- Navigate to Platform → Overview
- Verify analytics dashboard is accessible

**Custom Appearance:**
- Go to Platform → Appearance
- Customize branding, colors, and logos

**API Keys:**
- Navigate to Platform → API Keys
- Create and manage API keys

**And so on...** All enterprise features should be fully functional.

---

## Troubleshooting

### Build Errors: "X is not exported by Y"

**Problem:** During Docker build or local build, you may encounter errors like:
```
error during build:
src/i18n.ts (7:9): "LocalesEnum" is not exported by "../shared/src/index.js"
```
or
```
src/features/pieces/lib/form-utils.tsx (5:2): "piecePropertiesUtils" is not exported by "../pieces/community/framework/src/index.js"
```

**Cause:** Stale compiled JavaScript files (`.js`, `.js.map`, `.d.ts`) in the `src` directories of packages. These files are remnants from previous builds and cause module resolution issues during Vite builds, as Vite tries to resolve imports from these outdated CommonJS files instead of the TypeScript source files.

**Solution:**

1. Clean stale compiled files from all package source directories:

```bash
cd /path/to/activepieces

# Clean shared package
cd packages/shared/src
find . -name "*.js" -delete
find . -name "*.js.map" -delete
find . -name "*.d.ts" -delete
cd ../../..

# Clean pieces-framework package
cd packages/pieces/community/framework/src
find . -name "*.js" -delete
find . -name "*.js.map" -delete
find . -name "*.d.ts" -delete
cd ../../../../..

# Clean pieces-common package
cd packages/pieces/community/common/src
find . -name "*.js" -delete
find . -name "*.js.map" -delete
find . -name "*.d.ts" -delete
cd ../../../../..
```

2. Reset NX cache:

```bash
npx nx reset
```

3. Test the build locally:

```bash
npx nx build react-ui --configuration production
```

4. If successful, rebuild Docker image:

```bash
docker compose build
```

**Why this happens:** The NX build system compiles TypeScript to the `dist/` directory, but sometimes compiled files are also generated in the `src/` directories. Vite's module resolution picks up these stale `.js` files instead of using the TypeScript sources, causing export/import mismatches.

**Prevention:** In a clean repository, `src/` directories should only contain TypeScript source files (`.ts`, `.tsx`), not compiled JavaScript files.

### Features Still Locked After Update

If features still appear locked after making changes:

1. **Clear browser cache** - Frontend may be caching old platform data
2. **Check database** - Verify `platform_plan` table has the correct values
3. **Restart containers** - `docker compose restart`
4. **Check logs** - Look for errors in `docker compose logs`

### License Key Override

If you apply a license key after making these changes, the license key will override the default plan settings. License keys from the ActivePieces cloud service may disable features based on their tier.

**Solution:** Don't use license keys if you want all features enabled, or modify the license key service to ignore license restrictions.

---

## Rollback Instructions

To restore the paywall functionality:

```bash
# Revert the changes to billing/index.ts
git checkout packages/ee/shared/src/lib/billing/index.ts

# Rebuild
docker compose build
docker compose up -d
```

Then run the database migration in reverse (set all flags back to `false`) if needed.

---

## Architecture Overview

### How Paywalls Work

```
┌─────────────────────────────────────────────────────────────────┐
│  Platform Plan Configuration (billing/index.ts)                 │
│  - OPEN_SOURCE_PLAN / STANDARD_CLOUD_PLAN                      │
│  - Defines default feature flags                                │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│  Platform Plan Service (platform-plan.service.ts)               │
│  - Creates platform plan on first startup                       │
│  - Applies default plan based on edition                        │
│  - Saves to database (platform_plan table)                      │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│  Database (platform_plan table)                                 │
│  - Stores feature flags per platform                            │
│  - managePiecesEnabled, manageTemplatesEnabled, etc.            │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│  Frontend API Request (platformHooks.useCurrentPlatform())      │
│  - Fetches platform data including plan                         │
└────────────────┬────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────┐
│  React Components                                                │
│  - Check platform.plan.<featureName>Enabled                     │
│  - Show LockedAlert or enable features accordingly              │
│  - Disable buttons, hide menu items, etc.                       │
└─────────────────────────────────────────────────────────────────┘
```

By modifying the default plan configuration at the top of this chain, all downstream components automatically receive the updated feature flags.

---

## Additional Notes

### Related Feature Flags

All feature flags available in `PlatformPlan`:

- `managePiecesEnabled` - Manage pieces (tags, visibility, installation)
- `manageTemplatesEnabled` - Create and manage templates
- `analyticsEnabled` - Analytics/Overview page
- `customAppearanceEnabled` - Branding customization
- `globalConnectionsEnabled` - Global connections
- `auditLogEnabled` - Audit logs
- `ssoEnabled` - Single Sign-On
- `embeddingEnabled` - Signing keys for embedding
- `projectRolesEnabled` - Custom project roles
- `apiKeysEnabled` - Platform API keys
- `environmentsEnabled` - Multiple environments
- `customRolesEnabled` - Custom user roles
- `customDomainsEnabled` - Custom domain support
- `agentsEnabled` - AI agents
- `tablesEnabled` - Database tables
- `todosEnabled` - Todo/task management
- `mcpsEnabled` - Model Context Protocol

### License Compliance

ActivePieces is MIT licensed, which permits modifications including paywall removal for self-hosted instances. Ensure compliance with license terms when redistributing modified versions.

### Backend Enforcement

Some features may have additional backend enforcement via `platformMustHaveFeatureEnabled` hooks. Check these locations:

```bash
# Find backend feature gates
grep -r "platformMustHaveFeatureEnabled" packages/server/api/src
```

Most features don't have backend enforcement and rely solely on frontend checks.

---

## Comparison with Manual Approach

### Old Approach (Manual Frontend Changes)

- ❌ Modify 5+ React component files
- ❌ Remove imports and conditional rendering
- ❌ Easy to miss components
- ❌ Harder to maintain across updates
- ❌ More merge conflicts

### New Approach (Backend Configuration)

- ✅ Modify 1 configuration file
- ✅ Change ~15 boolean values
- ✅ Automatically affects all components
- ✅ Easier to maintain and update
- ✅ Cleaner git diff

---

**Last Updated:** 2025-12-26
**Tested On:** ActivePieces main branch commit: 7a774be0fd
**Approach:** Backend configuration override
