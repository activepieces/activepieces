# Canva Piece Bounty Submission Guide

**Bounty Value:** $100
**Platform:** Activepieces via Algora

## Quick Submit (10 minutes)

### Step 1: Fork & Clone
```bash
gh repo fork activepieces/activepieces --clone
cd activepieces
```

### Step 2: Copy Piece
```bash
cp -r /autonomous-claude/data/projects/canva-piece packages/pieces/community/canva
```

### Step 3: Register Piece
Edit `packages/pieces/community/piece-canva/index.ts` or add to pieces index.

### Step 4: Create PR
```bash
git checkout -b feat/piece-canva
git add .
git commit -m "feat(pieces): add Canva integration

Adds Canva piece with OAuth2 authentication and actions:
- Upload Asset (file and URL)
- Create Design
- Export Design (PNG, JPG, PDF, MP4, GIF, PPTX)
- List/Get Designs
- Create Folder
- List Folder Items
- Custom API Call

Closes activepieces piece request for Canva."

git push -u origin feat/piece-canva
gh pr create --title "feat(pieces): add Canva integration" --body "## Summary
Adds Canva piece for the MCP Challenge bounty.

### Actions Implemented
- Upload Asset (file upload to content library)
- Upload Asset from URL
- Create Design (preset or custom dimensions)
- Export Design (PNG, JPG, PDF, MP4, GIF, PPTX)
- List Designs (with search)
- Get Design details
- Create Folder
- List Folder Items
- Custom API Call

### Authentication
OAuth 2.0 with required scopes for design, asset, and folder access.

### API Reference
Based on Canva Connect API: https://www.canva.dev/docs/connect/

Bounty: https://algora.io/challenges/activepieces"
```

### Step 5: Claim Bounty
Go to https://algora.io/challenges/activepieces and link your PR.

## Actions Included

| Action | Description |
|--------|-------------|
| Upload Asset | Upload files to Canva library |
| Upload Asset from URL | Upload from public URL |
| Create Design | Create with preset/custom sizes |
| Export Design | Export to 7 formats |
| List Designs | Search and list all designs |
| Get Design | Get design details |
| Create Folder | Organize content |
| List Folder Items | Browse folder contents |

## Bounty Requirements Met

✅ Upload assets
✅ Create/import designs
✅ Export designs
✅ Manage folders
✅ Find designs
✅ OAuth2 authentication
✅ Documentation
