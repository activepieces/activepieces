import { createPiece } from '@activepieces/pieces-framework';
import packageJson from '../package.json';
import { delayAction, delayForAction, delayTillAction } from './lib/actions/delay-action';

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
	delayForAction, // Like delayAction but without the 5 minute limit
	delayTillAction // Takes a timestamp parameter instead of duration
  ],
  triggers: [
  ],
});
