# Amazon SES v2 Piece

This piece provides integration with Amazon Simple Email Service (SES) v2 API.

## Features

### Actions

1. **Send Email** - Send individual emails with HTML and/or text content
2. **Send Templated Email** - Send emails using SES templates
3. **Get Sending Statistics** - Retrieve email sending statistics and account status

### Authentication

Uses AWS credentials authentication with the following fields:
- Access Key ID
- Secret Access Key
- Region
- Endpoint (optional - for SES-compatible services)

## Setup

1. Create AWS IAM user with SES permissions
2. Generate Access Key ID and Secret Access Key
3. Configure the piece with your credentials
4. Verify your email addresses in SES console before sending

## Permissions Required

The IAM user needs the following SES permissions:
- `ses:SendEmail`
- `ses:SendTemplatedEmail`
- `ses:GetSendStatistics`
- `ses:GetAccountSendingEnabled`

## Example Usage

### Send Simple Email
```javascript
{
  "fromAddress": "sender@example.com",
  "toAddresses": ["recipient@example.com"],
  "subject": "Hello World",
  "htmlBody": "<h1>Hello</h1><p>This is a test email.</p>",
  "textBody": "Hello\n\nThis is a test email."
}
```

### Send Templated Email
```javascript
{
  "fromAddress": "sender@example.com",
  "toAddresses": ["recipient@example.com"],
  "templateName": "MyTemplate",
  "templateData": {
    "name": "John Doe",
    "product": "Awesome Product"
  }
}
```

## Supported Regions

All AWS regions where SES is available, including:
- us-east-1 (N. Virginia)
- us-west-2 (Oregon)
- eu-west-1 (Ireland)
- And many more...

## Notes

- Email addresses must be verified in SES before sending (unless in production mode)
- SES has sending limits that can be increased by contacting AWS support
- This piece uses SES v2 API which provides enhanced functionality over v1
