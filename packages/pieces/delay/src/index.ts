import { createPiece } from '@activepieces/pieces-framework';
import packageJson from '../package.json';
import { delayForAction } from './lib/actions/delay-for-action';
import { delayTillAction } from './lib/actions/delay-till-action';

export const delay = createPiece({
  name: 'delay',
  displayName: 'Delay',
  logoUrl: 'https://cdn.activepieces.com/pieces/delay.png',
  version: packageJson.version,
  authors: [
    "abuaboud"
  ],
  actions: [
	delayForAction, // Like delayAction but without the 5 minute limit
	delayTillAction // Takes a timestamp parameter instead of duration
  ],
  triggers: [
  ],
});
