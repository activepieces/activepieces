import { Property } from "@activepieces/pieces-framework";

export const figmaAuth = Property.OAuth2({
  description: '',
  displayName: 'Authentication',
  authUrl: 'https://www.figma.com/oauth',
  tokenUrl: 'https://www.figma.com/api/oauth/token',
  required: true,
  scope: [
    'file_read',
  ],
});
