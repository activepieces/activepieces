# pCloud Piece for Activepieces

## Overview

This piece integrates [pCloud](https://www.pcloud.com/) with Activepieces, enabling automation of file storage, sharing, and management workflows.

## Features

### Actions

| Action | Description |
|--------|-------------|
| **List Folder** | List all files and folders in a pCloud folder |
| **Create Folder** | Create a new folder in pCloud |
| **Upload File** | Upload a file to pCloud |
| **Get Download Link** | Get a download link for a file |
| **Delete File** | Delete a file from pCloud |
| **Copy File** | Copy a file to another folder |

### Triggers

| Trigger | Description |
|---------|-------------|
| **New File** | Triggers when a new file is added to a folder |
| **New Folder** | Triggers when a new folder is created |

## Authentication

This piece uses pCloud OAuth2 access token authentication.

### Getting Your Access Token

1. Visit https://docs.pcloud.com/my_apps/ and create a new app
2. Set the redirect URI to `https://activepieces.com/oauth/callback`
3. Use the OAuth2 flow to obtain an access token
4. Paste the access token into the authentication field

## API Endpoints

- US Data Center: `https://api.pcloud.com`
- EU Data Center: `https://eapi.pcloud.com`

The correct endpoint is automatically determined during the OAuth flow.

## Common Use Cases

- **Backup Automation**: Automatically upload important files to pCloud
- **File Synchronization**: Sync files between different cloud storage services
- **Workflow Automation**: Trigger workflows when new files are uploaded
- **Content Distribution**: Automatically share files via pCloud links

## Resources

- [pCloud API Documentation](https://docs.pcloud.com/)
- [Activepieces Documentation](https://www.activepieces.com/docs)

## License

MIT License - see LICENSE file for details

## Authors

- ktwo
