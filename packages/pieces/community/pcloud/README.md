# pCloud Piece for Activepieces

This piece integrates pCloud cloud storage with Activepieces, allowing you to automate file management workflows.

## Features

### Triggers

| Trigger | Description |
|---------|-------------|
| **New File Uploaded** | Fires when a new file appears in the specified folder (or any folder if none selected). Uses polling every 5 minutes. |
| **New Folder Created** | Fires when a new folder is created inside the specified folder (or anywhere in pCloud). Uses polling every 5 minutes. |

### Actions

| Action | Description |
|--------|-------------|
| **Upload File** | Upload a file to a pCloud folder. Supports rename-if-exists conflict resolution. |
| **Create Folder** | Create a new folder inside any existing folder. |
| **Download File Content** | Retrieve a file's content by File ID or path. Returns base64-encoded data plus a direct download URL. |
| **Copy File** | Duplicate a file to another folder, optionally with a new filename. |
| **Find File/Folder** | Search for files and/or folders by name (case-insensitive, partial match) within a folder tree. |

## Authentication

This piece uses **OAuth 2.0**. To set it up:

1. Go to [https://docs.pcloud.com/my_apps/](https://docs.pcloud.com/my_apps/) and create a new application.
2. Set the **Redirect URI** to the one shown in Activepieces when connecting pCloud.
3. Copy your **Client ID** and **Client Secret** into the Activepieces connection dialog.

> **Note on regions**: pCloud operates two separate API endpoints — `api.pcloud.com` for US-hosted accounts and `eapi.pcloud.com` for EU-hosted accounts. This piece automatically detects the correct endpoint from the OAuth2 token response (`locationid` field) and routes all API calls accordingly.

## Folder Selector

All folder fields in this piece show a real-time dropdown populated from your pCloud account. The root folder is represented as `/ (Root)` with folder ID `0`.

## Development

```bash
npm install
npm run build
```

## Contributing

This piece was contributed to the Activepieces community. Pull requests and issue reports are welcome.
