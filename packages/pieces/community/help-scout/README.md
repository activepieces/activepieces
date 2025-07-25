# Help Scout Integration for Activepieces

This is a comprehensive Help Scout integration for Activepieces that provides automation capabilities for customer support workflows.

## Features

### Triggers
- **Conversation Created**: Fires when a new conversation is started in a mailbox
- **Conversation Assigned**: Fires when a conversation is assigned to a user
- **Tags Updated**: Fires when tags on a conversation are modified
- **New Customer**: Fires when a new customer is added in Help Scout

### Write Actions
- **Create Conversation**: Start a new conversation with optional tags, fields, and auto-reply options
- **Send Reply**: Send a message in an existing conversation (supports draft mode)
- **Add Note**: Add an internal note to a conversation
- **Create Customer**: Add a new customer with full profile details
- **Update Customer Properties**: Modify fields and custom attributes for an existing customer

### Search Actions
- **Find Conversation**: Locate a conversation by subject, mailbox, tags, or customer
- **Find Customer**: Search for a customer by email
- **Find User**: Find a Help Scout user by email

### Custom API Call
- **Custom API Call**: Make custom API calls to the Help Scout API

## Authentication

This integration uses Help Scout's API Key authentication. To get your API credentials:

1. Log in to your Help Scout account
2. Go to **Manage > Company > Apps**
3. Click **Create My App**
4. Fill in the app details and save
5. Copy your **App ID** and **App Secret**
6. Generate an API Key by going to **Manage > API Keys**
7. Click **Generate API Key** and copy the generated key

## API Reference

Based on the [Help Scout REST API v2](https://developer.helpscout.com/) documentation.

## Test Account

You can test Help Scout APIs by signing up for a Standard Plan Free Trial at [Help Scout](https://www.helpscout.com/).

## Usage Examples

### Workflow Ideas

1. **Auto-assign urgent conversations**: Use the "Conversation Created" trigger to automatically assign conversations with "urgent" tags to specific agents
2. **Customer onboarding**: Use the "New Customer" trigger to send welcome emails and create tasks in other systems
3. **Escalation workflows**: Use the "Tags Updated" trigger to escalate conversations when specific tags are added
4. **Follow-up automation**: Use the "Send Reply" action to send automated follow-up messages based on conversation status

### Common Use Cases

- **Support ticket management**: Create conversations from external forms or systems
- **Customer data synchronization**: Sync customer information between Help Scout and CRM systems
- **Automated responses**: Send templated replies based on conversation content or tags
- **Performance tracking**: Monitor conversation assignment patterns and response times

## Development

This piece follows the Activepieces piece development guidelines and is written in TypeScript.

## Support

For issues and questions, please refer to the [Activepieces documentation](https://docs.activepieces.com/) or create an issue in the repository.