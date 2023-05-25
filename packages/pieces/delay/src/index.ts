import { createPiece } from '@activepieces/pieces-framework';
import packageJson from '../package.json';
import { delayAction } from './lib/actions/delay-action';
import { pauseAction } from './lib/actions/pause-action';
import { stopAction } from './lib/actions/stop-action';

export const delay = createPiece({
  name: 'delay',
  displayName: 'Delay',
  logoUrl: 'https://cdn.activepieces.com/pieces/delay.png',
  version: packageJson.version,
  authors: [
    "abuaboud"
  ],
  actions: [
    delayAction,
    pauseAction,
    stopAction,
  ],
  triggers: [
  ],
});
