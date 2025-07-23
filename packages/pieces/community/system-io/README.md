# Systeme.io Integration

This piece provides a comprehensive integration with [Systeme.io](https://systeme.io), an all‑in‑one marketing platform for building sales funnels, email campaigns, membership sites, and more.

## Authentication

To authenticate with Systeme.io, you need an API key:

1. Log in to your Systeme.io account
2. Navigate to **Profile Settings** → **Public API keys**
3. Generate a new API key
4. Copy the key and paste it into the API Key field in Activepieces

⚠️ **Security Notice**: Never expose your API key in public pages or client-side code. Always use it securely on the server side.

## Actions

### Contact Management

#### Create Contact
Creates a new contact with email, name, and optional tags.
- **Email** (required): Contact's email address
- **First Name** (optional): Contact's first name
- **Last Name** (optional): Contact's last name
- **Phone** (optional): Contact's phone number
- **Tags** (optional): Array of tag names to assign
- **Custom Fields** (optional): Key-value pairs for custom field data

#### Update Contact
Updates fields of an existing contact using merge patch format.
- **Contact ID** (required): The ID of the contact to update
- **First Name** (optional): Updated first name
- **Last Name** (optional): Updated last name
- **Phone** (optional): Updated phone number
- **Locale** (optional): Contact locale (e.g., "en", "fr")
- **Custom Fields** (optional): Custom field updates (set to null to remove)

#### Find Contact by Email
Searches for a contact by email address.
- **Email** (required): Email address to search for

### Tag Management

#### Add Tag to Contact
Assigns a tag to an existing contact.
- **Contact ID** (required): The ID of the contact
- **Tag Name** (required): Name of the tag to assign

#### Remove Tag from Contact
Removes a tag from an existing contact.
- **Contact ID** (required): The ID of the contact
- **Tag ID** (required): The unique identifier of the tag to remove

💡 **Tip**: Use the "List Contact Tags" action to get tag IDs for removal.

#### List Contact Tags
Gets all tags assigned to a specific contact.
- **Contact ID** (required): The ID of the contact
- **Returns**: Array of tag objects with IDs and names

### Custom API Call
Provides a flexible way to make custom API calls to any Systeme.io endpoint with proper authentication headers.

## Triggers

### New Contact
Fires when a new contact is created in your Systeme.io account.

**Sample Payload:**
```json
{
  "id": "12345",
  "email": "john.doe@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890",
  "locale": "en",
  "created_at": "2024-01-15T10:30:00Z",
  "tags": ["lead", "website"]
}
```

### New Sale
Fires when a new purchase is made within a funnel.

**Sample Payload:**
```json
{
  "id": "order_12345",
  "customer": {
    "id": "12345",
    "email": "john.doe@example.com",
    "first_name": "John",
    "last_name": "Doe"
  },
  "total_amount": 99.99,
  "currency": "USD",
  "payment_status": "paid",
  "funnel_id": "funnel_123"
}
```

### New Tag Added to Contact
Fires when a tag is assigned to a contact. Optionally filter by specific tag names.

**Configuration:**
- **Tag Name** (optional): Specific tag name to monitor. Leave empty to trigger on any tag addition.

## Error Handling

The integration includes comprehensive error handling for:
- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Invalid API key
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource doesn't exist
- **409 Conflict**: Resource already exists
- **422 Validation Error**: Invalid data provided
- **429 Rate Limit**: Too many requests
- **500 Server Error**: Systeme.io API issues

## Rate Limiting

Systeme.io implements rate limiting. The integration handles this gracefully:
- Monitors `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Refill` headers
- Provides clear error messages when rate limits are exceeded
- Includes `Retry-After` information when available

## Webhook Setup

Webhooks are automatically registered and managed by the triggers. When you:
- **Enable a trigger**: A webhook is automatically created in your Systeme.io account
- **Disable a trigger**: The webhook is automatically removed

## Common Use Cases

1. **Lead Management**: Automatically create and tag contacts from form submissions
2. **Sales Automation**: Trigger follow-up sequences when purchases are made
3. **Segmentation**: Add/remove tags based on customer behavior
4. **CRM Sync**: Keep contact information synchronized across platforms
5. **Analytics**: Track sales and funnel performance in external tools

## API Reference

This integration uses the [Systeme.io Public API](https://developer.systeme.io/reference/api). For detailed API documentation, refer to their official documentation.

## Support

For issues related to the Systeme.io API itself, contact [Systeme.io support](https://systeme.io). For integration issues, please file an issue in the Activepieces repository.
