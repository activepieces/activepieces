# Custom Pieces Publishing Guide

This guide explains how to publish custom ActivePieces pieces to npm.

## Prerequisites

1. **npm Account**: You must have an npm account and be logged in
   ```bash
   npm login
   ```

2. **Verify Login**:
   ```bash
   npm whoami
   ```

## Publishing Methods

### Option 1: Publish All Pieces at Once

From the `packages/pieces/custom` directory:

```bash
./publish-pieces.sh [patch|minor|major]
```

**Examples:**
- `./publish-pieces.sh` - Patch version bump (0.0.1 → 0.0.2)
- `./publish-pieces.sh minor` - Minor version bump (0.0.1 → 0.1.0)
- `./publish-pieces.sh major` - Major version bump (0.0.1 → 1.0.0)

This will:
1. Check npm authentication
2. Bump version for each piece
3. Build each piece
4. Publish to npm with public access
5. Show a summary of successes/failures

### Option 2: Publish Individual Pieces

Navigate to the specific piece directory and run:

```bash
cd narmi
./publish.sh [patch|minor|major]
```

Or from anywhere:
```bash
cd packages/pieces/custom/narmi && ./publish.sh
cd packages/pieces/custom/fiserv-premier && ./publish.sh
cd packages/pieces/custom/icemortgage-encompass && ./publish.sh
cd packages/pieces/custom/gelato && ./publish.sh
```

## Version Types

- **patch** (default): Bug fixes and small changes (0.0.1 → 0.0.2)
- **minor**: New features, backwards compatible (0.0.1 → 0.1.0)
- **major**: Breaking changes (0.0.1 → 1.0.0)

## Custom Pieces

### Narmi
- **Package**: `@vqnguyen1/piece-narmi`
- **Logo**: https://i.imgur.com/EpttLjG.png
- **Features**: Account Opening API integration with Custom API Call

### Fiserv Premier
- **Package**: `@vqnguyen1/piece-fiserv-premier`
- **Logo**: https://i.imgur.com/1BOQN9O.png
- **Features**: Party management with EFXHeader authentication and Custom API Call

### IceMortgage Encompass
- **Package**: `@vqnguyen1/piece-icemortgage-encompass`
- **Logo**: https://i.imgur.com/UqqkpPQ.png
- **Features**: Loan and document management with Custom API Call

### Gelato
- **Package**: `@vqnguyen1/piece-gelato`
- **Logo**: https://cdn.activepieces.com/pieces/gelato.png
- **Features**: Ice cream flavor management with Custom API Call

## What Happens During Publishing

1. **Version Bump**: Updates `package.json` version
2. **Build**: Compiles TypeScript and creates distribution files
3. **Publish**: Uploads to npm with `--access public` flag
4. **Verification**: Package becomes available on npm

## Viewing Published Packages

After publishing, view your packages at:
- https://www.npmjs.com/package/@vqnguyen1/piece-narmi
- https://www.npmjs.com/package/@vqnguyen1/piece-fiserv-premier
- https://www.npmjs.com/package/@vqnguyen1/piece-icemortgage-encompass
- https://www.npmjs.com/package/@vqnguyen1/piece-gelato

## Troubleshooting

### Not logged in to npm
```bash
npm login
```

### Permission denied on scripts
```bash
chmod +x publish-pieces.sh
chmod +x */publish.sh
```

### Build failed
Check TypeScript errors in the piece source code

### Publish failed
- Verify you have publish rights to the `@vqnguyen1` scope
- Check if version already exists on npm
- Ensure package name is unique

## Notes

- Scripts automatically use `--no-git-tag-version` to prevent git tags
- All packages are published with `--access public`
- Build uses `--skip-nx-cache` to ensure fresh builds
- Version increments happen in source `package.json`
