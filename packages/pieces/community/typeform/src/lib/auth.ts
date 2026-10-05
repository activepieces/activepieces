import { PieceAuth } from '@activepieces/pieces-framework';

export const typeformAuth = PieceAuth.OAuth2({
  required: true,
  tokenUrl: 'https://api.typeform.com/oauth/token',
  authUrl: 'https://admin.typeform.com/oauth/authorize',
  scope: [
    'webhooks:write',
    'forms:read',
    'forms:write',
    'accounts:read',
    'responses:read',
    'responses:write',
    'workspaces:read',
    'workspaces:write',
    'themes:read',
    'themes:write',
    'images:read',
    'images:write',
    'offline',
  ],
});
