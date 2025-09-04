import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { wealthBoxAuth } from './lib/common/constants';
import { newTask } from './lib/triggers/new-task';

export const wealthbox = createPiece({
  displayName: 'Wealthbox',
  auth: wealthBoxAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/wealthbox.png',
  authors: ["gs03-dev"],
  actions: [],
  triggers: [
    newTask
  ],
});
