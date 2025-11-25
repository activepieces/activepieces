import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { launchPhantom } from './lib/actions/launch-phantom';
import { phantombusterAuth } from './lib/common/auth';

export const phantombuster = createPiece({
  displayName: 'Phantombuster',
  auth: phantombusterAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/phantombuster.png',
  authors: ['sanket-a11y'],
  actions: [launchPhantom],
  triggers: [],
});
