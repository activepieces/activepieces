# EmailIt Piece for Activepieces

This piece integrates EmailIt's transactional email service with Activepieces.

## Features

- Send HTML emails through EmailIt API
- Simple API key authentication
- Customizable sender information
- Reply-to header support
- Error handling and validation

## Installation

### From npm Registry
```bash
npm install dennisklappe-piece-emailit
```

### In Activepieces Cloud
1. Go to Settings → My Pieces → Install Piece
2. Enter package name: `dennisklappe-piece-emailit`
3. Click Install

## Configuration

1. Get your API key from [EmailIt App](https://app.emailit.com/)
2. Add the EmailIt piece to your flow
3. Configure the required fields:
   - **API Key**: Your EmailIt API key
   - **From Name**: Sender display name
   - **From Email**: Sender email address
   - **To Email**: Recipient email address
   - **Subject**: Email subject line
   - **Body**: Email content (HTML supported)
   - **Reply-To Email** (optional): Alternative reply address

## Development

```bash
# Install dependencies
npm install

# Build the piece
npm run build

# Publish to npm
npm run publish-piece
```

## API Documentation

For more information about EmailIt's API, visit [EmailIt Documentation](https://docs.emailit.com)