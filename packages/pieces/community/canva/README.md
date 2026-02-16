# Canva Piece for Activepieces

This piece integrates Canva's REST API with Activepieces, enabling automation of design workflows.

## Features

### Authentication
- OAuth2 authentication with full scope support
- Secure token management

### Actions

#### Write Actions
1. **Upload Asset** - Upload images, videos, and other assets to Canva
   - Supports multipart form data upload
   - Optional tagging for organization

2. **Create Design** - Create new designs (documents, whiteboards, presentations)
   - Support for all design types
   - Optional title configuration

3. **Import Design** - Import designs from external URLs
   - Async job with optional polling
   - Supports PDF, images, and other formats

4. **Export Design** - Export designs to various formats
   - Formats: PDF, PNG, JPG, Video, GIF, PPTX
   - Quality settings (low, medium, high)
   - Async job with automatic polling
   - Page selection support

5. **Move Design to Folder** - Organize designs in folders
   - Move designs between folders
   - Folder hierarchy support

#### Search Actions
6. **Find Design** - Search for designs by title or query
   - Flexible search with query parameters
   - Pagination support
   - Configurable result limits

#### Read Actions
7. **Get Folder** - Retrieve folder details and contents
   - Full folder metadata
   - Nested item information

8. **Get Image** - Get details of uploaded image assets
   - Asset metadata
   - Tag information

### Custom API Call
- Built-in custom API call action for advanced use cases
- Automatic authentication handling

## API Reference

This piece implements the Canva REST API v1:
- Base URL: `https://api.canva.com/rest/v1`
- Documentation: https://www.canva.dev/docs/connect/

## Technical Implementation

### Async Operations
The Export Design and Import Design actions handle Canva's async job pattern:
1. POST request creates a job
2. Automatic polling checks job status
3. Returns result when complete or provides job ID for manual polling

### File Upload
The Upload Asset action uses multipart form data for efficient file uploads.

### Error Handling
- Comprehensive error messages
- Timeout protection for long-running jobs
- Validation of required parameters

## Requirements

- Canva account with API access
- OAuth2 client credentials
- Activepieces version 0.36.1 or higher

## Scopes

The piece requires the following OAuth2 scopes:
- `design:content:read` - Read design content
- `design:content:write` - Create and modify designs
- `design:meta:read` - Read design metadata
- `asset:read` - Read uploaded assets
- `asset:write` - Upload new assets
- `folder:read` - Read folder information
- `folder:write` - Organize items in folders

## Author

St34lthcole - Built for Activepieces bounty #8135
