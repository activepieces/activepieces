# Respond.io Piece

This piece integrates with Respond.io, a business messaging platform that enables automated conversations and customer engagement across SMS, WhatsApp, Messenger, and more.

## Features

### Actions
- **Create Contact** - Create a new contact record
- **Find Contact** - Search for a contact by email, phone, or ID
- **Create or Update Contact** - Upsert contact by email/phone or ID
- **Delete Contact** - Permanently delete a contact
- **Add Tag to Contact** - Assign a tag or multiple tags to a contact
- **Assign or Unassign Conversation** - Change the assignee on a conversation
- **Add Comment to Conversation** - Append an internal note to a conversation
- **Open Conversation** - Mark a conversation as open

### Triggers
- **New Incoming Message** - Fires when a new message is received on any channel
- **New Outgoing Message** - Fires when a message is sent from Respond.io
- **Conversation Opened** - Fires when a new conversation is opened
- **Conversation Closed** - Fires when a conversation is closed
- **New Contact** - Fires when a contact is created
- **Contact Updated** - Fires when any contact field is updated
- **Contact Tag Updated** - Fires when tags are added or removed on a contact

## Setup

1. Go to https://respond.io/
2. Sign up for a free trial account
3. Navigate to Settings > API
4. Generate an API key
5. Copy your Workspace ID from the URL or settings
6. Use these credentials in the Activepieces Respond.io piece

## Authentication

The piece uses API Key authentication with the following required fields:
- **API Key** - Your Respond.io API key
- **Workspace ID** - Your Respond.io workspace ID

## API Reference

For detailed API documentation, visit the [Respond.io API Documentation](https://respond.io/).

## Support

For support with this piece, please join the [Activepieces Discord community](https://discord.gg/2jUXBKDdP8). 