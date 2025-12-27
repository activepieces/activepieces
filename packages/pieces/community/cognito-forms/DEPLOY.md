# Deployment Guide: Cognito Forms Piece

## Target Platform

**ActivePieces Community Pieces Repository**

This piece was created for the [Cognito Forms bounty](https://console.algora.io/bounty) on Algora.

## Bounty Submission

### Step 1: Verify Requirements

Check the bounty requirements match this implementation:
- API Key authentication
- CRUD operations for entries
- Form listing
- Custom API call support

### Step 2: Test Locally

```bash
# Install dependencies
npm install

# Build TypeScript
npx tsc

# Run any tests
npm test
```

### Step 3: Fork ActivePieces

```bash
git clone https://github.com/YOUR_USERNAME/activepieces.git
cd activepieces
```

### Step 4: Add the Piece

```bash
cp -r /path/to/cognito-forms-piece packages/pieces/community/cognito-forms
```

### Step 5: Build in ActivePieces

```bash
pnpm install
pnpm build --filter=@activepieces/piece-cognito-forms
```

### Step 6: Create Pull Request

1. Commit changes
2. Push to your fork
3. Open PR to `activepieces/activepieces`
4. Reference the bounty in PR description

### Step 7: Submit to Bounty

After PR is merged:
1. Go to Algora bounty page
2. Submit your merged PR as proof
3. Claim the reward

## API Key Setup

Users need to:
1. Log in to Cognito Forms
2. Go to Organization Settings
3. Navigate to Integrations
4. Generate new API key
5. Paste into ActivePieces connection

## Actions Implemented

| Action | Endpoint | Method |
|--------|----------|--------|
| Get Forms | /forms | GET |
| Get Entries | /forms/{id}/entries | GET |
| Get Entry | /forms/{id}/entries/{entryId} | GET |
| Create Entry | /forms/{id}/entries | POST |
| Update Entry | /forms/{id}/entries/{entryId} | PUT |
| Delete Entry | /forms/{id}/entries/{entryId} | DELETE |
| Custom API | Any | Any |

## Monetization

This is a bounty submission. After completion:
- Bounty reward (one-time)
- GitHub Sponsors for maintenance
- Consulting for Cognito Forms automation

## Support

- ActivePieces: https://discord.gg/activepieces
- Cognito Forms API: https://www.cognitoforms.com/support/475/data-integration/cognito-forms-api
