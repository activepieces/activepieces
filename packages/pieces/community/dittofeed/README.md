# Dittofeed Piece for ActivePieces

This piece provides integration with [Dittofeed](https://dittofeed.com/), a customer data platform for user analytics and tracking.

## Authentication

To use the Dittofeed piece, you need to provide:

1. **API Key**: Your Dittofeed API key for authentication
2. **Base URL**: The base URL of your Dittofeed instance (e.g., `https://api.dittofeed.com` or your self-hosted instance URL)

## Actions

### Identify User

Identify a user in Dittofeed with their unique ID and traits.

**Parameters:**
- **User ID** (required): A unique identifier for the user
- **User Traits** (optional): An object containing user properties like name, email, etc.

**Example:**
```json
{
  "userId": "user123",
  "traits": {
    "name": "John Doe",
    "email": "john@example.com",
    "plan": "premium"
  }
}
```

### Track Event

Track a user event in Dittofeed.

**Parameters:**
- **User ID** (required): A unique identifier for the user
- **Event** (required): The name of the event to track
- **Properties** (optional): An object containing event properties

**Example:**
```json
{
  "userId": "user123",
  "event": "purchase_completed",
  "properties": {
    "product": "Premium Plan",
    "price": 99.99,
    "currency": "USD"
  }
}
```

### Screen View

Track a screen view event in Dittofeed.

**Parameters:**
- **User ID** (required): A unique identifier for the user
- **Name** (required): The name of the screen viewed
- **Properties** (optional): An object containing screen view properties

**Example:**
```json
{
  "userId": "user123",
  "name": "checkout_page",
  "properties": {
    "referrer": "product_page",
    "device": "mobile"
  }
}
```

## Troubleshooting

### Common Errors

1. **Authentication failed**: Check that your API key is correct and has the necessary permissions.
2. **API endpoint not found**: Verify that your base URL is correct and points to a valid Dittofeed instance.
3. **Rate limit exceeded**: You've made too many requests in a short period. Wait and try again later.
4. **Invalid input**: Ensure that your User ID is not empty and that traits/properties are valid objects.

### Best Practices

1. Use consistent User IDs across all actions to ensure proper user tracking.
2. Keep event names consistent and descriptive for better analytics.
3. Include relevant properties with events and screen views to capture valuable context.

## Building

Run `nx build pieces-dittofeed` to build the library.
