import { createPiece } from "@activepieces/pieces-framework";
import { getTickets } from './lib/actions/get-tickets';
import { getContactFromID } from './lib/actions/get-contact-from-id';
import { getTicketStatus } from './lib/actions/get-ticket-status';

export const freshdesk = createPiece({
  displayName: "Freshdesk",
  logoUrl: "https://cdn.activepieces.com/pieces/freshdesk.png",
  authors: ['buttonsbond'],
  actions: [getTickets,getContactFromID,getTicketStatus],
  triggers: [],
});
