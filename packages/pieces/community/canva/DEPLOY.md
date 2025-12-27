# Deployment Guide: Canva Piece

## Target Platform

**ActivePieces Community Pieces Repository**

## Prerequisites

1. **Canva Developer Account**
   - Go to [Canva Developers](https://www.canva.com/developers/)
   - Create a new app
   - Configure OAuth2 scopes
   - Note Client ID and Secret

2. **ActivePieces Instance**
   - Self-hosted or cloud version
   - Admin access for custom pieces

## Submission Process

### 1. Fork ActivePieces Repository

```bash
git clone https://github.com/YOUR_USERNAME/activepieces.git
cd activepieces
```

### 2. Add the Piece

```bash
cp -r /path/to/canva-piece packages/pieces/community/canva
```

### 3. Update Dependencies

```bash
pnpm install
```

### 4. Build & Test

```bash
pnpm build --filter=@activepieces/piece-canva
```

### 5. Create Pull Request

1. Commit changes
2. Push to your fork
3. Open PR to `activepieces/activepieces`

## OAuth2 Configuration

### Required Scopes

```
design:content:read
design:content:write
design:meta:read
asset:read
asset:write
folder:read
folder:write
profile:read
```

### Redirect URI

Add your ActivePieces OAuth callback URL:
```
https://your-activepieces.com/api/v1/oauth2/callback
```

## Private Deployment

For private use:

```bash
cd activepieces/packages/pieces/community
cp -r /path/to/canva-piece canva
cd ../../..
pnpm install
pnpm build
```

## Use Cases

This piece enables:

1. **Automated Design Creation** - Create designs from templates via API
2. **Bulk Export** - Export multiple designs in batch
3. **Asset Management** - Organize brand assets programmatically
4. **Cross-Platform Publishing** - Export and distribute to other platforms

## Monetization

Options for this open-source contribution:

1. **GitHub Sponsors** - Maintenance support
2. **Design Automation Services** - Consulting using this integration
3. **Premium Templates** - Sell Canva templates with automation workflows

## Support

- ActivePieces Discord: https://discord.gg/activepieces
- Canva Developers: https://www.canva.dev/
