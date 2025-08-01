# Paperform API

This piece provides integration with the Paperform API, allowing you to interact with forms, submissions, and other Paperform resources.

## Authentication

To use this piece, you need a Paperform API key. API access is only available with either the Standard or Business API for Paperform.

### Getting Your API Key

1. Log in to your Paperform account
2. Go to your account page
3. Generate an API key
4. Copy the API key for use in this piece

### Authentication Setup

When setting up this piece in Activepieces:

1. Enter your Paperform API key in the "API Key" field
2. The piece will automatically validate your API key
3. If validation fails, please check that your API key is correct and that you have the appropriate API access level

## Available Actions

### Get Forms
Retrieves a list of forms from your Paperform account with optional pagination parameters.

### Custom API Call
Allows you to make any API call to the Paperform API with proper authentication headers.

## API Endpoints

The piece uses the Paperform API v1 base URL: `https://api.paperform.co/v1`

Common endpoints include:
- `/forms` - Get all forms
- `/forms/{id}` - Get a specific form
- `/forms/{id}/submissions` - Get submissions for a form
- `/submissions/{id}` - Get a specific submission

## Support

For API support, contact: support@paperform.co
Paperform website: https://paperform.co
