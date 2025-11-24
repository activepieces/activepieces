import { PieceAuth } from '@activepieces/pieces-framework';

export const bushbulletAuth = PieceAuth.OAuth2({
  description: '',
  authUrl: 'https://www.pushbullet.com/authorize',
  tokenUrl: 'https://api.pushbullet.com/oauth2/token',
  required: true,
  scope: [''],
});
