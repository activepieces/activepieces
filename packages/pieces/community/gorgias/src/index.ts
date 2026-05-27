import { createPiece, PieceAuth, Property } from '@activepieces/pieces-framework';
import {
  createCustomApiCallAction,
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { gorgiasApi } from './lib/common/client';
import { createTicket } from './lib/actions/create-ticket';
import { getTicket } from './lib/actions/get-ticket';
import { updateTicket } from './lib/actions/update-ticket';
import { listTickets } from './lib/actions/list-tickets';
import { addMessage } from './lib/actions/add-message';
import { createCustomer } from './lib/actions/create-customer';
import { updateCustomer } from './lib/actions/update-customer';
import { findCustomer } from './lib/actions/find-customer';
import { newTicket } from './lib/triggers/new-ticket';
import { updatedTicket } from './lib/triggers/updated-ticket';
import { ticketStatusUpdated } from './lib/triggers/ticket-status-updated';
import { newMessage } from './lib/triggers/new-message';

export const gorgiasAuth = PieceAuth.CustomAuth({
  description: `Connect your Gorgias account using your account email and an API key.

**How to get your API key:**
1. Log in to your Gorgias account.
2. Go to **Settings → REST API** (or visit \`https://YOUR-DOMAIN.gorgias.com/settings/rest-api\`).
3. Copy your **API key**.

Your domain is the subdomain in your Gorgias URL — for \`https://acme.gorgias.com\` the domain is \`acme\`.`,
  required: true,
  props: {
    domain: Property.ShortText({
      displayName: 'Domain',
      description: 'Your Gorgias subdomain. For "https://acme.gorgias.com" enter "acme".',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Account Email',
      description: 'The email address of your Gorgias account.',
      required: true,
    }),
    api_key: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Found under Settings → REST API in your Gorgias account.',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${gorgiasApi.buildBaseUrl(auth.domain)}/tickets`,
        authentication: {
          type: AuthenticationType.BASIC,
          username: auth.email,
          password: auth.api_key,
        },
        queryParams: { limit: '1' },
      });
      return { valid: true };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid credentials. Check your domain, email, and API key.',
      };
    }
  },
});

export const gorgias = createPiece({
  displayName: 'Gorgias',
  description:
    'Helpdesk for ecommerce. Manage tickets, messages, and customers in your Gorgias support inbox.',
  auth: gorgiasAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/gorgias.png',
  categories: [PieceCategory.CUSTOMER_SUPPORT],
  authors: ['sanket-a11y'],
  actions: [
    createTicket,
    getTicket,
    updateTicket,
    listTickets,
    addMessage,
    createCustomer,
    updateCustomer,
    findCustomer,
    createCustomApiCallAction({
      baseUrl: (auth) => (auth ? gorgiasApi.buildBaseUrl(auth.props.domain) : ''),
      auth: gorgiasAuth,
      authMapping: async (auth) => {
        const token = Buffer.from(`${auth.props.email}:${auth.props.api_key}`).toString('base64');
        return { Authorization: `Basic ${token}` };
      },
    }),
  ],
  triggers: [newTicket, updatedTicket, ticketStatusUpdated, newMessage],
});
