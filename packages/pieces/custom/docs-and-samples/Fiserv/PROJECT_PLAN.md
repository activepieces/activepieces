# Fiserv Banking API - Activepieces Integration
## Complete Project Plan

---

## 📊 Project Overview

**Goal**: Build a production-ready Fiserv Banking API integration piece for Activepieces focused on **account opening workflows** for consumer and commercial banking.

**Target Users**: Financial institutions using Fiserv Premier banking platform who want to automate account opening, customer onboarding, and loan origination workflows.

**Package Name**: `@vqnguyen1/piece-fiserv` (or `@activepieces/piece-fiserv` for community)

**Version**: Start at `0.0.1`, increment as features are added

---

## 🎯 Scope & Deliverables

### ✅ In Scope (Phase 1)

**Core Functionality - 23 Actions Total**

1. **Account Management (6 actions)**
   - Create Account (deposits & loans)
   - Get Account
   - Update Account
   - Update Overdraft Details
   - Update Term Deposit Details
   - Update Interest Deposit Details

2. **Party/Customer Management (9 actions)**
   - Create Party (person/organization)
   - Get Party
   - Update Party
   - Add Address
   - Update Address
   - Delete Address
   - Add Phone
   - Delete Phone
   - Add/Delete Email

3. **Loan Operations (8 actions)**
   - **Collateral** (4 actions)
     - Add Collateral
     - Get Collateral
     - Update Collateral
     - Delete Collateral
   - **Escrow** (4 actions)
     - Add Escrow
     - Get Escrow
     - Update Escrow
     - Delete Escrow

### ❌ Out of Scope (Future Phases)

- ❌ Card management (Card Service, Tokens)
- ❌ Transaction processing (ACH, transfers, payments)
- ❌ Deposit applications (separate from account opening)
- ❌ Safe deposit box operations
- ❌ Webhooks/triggers (polling only initially)
- ❌ Party-party relationships (complex)
- ❌ Document management (separate service)

---

## 📁 Project Structure

```
packages/pieces/community/fiserv/
├── package.json                      # Package configuration
├── project.json                      # NX build configuration
├── tsconfig.json                     # TypeScript config
├── tsconfig.lib.json                 # Library-specific TS config
├── README.md                         # User documentation
├── logo.png                          # Fiserv logo (70x70px min)
└── src/
    ├── index.ts                      # Main piece definition & exports
    └── lib/
        ├── common/
        │   ├── index.ts              # Re-export all common utilities
        │   ├── auth.ts               # Authentication configuration
        │   ├── client.ts             # HTTP client wrapper with EFXHeader
        │   ├── props.ts              # Shared/reusable property builders
        │   ├── constants.ts          # API URLs, enums, account types
        │   └── types.ts              # TypeScript interfaces from swagger
        │
        ├── actions/
        │   ├── accounts/
        │   │   ├── index.ts          # Export all account actions
        │   │   ├── create-account.ts        # Account - Create
        │   │   ├── get-account.ts           # Account - Get
        │   │   ├── update-account.ts        # Account - Update
        │   │   ├── update-overdraft.ts      # Account - Update Overdraft
        │   │   ├── update-term-deposit.ts   # Account - Update Term Deposit
        │   │   └── update-interest-deposit.ts # Account - Update Interest
        │   │
        │   ├── parties/
        │   │   ├── index.ts          # Export all party actions
        │   │   ├── create-party.ts          # Party - Create
        │   │   ├── get-party.ts             # Party - Get
        │   │   ├── update-party.ts          # Party - Update
        │   │   ├── add-address.ts           # Party - Add Address
        │   │   ├── update-address.ts        # Party - Update Address
        │   │   ├── delete-address.ts        # Party - Delete Address
        │   │   ├── add-phone.ts             # Party - Add Phone
        │   │   ├── delete-phone.ts          # Party - Delete Phone
        │   │   ├── add-email.ts             # Party - Add Email
        │   │   └── delete-email.ts          # Party - Delete Email
        │   │
        │   └── loans/
        │       ├── index.ts          # Export all loan-related actions
        │       ├── collateral/
        │       │   ├── index.ts      # Export collateral actions
        │       │   ├── add-collateral.ts     # Collateral - Add
        │       │   ├── get-collateral.ts     # Collateral - Get
        │       │   ├── update-collateral.ts  # Collateral - Update
        │       │   └── delete-collateral.ts  # Collateral - Delete
        │       │
        │       └── escrow/
        │           ├── index.ts      # Export escrow actions
        │           ├── add-escrow.ts         # Escrow - Add
        │           ├── get-escrow.ts         # Escrow - Get
        │           ├── update-escrow.ts      # Escrow - Update
        │           └── delete-escrow.ts      # Escrow - Delete
        │
        └── triggers/
            └── index.ts              # Empty for now (webhooks future)
```

**Total Files**: ~37 files (23 action files + 14 structure/config files)

---

## 🔧 Technical Architecture

### Authentication

**Type**: Custom Auth (API Key + Organization ID)

```typescript
export const fiservAuth = PieceAuth.CustomAuth({
  description: 'Fiserv Banking API credentials',
  required: true,
  props: {
    baseUrl: Property.ShortText({
      displayName: 'Base URL',
      description: 'Fiserv API base URL (e.g., https://api.fiservapps.com)',
      required: true,
    }),
    organizationId: Property.ShortText({
      displayName: 'Organization ID',
      description: 'Your Fiserv organization/institution ID',
      required: true,
    }),
    apiKey: Property.SecretText({
      displayName: 'API Key',
      description: 'Your Fiserv API key',
      required: true,
    }),
  },
});
```

### HTTP Client Pattern

**Critical Requirements**:
1. **EFXHeader**: Required on ALL API calls (contains OrgId, TrnId, etc.)
2. **Transaction IDs**: Generate unique IDs for each request
3. **Error Handling**: Parse Fiserv-specific error responses

```typescript
// client.ts structure
export async function callFiservApi<T>(
  method: HttpMethod,
  auth: any,
  endpoint: string,
  body?: any,
): Promise<{ body: T }> {
  // Build EFXHeader
  // Add auth headers
  // Make request
  // Handle errors
}
```

### Action Naming Convention

Following BUILDING_CUSTOM_PIECES.md guidelines:

**Pattern**: `{Resource} - {Operation}`

Examples:
- `Party - Create` (not "Create Party")
- `Account - Update` (not "Update Account")
- `Collateral - Delete` (not "Delete Collateral")

**Benefits**:
- Groups related actions in UI
- Consistent with other Activepieces pieces
- Easy to search/filter

---

## 📚 Reference Documentation

### Primary Swagger Files

Located in: `packages/pieces/custom/docs-and-samples/Fiserv/documentation/swagger/`

**Must Reference**:
1. `Bank_Sol_Org-AcctService-11.0.0-resolved.yaml` - Account operations
2. `Bank_Sol_Org-PartyService-11.0.0-resolved.yaml` - Party/customer operations
3. `Bank_Sol_Org-CollateralService-11.0.0-resolved.yaml` - Collateral management
4. `Bank_Sol_Org-EscrowService-11.0.0-resolved.yaml` - Escrow management
5. `Bank_Sol_Org-AddressService-11.0.0-resolved.yaml` - Address operations

### Example Pieces to Study

**Similar Domain**:
- `packages/pieces/community/salesforce/` - Best template (similar structure)
- `packages/pieces/community/hubspot/` - Large piece organization patterns
- `packages/pieces/community/stripe/` - Financial API examples

**Recently Built Custom**:
- `packages/pieces/custom/fiserv-premier/` - Simpler Fiserv integration
- `packages/pieces/custom/icemortgage-encompass/` - Loan system integration

---

## 🗓️ Implementation Timeline

### Phase 1: Setup & Foundation (Days 1-2)

**Day 1: Project Scaffolding**
- [ ] Create folder structure
- [ ] Set up package.json with correct peerDependencies
- [ ] Create project.json for NX build
- [ ] Set up TypeScript configs
- [ ] Add Fiserv logo (find or create 70x70px)
- [ ] Write README.md with basic usage

**Day 2: Common Infrastructure**
- [ ] Implement auth.ts (CustomAuth definition)
- [ ] Implement client.ts (HTTP wrapper with EFXHeader)
- [ ] Define constants.ts (enums, API version, endpoints)
- [ ] Define types.ts (interfaces from swagger schemas)
- [ ] Implement props.ts (shared property builders)
- [ ] Create index.ts exports

**Deliverable**: Buildable piece with no actions yet, but solid foundation

---

### Phase 2: Account Actions (Days 3-4)

**Day 3: Core Account Operations**
- [ ] `Account - Create` (POST /accounts)
  - Handle both deposit and loan account creation
  - Support account types: Checking, Savings, CD, Loan
- [ ] `Account - Get` (POST /accounts/secured)
  - Retrieve account by ID or account number
- [ ] `Account - Update` (PUT /accounts)
  - Update account details

**Day 4: Specialized Account Updates**
- [ ] `Account - Update Overdraft` (PUT /accounts/overdraft)
- [ ] `Account - Update Term Deposit` (PUT /accounts/termDeposit)
- [ ] `Account - Update Interest Deposit` (PUT /accounts/interestDeposit)

**Testing**: Verify each action works with Fiserv sandbox

**Deliverable**: 6 working account actions

---

### Phase 3: Party/Customer Actions (Days 5-6)

**Day 5: Core Party Operations**
- [ ] `Party - Create` (POST /parties)
  - Support Person and Organization types
- [ ] `Party - Get` (POST /parties/secured)
- [ ] `Party - Update` (PUT /parties)

**Day 6: Party Contact Information**
- [ ] `Party - Add Address` (POST /parties/address)
- [ ] `Party - Update Address` (PUT /parties/address)
- [ ] `Party - Delete Address` (PUT /parties/address/secured)
- [ ] `Party - Add Phone` (POST /parties/phoneNum)
- [ ] `Party - Delete Phone` (PUT /parties/phoneNum/secured)
- [ ] `Party - Add Email` (POST /parties/email)
- [ ] `Party - Delete Email` (PUT /parties/email/secured)

**Testing**: End-to-end party creation and management

**Deliverable**: 9 working party actions

---

### Phase 4: Loan Operations (Days 7-8)

**Day 7: Collateral Management**
- [ ] `Collateral - Add` (POST /collateral)
- [ ] `Collateral - Get` (POST /collateral/secured)
- [ ] `Collateral - Update` (PUT /collateral)
- [ ] `Collateral - Delete` (PUT /collateral/secured)

**Day 8: Escrow Management**
- [ ] `Escrow - Add` (POST /escrow)
- [ ] `Escrow - Get` (POST /escrow/secured)
- [ ] `Escrow - Update` (PUT /escrow)
- [ ] `Escrow - Delete` (PUT /escrow/secured)

**Testing**: Complete loan workflow with collateral and escrow

**Deliverable**: 8 working loan-related actions

---

### Phase 5: Testing & Documentation (Days 9-10)

**Day 9: Integration Testing**
- [ ] Test complete account opening workflow:
  1. Create party/customer
  2. Add address, phone, email
  3. Create account
  4. Link party to account
- [ ] Test loan workflow:
  1. Create party
  2. Create loan account
  3. Add collateral
  4. Add escrow
- [ ] Test error handling and edge cases
- [ ] Validate all required fields work correctly

**Day 10: Documentation & Polish**
- [ ] Complete README.md with examples
- [ ] Add inline code documentation
- [ ] Create example flows for common use cases
- [ ] Test build with NX
- [ ] Version bump and publish to npm

**Deliverable**: Production-ready piece v0.1.0

---

## 📋 Development Checklist

### Pre-Development
- [ ] Read IMPLEMENTATION_GUIDE.md thoroughly
- [ ] Review swagger files for all services
- [ ] Study fiserv-premier piece as reference
- [ ] Set up Fiserv sandbox credentials

### During Development
- [ ] Follow naming convention: `{Resource} - {Operation}`
- [ ] Use peerDependencies with wildcards
- [ ] NO file extensions in imports (.ts, .js)
- [ ] Import httpClient from `@activepieces/pieces-common`
- [ ] Cast context.auth as any for property access
- [ ] Include EFXHeader on all API calls
- [ ] Generate unique transaction IDs

### Before Publishing
- [ ] Build with NX: `bunx nx build pieces-fiserv`
- [ ] Verify logo is included in dist
- [ ] Test installation: `npm pack` from dist folder
- [ ] Version in package.json is correct
- [ ] README.md has installation instructions
- [ ] All actions tested in Activepieces UI

---

## 🎨 Action Implementation Pattern

Each action should follow this structure:

```typescript
import { createAction, Property } from '@activepieces/pieces-framework';
import { callFiservApi } from '../../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { fiservAuth } from '../../common/auth';

export const resourceOperation = createAction({
  name: 'resource_operation',  // snake_case
  displayName: 'Resource - Operation',  // Title Case with dash
  description: 'Clear description of what this action does',
  auth: fiservAuth,
  props: {
    // Define input properties
    resourceId: Property.ShortText({
      displayName: 'Resource ID',
      description: 'The ID of the resource',
      required: true,
    }),
    // ... more props
  },
  async run(context) {
    const { resourceId } = context.propsValue;
    const auth = context.auth as any;

    const response = await callFiservApi(
      HttpMethod.POST,
      auth,
      '/endpoint',
      {
        // Request body from swagger
      }
    );

    return response.body;
  },
});
```

---

## 🔍 Key Technical Considerations

### 1. EFXHeader Requirement

**CRITICAL**: Every API call requires EFXHeader with:
- `OrgId` - Organization ID from auth
- `TrnId` - Unique transaction ID (generate per request)
- Other fields per swagger specification

### 2. Account Types

Support these account types:
- **Deposit Accounts**: Checking (DDA), Savings (SDA), CD (CDA), Money Market (MMA)
- **Loan Accounts**: Personal loans, mortgages, lines of credit

### 3. Party Types

Support:
- **Person**: Individual customers
- **Organization**: Business customers

### 4. Error Handling

Fiserv returns structured errors - parse and display user-friendly messages:
```typescript
catch (error) {
  // Parse Fiserv error response
  // Return actionable error message
}
```

---

## 📦 Package Configuration

### package.json

```json
{
  "name": "@vqnguyen1/piece-fiserv",
  "version": "0.1.0",
  "license": "MIT",
  "type": "commonjs",
  "main": "./src/index.js",
  "types": "./src/index.d.ts",
  "exports": {
    ".": "./src/index.js"
  },
  "dependencies": {
    "tslib": "^2.3.0"
  },
  "peerDependencies": {
    "@activepieces/pieces-framework": "*",
    "@activepieces/pieces-common": "*",
    "@activepieces/shared": "*"
  }
}
```

### project.json

```json
{
  "name": "pieces-fiserv",
  "$schema": "../../../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "packages/pieces/community/fiserv/src",
  "projectType": "library",
  "targets": {
    "build": {
      "executor": "@nx/js:tsc",
      "outputs": ["{options.outputPath}"],
      "options": {
        "outputPath": "dist/packages/pieces/community/fiserv",
        "main": "packages/pieces/community/fiserv/src/index.ts",
        "tsConfig": "packages/pieces/community/fiserv/tsconfig.lib.json",
        "assets": [
          "packages/pieces/community/fiserv/*.md",
          "packages/pieces/community/fiserv/*.png"
        ]
      }
    }
  },
  "tags": []
}
```

---

## 🚀 Build & Publish Process

### 1. Build with NX
```bash
bunx nx build pieces-fiserv
```

### 2. Verify Build
```bash
ls -la dist/packages/pieces/community/fiserv/
# Should see: package.json, README.md, logo.png, src/
```

### 3. Test Package
```bash
cd dist/packages/pieces/community/fiserv
npm pack
# Creates tarball to test installation
```

### 4. Publish to npm
```bash
npm publish --access public
```

### 5. Install in Activepieces
Via UI or API:
```bash
curl -X POST http://localhost:8080/api/v1/pieces \
  -H "Content-Type: application/json" \
  -d '{
    "packageType": "REGISTRY",
    "pieceName": "@vqnguyen1/piece-fiserv",
    "pieceVersion": "0.1.0"
  }'
```

---

## 🎯 Success Criteria

### Must Have
- ✅ All 23 actions working correctly
- ✅ Builds successfully with NX
- ✅ Logo displays in Activepieces UI
- ✅ Authentication works with sandbox
- ✅ EFXHeader included on all requests
- ✅ Error handling provides clear messages
- ✅ README with usage examples

### Nice to Have
- 🎨 Account opening workflow example
- 🎨 Loan origination workflow example
- 🎨 Unit tests for common utilities
- 🎨 Postman collection for testing

---

## 📈 Future Enhancements (Phase 2+)

### Short Term
- Add webhook triggers for account events
- Document management integration
- Transaction history retrieval
- Statement generation

### Long Term
- Card management (issue, activate, deactivate)
- ACH and wire transfers
- Bill payment processing
- Party-party relationships
- Safe deposit box management

---

## 🔗 Quick Reference Links

**Documentation**:
- Implementation Guide: `docs-and-samples/Fiserv/IMPLEMENTATION_GUIDE.md`
- Quick Start: `docs-and-samples/Fiserv/QUICK_START.md`
- Building Guide: `custom/BUILDING_CUSTOM_PIECES.md`

**Swagger Files**: `docs-and-samples/Fiserv/documentation/swagger/`

**Example Pieces**:
- `packages/pieces/custom/fiserv-premier/` - Similar integration
- `packages/pieces/community/salesforce/` - Best template
- `packages/pieces/custom/icemortgage-encompass/` - Loan system

---

## ✅ Getting Started

1. **Read this plan** completely
2. **Review** IMPLEMENTATION_GUIDE.md for detailed code examples
3. **Study** fiserv-premier piece for patterns
4. **Start** with Phase 1: Setup & Foundation
5. **Follow** the checklist as you build

**Estimated Total Time**: 10 days (full-time) or 3-4 weeks (part-time)

---

**Ready to build!** 🚀

Start with creating the folder structure and setting up the foundation files.
