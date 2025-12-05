# SmarterProctoring Piece for ActivePieces

This piece provides integration with SmarterProctoring, an online proctoring and exam management platform.

## Authentication

To use the SmarterProctoring piece, you need to provide:

1. **API Key**: Your SmarterProctoring API key for authentication
2. **Base URL**: The base URL of your SmarterProctoring instance (e.g., `https://api.smarterproctoring.com` or your custom instance URL)

**Important**: The API key is sent in the `token` header field, not as a standard Bearer token in the Authorization header.

## Actions

### Custom API Call

Make custom API calls to any SmarterProctoring endpoint.

**Parameters:**
- **Method** (required): HTTP method (GET, POST, PUT, DELETE, PATCH)
- **Endpoint** (required): The API endpoint path (e.g., `/api/v1/exams`)
- **Headers** (optional): Additional headers to include in the request
- **Query Parameters** (optional): Query parameters to include in the request
- **Body** (optional): The request body (for POST, PUT, PATCH requests)

## Working with Path Parameters

Many SmarterProctoring API endpoints use path parameters (e.g., `/v1/installs/{installSid}/exams/{examSid}/sessions/{sessionSid}/events`). When using these endpoints, you need to replace the placeholders with actual values.

**Example:**

To call the endpoint `/v1/installs/{installSid}/exams/{examSid}/sessions/{sessionSid}/events`, replace the path parameters with actual values:

```
/v1/installs/inst_12345/exams/exam_67890/sessions/sess_54321/events
```

## Error Handling

The SmarterProctoring piece handles common HTTP errors:

- **401**: Authentication failed (check your API key)
- **404**: API endpoint not found
- **429**: Rate limit exceeded
- **500+**: Server errors

When using endpoints with path parameters, ensure all placeholders are replaced with valid values to avoid 400 (Bad Request) errors.
