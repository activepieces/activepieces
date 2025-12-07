# Klaviyo Piece

This piece provides integration with Klaviyo, a marketing automation platform for email, SMS, and customer data management.

## Authentication

This piece uses API Key authentication. You'll need a Klaviyo Private API Key to connect.

### How to get your Klaviyo API Key:

1. Log in to your Klaviyo account
2. Navigate to **Settings** > **API Keys**
3. Click **Create Private API Key**
4. Give your key a name (e.g., "Activepieces Integration")
5. Set the appropriate permissions for your use case
6. Copy the generated API key

## Features

### Actions

#### Profile Management
- **Create Profile** - Create a new profile in Klaviyo with email, phone, and custom properties
- **Update Profile** - Update an existing profile's information
- **Find Profile by Email or Phone** - Search for profiles using email or phone number

#### List Management
- **Create List** - Create a new subscriber list
- **Add Profile to List** - Add a profile to a specific list
- **Remove Profile from List** - Remove a profile from a list
- **Find List by Name** - Search for a list by its name

#### Subscription Management
- **Subscribe Profile** - Subscribe a profile to email or SMS marketing
- **Unsubscribe Profile** - Unsubscribe a profile from email or SMS marketing

#### Other
- **Find Tag by Name** - Search for tags in your Klaviyo account

### Triggers

- **New Profile** - Triggers when a new profile is created in Klaviyo (polling-based)
- **Profile Added to List** - Triggers when a profile is added to a specific list (polling-based)

## API Version

This piece uses Klaviyo API revision `2024-10-15`.

## Resources

- [Klaviyo API Documentation](https://developers.klaviyo.com/en/reference)
- [Klaviyo Developer Portal](https://developers.klaviyo.com/)

## Support

For issues or feature requests, please open an issue in the Activepieces repository.
