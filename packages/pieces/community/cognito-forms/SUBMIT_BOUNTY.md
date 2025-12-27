# Cognito Forms Bounty Submission Instructions

## Bounty Details
- **Platform**: Algora.io
- **Challenge**: Activepieces MCP Challenge
- **Bounty**: $50 for Cognito Forms integration
- **URL**: https://algora.io/challenges/activepieces

## Submission Steps

### 1. Fork Activepieces Repository
```bash
git clone https://github.com/activepieces/activepieces.git
cd activepieces
```

### 2. Copy Piece to Repository
```bash
cp -r /autonomous-claude/data/projects/cognito-forms-piece packages/pieces/community/cognito-forms
```

### 3. Register Piece
Add to `packages/pieces/community/index.ts`:
```typescript
export * from './cognito-forms';
```

### 4. Add Logo
Upload cognito-forms logo (256x256) to Activepieces CDN or use existing asset.

### 5. Test Locally
```bash
npm install
nx build pieces-cognito-forms
```

### 6. Create Pull Request
Title: `feat(pieces): add Cognito Forms integration`

Body:
```markdown
## Summary
- Adds Cognito Forms integration for form and entry management
- API Key authentication
- 6 actions + custom API call

## Actions
- Get Forms - List all forms in organization
- Get Entries - Get entries with pagination
- Get Entry - Get specific entry by ID
- Create Entry - Create new form entry
- Update Entry - Update existing entry
- Delete Entry - Delete entry
- Custom API Call - Make custom requests

## Test Plan
- [ ] API key authentication works
- [ ] Get Forms returns form list
- [ ] CRUD operations on entries work

Closes Algora bounty for Cognito Forms ($50)
```

### 7. Claim Bounty
After PR is merged, claim on Algora:
https://algora.io/challenges/activepieces

## Files Ready
- `src/index.ts` - Main piece definition with API key auth
- `src/lib/actions/*.ts` - 6 action implementations
- `package.json` - Package configuration
- `tsconfig.json` - TypeScript configuration
- `README.md` - Documentation
