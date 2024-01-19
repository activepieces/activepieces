import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { triggers } from './lib/triggers';

export const calcomAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'API Key provided by cal.com',
  required: true,
});

export const calcom = createPiece({
  displayName: 'Cal.com',
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/cal.com.png',
  authors: ['kanarelo'],
  auth: calcomAuth,
  actions: [],
  triggers,
});
