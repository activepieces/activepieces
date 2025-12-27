# Canva Piece for Activepieces

Integrates Canva's design platform with Activepieces automation.

## Features

### Actions
- **Upload Asset** - Upload files to Canva content library
- **Upload Asset from URL** - Upload from public URL
- **Create Design** - Create new designs with preset or custom dimensions
- **Export Design** - Export to PNG, JPG, PDF, MP4, GIF, PPTX
- **List Designs** - List all designs with optional search
- **Get Design** - Get details of a specific design
- **Create Folder** - Create folders to organize content
- **List Folder Items** - List items in a folder
- **Custom API Call** - Make any Canva API request

### Authentication
OAuth 2.0 with scopes:
- design:content:read/write
- design:meta:read
- asset:read/write
- folder:read/write
- profile:read

## Installation

Copy to `packages/pieces/community/canva` in Activepieces repo.

## API Reference

Based on Canva Connect API v1: https://www.canva.dev/docs/connect/
