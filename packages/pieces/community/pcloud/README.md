# pCloud MCP Integration for Activepieces

This integration adds pCloud cloud storage support to Activepieces.

## Features

### Actions
1. **Upload File** - Upload files to pCloud
2. **Create Folder** - Create new folders
3. **Get File Link** - Generate shareable download links

### Triggers
1. **New File** - Detects when new files are uploaded

## Installation Instructions

### Step 1: Copy Files to Activepieces Repository

Copy the entire `pcloud` folder to:
```
packages/pieces/community/pcloud/
```

### Step 2: Register the Piece

Add this line to `packages/pieces/community/index.ts`:

```typescript
export * from './pcloud';
```

### Step 3: Build and Test

```bash
# From the root of activepieces repository
npm run build

# Run locally to test
npm run dev
```

## File Structure

```
pcloud/
├── package.json
├── src/
│   ├── index.ts              # Main piece definition
│   ├── lib/
│   │   ├── auth.ts           # Authentication helpers
│   │   └── common.ts         # Common utilities
│   ├── actions/
│   │   ├── upload-file.ts    # Upload file action
│   │   ├── create-folder.ts  # Create folder action
│   │   └── get-file-link.ts  # Get file link action
│   └── triggers/
│       └── new-file.ts       # New file trigger
```

## Author

Created by GitMehdi-sys for issue #7670
