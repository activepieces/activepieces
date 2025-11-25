import { createPiece } from '@activepieces/pieces-framework';
import { orimonAuth } from './lib/common/auth';
import { sendMessage } from './lib/actions/send-message';
import { newLead } from './lib/triggers/new-lead';



export const orimon = createPiece({
  displayName: 'Orimon',
  auth: orimonAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/orimon.png',
  authors: ['sanket-a11y'],
  actions: [sendMessage],
  triggers: [newLead],
});
