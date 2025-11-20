# Klaviyo Piece

This piece integrates Klaviyo, a powerful email marketing and automation platform for ecommerce, with Activepieces.

## Authentication

To use this piece, you need a Klaviyo Private API Key:

1. Log in to your Klaviyo account at https://www.klaviyo.com/login
2. Click on your account name in the bottom-left corner
3. Navigate to **Settings** > **API Keys**
4. Under **Private API Keys**, click **Create Private API Key**
5. Give your key a descriptive name (e.g., "Activepieces Integration")
6. Set the appropriate permissions (Full Access recommended for all features)
7. Click **Create** and copy the API key

**Note:** You can create a free test account at https://www.klaviyo.com/signup to try this integration.

## Features

### Triggers

- **New Profile**: Triggers when a new profile is created in Klaviyo
- **Profile Added to List**: Triggers when a profile is added to a specific list

### Actions

#### Search Actions
- **Find Profile**: Search for a profile by email or phone number
- **Find List**: Search for a list by name
- **Find Tag**: Search for a tag by name

#### Write Actions
- **Create Profile**: Create a new customer profile with email, phone, and custom attributes
- **Update Profile**: Update an existing profile's information
- **Subscribe Profile**: Subscribe a profile to email or SMS marketing for a specific list
- **Unsubscribe Profile**: Unsubscribe a profile from email or SMS marketing
- **Add Profile to List**: Add one or more profiles to a list
- **Remove Profile from List**: Remove one or more profiles from a list
- **Create List**: Create a new list in Klaviyo

## API Reference

This piece uses the Klaviyo REST API (revision 2024-10-15). For more information, visit:
https://developers.klaviyo.com/en/reference/api_overview

## Requirements

- Klaviyo account (free or paid)
- Private API Key with appropriate permissions

## Support

For issues or questions:
- GitHub: https://github.com/activepieces/activepieces
- Discord: https://discord.gg/activepieces

## Contributing

This is a community piece. Contributions are welcome! Please submit pull requests to the main Activepieces repository.

## License

This piece is part of the Activepieces project and follows the same license.

