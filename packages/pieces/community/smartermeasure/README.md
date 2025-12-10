# SmarterMeasure Piece for ActivePieces

This piece provides integration with SmarterMeasure, a learning readiness assessment platform.

## Authentication

To use the SmarterMeasure piece, you need to provide:

1. **Username**: Your SmarterMeasure username for authentication
2. **Password**: Your SmarterMeasure password for authentication
3. **Base URL**: The base URL of your SmarterMeasure instance (e.g., `https://api.smartermeasure.com` or your custom instance URL)

**Important**: Authentication is done using HTTP Basic Authentication.

## Actions

### Custom API Call

Make custom API calls to any SmarterMeasure endpoint.

**Parameters:**
- **Method** (required): HTTP method (GET, POST, PUT, DELETE, PATCH)
- **Endpoint** (required): The API endpoint path (e.g., `/api/v1/assessments`)
- **Headers** (optional): Additional headers to include in the request
- **Query Parameters** (optional): Query parameters to include in the request
- **Body** (optional): The request body (for POST, PUT, PATCH requests)

## Working with Path Parameters

Many SmarterMeasure API endpoints use path parameters (e.g., `/v1/assessments/{assessmentId}/results`). When using these endpoints, you need to replace the placeholders with actual values.

**Example:**

To call the endpoint `/v1/assessments/{assessmentId}/results`, replace the path parameters with actual values:

```
/v1/assessments/12345/results
```

## Error Handling

The SmarterMeasure piece handles common HTTP errors:

- **401**: Authentication failed (check your username and password)
- **404**: API endpoint not found
- **429**: Rate limit exceeded
- **500+**: Server errors

When using endpoints with path parameters, ensure all placeholders are replaced with valid values to avoid 400 (Bad Request) errors.
