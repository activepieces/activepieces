# Google Chat Piece

This piece integrates with Google Chat API to enable automation of messaging, space management, and conversation interactions.

## Features

### Actions

- **Send a Message**: Send messages to Google Chat spaces
- **Get Direct Message Details**: Retrieve details of specific direct messages
- **Add a Space Member**: Add users to Google Chat spaces
- **Get Message**: Retrieve details of any message
- **Search Messages**: Search for messages using keywords or filters
- **Find Member**: Search for space members by email

### Triggers

- **New Message**: Fires when a new message is received in Google Chat
- **New Mention**: Fires when a new mention is received in a space

## Authentication

This piece uses OAuth2 authentication with the following scopes:
- `https://www.googleapis.com/auth/chat.bot`
- `https://www.googleapis.com/auth/chat.messages`
- `https://www.googleapis.com/auth/chat.spaces`
- `https://www.googleapis.com/auth/chat.messages.readonly`
- `https://www.googleapis.com/auth/chat.spaces.readonly`

## API Reference

This piece is based on the [Google Chat API](https://developers.google.com/workspace/chat/api/reference/rest) and provides access to:

- Spaces management
- Message creation and retrieval
- Member management
- Message search functionality
- Webhook-based triggers

## Usage Examples

### Send a Message
Send a message to a specific space with optional thread support.

### Search Messages
Search for messages containing specific keywords or phrases.

### Monitor New Messages
Set up triggers to automatically respond to new messages in spaces.

### Manage Space Members
Add new members to spaces with specific roles (Member/Admin).

## Development

This piece follows the Activepieces architecture and can be extended with additional actions and triggers as needed.
