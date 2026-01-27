# EmailIt Piece for Activepieces

This piece integrates EmailIt's transactional email service (API v2) with Activepieces.

## Features

- Send HTML or plain text emails through EmailIt API v2
- Simple API key authentication
- Customizable sender information
- Support for multiple recipients (TO, CC, BCC)
- Reply-to header support
- Open and click tracking options
- Custom API call action for advanced use cases

## Configuration

1. Get your API key from [EmailIt App](https://app.emailit.com/)
2. Add the EmailIt piece to your flow
3. Configure the required fields:
   - **API Key**: Your EmailIt API key
   - **Sender Name**: Display name for the sender
   - **Sender Email**: Sender email address
   - **To**: Recipient email addresses (array, up to 50 total)
   - **Subject**: Email subject line
   - **Content Type**: Plain text or HTML
   - **Content**: Email body content

4. Optional fields:
   - **CC**: Carbon copy recipients
   - **BCC**: Blind carbon copy recipients
   - **Reply-To**: Alternative reply address
   - **Track Opens**: Enable open tracking
   - **Track Clicks**: Enable click tracking

## API Documentation

For more information about EmailIt's API, visit [EmailIt Documentation](https://emailit.com/docs/api-reference)
