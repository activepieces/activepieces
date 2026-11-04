import { createPiece, PieceAuth, Property } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/pieces-framework';
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
import { aiAddChangeNote } from './lib/actions/ai/ai-add-change-note';
import { aiAddTicketNote } from './lib/actions/ai/ai-add-ticket-note';
import { aiCreateChange } from './lib/actions/ai/ai-create-change';
import { aiCreateRequester } from './lib/actions/ai/ai-create-requester';
import { aiCreateTicket } from './lib/actions/ai/ai-create-ticket';
import { aiFindRequester } from './lib/actions/ai/ai-find-requester';
import { aiGetChange } from './lib/actions/ai/ai-get-change';
import { aiGetTicket } from './lib/actions/ai/ai-get-ticket';
import { aiListAgents } from './lib/actions/ai/ai-list-agents';
import { aiListChanges } from './lib/actions/ai/ai-list-changes';
import { aiListDepartments } from './lib/actions/ai/ai-list-departments';
import { aiListGroups } from './lib/actions/ai/ai-list-groups';
import { aiReplyToTicket } from './lib/actions/ai/ai-reply-to-ticket';
import { aiSearchTickets } from './lib/actions/ai/ai-search-tickets';
import { aiUpdateChange } from './lib/actions/ai/ai-update-change';
import { aiUpdateTicket } from './lib/actions/ai/ai-update-ticket';
import { aiRequestTicketApproval } from './lib/actions/ai/ai-request-ticket-approval';
import { aiDeleteChange } from './lib/actions/ai/ai-delete-change';
import { aiCreateChangeTask } from './lib/actions/ai/ai-create-change-task';
import { aiUpdateChangeTask } from './lib/actions/ai/ai-update-change-task';
import { aiDeleteChangeTask } from './lib/actions/ai/ai-delete-change-task';
import { newTicket } from './lib/triggers/new-ticket';
import { updatedTicket } from './lib/triggers/updated-ticket';
import { newRequester } from './lib/triggers/new-requester';
import { updatedRequester } from './lib/triggers/updated-requester';
import { newChange } from './lib/triggers/new-change';
import { updatedChange } from './lib/triggers/updated-change';
import { newChangeTask } from './lib/triggers/new-change-task';
import { updatedChangeTask } from './lib/triggers/updated-change-task';
import { HttpMethod } from '@activepieces/pieces-common';
import { buildBaseUrl, freshserviceRequest, isFreshserviceApiError, normalizeDomain, readErrorMessage } from './lib/common/client';

function describeValidationError({ error, domain }: { error: unknown; domain: string }): string {
  if (isFreshserviceApiError(error)) {
    if (error.status === 401) {
      return `${error.message}. Check the API key from your Freshservice Profile Settings`;
    }
    if (error.status === 404) {
      return `${error.message}. Check that ${domain}.freshservice.com is your Freshservice address`;
    }
    return error.message;
  }
  const message = readErrorMessage(error);
  return `Could not reach ${domain}.freshservice.com: ${message}`;
}

export const freshserviceAuth = PieceAuth.CustomAuth({
  description: `
To get your API key:
1. Log in to your **Freshservice** account as an agent.
2. Click your **profile picture** in the top-right corner.
3. Go to **Profile Settings**.
4. Your API key is displayed on the right side of the page.

For the domain, enter your subdomain. For example, if your URL is **mycompany.freshservice.com**, enter **mycompany** (the full address also works).
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
    const domain = normalizeDomain(auth.domain);
    if (domain.length === 0) {
      return { valid: false, error: 'Enter your Freshservice subdomain, for example "acme" from acme.freshservice.com.' };
    }
    try {
      await freshserviceRequest({
        method: HttpMethod.GET,
        endpoint: 'agents/me',
        domain,
        apiKey: auth.api_key,
      });
      return { valid: true };
    } catch (error) {
      return { valid: false, error: describeValidationError({ error, domain }) };
    }
  },
});

export const freshservice = createPiece({
  displayName: 'Freshservice',
  description: 'IT service management software for ticketing, asset management, and IT operations.',
  minimumSupportedRelease: '0.86.4',
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
    aiAddChangeNote,
    aiAddTicketNote,
    aiCreateChange,
    aiCreateRequester,
    aiCreateTicket,
    aiFindRequester,
    aiGetChange,
    aiGetTicket,
    aiListAgents,
    aiListChanges,
    aiListDepartments,
    aiListGroups,
    aiReplyToTicket,
    aiSearchTickets,
    aiUpdateChange,
    aiUpdateTicket,
    aiRequestTicketApproval,
    aiDeleteChange,
    aiCreateChangeTask,
    aiUpdateChangeTask,
    aiDeleteChangeTask,
    createCustomApiCallAction({
      baseUrl: (auth) =>
        buildBaseUrl(auth?.props.domain ?? ''),
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
