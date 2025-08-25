# Vimeo Piece

This library provides integration with Vimeo's API for Activepieces, allowing you to upload videos and manage your Vimeo content.

## Features

- **Upload Video**: Upload videos to your Vimeo account with comprehensive configuration options
- **Delete Video**: Permanently delete one or more videos from your Vimeo account
- **OAuth2 Authentication**: Secure authentication using Vimeo's OAuth2 flow
- **Privacy Controls**: Configure video privacy settings (public, private, unlisted, password-protected)
- **Embed Settings**: Customize embed player appearance and functionality
- **Content Management**: Set licenses, content ratings, and language preferences

## Authentication

This piece uses OAuth2 authentication with the `upload` and `delete` scopes, which allows the application to upload and delete videos from your Vimeo account.

## Actions

### Upload Video

Uploads a video to your Vimeo account with the following features:

**Required Fields:**
- Video URL: The URL of the video to upload
- Video Name: The title/name of the video

**Optional Fields:**
- Description: Video description
- Privacy Settings: Control who can view the video
- Password: For password-protected videos
- Folder URI: Upload to a specific folder
- License: Creative Commons license options
- Comment Settings: Control who can comment
- Embed Settings: Control embedding permissions and player appearance
- Download Settings: Control video download permissions
- Content Rating: Describe video content
- Language: Set video default language

### Delete Video

Permanently deletes one or more videos from your Vimeo account:

**Required Fields:**
- Video URIs: List of video URIs to delete

**Optional Fields:**
- User ID: The ID of the user who owns the videos (leave empty to use authenticated user)

## Usage

1. Configure OAuth2 authentication with your Vimeo account
2. Use the "Upload Video" action to upload videos with your desired settings
3. Use the "Delete Video" action to remove videos from your account
4. Both actions will return success/failure status and relevant information

## API Endpoints

- **Upload**: `POST https://api.vimeo.com/me/videos`
- **Delete**: `DELETE https://api.vimeo.com/me/videos` or `DELETE https://api.vimeo.com/users/{user_id}/videos`
- **Authentication**: OAuth2 with upload and delete scopes

## Building

Run `nx build pieces-vimeo` to build the library.

## Dependencies

- `@activepieces/pieces-framework`: Core framework
- `@activepieces/pieces-common`: Common utilities and HTTP client
