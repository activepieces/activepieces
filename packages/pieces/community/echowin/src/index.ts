import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { echowinAuth } from './lib/common/auth';
import { callCreated } from './lib/triggers/call-created';

export const echowin = createPiece({
  displayName: 'Echowin',
  auth: echowinAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/echowin.png',
  authors: ['sanket-a11y'],
  actions: [],
  triggers: [callCreated],
});
