import { PieceAuth, createPiece } from '@activepieces/pieces-framework';

export const biginAuth = PieceAuth.OAuth2({
  description: 'Authenticate with your Bigin account',
  authUrl: 'https://accounts.zoho.com/oauth/v2/auth',
  tokenUrl: 'https://accounts.zoho.com/oauth/v2/token',
  required: true,
  scope: ['ZohoBigin.modules.ALL', 'ZohoBigin.settings.ALL'],
  extra: {
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
  },
});
