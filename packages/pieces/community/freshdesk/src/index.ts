import {
  PieceAuth,
  Property,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getContactFromID } from './lib/actions/get-contact-from-id';
import { getTicketStatus } from './lib/actions/get-ticket-status';
import { getTickets } from './lib/actions/get-tickets';

export const freshdeskAuth = PieceAuth.CustomAuth({
  props: {
    base_url: Property.ShortText({
      displayName: 'Base URL',
      description: 'Enter the base URL',
      required: true,
    }),
    access_token: Property.ShortText({
      displayName: 'API Token',
      description: 'Enter the API token',
      required: true,
    }),
  },
  description: `Get the API token by visiting your profile settings and clicking View API key`,
  required: true,
});

export const freshdesk = createPiece({
  displayName: 'Freshdesk',
  logoUrl: 'https://cdn.activepieces.com/pieces/freshdesk.png',
  authors: ['buttonsbond'],
  categories: [PieceCategory.CUSTOMER_SERVICE],
  auth: freshdeskAuth,
  actions: [getTickets, getContactFromID, getTicketStatus],
  triggers: [],
});
