# Klaviyo Piece - Testing Guide

This guide will help you test the Klaviyo piece before submitting your pull request.

## Prerequisites

1. **Klaviyo Account**: Create a free account at https://www.klaviyo.com/signup
2. **API Key**: Get your Private API Key from Settings > API Keys
3. **Activepieces Development Environment**: Set up as per the main repository instructions

## Setup for Testing

### 1. Install Dependencies

```bash
npm install
```

### 2. Build the Piece

```bash
npx nx build @activepieces/piece-klaviyo
```

### 3. Run Activepieces in Development Mode

```bash
npm run start:dev
```

## Testing Checklist

### Authentication ✅
- [ ] Test with valid API key - should authenticate successfully
- [ ] Test with invalid API key - should show error message
- [ ] Test with empty API key - should show validation error

### Actions to Test

#### Search Actions
- [ ] **Find Profile by Email**
  - Create a test profile in Klaviyo first
  - Use the Find Profile action with the email
  - Verify it returns the correct profile

- [ ] **Find Profile by Phone**
  - Use a profile with a phone number
  - Search by phone number
  - Verify the result

- [ ] **Find List**
  - Create a test list in Klaviyo
  - Search for it by name
  - Verify it's found

- [ ] **Find Tag**
  - Create a tag in Klaviyo
  - Search for it
  - Verify the result

#### Write Actions
- [ ] **Create Profile**
  - Test with email only
  - Test with phone only
  - Test with all fields (name, location, properties)
  - Verify profile is created in Klaviyo

- [ ] **Update Profile**
  - Get a profile ID from Find Profile
  - Update various fields
  - Verify changes in Klaviyo

- [ ] **Subscribe Profile**
  - Test email subscription
  - Test SMS subscription
  - Verify subscription status in Klaviyo

- [ ] **Unsubscribe Profile**
  - Test email unsubscription
  - Test SMS unsubscription
  - Verify status in Klaviyo

- [ ] **Add Profile to List**
  - Add single profile
  - Add multiple profiles
  - Verify in Klaviyo list

- [ ] **Remove Profile from List**
  - Remove profiles
  - Verify removal in Klaviyo

- [ ] **Create List**
  - Create a new list
  - Verify it appears in Klaviyo

### Triggers to Test

- [ ] **New Profile Trigger**
  - Set up the trigger
  - Create a new profile in Klaviyo
  - Wait for polling interval
  - Verify trigger fires with new profile data

- [ ] **Profile Added to List Trigger**
  - Set up trigger for a specific list
  - Add a profile to that list in Klaviyo
  - Wait for polling interval
  - Verify trigger fires

## Common Issues and Solutions

### Issue: "Invalid API Key"
- **Solution**: Make sure you're using a Private API Key, not a Public API Key
- **Solution**: Check that the key hasn't been revoked in Klaviyo

### Issue: "Profile not found"
- **Solution**: Wait a few seconds after creating a profile before searching
- **Solution**: Verify the email/phone format is correct

### Issue: Phone number format errors
- **Solution**: Use E.164 format (e.g., +12345678900)

### Issue: Triggers not firing
- **Solution**: Polling triggers have a default interval (usually 5 minutes)
- **Solution**: Check the logs for any API errors

## Test Data Examples

### Valid Email Formats
```
test@example.com
user+tag@domain.co.uk
```

### Valid Phone Formats (E.164)
```
+12345678900
+442071234567
+61412345678
```

### Sample Custom Properties
```json
{
  "favorite_color": "blue",
  "account_type": "premium",
  "signup_date": "2024-01-01"
}
```

## Performance Testing

- [ ] Test with large profile lists (100+ profiles)
- [ ] Test rapid successive API calls
- [ ] Monitor rate limits (Klaviyo has rate limiting)

## Integration Testing

Create a test flow that:
1. Creates a new profile
2. Finds that profile
3. Updates the profile
4. Adds it to a list
5. Subscribes it
6. Verifies all steps succeeded

## Reporting Issues

If you find any issues during testing:
1. Check the browser console for errors
2. Check the Activepieces backend logs
3. Verify your Klaviyo account has the necessary permissions
4. Document the exact steps to reproduce
5. Include error messages and logs

## Ready to Submit?

Once all tests pass:
1. Commit your changes
2. Push to your fork
3. Create a pull request to activepieces/activepieces
4. Reference issue #8284 in your PR description
5. Include test results and screenshots if possible

## Contact

For questions or help:
- GitHub Issue: #8284
- Discord: https://discord.gg/activepieces

