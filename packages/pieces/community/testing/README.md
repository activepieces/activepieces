# Testing Piece

A simple testing piece for Activepieces that demonstrates basic piece functionality.

## Features

- **Echo Message Action**: Returns the input message as output
- **No Authentication Required**: Simple piece for testing purposes
- **Comprehensive Testing**: Full test coverage with Jest

## Testing

This piece includes comprehensive unit tests to demonstrate proper testing patterns for Activepieces pieces.

### Running Tests

```bash
# Run tests for this piece only
nx test pieces-testing

# Run tests with coverage
nx test pieces-testing --configuration=ci

# Run tests in watch mode
nx test pieces-testing --watch
```

### Test Structure

- `src/index.test.ts` - Tests for the main piece configuration
- `src/lib/actions/echo-message-action.test.ts` - Tests for the echo message action
- `src/lib/__tests__/test-helpers.ts` - Common testing utilities

### Test Patterns

The tests demonstrate:
- Action functionality testing
- Property validation
- Metadata verification
- Edge case handling
- Mock context creation
- Helper function usage

## Development

This piece serves as a reference implementation for:
- Basic piece structure
- Action implementation
- Testing best practices
- Project configuration
