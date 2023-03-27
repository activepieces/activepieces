
import { createPiece } from '@activepieces/framework';
import packageJson from '../package.json';
import { newTicketInView } from './lib/trigger/new-ticket-in-view';

export const zendesk = createPiece({
  name: 'zendesk',
  displayName: 'Zendesk',
  logoUrl: 'https://cdn.activepieces.com/pieces/zendesk.png',
  version: packageJson.version,
  authors: [
    "abuaboud"
  ],
  actions: [
  ],
  triggers: [
    newTicketInView
  ],
});
