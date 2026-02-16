# Klaviyo Piece for Activepieces

This piece provides integration with Klaviyo's API for marketing automation and customer data management.

## Features

### Authentication
- API Key authentication using Klaviyo Private API Key
- Automatic validation of credentials

### Actions

#### Profile Management
1. **Create Profile** - Create a new profile with email, phone, and custom properties
2. **Update Profile** - Update an existing profile's information
3. **Find Profile** - Search for profiles by email or phone number

#### List Management
4. **Subscribe Profile to List** - Subscribe one or more profiles to a list
5. **Unsubscribe Profile from List** - Unsubscribe profiles from a list
6. **Add Profile to List** - Add profiles to a list by profile ID
7. **Remove Profile from List** - Remove profiles from a list by profile ID
8. **Create List** - Create a new list in Klaviyo
9. **Find List by Name** - Search for lists by name

#### Tags
10. **Find Tag by Name** - Search for tags by name

### Triggers

1. **New Profile** - Triggers when a new profile is created (polling)
2. **Profile Added to List** - Triggers when a profile is added to a specific list (polling)

## API Details

- **Base URL**: `https://a.klaviyo.com/api`
- **API Revision**: `2025-01-15`
- **Content Type**: `application/vnd.api+json`
- All requests follow JSON:API specification

## Setup

1. Get your Klaviyo Private API Key from your Klaviyo account settings
2. Add the API key to your Activepieces connection
3. Start using the actions and triggers

## Notes

- All API requests include the required `revision` header
- Requests and responses follow JSON:API format
- Phone numbers should be in E.164 format for best results
- Profile creation requires either email or phone number
- Bulk operations (subscribe/unsubscribe) support multiple profiles at once
- Triggers use polling strategy with cursor-based pagination for efficiency

## Author

Built by St34lthcole for Activepieces bounty #8284
