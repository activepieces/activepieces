# Fiserv Piece - Quick Start Guide

## 🎯 Project Goal
Build a Fiserv Banking API integration for **account opening workflows** (consumer & commercial).

## 📋 What to Build

### Scope: Account Opening Focus
- ✅ **Accounts**: Create/get/update accounts (deposit & loan)
- ✅ **Parties**: Create/get/update customers (person & organization)
- ✅ **Loans**: Create loans with collateral and escrow

### NOT in Scope (Future)
- ❌ Cards
- ❌ Transactions/Transfers
- ❌ Deposits (separate from account opening)

## 📁 Folder Structure
```
packages/pieces/community/fiserv/src/
├── index.ts
└── lib/
    ├── actions/
    │   ├── accounts/        # 6 actions
    │   ├── parties/         # 9 actions
    │   └── loans/
    │       ├── collateral/  # 4 actions
    │       └── escrow/      # 4 actions
    └── common/
        ├── auth.ts
        ├── client.ts
        ├── props.ts
        ├── constants.ts
        └── types.ts
```

## 📚 Key Reference Files

**Swagger Documentation** (in `packages/pieces/docs-and-samples/Fiserv/documentation/swagger/`):
1. `Bank_Sol_Org-AcctService-11.0.0-resolved.yaml` - Account operations
2. `Bank_Sol_Org-PartyService-11.0.0-resolved.yaml` - Customer operations
3. `Bank_Sol_Org-CollateralService-11.0.0-resolved.yaml` - Collateral management
4. `Bank_Sol_Org-EscrowService-11.0.0-resolved.yaml` - Escrow management

**Full Guide**: `IMPLEMENTATION_GUIDE.md` (same folder)

## 🚀 Implementation Order

1. **Setup** (Day 1)
   - Create folder structure
   - Set up auth, client, constants, types

2. **Accounts** (Day 2-3)
   - Create/get/update account actions

3. **Parties** (Day 3-4)
   - Create/get/update party + address/phone/email actions

4. **Loans** (Day 5-6)
   - Collateral and escrow actions

5. **Test** (Day 7)
   - End-to-end workflows

## ⚠️ Critical Notes

1. **EFXHeader Required**: All API calls need this header (check swagger for structure)
2. **Account Opening = Party First**: Must create party/customer before account
3. **Use Salesforce piece as template**: Similar structure and patterns
4. **Test Environment**: Use Fiserv sandbox (URLs in swagger files)

## 🔗 Example Pieces to Reference
- `packages/pieces/community/salesforce/` - Similar domain, great template
- `packages/pieces/community/hubspot/` - Large piece organization
- `packages/pieces/community/stripe/` - Financial API example

## 📖 Full Documentation
See `IMPLEMENTATION_GUIDE.md` for complete details, code examples, and step-by-step instructions.

---
**Start Here**: Open `IMPLEMENTATION_GUIDE.md` and follow Phase 1.
