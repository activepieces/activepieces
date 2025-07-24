# Podio

Podio is a collaborative work platform that helps teams organize work the way they want. This integration allows you to automate your Podio workflows with Activepieces.

## Configuration

To use this piece, you'll need to set up OAuth2 authentication:

1. Log in to your Podio Developer account at https://developers.podio.com/
2. Create a new App by clicking "Create new app"
3. Fill in the app details and set the redirect URL to match your integration
4. Copy the Client ID and Client Secret
5. Use the OAuth2 flow to get an access token for API calls

For more information, visit: https://developers.podio.com/authentication

## Triggers

### New Item
Triggers when a new item is created in a Podio app.

### New Task
Triggers when a new task is created in Podio.

### New Activity
Triggers when a new activity occurs in Podio.

### Item Updated
Triggers when an item is updated in a Podio app.

### New Organization
Triggers when a new organization is created in Podio.

### New Workspace
Triggers when a new workspace is created in Podio.

## Actions

### Create Item
Creates a new item in a Podio app with custom fields.

### Update Item
Updates an existing item in Podio.

### Find Item
Searches for items in a Podio app.

### Create Task
Creates a new task in Podio.

### Update Task
Updates an existing task in Podio.

### Find Task
Searches for tasks in Podio.

### Attach File
Attaches a file to an item, task, or other object in Podio.

### Create Comment
Creates a comment on an item, task, or other object in Podio.

### Create Status Update
Creates a status update in Podio.

## API Documentation

For more information about the Podio API, visit:
- [Podio API Documentation](https://developers.podio.com/doc)
- [Authentication Guide](https://developers.podio.com/authentication)
- [Items API](https://developers.podio.com/doc/items)
- [Tasks API](https://developers.podio.com/doc/tasks)

## Support

This integration supports Podio's core functionality including:
- Items management (CRUD operations)
- Tasks management (CRUD operations)
- File attachments
- Comments and status updates
- Organization and workspace management
- Activity tracking

All triggers use polling strategy to check for new data at regular intervals.