# Evernote Piece

This piece provides integration with Evernote, allowing you to create, update, and manage notes, tags, and notebooks programmatically.

## Authentication

The Evernote piece uses OAuth2 authentication. You'll need to:

1. Set up OAuth2 credentials in your Evernote developer account
2. Configure the OAuth2 flow in ActivePieces
3. Grant the necessary permissions to create, update, and manage notes, tags, and notebooks

## Actions

### Create Note

Creates a new note in Evernote with the specified content and metadata.

**Properties:**
- **Title** (required): The title of the note
- **Content** (required): The content of the note in ENML format (HTML-like markup)
- **Notebook GUID** (optional): The GUID of the notebook where the note should be created
- **Tag Names** (optional): List of tag names to apply to the note
- **Source** (optional): The source application that created the note
- **Source URL** (optional): The URL where the note was originally found

**Example Usage:**
```typescript
// Create a simple note
{
  title: "Meeting Notes",
  content: "<en-note><h1>Meeting Notes</h1><p>Discussion points...</p></en-note>"
}

// Create a note with tags and notebook
{
  title: "Project Ideas",
  content: "<en-note><h1>Project Ideas</h1><ul><li>Web app</li><li>Mobile app</li></ul></en-note>",
  notebookGuid: "your-notebook-guid",
  tagNames: ["ideas", "projects"]
}
```

### Update Note

Updates an existing note in Evernote with new content and metadata. Only the fields you want to change need to be specified.

**Properties:**
- **Note GUID** (required): The GUID of the note to update
- **Title** (required): The new title for the note
- **Content** (optional): The new content for the note in ENML format (leave empty to keep existing content)
- **Notebook GUID** (optional): The GUID of the notebook to move the note to
- **Tag Names** (optional): List of tag names to apply to the note (leave empty to keep existing tags)
- **Source** (optional): The source application that updated the note
- **Source URL** (optional): The URL where the note was originally found
- **Active** (optional): Whether the note should be active

**Example Usage:**
```typescript
// Update just the title
{
  noteGuid: "existing-note-guid",
  title: "Updated Meeting Notes"
}

// Update content and tags
{
  noteGuid: "existing-note-guid",
  title: "Enhanced Project Ideas",
  content: "<en-note><h1>Enhanced Project Ideas</h1><ul><li>Web app v2</li><li>Mobile app v2</li><li>AI integration</li></ul></en-note>",
  tagNames: ["ideas", "projects", "enhanced"]
}

// Move note to different notebook
{
  noteGuid: "existing-note-guid",
  title: "Current Title",
  notebookGuid: "new-notebook-guid"
}
```

### Create Tag

Creates a new tag in Evernote that can be used to organize notes.

**Properties:**
- **Tag Name** (required): The name of the tag to create
- **Parent Tag GUID** (optional): The GUID of the parent tag for hierarchical organization

**Example Usage:**
```typescript
// Create a simple tag
{
  name: "work"
}

// Create a nested tag
{
  name: "urgent",
  parentGuid: "work-tag-guid"
}
```

### Create Notebook

Creates a new notebook in Evernote for organizing notes.

**Properties:**
- **Notebook Name** (required): The name of the notebook to create
- **Stack** (optional): The stack name to organize notebooks
- **Active** (optional): Whether the notebook should be active (default: true)
- **Default Notebook** (optional): Whether this should be the default notebook
- **Publishing URI** (optional): The URI for publishing the notebook
- **Public Description** (optional): Public description for the published notebook

**Example Usage:**
```typescript
// Create a simple notebook
{
  name: "Work Projects"
}

// Create a notebook with stack and publishing
{
  name: "Public Blog",
  stack: "Writing",
  publishingUri: "https://myblog.com/evernote",
  publicDescription: "My public notes and thoughts"
}

// Create a default notebook
{
  name: "Quick Notes",
  defaultNotebook: true
}
```

## ENML Content Format

Evernote uses ENML (Evernote Markup Language) for note content. This is similar to HTML but with Evernote-specific elements:

- `<en-note>`: Root element for note content
- `<h1>`, `<h2>`, `<h3>`: Headings
- `<p>`: Paragraphs
- `<ul>`, `<ol>`, `<li>`: Lists
- `<strong>`, `<em>`: Text formatting
- `<a href="...">`: Links
- `<img src="...">`: Images

## API Reference

The piece implements the following Evernote API methods:
- `NoteStore.createNote`: Creates a new note
- `NoteStore.updateNote`: Updates an existing note
- `NoteStore.createTag`: Creates a new tag
- `NoteStore.createNotebook`: Creates a new notebook

## Error Handling

The piece handles various Evernote API errors including:
- Invalid data format (name length, content validation)
- Data conflicts (duplicate names, URI conflicts)
- Limits reached (maximum notes/tags/notebooks per account)
- Permission denied (notebook ownership, default notebook permissions, tag modification)
- Quota exceeded (upload limits)
- Data required (missing required fields)
- Not found errors (note GUID, notebook GUID)

## Notes

- All timestamps are automatically generated
- Content is automatically hashed and length-calculated
- The piece follows Evernote's API best practices
- OAuth2 tokens are automatically refreshed as needed
- Notebook names are case-insensitive and must be unique per account
- Update operations only modify the fields you specify, preserving other existing data
- The update note action requires both the note GUID and title to be provided
