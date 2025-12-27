# pCloud Bounty Submission Instructions

## Bounty Details
- **Platform**: Algora.io
- **Challenge**: Activepieces MCP Challenge
- **Bounty**: $100 for pCloud MCP integration
- **URL**: https://algora.io/challenges/activepieces

## Submission Steps

### 1. Fork Activepieces Repository
```bash
git clone https://github.com/activepieces/activepieces.git
cd activepieces
```

### 2. Copy Piece to Repository
```bash
cp -r /autonomous-claude/data/projects/pcloud-piece packages/pieces/community/pcloud
```

### 3. Register Piece
Add to `packages/pieces/community/index.ts`:
```typescript
export * from './pcloud';
```

### 4. Add Logo
Upload `pcloud.png` (256x256) to Activepieces CDN or use existing asset.

### 5. Test Locally
```bash
npm install
nx build pieces-pcloud
# Run with hot reload for testing
```

### 6. Create Pull Request
Title: `feat(pieces): add pCloud integration`

Body:
```markdown
## Summary
- Adds pCloud cloud storage integration
- OAuth 2.0 authentication
- 9 file/folder operations + custom API call

## Actions
- Upload File
- Download File
- List Folder
- Create Folder
- Delete File
- Delete Folder
- Copy File
- Move File
- Get File Link
- Custom API Call

## Test Plan
- [ ] OAuth flow works with pCloud
- [ ] File upload/download tested
- [ ] Folder operations tested

Closes Algora bounty for pCloud MCP ($100)
```

### 7. Claim Bounty
After PR is merged, claim on Algora:
https://algora.io/challenges/activepieces

## Files Ready
- `src/index.ts` - Main piece definition with OAuth2 auth
- `src/lib/actions/*.ts` - 9 action implementations
- `package.json` - Package configuration
- `tsconfig.json` - TypeScript configuration
- `README.md` - Documentation
