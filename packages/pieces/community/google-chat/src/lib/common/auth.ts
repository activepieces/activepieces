import { PieceAuth } from '@activepieces/pieces-framework';

export const googleChatAuth = PieceAuth.OAuth2({
  description: 'Authentication for Google Chat API',
  authUrl: 'https://accounts.google.com/o/oauth2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  required: true,
  scope: [
    'https://www.googleapis.com/auth/chat.bot',
    'https://www.googleapis.com/auth/chat.messages',
    'https://www.googleapis.com/auth/chat.spaces',
    'https://www.googleapis.com/auth/chat.messages.readonly',
    'https://www.googleapis.com/auth/chat.spaces.readonly',
  ],
}); 