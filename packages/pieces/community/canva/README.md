# Canva

Canva is an online design platform for creating visual content. This piece enables automation of design workflows using the Canva Connect API.

## Authentication

OAuth2 via Canva Connect API. Required scopes:
- `design:content:read` / `design:content:write`
- `design:meta:read`
- `asset:read` / `asset:write`
- `folder:read` / `folder:write`

## Actions

- **Create Design** — Create a new design using a preset type or custom dimensions
- **Upload Asset** — Upload an image or video to the Canva asset library
- **Import Design** — Import an external file (PDF, PPTX, DOCX, etc.) as a Canva design
- **Export Design** — Export a design to PDF, JPG, PNG, GIF, PPTX, or MP4
- **Get Design** — Retrieve metadata for a design
- **Find Design** — Search designs by keyword
- **Move Folder Item** — Move a design or asset to a different folder
- **Get Folder** — Retrieve folder details
- **Get Asset** — Retrieve asset details
