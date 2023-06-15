
import { createPiece } from '@activepieces/pieces-framework';
import { newTicketInView } from './lib/trigger/new-ticket-in-view';

export const zendesk = createPiece({
  displayName: 'Zendesk',
  logoUrl: 'https://cdn.activepieces.com/pieces/zendesk.png',
  authors: [
    "abuaboud"
  ],
  actions: [
  ],
  triggers: [
    newTicketInView
  ],
});
