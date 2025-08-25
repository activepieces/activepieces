# Evernote Piece

This piece integrates with Evernote, allowing you to automate note-taking and organization workflows.

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

This piece uses OAuth2 authentication. To set up:

1. Visit the [Evernote Developer Portal](https://dev.evernote.com/)
2. Create a new application
3. Configure OAuth settings with redirect URI: `https://cloud.activepieces.com/redirect`
4. Use your Consumer Key and Consumer Secret

## Use Cases

- Automatically create project notebooks when new projects are created
- Turn new notes into tasks or tickets
- Publish tagged notes to CMS queues
- Maintain daily standup notes by appending updates
- Mirror labels and tags from other systems
