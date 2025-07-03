# Coasy Piece for Activepieces

This is the Coasy integration piece for Activepieces, providing actions and triggers to interact with the Coasy platform for funnel and webinar management.

## Overview

The Coasy piece includes:
- **Actions**: Create funnel participants
- **Triggers**: New funnel participants, new webinar participants, new auth events
- **Authentication**: Custom auth with base URL and API key

## Development Setup

### Prerequisites
1. Clone the activepieces repository
2. Install dependencies: `npm install`
3. Ensure you're in the root directory of the activepieces monorepo

### Development Commands

#### Building the Piece
```bash
# Build the coasy piece specifically
nx build pieces-coasy

# Build with watch mode for development
nx build pieces-coasy --watch
```

#### Testing
```bash
# Run tests for the coasy piece
nx test pieces-coasy

# Run tests with watch mode
nx test pieces-coasy --watch
```

#### Linting
```bash
# Lint the coasy piece
nx lint pieces-coasy

# Auto-fix lint issues
nx lint pieces-coasy --fix
```

### Development Workflow

#### 1. Start Development Environment
```bash
# Start the full development environment (frontend + backend + engine + pieces)
npm run dev

# Or start just backend services if only testing the piece
npm run dev:backend
```

#### 2. Testing Your Changes
- Navigate to `http://localhost:4200` (frontend)
- Create a new flow and add Coasy actions/triggers
- Test authentication with your Coasy credentials
- Verify actions and triggers work as expected

#### 3. Adding New Features

**Adding a New Action:**
1. Create a new file in `src/lib/actions/`
2. Export the action from `src/index.ts`
3. Follow the existing patterns in `create-funnel-participant.ts`

**Adding a New Trigger:**
1. Create a new file in `src/lib/triggers/`
2. Export the trigger from `src/index.ts`
3. Follow the existing patterns in `new-funnel-participant.ts`

#### 4. File Structure
```
packages/pieces/community/coasy/
├── README.md                 # This file
├── package.json             # Package configuration
├── project.json             # Nx project configuration
├── tsconfig.json           # TypeScript config
└── src/
    ├── index.ts            # Main piece definition and exports
    └── lib/
        ├── actions/        # Action implementations
        ├── triggers/       # Trigger implementations
        └── common/         # Shared utilities
```

## Code Standards

### Authentication
The piece uses custom authentication with:
- `baseUrl`: Coasy instance base URL
- `apiKey`: API key for authentication

### Error Handling
- Use proper error messages for user-facing errors
- Handle API errors gracefully
- Validate inputs before making API calls

### Properties
- Use descriptive `displayName` and `description` for all properties
- Mark required fields appropriately
- Use proper property types from `@activepieces/pieces-framework`

## Testing in Activepieces

1. **Authentication Testing**:
   - Verify connection works with valid credentials
   - Test error handling with invalid credentials

2. **Action Testing**:
   - Test with valid inputs
   - Test error scenarios
   - Verify data transformation

3. **Trigger Testing**:
   - Set up webhooks/polling as needed
   - Test trigger conditions
   - Verify payload structure

## Publishing

The piece is published as `@coasy/piece-coasy` to npm. Version is currently `0.0.11`.

To update the version:
1. Update `version` in `package.json`
2. Use the publish script: `npm run publish-piece`

## Resources

- [Activepieces Documentation](https://www.activepieces.com/docs)
- [Pieces Framework Reference](https://www.activepieces.com/docs/developers/piece-reference/properties)
- [Piece Development Guide](https://www.activepieces.com/docs/developers/building-pieces/create-action)
