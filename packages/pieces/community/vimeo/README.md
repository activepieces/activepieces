# Vimeo Piece for Activepieces

This piece provides integration with Vimeo's video hosting and distribution platform, enabling powerful privacy, collaboration, and embedding controls through automated workflows.

## Features

### Triggers
- **New Video I've Liked**: Fires when you like a new video on Vimeo
- **New Video by Search**: Fires when a new video matching your search query is added
- **New Video of Mine**: Fires when you upload a new video to your account
- **New Video by User**: Fires when a specified user uploads a new video

### Actions
- **Upload Video**: Upload a video to your Vimeo account with customizable privacy settings
- **Add Video to Album**: Add an existing video to one of your albums
- **Delete Video**: Permanently delete a video from your account
- **Custom API Call**: Make direct API calls to Vimeo's REST API

## Authentication

This piece uses OAuth 2.0 authentication. To set up:

1. Go to the [Vimeo Developer Portal](https://developer.vimeo.com/)
2. Create a new app and configure your OAuth settings
3. Add `https://cloud.activepieces.com/redirect` to your redirect URIs
4. Copy your Client ID and Client Secret to Activepieces

## Use Cases

- **Content Curation**: Auto-post liked videos to team channels
- **Monitoring**: Track specific keywords or conference content
- **Content Distribution**: Automatically notify subscribers of new uploads
- **Partnership Tracking**: Monitor partner accounts and sync content calendars

## API Permissions

This piece requests the following Vimeo API scopes:
- `public`: Access public member data
- `private`: Access private member data (required for most scopes)
- `purchased`: Access Vimeo On Demand purchase history
- `create`: Create new resources (showcases, groups, channels, portfolios)
- `edit`: Edit existing resources including videos
- `delete`: Delete existing resources including videos
- `interact`: Like videos, follow members, add comments
- `upload`: Upload videos to Vimeo
- `stats`: Access video statistics and analytics
- `video_files`: Access video files (requires Standard+ membership)
- `promo_codes`: Manage Vimeo On Demand promotions

**Note:** The 'private' scope is required for any scope other than 'public'.
