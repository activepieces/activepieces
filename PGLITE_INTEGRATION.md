# PGlite Integration with TypeORM

This document describes the implementation of PGlite support in Activepieces as an alternative to SQLite3.

## Overview

PGlite is a WASM-based PostgreSQL implementation that runs entirely in-process, similar to SQLite, but provides full PostgreSQL compatibility. This makes it an excellent replacement for SQLite3 while maintaining better compatibility with the PostgreSQL production database.

## Benefits of PGlite over SQLite3

1. **PostgreSQL Compatibility**: Uses the same SQL syntax and features as PostgreSQL, eliminating the need for database-specific code
2. **No Driver Differences**: Same `pg` driver API as PostgreSQL, simplifying codebase
3. **Better Feature Support**: Supports JSONB, arrays, and other PostgreSQL-specific features
4. **Easier Migration Path**: Switching between PGlite (development) and PostgreSQL (production) is seamless
5. **Modern Implementation**: WASM-based, actively maintained, and performant

## Implementation Details

### Files Modified/Created

1. **`packages/server/api/src/app/helper/system/system.ts`**
   - Added `PGLITE` to the `DatabaseType` enum

2. **`packages/server/api/src/app/database/pglite-connection.ts`** (NEW)
   - Implements PGlite DataSource creation
   - Wraps PGlite in a node-postgres compatible interface
   - Supports both file-based and in-memory databases
   - Uses file-based storage in production (`~/.activepieces/pglite`)
   - Uses in-memory storage for testing

3. **`packages/server/api/src/app/database/database-connection.ts`**
   - Added PGlite as a connection option
   - Routes PGlite to use PostgreSQL-compatible query handling
   - Treats PGlite the same as PostgreSQL for array operations

4. **`packages/server/api/src/app/database/database-common.ts`**
   - Updated `isPostgres()` function to include PGlite
   - Ensures PGlite uses PostgreSQL column types (JSONB, arrays, etc.)

5. **`packages/server/api/src/app/helper/pagination/paginator.ts`**
   - Added PGlite to PostgreSQL query syntax handling

## Usage

### Configuration

Set the database type environment variable:

```bash
AP_DB_TYPE=PGLITE
```

### Database Storage

- **Production/Development**: `~/.activepieces/pglite/` (or path set by `AP_CONFIG_PATH`)
- **Testing**: In-memory (`memory://`)

### Architecture

```
┌─────────────────────────────────────┐
│         TypeORM DataSource          │
├─────────────────────────────────────┤
│    PostgreSQL Driver Interface      │
├─────────────────────────────────────┤
│     PGliteConnection Wrapper        │
├─────────────────────────────────────┤
│        @electric-sql/pglite         │
├─────────────────────────────────────┤
│         PostgreSQL (WASM)           │
└─────────────────────────────────────┘
```

The `PGliteConnection` class wraps the PGlite instance to provide a node-postgres compatible interface that TypeORM expects.

## Testing

A test script is provided at `test-pglite.ts` that verifies:
- Basic SQL queries
- Table creation and data insertion
- PostgreSQL-specific features (JSONB, arrays)
- TypeORM compatibility

Run the test:
```bash
npx ts-node test-pglite.ts
```

## Migration Notes

### For Users Currently Using SQLite3

When migrating from SQLite3 to PGlite:

1. **Data Migration**: You'll need to export your SQLite3 data and import it into PGlite
2. **No Code Changes**: Application code works the same way
3. **Better Compatibility**: PGlite uses PostgreSQL syntax, which is closer to production

### For Users Using PostgreSQL

PGlite can be used as a lightweight development alternative:

1. Set `AP_DB_TYPE=PGLITE` for local development
2. Use `AP_DB_TYPE=POSTGRES` for production
3. Migrations and queries work identically

## Limitations

1. **Migrations**: Currently uses TypeORM's `synchronize` mode in testing. Production migrations need to be adapted from PostgreSQL migrations.
2. **Performance**: While fast, PGlite won't match a full PostgreSQL server for high-concurrency workloads
3. **Single Process**: PGlite runs in-process, so it can't be shared across multiple application instances

## Future Improvements

1. **Migration Support**: Adapt PostgreSQL migrations to work with PGlite
2. **Data Migration Tools**: Create utilities to migrate from SQLite3 to PGlite
3. **Performance Optimization**: Fine-tune PGlite configuration for optimal performance
4. **Clustering Support**: Investigate options for multi-process scenarios

## Dependencies

- `@electric-sql/pglite`: ^0.2.15

## Conclusion

PGlite provides a modern, PostgreSQL-compatible alternative to SQLite3 that simplifies the codebase and improves compatibility between development and production environments. The implementation is complete and ready for testing.
