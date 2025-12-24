# Fiserv Account Opening Implementation Guide

## 🎯 Project Overview

**Objective**: Build a Fiserv Banking API integration piece for Activepieces focused on **account opening workflows** for consumer and commercial banking.

**Scope**: Implement actions for opening accounts, managing parties (customers), and handling loans with collateral and escrow.

---

## 📋 What to Build

### Core Entities (3 Entity Groups)

#### 1. **Accounts** (Consumer & Commercial)
Focus on deposit and loan account opening workflows.

**Priority Actions**:
- ✅ Create Account (POST /accounts)
- ✅ Get Account (POST /accounts/secured)
- ✅ Update Account (PUT /accounts)
- Update Overdraft Details (PUT /accounts/overdraft)
- Update Term Deposit Details (PUT /accounts/termDeposit)
- Update Interest Deposit Details (PUT /accounts/interestDeposit)

#### 2. **Parties** (Customer Management)
Manage person and organization data for account opening.

**Priority Actions**:
- ✅ Create Party (POST /parties)
- ✅ Get Party (POST /parties/secured)
- ✅ Update Party (PUT /parties)
- Add Party Address (POST /parties/address)
- Update Party Address (PUT /parties/address)
- Delete Party Address (PUT /parties/address/secured)
- Add Party Phone (POST /parties/phoneNum)
- Delete Party Phone (PUT /parties/phoneNum/secured)
- Add Party Email (POST /parties/email)
- Delete Party Email (PUT /parties/email/secured)

#### 3. **Loans** (with Collateral & Escrow)
Handle loan creation and associated collateral/escrow for secured lending.

**Loan Actions**:
- Create Loan Account (POST /accounts - loan type)
- Get Loan Account (POST /accounts/secured - loan type)
- Update Loan Account (PUT /accounts)

**Collateral Actions**:
- ✅ Add Collateral (POST /collateral)
- ✅ Get Collateral (POST /collateral/secured)
- ✅ Update Collateral (PUT /collateral)
- ✅ Delete Collateral (PUT /collateral/secured)
- Link Account to Collateral (use Account Collateral Service)

**Escrow Actions**:
- ✅ Add Escrow (POST /escrow)
- ✅ Get Escrow (POST /escrow/secured)
- ✅ Update Escrow (PUT /escrow)
- ✅ Delete Escrow (PUT /escrow/secured)

### Out of Scope (For Later Phases)
- ❌ Cards (Card Service, Card Relationships, Tokens)
- ❌ Transactions (Transfers, ACH, Payments)
- ❌ Deposits (Deposit Applications - separate from account opening)
- ❌ Safe Deposit Box
- ❌ Party-Party Relationships (will use simple relationship linking for now)

---

## 📁 Recommended Folder Structure

```
packages/pieces/community/fiserv/
├── package.json
├── project.json
├── tsconfig.json
└── src/
    ├── index.ts                           # Main piece definition
    └── lib/
        ├── actions/
        │   ├── accounts/
        │   │   ├── create-account.ts      # POST /accounts
        │   │   ├── get-account.ts         # POST /accounts/secured
        │   │   ├── update-account.ts      # PUT /accounts
        │   │   ├── update-overdraft.ts    # PUT /accounts/overdraft
        │   │   ├── update-term-deposit.ts # PUT /accounts/termDeposit
        │   │   └── index.ts               # Export all account actions
        │   ├── parties/
        │   │   ├── create-party.ts        # POST /parties
        │   │   ├── get-party.ts           # POST /parties/secured
        │   │   ├── update-party.ts        # PUT /parties
        │   │   ├── add-address.ts         # POST /parties/address
        │   │   ├── delete-address.ts      # PUT /parties/address/secured
        │   │   ├── add-phone.ts           # POST /parties/phoneNum
        │   │   ├── delete-phone.ts        # PUT /parties/phoneNum/secured
        │   │   ├── add-email.ts           # POST /parties/email
        │   │   ├── delete-email.ts        # PUT /parties/email/secured
        │   │   └── index.ts               # Export all party actions
        │   └── loans/
        │       ├── collateral/
        │       │   ├── add-collateral.ts      # POST /collateral
        │       │   ├── get-collateral.ts      # POST /collateral/secured
        │       │   ├── update-collateral.ts   # PUT /collateral
        │       │   ├── delete-collateral.ts   # PUT /collateral/secured
        │       │   └── index.ts
        │       ├── escrow/
        │       │   ├── add-escrow.ts          # POST /escrow
        │       │   ├── get-escrow.ts          # POST /escrow/secured
        │       │   ├── update-escrow.ts       # PUT /escrow
        │       │   ├── delete-escrow.ts       # PUT /escrow/secured
        │       │   └── index.ts
        │       ├── create-loan.ts         # POST /accounts (loan)
        │       ├── get-loan.ts            # POST /accounts/secured (loan)
        │       ├── update-loan.ts         # PUT /accounts (loan)
        │       └── index.ts
        ├── triggers/                      # Empty for now (webhooks future)
        └── common/
            ├── index.ts                   # Re-export everything
            ├── auth.ts                    # Authentication configuration
            ├── client.ts                  # HTTP client wrapper
            ├── props.ts                   # Shared property builders
            ├── constants.ts               # API URLs, enums, account types
            └── types.ts                   # TypeScript interfaces
```

---

## 📚 Reference Documentation

### Swagger/OpenAPI Files
All located in: `packages/pieces/docs-and-samples/Fiserv/documentation/swagger/`

**Key Files to Reference**:
1. **Account Service**: `Bank_Sol_Org-AcctService-11.0.0-resolved.yaml`
   - Operations: Add, Get, Update accounts (deposit & loan)
   - Endpoints: POST /accounts, PUT /accounts, POST /accounts/secured
   - Account types: Deposit (checking, savings, CD) and Loan accounts

2. **Party Service**: `Bank_Sol_Org-PartyService-11.0.0-resolved.yaml`
   - Operations: Add, Get, Update party (customer) data
   - Endpoints: POST /parties, PUT /parties, POST /parties/secured
   - Includes: Address, phone, email management

3. **Collateral Service**: `Bank_Sol_Org-CollateralService-11.0.0-resolved.yaml`
   - Operations: Add, Get, Update, Delete collateral
   - Endpoints: POST /collateral, PUT /collateral, POST /collateral/secured

4. **Escrow Service**: `Bank_Sol_Org-EscrowService-11.0.0-resolved.yaml`
   - Operations: Add, Get, Update, Delete escrow accounts
   - Endpoints: POST /escrow, PUT /escrow, POST /escrow/secured

5. **Address Service**: `Bank_Sol_Org-AddressService-11.0.0-resolved.yaml`
   - Operations: Manage party addresses
   - Endpoints: POST /parties/address, PUT /parties/address

### Additional Reference Files
- **Postman Collection**: `packages/pieces/docs-and-samples/Fiserv/references/Banking Hub - Premier - Trial Plan Postman Collection_R2025.3.3_v6.postman_collection 2`
  - Contains example requests/responses
  - Use for testing and understanding request formats

---

## 🔧 Technical Implementation Details

### 1. Authentication Setup

**File**: `src/lib/common/auth.ts`

Fiserv Banking API uses OAuth2 or API Key authentication. Reference the swagger files for exact auth requirements.

```typescript
import { PieceAuth } from '@activepieces/pieces-framework';

// Option 1: OAuth2 (if Fiserv provides OAuth)
export const fiservAuth = PieceAuth.OAuth2({
  authUrl: 'https://auth.fiserv.com/oauth/authorize',  // Replace with actual URL
  tokenUrl: 'https://auth.fiserv.com/oauth/token',     // Replace with actual URL
  required: true,
  scope: ['accounts:read', 'accounts:write', 'parties:read', 'parties:write'],
});

// Option 2: API Key (if using API key authentication)
export const fiservAuth = PieceAuth.CustomAuth({
  required: true,
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      required: true,
      description: 'Your Fiserv API key',
    }),
    baseUrl: Property.ShortText({
      displayName: 'Base URL',
      required: true,
      defaultValue: 'https://api.fiserv.com',
      description: 'Fiserv API base URL',
    }),
  },
});
```

**Check Swagger files** for the exact authentication mechanism under `servers` and `securitySchemes` sections.

### 2. HTTP Client Wrapper

**File**: `src/lib/common/client.ts`

```typescript
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export async function callFiservApi<T = any>(
  method: HttpMethod,
  auth: any,
  endpoint: string,
  body?: any,
): Promise<{ body: T }> {
  const baseUrl = auth.baseUrl || 'https://api.fiserv.com';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${auth.access_token || auth.apiKey}`,
    // EFXHeader is required by Fiserv - check swagger for structure
    'EFXHeader': JSON.stringify({
      // Add required EFX header fields from swagger
      OrgId: 'YOUR_ORG_ID',
      TrnId: generateTransactionId(),
      // ... other required fields
    }),
  };

  const response = await httpClient.sendRequest<T>({
    method,
    url: `${baseUrl}${endpoint}`,
    headers,
    body,
  });

  return { body: response.body };
}

function generateTransactionId(): string {
  return `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
```

**IMPORTANT**: The `EFXHeader` is required by all Fiserv API calls. Check the swagger files for the exact structure.

### 3. Constants and Types

**File**: `src/lib/common/constants.ts`

```typescript
export const FISERV_API_VERSION = 'v11.0.0';

export enum AccountType {
  CHECKING = 'DDA',           // Demand Deposit Account
  SAVINGS = 'SDA',            // Savings Deposit Account
  CERTIFICATE_DEPOSIT = 'CDA', // Certificate of Deposit
  MONEY_MARKET = 'MMA',       // Money Market Account
  LOAN = 'LOAN',
  CREDIT_LINE = 'CRD',        // Credit Line
}

export enum PartyType {
  PERSON = 'Person',
  ORGANIZATION = 'Org',
}

export enum CollateralType {
  REAL_ESTATE = 'RealEstate',
  VEHICLE = 'Vehicle',
  CASH = 'Cash',
  SECURITIES = 'Securities',
}

// Add more enums based on swagger documentation
```

**File**: `src/lib/common/types.ts`

```typescript
// Define TypeScript interfaces based on Swagger schemas

export interface EFXHeader {
  OrgId: string;
  TrnId: string;
  // Add other required fields from swagger
}

export interface AccountRequest {
  AcctType: string;
  AcctPref?: {
    Language?: string;
  };
  DepositAcctInfo?: {
    // From swagger AcctAddRqType schema
  };
  LoanAcctInfo?: {
    // From swagger AcctAddRqType schema
  };
}

export interface PartyInfo {
  PartyType: 'Person' | 'Org';
  PersonPartyInfo?: {
    PersonName?: {
      FullName?: string;
      FirstName?: string;
      LastName?: string;
    };
    TaxIdentity?: {
      TaxIdent?: string;
      TaxIdentType?: string;
    };
    BirthDt?: string;
  };
  OrgPartyInfo?: {
    OrgName?: string;
    TaxIdent?: string;
    // Business details
  };
  ContactInfo?: {
    PhoneNum?: Array<{ Phone: string; PhoneType: string }>;
    EmailAddr?: Array<{ EmailIdent: string }>;
    PostAddr?: Array<{
      Addr1?: string;
      City?: string;
      StateProv?: string;
      PostalCode?: string;
      Country?: string;
    }>;
  };
}

// Add more interfaces based on swagger schemas
```

### 4. Shared Property Builders

**File**: `src/lib/common/props.ts`

```typescript
import { Property } from '@activepieces/pieces-framework';
import { AccountType, PartyType } from './constants';

export const fiservCommon = {
  accountType: Property.StaticDropdown({
    displayName: 'Account Type',
    required: true,
    options: {
      options: [
        { label: 'Checking (DDA)', value: AccountType.CHECKING },
        { label: 'Savings (SDA)', value: AccountType.SAVINGS },
        { label: 'Certificate of Deposit (CDA)', value: AccountType.CERTIFICATE_DEPOSIT },
        { label: 'Money Market (MMA)', value: AccountType.MONEY_MARKET },
        { label: 'Loan', value: AccountType.LOAN },
        { label: 'Credit Line', value: AccountType.CREDIT_LINE },
      ],
    },
  }),

  partyType: Property.StaticDropdown({
    displayName: 'Party Type',
    required: true,
    options: {
      options: [
        { label: 'Person (Consumer)', value: PartyType.PERSON },
        { label: 'Organization (Commercial)', value: PartyType.ORGANIZATION },
      ],
    },
  }),

  // Add more common properties
};
```

### 5. Example Action Implementation

**File**: `src/lib/actions/accounts/create-account.ts`

```typescript
import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { fiservAuth } from '../../..';
import { callFiservApi } from '../../common/client';
import { fiservCommon } from '../../common/props';
import { AccountType } from '../../common/constants';

export const createAccountAction = createAction({
  auth: fiservAuth,
  name: 'fiserv_create_account',
  displayName: 'Create Account',
  description: 'Creates a new deposit or loan account in Fiserv Banking.',
  props: {
    accountType: fiservCommon.accountType,
    partyId: Property.ShortText({
      displayName: 'Party ID',
      description: 'The customer/party ID who owns the account',
      required: true,
    }),
    productCode: Property.ShortText({
      displayName: 'Product Code',
      description: 'Bank product code for the account type',
      required: true,
    }),
    branchId: Property.ShortText({
      displayName: 'Branch ID',
      description: 'Branch identifier where account is opened',
      required: false,
    }),
    openingBalance: Property.Number({
      displayName: 'Opening Balance',
      description: 'Initial deposit amount (for deposit accounts)',
      required: false,
    }),
    loanAmount: Property.Number({
      displayName: 'Loan Amount',
      description: 'Loan principal amount (for loan accounts)',
      required: false,
    }),
    interestRate: Property.Number({
      displayName: 'Interest Rate',
      description: 'Annual interest rate percentage',
      required: false,
    }),
    additionalFields: Property.Json({
      displayName: 'Additional Fields',
      description: 'Additional account fields as JSON object',
      required: false,
    }),
  },

  async run(context) {
    const {
      accountType,
      partyId,
      productCode,
      branchId,
      openingBalance,
      loanAmount,
      interestRate,
      additionalFields,
    } = context.propsValue;

    // Build request body based on swagger AcctAddRqType schema
    const requestBody = {
      AcctKeys: {
        AcctId: '', // Generated by system
      },
      AcctType: accountType,
      ProductIdent: productCode,
      BranchIdent: branchId,
      ...(accountType === AccountType.LOAN ? {
        LoanAcctInfo: {
          LoanAmt: loanAmount,
          IntRate: interestRate,
          // Add more loan-specific fields from swagger
        },
      } : {
        DepositAcctInfo: {
          BalanceAmt: openingBalance,
          // Add more deposit-specific fields from swagger
        },
      }),
      PartyAcctRelInfo: [{
        PartyRef: {
          PartyKeys: {
            PartyId: partyId,
          },
        },
        PartyAcctRelType: 'Owner',
      }],
      ...(additionalFields || {}),
    };

    const response = await callFiservApi(
      HttpMethod.POST,
      context.auth,
      '/accounts',
      requestBody
    );

    return response.body;
  },
});
```

**Reference**: Look at `Bank_Sol_Org-AcctService-11.0.0-resolved.yaml` lines 153-186 for the exact request/response schemas.

### 6. Main Piece Definition

**File**: `src/index.ts`

```typescript
import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';

// Import all actions
import { createAccountAction } from './lib/actions/accounts/create-account';
import { getAccountAction } from './lib/actions/accounts/get-account';
import { updateAccountAction } from './lib/actions/accounts/update-account';

import { createPartyAction } from './lib/actions/parties/create-party';
import { getPartyAction } from './lib/actions/parties/get-party';
import { updatePartyAction } from './lib/actions/parties/update-party';

import { addCollateralAction } from './lib/actions/loans/collateral/add-collateral';
import { addEscrowAction } from './lib/actions/loans/escrow/add-escrow';

export const fiservAuth = PieceAuth.CustomAuth({
  // Define auth as shown above
});

export const fiserv = createPiece({
  displayName: 'Fiserv Banking',
  description: 'Integrate with Fiserv Banking API for account opening and management',
  auth: fiservAuth,
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/fiserv.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  authors: ['Your Name'],
  actions: [
    // Account actions
    createAccountAction,
    getAccountAction,
    updateAccountAction,

    // Party actions
    createPartyAction,
    getPartyAction,
    updatePartyAction,

    // Loan actions (collateral & escrow)
    addCollateralAction,
    addEscrowAction,

    // Add more actions as implemented
  ],
  triggers: [
    // Empty for now - webhooks can be added later
  ],
});
```

---

## 🎯 Implementation Steps

### Phase 1: Project Setup (Day 1)
1. ✅ Create piece directory: `packages/pieces/community/fiserv/`
2. ✅ Copy `package.json`, `project.json`, `tsconfig.json` from another piece (e.g., salesforce)
3. ✅ Update package names and metadata
4. ✅ Create folder structure as outlined above
5. ✅ Set up authentication in `common/auth.ts`
6. ✅ Implement HTTP client wrapper in `common/client.ts`
7. ✅ Define constants and types in `common/constants.ts` and `common/types.ts`

**Reference**: Look at `packages/pieces/community/salesforce/` or `packages/pieces/community/hubspot/` for structure examples.

### Phase 2: Core Account Actions (Day 2-3)
1. ✅ Implement `create-account.ts`
2. ✅ Implement `get-account.ts`
3. ✅ Implement `update-account.ts`
4. Test all three actions with Fiserv sandbox/test environment

**Swagger Reference**: `Bank_Sol_Org-AcctService-11.0.0-resolved.yaml`

### Phase 3: Party Management Actions (Day 3-4)
1. ✅ Implement `create-party.ts`
2. ✅ Implement `get-party.ts`
3. ✅ Implement `update-party.ts`
4. ✅ Implement `add-address.ts`
5. ✅ Implement `add-phone.ts`
6. ✅ Implement `add-email.ts`
7. Test party creation and updates

**Swagger Reference**: `Bank_Sol_Org-PartyService-11.0.0-resolved.yaml`

### Phase 4: Loan with Collateral & Escrow (Day 5-6)
1. ✅ Implement loan account creation (reuse account action with loan type)
2. ✅ Implement `add-collateral.ts`
3. ✅ Implement `get-collateral.ts`
4. ✅ Implement `update-collateral.ts`
5. ✅ Implement `add-escrow.ts`
6. ✅ Implement `get-escrow.ts`
7. ✅ Implement `update-escrow.ts`
8. Test complete loan opening workflow with collateral and escrow

**Swagger References**:
- `Bank_Sol_Org-CollateralService-11.0.0-resolved.yaml`
- `Bank_Sol_Org-EscrowService-11.0.0-resolved.yaml`

### Phase 5: Testing & Documentation (Day 7)
1. ✅ Test all actions end-to-end
2. ✅ Create example workflows showing account opening process
3. ✅ Document each action with clear descriptions
4. ✅ Add error handling and validation
5. ✅ Create README with usage examples

---

## 🧪 Testing Strategy

### Test Environment
- Use Fiserv sandbox/test environment
- Credentials should be stored securely
- Base URL: Check swagger files for test environment URLs

### Test Scenarios

**Consumer Account Opening (Checking Account)**:
1. Create Party (Person)
2. Add Address to Party
3. Add Phone to Party
4. Add Email to Party
5. Create Checking Account linked to Party
6. Verify account creation with Get Account

**Commercial Loan with Collateral**:
1. Create Party (Organization)
2. Add Organization Address
3. Create Loan Account
4. Add Collateral (Real Estate)
5. Link Collateral to Loan
6. Add Escrow Account for Loan
7. Verify all entities created

### Test Data

```json
// Example Party (Person)
{
  "PartyType": "Person",
  "PersonPartyInfo": {
    "PersonName": {
      "FirstName": "John",
      "LastName": "Doe"
    },
    "TaxIdentity": {
      "TaxIdent": "123-45-6789",
      "TaxIdentType": "SSN"
    },
    "BirthDt": "1985-05-15"
  },
  "ContactInfo": {
    "PostAddr": [{
      "Addr1": "123 Main St",
      "City": "New York",
      "StateProv": "NY",
      "PostalCode": "10001",
      "Country": "USA"
    }],
    "PhoneNum": [{
      "Phone": "555-123-4567",
      "PhoneType": "Mobile"
    }],
    "EmailAddr": [{
      "EmailIdent": "john.doe@example.com"
    }]
  }
}

// Example Account (Checking)
{
  "AcctType": "DDA",
  "ProductIdent": "CHK001",
  "BranchIdent": "BRANCH001",
  "DepositAcctInfo": {
    "BalanceAmt": 1000.00
  }
}
```

---

## 📖 Key Swagger Details to Review

### EFXHeader Requirement
**All API calls require the `EFXHeader`** - check each swagger file for the structure:
- `OrgId`: Your organization identifier
- `TrnId`: Unique transaction ID
- Other fields as specified

**Example from swagger**:
```yaml
parameters:
  - name: EFXHeader
    in: header
    description: The message header request aggregate contains common information for all request messages
    required: true
    schema:
      $ref: "#/components/schemas/EFXHeader"
```

Review the `EFXHeader` schema in swagger to understand all required fields.

### REST Endpoints

**Account Service**:
- POST `/accounts` - Create account
- PUT `/accounts` - Update account
- POST `/accounts/secured` - Get account details
- PUT `/accounts/overdraft` - Update overdraft
- PUT `/accounts/termDeposit` - Update term deposit
- PUT `/accounts/interestDeposit` - Update interest deposit

**Party Service**:
- POST `/parties` - Create party
- PUT `/parties` - Update party
- POST `/parties/secured` - Get party details
- POST `/parties/address` - Add address
- PUT `/parties/address/secured` - Delete address
- POST `/parties/phoneNum` - Add phone
- PUT `/parties/phoneNum/secured` - Delete phone
- POST `/parties/email` - Add email
- PUT `/parties/email/secured` - Delete email

**Collateral Service**:
- POST `/collateral` - Add collateral
- PUT `/collateral` - Update collateral
- POST `/collateral/secured` - Get collateral
- PUT `/collateral/secured` - Delete collateral

**Escrow Service**:
- POST `/escrow` - Add escrow
- PUT `/escrow` - Update escrow
- POST `/escrow/secured` - Get escrow
- PUT `/escrow/secured` - Delete escrow

### Response Handling

All Fiserv responses follow a consistent structure:
```json
{
  "Status": {
    "StatusCode": "0",
    "StatusDesc": "Success"
  },
  "RecCtrlOut": {
    "SentRecCount": 1
  },
  "[EntityName]StatusRec": {
    "[EntityName]Keys": {
      // Entity identifiers
    },
    "[EntityName]Status": {
      // Status details
    }
  },
  "[EntityName]Rec": {
    // Actual entity data
  }
}
```

Ensure your actions parse and return the appropriate parts of the response.

---

## 🚨 Important Notes

### Banking Domain Considerations

1. **Account Opening Workflows** typically require:
   - Valid Party (customer) created first
   - Address information (regulatory requirement)
   - Tax identification (SSN for individuals, EIN for organizations)
   - Product codes configured in Fiserv system
   - Branch identifiers

2. **Loan Workflows** require:
   - Credit analysis (may be external to API)
   - Collateral valuation
   - Escrow setup for taxes/insurance
   - Underwriting approval (may be manual step)

3. **Regulatory Compliance**:
   - KYC (Know Your Customer) data required
   - CIP (Customer Identification Program) fields
   - BSA/AML (Bank Secrecy Act/Anti-Money Laundering) requirements
   - Ensure all required fields are captured

### Error Handling

Implement robust error handling for:
- Invalid party IDs
- Missing required fields
- Account type mismatches
- Authentication failures
- API rate limits

Example error response structure:
```json
{
  "Status": {
    "StatusCode": "400",
    "StatusDesc": "Bad Request",
    "Severity": "Error",
    "SvcProviderName": "Fiserv"
  }
}
```

### Validation

Add validation for:
- SSN/EIN format (xxx-xx-xxxx / xx-xxxxxxx)
- Email format
- Phone number format
- Required fields per account type
- Valid state/province codes
- Valid country codes

---

## 📦 Package Configuration Files

### package.json
```json
{
  "name": "@activepieces/piece-fiserv",
  "version": "0.0.1",
  "main": "src/index.ts",
  "dependencies": {
    "@activepieces/pieces-common": "workspace:^",
    "@activepieces/pieces-framework": "workspace:^",
    "@activepieces/shared": "workspace:^"
  }
}
```

### project.json
```json
{
  "name": "piece-fiserv",
  "$schema": "../../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "packages/pieces/community/fiserv/src",
  "projectType": "library",
  "targets": {}
}
```

---

## ✅ Success Criteria

Your Fiserv piece is complete when:

1. ✅ All core account actions work (create, get, update)
2. ✅ All party management actions work (create, get, update, add address/phone/email)
3. ✅ Loan actions work with collateral and escrow
4. ✅ End-to-end workflows tested:
   - Consumer checking account opening
   - Commercial loan with collateral and escrow
5. ✅ Error handling implemented for common failure scenarios
6. ✅ Code follows Activepieces patterns (see salesforce/hubspot examples)
7. ✅ All actions have clear descriptions and property labels
8. ✅ Authentication working with Fiserv API

---

## 🔗 Additional Resources

### Activepieces Documentation
- Pieces Framework: https://www.activepieces.com/docs/developers/building-pieces
- Authentication: https://www.activepieces.com/docs/developers/piece-reference/authentication
- Actions: https://www.activepieces.com/docs/developers/piece-reference/actions

### Example Pieces to Reference
- **Salesforce**: `packages/pieces/community/salesforce/` - Similar banking/CRM domain
- **HubSpot**: `packages/pieces/community/hubspot/` - Large piece with many actions
- **Stripe**: `packages/pieces/community/stripe/` - Financial services API

### Fiserv Documentation
- Swagger files in: `packages/pieces/docs-and-samples/Fiserv/documentation/swagger/`
- Postman collection: `packages/pieces/docs-and-samples/Fiserv/references/`
- Organization analysis: `packages/pieces/docs-and-samples/Fiserv/ORGANIZATION_ANALYSIS.md`

---

## 🎓 Learning Path for Another Claude Instance

If you're another Claude instance picking up this work:

1. **Start with understanding the codebase structure**:
   - Read `packages/pieces/community/salesforce/src/index.ts`
   - Read `packages/pieces/community/salesforce/src/lib/action/create-contact.ts`
   - Understand the pattern of: auth → props → run function → API call

2. **Review Fiserv API structure**:
   - Read the swagger files to understand request/response formats
   - Note the EFXHeader requirement
   - Understand the distinction between secured and non-secured endpoints

3. **Start implementation**:
   - Begin with Phase 1 (setup)
   - Build incrementally - one action at a time
   - Test each action before moving to the next

4. **When stuck**:
   - Check swagger files for exact schema
   - Look at similar actions in salesforce/hubspot pieces
   - Review this implementation guide

5. **Testing**:
   - Use Fiserv sandbox environment
   - Test each action individually
   - Then test complete workflows

Good luck! This is a comprehensive guide - follow it step by step and you'll have a working Fiserv piece.

---

**Document Version**: 1.0
**Last Updated**: 2025-12-23
**Created By**: Claude (Sonnet 4.5)
