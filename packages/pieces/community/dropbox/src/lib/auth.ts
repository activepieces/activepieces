import { PieceAuth } from '@activepieces/pieces-framework';

export const dropboxAuth = PieceAuth.OAuth2({
  description: '',
  authUrl: 'https://www.dropbox.com/oauth2/authorize',
  tokenUrl: 'https://api.dropboxapi.com/oauth2/token',
  required: true,
  // include token_access_type=offline as a parameter on Authorization URL in order to return a refresh_token
  extra: { token_access_type: 'offline' },
  scope: [
    'files.metadata.write',
    'files.metadata.read',
    'files.content.write',
    'files.content.read',
  ],
});
