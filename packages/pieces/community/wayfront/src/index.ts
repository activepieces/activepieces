import { createPiece } from '@activepieces/pieces-framework';
import { wayfrontAuth } from './lib/auth';
import { createClientAction } from './lib/actions/create-client';
import { updateClientAction } from './lib/actions/update-client';
import { createActivityAction } from './lib/actions/create-activity';
import { updateActivityAction } from './lib/actions/update-activity';
import { completeActivityAction } from './lib/actions/complete-activity';
import { createTicketAction } from './lib/actions/create-ticket';
import { listTicketsAction } from './lib/actions/list-tickets';
import { updateTicketAction } from './lib/actions/update-ticket';
import { listOrdersAction } from './lib/actions/list-orders';
import { createOrderAction } from './lib/actions/create-order';
import { updateOrderAction } from './lib/actions/update-order';

export const wayfront = createPiece({
  displayName: 'Wayfront',
  description: 'Unify your process, automate steps, and help clients find what they need.',
  auth: wayfrontAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/wayfront.png',
  authors: ['onyedikachi-david'],
  actions: [
    createClientAction,
    updateClientAction,
    createActivityAction,
    updateActivityAction,
    completeActivityAction,
    createTicketAction,
    listTicketsAction,
    updateTicketAction,
    listOrdersAction,
    createOrderAction,
    updateOrderAction,
  ],
  triggers: [],
});
