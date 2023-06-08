import { createPiece } from '@activepieces/pieces-framework';
import packageJson from '../package.json';
import { delayForAction } from './lib/actions/delay-for-action';
import { delayUntilAction } from './lib/actions/delay-untill-action';

export const delay = createPiece({
  name: 'delay',
  displayName: 'Delay',
  logoUrl: 'https://cdn.activepieces.com/pieces/delay.png',
  version: packageJson.version,
  authors: [
    "abuaboud",
    "nileshtrivedi"
  ],
  actions: [
	delayForAction, // Delay for a fixed duration
	delayUntilAction // Takes a timestamp parameter instead of duration
  ],
  triggers: [
  ],
});
