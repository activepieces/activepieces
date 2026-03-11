# Canva

[Canva](https://www.canva.com) is an online design and publishing tool that makes it easy for anyone to create stunning graphics, presentations, social media posts, and more.

## Authentication

This integration uses OAuth2 via the [Canva Connect API](https://www.canva.dev/docs/connect/). You'll need to:

1. Create an integration at [Canva Developers](https://www.canva.com/developers/)
2. Set the redirect URL to your Activepieces instance
3. Use the Client ID and Client Secret in the connection settings

## Actions

- **List Designs** – List designs in your Canva account with optional search filter
- **Get Design** – Get details of a specific design by ID
- **Create Design** – Create a new design (presentation, social media post, document, or whiteboard)
- **Export Design** – Export a design to PDF, PNG, JPG, SVG, PPTX, GIF, or MP4
- **Custom API Call** – Make any request to the Canva Connect API

## References

- [Canva Connect API Docs](https://www.canva.dev/docs/connect/)
- [Canva OAuth2 Guide](https://www.canva.dev/docs/connect/authentication/)
