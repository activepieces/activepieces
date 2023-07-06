
import { createPiece } from "@activepieces/pieces-framework";
import { getTickets } from './lib/actions/get-tickets';
import { getContactFromID } from './lib/actions/get-contact-from-id';

export const freshdesk = createPiece({
  displayName: "Freshdesk",
  logoUrl: "https://cdn.activepieces.com/pieces/freshdesk.png",
  authors: ['buttonsbond'],
  actions: [getTickets,getContactFromID],
  triggers: [],
});
