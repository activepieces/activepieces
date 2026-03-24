import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { Buffer } from 'buffer';

import { gorgiasAuth, getGorgiasBaseUrl } from './lib/auth';
import { createTicketAction } from './lib/actions/create-ticket';
import { getTicketAction } from './lib/actions/get-ticket';
import { updateTicketAction } from './lib/actions/update-ticket';
import { listTicketsAction } from './lib/actions/list-tickets';
import { createMessageAction } from './lib/actions/create-message';
import { getCustomerAction } from './lib/actions/get-customer';

export const gorgias = createPiece({
  displayName: 'Gorgias',
  description: 'Helpdesk platform for ecommerce teams to manage tickets, customers, and support conversations.',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://developers.gorgias.com/favicon.ico',
  categories: [PieceCategory.CUSTOMER_SUPPORT],
  auth: gorgiasAuth,
  authors: ['Harmatta'],
  actions: [
    createTicketAction,
    getTicketAction,
    updateTicketAction,
    listTicketsAction,
    createMessageAction,
    getCustomerAction,
    createCustomApiCallAction({
      baseUrl: (auth) => getGorgiasBaseUrl(auth?.props.domain ?? ''),
      auth: gorgiasAuth,
      authMapping: async (auth) => {
        const credentials = `${auth.props.email}:${auth.props.api_key}`;
        return {
          Authorization: `Basic ${Buffer.from(credentials).toString('base64')}`,
        };
      },
    }),
  ],
  triggers: [],
});
