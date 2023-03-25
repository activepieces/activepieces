
import { createPiece } from '@activepieces/framework';
import packageJson from '../package.json';
import { sendMessage } from './lib/actions/send-message';

export const mattermost = createPiece({
  name: 'mattermost',
  displayName: 'Mattermost',
  logoUrl: 'https://cdn.activepieces.com/pieces/mattermost.png',
  version: packageJson.version,
  authors: [
  ],
  actions: [
    sendMessage
  ],
  triggers: [
  ],
});
