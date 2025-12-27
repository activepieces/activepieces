# Cognito Forms Piece for Activepieces

Integrates Cognito Forms with Activepieces for form and entry management.

## Authentication

This piece uses API Key authentication. To get your API key:
1. Click your organization name in the top left corner of Cognito Forms
2. Click Settings
3. Go to the Integrations section
4. Select "+ New API Key"
5. Copy and save your API key (it cannot be retrieved later)

## Actions

### Get Forms
Get a list of all forms in your organization.

### Get Entries
Get all entries for a specific form with pagination support.
- **Form ID**: Required - The ID of the form
- **Limit**: Optional - Maximum entries to return (default: 100)
- **Skip**: Optional - Entries to skip for pagination

### Get Entry
Get a specific entry by its ID.
- **Form ID**: Required - The ID of the form
- **Entry ID**: Required - The ID of the entry

### Create Entry
Create a new entry in a form.
- **Form ID**: Required - The ID of the form
- **Entry Data**: Required - JSON object with field names matching your form

### Update Entry
Update an existing form entry.
- **Form ID**: Required
- **Entry ID**: Required
- **Entry Data**: Required - JSON with updated fields

### Delete Entry
Delete an entry from a form.
- **Form ID**: Required
- **Entry ID**: Required

### Custom API Call
Make custom API requests to Cognito Forms.

## API Documentation

For more information about the Cognito Forms API:
- [API Overview](https://www.cognitoforms.com/support/475/data-integration/cognito-forms-api)
- [REST API Reference](https://www.cognitoforms.com/support/476/data-integration/cognito-forms-api/rest-api-reference)
