# Zoho Campaigns Piece for Activepieces

This piece enables integration with Zoho Campaigns, allowing you to automate your email marketing workflows.

## Authentication

This piece uses OAuth2 authentication. You'll need to:

1. Create a Zoho Campaigns account at https://www.zoho.com/campaigns/
2. Go to API & Developers > Client ID/Secret
3. Create a new client and get the OAuth credentials
4. Use these credentials to authenticate the piece in Activepieces

## Features

### Triggers

1. **New Contact**
   - Triggers when a new contact is added to a selected mailing list
   - Configurable polling interval
   - Returns contact details including email, name, and status

2. **Unsubscribe**
   - Triggers when a contact unsubscribes from a mailing list
   - Includes unsubscribe reason if available
   - Helps maintain clean mailing lists

3. **New Campaign**
   - Triggers when a new campaign is created
   - Returns campaign details including name, subject, and status

### Actions

1. **Create Campaign**
   - Create a new email campaign
   - Set campaign name, subject, content, and sender details
   - Specify target mailing list

2. **Clone Campaign**
   - Clone an existing campaign
   - Optionally rename the cloned campaign
   - Useful for creating variations of successful campaigns

3. **Send Campaign**
   - Send a created campaign immediately or schedule it
   - Optional scheduling with ISO datetime
   - Returns sending status and campaign details

4. **Add/Update Contact**
   - Add new contacts or update existing ones
   - Comprehensive contact information support
   - Automatic duplicate handling
   - Optional tagging and source tracking

5. **Add Tag to Contact**
   - Apply tags to contacts for segmentation
   - Supports multiple tags
   - Identifies contacts by email address

6. **Remove Tag**
   - Remove specific tags from contacts
   - Maintain clean contact segmentation
   - Batch operation support

7. **Unsubscribe Contact**
   - Remove contacts from mailing lists
   - Proper unsubscribe handling
   - Optional reason tracking

8. **Add Contact to Mailing List**
   - Add existing contacts to mailing lists
   - Supports multiple list additions
   - Handles duplicates appropriately

9. **Find Contact**
   - Look up contacts by email address
   - Returns comprehensive contact details
   - Includes list memberships and tags

10. **Find Campaign**
    - Search for campaigns by name
    - Returns campaign details and statistics
    - Includes tracking information

## Error Handling

- Comprehensive error handling for all API operations
- Detailed error messages for troubleshooting
- Automatic retry for rate limiting
- Input validation before API calls

## Best Practices

1. Always validate email addresses before adding contacts
2. Use tags for better contact organization
3. Check campaign status before sending
4. Handle rate limits appropriately
5. Keep mailing lists clean and updated

## Examples

### Creating and Sending a Campaign

```typescript
// 1. Create a new campaign
const campaign = await createCampaign({
    campaignName: "Welcome Series",
    subject: "Welcome to Our Newsletter",
    fromName: "Marketing Team",
    fromEmail: "marketing@company.com",
    listKey: "your_list_key",
    content: "<h1>Welcome!</h1>..."
});

// 2. Send the campaign
await sendCampaign({
    campaignKey: campaign.campaign_key
});
```

### Managing Contacts

```typescript
// Add a new contact with tags
const contact = await createContact({
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    listKey: "your_list_key",
    tags: ["new-subscriber", "website"],
    source: "Website Signup"
});
```

## Rate Limits

- Respect Zoho Campaigns API rate limits
- Built-in rate limit handling
- Automatic retries with exponential backoff

## Support

For issues and feature requests, please:
1. Check the Activepieces documentation
2. Open an issue in the Activepieces repository
3. Contact Zoho Campaigns support for API-specific issues
