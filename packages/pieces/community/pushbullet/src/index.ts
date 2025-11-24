import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { bushbulletAuth } from './lib/common/auth';

export const pushbullet = createPiece({
  displayName: 'Pushbullet',
  auth: bushbulletAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/pushbullet.png',
  authors: ['sanket-a11y'],
  actions: [],
  triggers: [],
});
