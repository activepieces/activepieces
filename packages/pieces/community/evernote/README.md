# Evernote Piece

This piece integrates with Evernote, allowing you to automate note-taking and organization workflows using developer tokens.

## Features

### Triggers
- **New Note**: Triggers when a new note is created
- **New Notebook**: Triggers when a new notebook is created  
- **New Tag Added to Note**: Triggers when a tag is added to a note

### Actions
- **Create Note**: Create new notes in specified notebooks
- **Update Note**: Modify existing notes
- **Append to Note**: Add content to existing notes
- **Create Notebook**: Create new notebooks
- **Create Tag**: Create new tags
- **Find Note**: Search for notes with filters
- **Find Tag**: Search for existing tags

## Authentication

This piece uses **Developer Token authentication**. To set up:

1. Visit the [Evernote Developer Portal](https://dev.evernote.com/)
2. Log in or create an account
3. Go to "Get an API Key" section
4. Request a developer token for your application
5. Copy the token and paste it here

**Note**: Developer tokens are long-lived and don't expire unless revoked. They provide direct API access without OAuth complexity.

## Use Cases

- Automatically create project notebooks when new projects are created
- Turn new notes into tasks or tickets
- Publish tagged notes to CMS queues
- Maintain daily standup notes by appending updates
- Mirror labels and tags from other systems
- Trigger workflows based on note creation, notebook changes, or tag additions

## Technical Details

- **Authentication**: Developer Token (direct API access)
- **API**: Thrift-based API integration via Evernote SDK
- **Error Handling**: Comprehensive error handling with proper fallbacks
- **Type Safety**: Full TypeScript support with proper interfaces
- **SDK**: Uses official Evernote Node.js SDK for reliable API access
