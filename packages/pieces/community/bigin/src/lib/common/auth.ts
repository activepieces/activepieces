import { PieceAuth, createPiece } from '@activepieces/pieces-framework';

export const biginAuth = PieceAuth.OAuth2({
  description: 'Authenticate with your Bigin account',
  authUrl: 'https://accounts.zoho.in/oauth/v2/auth',
  tokenUrl: 'https://accounts.zoho.in/oauth/v2/token',
  required: true,
  scope: [
    'ZohoBigin.modules.ALL',
    'ZohoBigin.modules.contacts.ALL',
    'ZohoBigin.modules.contacts.READ',
    'ZohoBigin.modules.contacts.CREATE',
  ],
  extra: {
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
  },
});
