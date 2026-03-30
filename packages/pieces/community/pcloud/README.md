# pCloud Piece for Activepieces

This piece provides integration with pCloud cloud storage service.

## Actions

- **Upload File** - Upload a file to pCloud
- **Download File** - Download a file from pCloud
- **Delete File** - Delete a file from pCloud
- **List Files** - List files in a folder
- **Create Folder** - Create a new folder
- **Copy File** - Copy a file to another location
- **Get File Info** - Get file metadata
- **Create Share Link** - Create a public share link for a file

## Triggers

- **New File Uploaded** - Triggered when a new file is uploaded to a folder
- **Folder Created** - Triggered when a new folder is created

## Authentication

This piece uses OAuth2 authentication. You'll need to:

1. Create a pCloud developer account at https://docs.pcloud.com/
2. Register your application to get client credentials
3. Use the OAuth2 flow to authenticate

## Building

Run `turbo run build --filter=@activepieces/piece-pcloud` to build the library.
