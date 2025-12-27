# pCloud Piece - Deployment Guide

## Product Overview

**Type**: Activepieces Community Piece (Bounty)
**Bounty Value**: $100
**Platform**: Algora.io - Activepieces Challenge
**URL**: https://algora.io/challenges/activepieces

## Product Summary

A complete pCloud cloud storage integration for Activepieces automation platform with:
- OAuth 2.0 authentication
- 9 file/folder actions + Custom API Call
- Full coverage of pCloud API features

## Deployment Steps

### 1. Fork Activepieces Repository

```bash
git clone https://github.com/activepieces/activepieces.git
cd activepieces
```

### 2. Copy Piece Files

```bash
# Copy the pcloud piece to the community pieces directory
cp -r /path/to/pcloud-piece packages/pieces/community/pcloud
```

### 3. Register the Piece

Add to `packages/pieces/community/index.ts`:

```typescript
export * from './pcloud';
```

### 4. Add to Workspace

Add to `nx.json` workspace configuration if required.

### 5. Build and Test

```bash
# Install dependencies
npm install

# Build the piece
npx nx build pieces-pcloud

# Run full test suite
npm test
```

### 6. Create Pull Request

**Title**: `feat(pieces): add pCloud cloud storage integration`

**PR Body**:
```markdown
## Summary
Adds pCloud cloud storage integration to Activepieces.

## Features
- OAuth 2.0 authentication
- 9 file/folder operations:
  - Upload File
  - Download File
  - List Folder (with recursive option)
  - Create Folder
  - Delete File
  - Delete Folder (with recursive option)
  - Copy File
  - Move File
  - Get File Link
- Custom API Call action for advanced use cases

## Test Plan
- [ ] OAuth flow with pCloud works correctly
- [ ] File upload/download tested
- [ ] Folder operations (create, list, delete) tested
- [ ] Copy/move operations tested
- [ ] Error handling for API failures

## Bounty
Closes Algora pCloud bounty ($100)
```

### 7. Claim Bounty

After PR is merged:
1. Visit https://algora.io/challenges/activepieces
2. Link your PR
3. Claim the $100 bounty

## Files Included

```
pcloud-piece/
├── package.json           # Package definition
├── project.json           # NX build configuration
├── tsconfig.json          # TypeScript config
├── tsconfig.lib.json      # Library-specific TS config
├── .eslintrc.json         # ESLint configuration
├── .babelrc               # Babel configuration
├── README.md              # Documentation
├── SUBMIT_BOUNTY.md       # Bounty submission guide
├── DEPLOY.md              # This file
└── src/
    ├── index.ts           # Main piece definition
    └── lib/
        └── actions/
            ├── upload-file.ts
            ├── download-file.ts
            ├── list-folder.ts
            ├── create-folder.ts
            ├── delete-file.ts
            ├── delete-folder.ts
            ├── copy-file.ts
            ├── move-file.ts
            └── get-file-link.ts
```

## Technical Notes

- Uses `@activepieces/pieces-framework` and `@activepieces/pieces-common`
- OAuth2 authentication at `https://my.pcloud.com/oauth2/authorize`
- Token URL: `https://api.pcloud.com/oauth2_token`
- API base URL: `https://api.pcloud.com` (US) or `https://eapi.pcloud.com` (EU)
- pCloud tokens don't expire, simplifying token management

## Prerequisites for Deployment

- GitHub account to fork Activepieces
- Node.js 18+ for building
- pCloud developer account for testing OAuth flow

## Estimated Value

- **Bounty**: $100 cash
- **Additional**: +1,400 tasks/month credit on Activepieces Cloud
