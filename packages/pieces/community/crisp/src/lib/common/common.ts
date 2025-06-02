import { PieceAuth } from '@activepieces/pieces-framework';


export const crispAuth = PieceAuth.OAuth2({
  description: 'Authentication for Crisp API',
  authUrl: 'https://api.crisp.chat/v1/oauth/authorize',
  tokenUrl: 'https://api.crisp.chat/v1/oauth/token',
  required: true,
  scope: [
    'conversation:read',
    'conversation:write',
    'people:read',
    'people:write'
  ]
});