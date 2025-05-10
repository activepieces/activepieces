# SmartSuite Integration

This integration allows you to interact with SmartSuite's API to manage records, files, and web hooks in your SmartSuite solutions.

## Authentication

To use this integration, you'll need a SmartSuite API key. You can obtain one from your SmartSuite account settings.

## Rate Limiting

The SmartSuite API has the following rate limits:
- 5 requests per second per API key
- 30-second cooldown period after exceeding the limit
- Rate limits apply to all plans and cannot be increased

The integration automatically handles rate limiting by:
- Tracking request counts
- Implementing exponential backoff
- Waiting for the cooldown period when limits are exceeded
- Providing clear error messages for rate limit issues

## Available Actions

### Create Record
Creates a new record in a specified table with the provided field values.

### Update Record
Updates an existing record with new field values.

### Delete Record
Deletes a record from a specified table.

### Search Records
Searches for records in a table based on a query string.

### Find Records
Advanced search with filtering and sorting capabilities.

### Get Record
Retrieves a single record by its ID.

### Upload File
Attaches a file to a record's field.

## Web Hook Triggers

### New Record
Triggers when a new record is created in a specified table.

### Updated Record
Triggers when a record is updated in a specified table.

## Field Types Support

The integration supports the following field types:

- Text (Short and Long)
- Email
- URL
- Phone
- Number
- Date
- Checkbox
- File
- Select (Single and Multi)
- Relation
- Formula
- System Fields (created_at, updated_at, created_by, updated_by)

## Error Handling

The integration includes comprehensive error handling for various scenarios:

### Authentication Errors
- Invalid API Key
- Authentication Failed
- Token Expired
- Insufficient Permissions

### Request Errors
- Invalid Request
- Invalid Parameters
- Missing Required Fields
- Invalid Field Type/Value
- Field Validation Failed

### Resource Errors
- Resource Not Found
- Solution/Table/Record Not Found
- Field Not Found
- Web Hook Not Found

### File Errors
- File Too Large
- Invalid File Format
- File Upload/Delete Failed

### Rate Limiting
- Rate Limit Exceeded (5 requests/second)
- Cooldown Period (30 seconds)
- Too Many Requests

### Web Hook Errors
- Web Hook Creation/Deletion/Update Failed
- Invalid Web Hook URL
- Web Hook Verification Failed

## Usage Examples

### Creating a Record
```typescript
const result = await smartsuite.createRecord({
  solution: 'solution_id',
  table: 'table_id',
  fields: {
    name: 'John Doe',
    email: 'john@example.com',
    status: 'active'
  }
});
```

### Searching Records
```typescript
const results = await smartsuite.searchRecords({
  solution: 'solution_id',
  table: 'table_id',
  query: 'John',
  page: 1,
  perPage: 50,
  sortBy: 'created_at',
  sortOrder: 'desc'
});
```

### Using Web Hooks
```typescript
const webhook = await smartsuite.newRecord({
  solution: 'solution_id',
  table: 'table_id',
  includeFields: ['name', 'email', 'status'],
  retryOnFailure: true,
  maxRetries: 3
});
```
