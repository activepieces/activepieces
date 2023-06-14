import { createPiece } from '@activepieces/pieces-framework';
import { delayForAction } from './lib/actions/delay-for-action';
import { delayUntilAction } from './lib/actions/delay-untill-action';

export const delay = createPiece({
  displayName: 'Delay',
  logoUrl: 'https://cdn.activepieces.com/pieces/delay.png',
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
