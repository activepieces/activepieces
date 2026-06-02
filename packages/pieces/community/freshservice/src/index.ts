import { createPiece, PieceAuth, Property } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { Buffer } from 'buffer';
import { createTicket } from './lib/actions/create-ticket';
import { addNoteToTicket } from './lib/actions/add-note-to-ticket';
import { createRequester } from './lib/actions/create-requester';
import { requestTicketApproval } from './lib/actions/request-ticket-approval';
import { createChange } from './lib/actions/create-change';
import { updateChange } from './lib/actions/update-change';
import { deleteChange } from './lib/actions/delete-change';
import { addNoteToChange } from './lib/actions/add-note-to-change';
import { createChangeTask } from './lib/actions/create-change-task';
import { updateChangeTask } from './lib/actions/update-change-task';
import { deleteChangeTask } from './lib/actions/delete-change-task';
import { newTicket } from './lib/triggers/new-ticket';
import { updatedTicket } from './lib/triggers/updated-ticket';
import { newRequester } from './lib/triggers/new-requester';
import { updatedRequester } from './lib/triggers/updated-requester';
import { newChange } from './lib/triggers/new-change';
import { updatedChange } from './lib/triggers/updated-change';
import { newChangeTask } from './lib/triggers/new-change-task';
import { updatedChangeTask } from './lib/triggers/updated-change-task';
import { HttpMethod, httpClient, AuthenticationType } from '@activepieces/pieces-common';

export const freshserviceAuth = PieceAuth.CustomAuth({
  description: `
To get your API key:
1. Log in to your **Freshservice** account as an agent.
2. Click your **profile picture** in the top-right corner.
3. Go to **Profile Settings**.
4. Your API key is displayed on the right side of the page.

For the domain, enter only the subdomain. For example, if your URL is **mycompany.freshservice.com**, enter **mycompany**.
  `,
  required: true,
  props: {
    domain: Property.ShortText({
      displayName: 'Freshservice Domain',
      description:
        'Your Freshservice subdomain (e.g., "mycompany" from mycompany.freshservice.com).',
      required: true,
    }),
    api_key: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Your Freshservice API key from Profile Settings.',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `https://${auth.domain}.freshservice.com/api/v2/agents/me`,
        authentication: {
          type: AuthenticationType.BASIC,
          username: auth.api_key,
          password: 'X',
        },
      });
      return { valid: true };
    } catch {
      return {
        valid: false,
        error: 'Invalid domain or API key. Please check your credentials.',
      };
    }
  },
});

export const freshservice = createPiece({
  displayName: 'Freshservice',
  description: 'IT service management software for ticketing, asset management, and IT operations.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/freshservice.png',
  categories: [PieceCategory.CUSTOMER_SUPPORT],
  authors: ['AhmadTash'],
  auth: freshserviceAuth,
  actions: [
    createTicket,
    addNoteToTicket,
    createRequester,
    requestTicketApproval,
    createChange,
    updateChange,
    deleteChange,
    addNoteToChange,
    createChangeTask,
    updateChangeTask,
    deleteChangeTask,
    createCustomApiCallAction({
      baseUrl: (auth) =>
        `https://${auth?.props.domain ?? ''}.freshservice.com/api/v2`,
      auth: freshserviceAuth,
      authMapping: async (auth) => {
        const encoded = Buffer.from(`${auth.props.api_key}:X`).toString(
          'base64'
        );
        return {
          Authorization: `Basic ${encoded}`,
        };
      },
    }),
  ],
  triggers: [newTicket, updatedTicket, newRequester, updatedRequester, newChange, updatedChange, newChangeTask, updatedChangeTask],
});
