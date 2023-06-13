
import { createPiece } from '@activepieces/pieces-framework';
import { sendMessage } from './lib/actions/send-message';

export const mattermost = createPiece({
  displayName: 'Mattermost',
  logoUrl: 'https://cdn.activepieces.com/pieces/mattermost.png',
  minimumSupportedRelease: '0.3.9',
  authors: [
    "abuaboud"
  ],
  actions: [
    sendMessage
  ],
  triggers: [
  ],
});
