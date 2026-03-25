# pCloud for ActivePieces

Automate file and folder operations on pCloud — trigger workflows on new uploads, search, upload, download, copy, and organize your files.

## Authentication

Connect via OAuth2. You'll need a pCloud app with the following redirect URI:

```
https://cloud.activepieces.com/redirect/integrations/pcloud
```

Register your app at [my.pcloud.com](https://my.pcloud.com).

## Triggers

### New File Uploaded
Polls a folder for new files. Use folder ID `0` for root.

### Folder Created
Polls a folder for new subfolders. Use folder ID `0` for root.

## Actions

### Upload File
Upload a file to a folder. Supports overwrite.

### Download File
Download a file by ID and get its content + metadata.

### Create Folder
Create a new folder inside an existing folder.

### Copy File
Copy a file to another folder with optional overwrite.

### List Folder
List contents of a folder with optional recursive scanning.

### Find File
Search for files by name within a folder or globally.

### Find Folder
Search for folders by name within a folder or globally.

### Get File Info
Get metadata for a specific file.

### Delete File
Delete a file by ID.

## Building

```bash
npm install
turbo run build --filter=@activepieces/piece-pcloud
```
