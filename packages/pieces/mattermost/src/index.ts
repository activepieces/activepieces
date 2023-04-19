
import { createPiece } from '@activepieces/pieces-framework';
import packageJson from '../package.json';
import { sendMessage } from './lib/actions/send-message';

export const mattermost = createPiece({
  name: 'mattermost',
  displayName: 'Mattermost',
  logoUrl: 'https://cdn.activepieces.com/pieces/mattermost.png',
  version: packageJson.version,
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
