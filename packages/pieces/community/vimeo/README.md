# Vimeo Piece

A comprehensive Vimeo integration for Activepieces that enables video automation workflows.

## Features

### 🚨 Triggers
- **New Video I've Liked**: Fires when you like a new video on Vimeo
- **New Video by Search**: Fires when a new video matches a search query
- **New Video of Mine**: Fires when you upload a new video
- **New Video by User**: Fires when a specified user uploads a new video

### 🛠️ Actions
- **Upload Video**: Upload a video to your Vimeo account with metadata
- **Add Video to Album**: Add an existing video to a user's album
- **Delete Video**: Permanently delete a video from the user's account

## Setup

1. Go to the [Vimeo Developer Portal](https://developer.vimeo.com/)
2. Create a new app and configure OAuth2 settings
3. Add `https://cloud.activepieces.com/redirect` to allowed redirect URIs
4. Copy your Client ID and Client Secret
5. Configure the required scopes: `public`, `private`, `interact`, `upload`, `delete`

## Usage Examples

### Auto-post liked videos to Slack
Use the "New Video I've Liked" trigger to automatically share videos you like with your team in a Slack channel.

### Monitor conference content
Use the "New Video by Search" trigger to monitor for new videos with conference names and log them to a spreadsheet.

### Announce new uploads
Use the "New Video of Mine" trigger to send email newsletters or update your CMS when you upload new content.

### Track partner content
Use the "New Video by User" trigger to monitor partner accounts and sync their uploads to your content calendar.

## API Compatibility

This piece is compatible with the Vimeo API v3 and supports all standard video operations including upload, management, and monitoring capabilities.
