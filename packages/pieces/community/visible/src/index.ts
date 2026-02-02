import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { visibleActions } from './lib/actions';

export const visibleAuth = PieceAuth.SecretText({
  displayName: 'Access Token',
  required: true,
  description: 'Enter your Visible access token.',
});

export const visible = createPiece({
  displayName: 'Visible',
  auth: visibleAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/visible.png',
  authors: ['onyedikachi-david'],
  actions: visibleActions,
  triggers: [],
});