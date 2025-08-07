# Microsoft OneNote Piece

This piece provides integration with Microsoft OneNote, allowing you to create notes, pages, sections, and notebooks programmatically using the Microsoft Graph API.

## Features

### Actions
- **Create Notebook** - Creates a new OneNote notebook
- **Create Section** - Creates a new section in a notebook
- **Create Page** - Creates a new page with HTML content
- **Create Image Page** - Creates a page with an embedded image
- **Append Note** - Appends content to existing notes (placeholder implementation)

### Triggers
- **New Note in Section** - Polling trigger to detect new notes in a section

## Authentication

This piece uses Microsoft Graph API authentication with OAuth2 access tokens.

### Setup Instructions

1. **Azure App Registration**
   - Go to the [Azure Portal](https://portal.azure.com)
   - Navigate to Azure Active Directory > App registrations
   - Create a new app registration or use an existing one

2. **API Permissions**
   - Under "API permissions", add the following permissions:
     - `Notes.ReadWrite` (for creating and reading notes)
     - `Notes.Create` (for creating notes only)

3. **Generate Access Token**
   - Generate a client secret under "Certificates & secrets"
   - Use the client credentials flow to obtain an access token
   - The access token should be provided in the piece configuration

## API Reference

This piece is based on the Microsoft Graph API for OneNote:
- [Create page in section](https://learn.microsoft.com/en-us/graph/api/section-post-pages?view=graph-rest-1.0&tabs=http)
- [OneNote API Overview](https://learn.microsoft.com/en-us/graph/api/resources/onenote-api-overview?view=graph-rest-1.0)

## Usage Examples

### Creating a Notebook
```typescript
// Creates a new notebook with the specified name
const notebook = await client.createNotebook({ displayName: "My Notebook" });
```

### Creating a Section
```typescript
// Creates a new section in a notebook
const section = await client.createSection(notebookId, { displayName: "My Section" });
```

### Creating a Page
```typescript
// Creates a new page with HTML content
const page = await client.createPage(sectionId, {
  title: "My Page",
  content: "<h1>Hello World</h1><p>This is my first page.</p>"
});
```

### Creating an Image Page
```typescript
// Creates a page with an embedded image
const imagePage = await client.createImagePage(sectionId, "Image Page", "https://example.com/image.jpg");
```

## Error Handling

The piece includes comprehensive error handling for API responses:
- HTTP status code validation
- Descriptive error messages
- Graceful failure handling

## Development

This piece follows the Activepieces architecture and is built using TypeScript. All actions and triggers are properly typed and include comprehensive error handling.

## Dependencies

- `@activepieces/pieces-framework` - Core framework
- `@activepieces/pieces-common` - Common utilities
- `@activepieces/shared` - Shared types
- `tslib` - TypeScript runtime helpers 