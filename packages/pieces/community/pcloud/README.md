# pCloud Piece for Activepieces

A community piece that enables pCloud cloud storage integration with Activepieces.

## Features

### Authentication
- OAuth 2.0 authentication with pCloud
- Supports both US and EU data centers

### Actions

| Action | Description |
|--------|-------------|
| **Upload File** | Upload a file to a pCloud folder |
| **Download File** | Download a file from pCloud |
| **List Folder** | List contents of a folder (with recursive option) |
| **Create Folder** | Create a new folder |
| **Delete File** | Delete a file |
| **Delete Folder** | Delete a folder (with recursive option) |
| **Copy File** | Copy a file to another folder |
| **Move File** | Move/rename a file |
| **Get File Link** | Get a download link for a file |
| **Custom API Call** | Make custom API calls to pCloud |

## Setup

1. Create a pCloud developer account at https://docs.pcloud.com/my_apps/
2. Create a new application
3. Add your redirect URI
4. Use your Client ID and Client Secret in Activepieces

## API Reference

This piece uses the [pCloud API](https://docs.pcloud.com/). Key endpoints:

- `uploadfile` - Upload files
- `listfolder` - Browse directories
- `createfolder` - Create directories
- `deletefile` / `deletefolderrecursive` - Remove items
- `copyfile` / `renamefile` - Copy/move operations
- `getfilelink` - Generate download links

## Notes

- Folder ID 0 represents the root folder
- pCloud access tokens do not expire
- API supports both US (`api.pcloud.com`) and EU (`eapi.pcloud.com`) endpoints
