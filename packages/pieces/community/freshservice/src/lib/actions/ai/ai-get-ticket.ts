import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { freshserviceAuth } from '../../../';
import { freshserviceApiCall } from '../../common/client';
import { freshserviceCommon } from '../../common/props';
import { freshserviceSchemas } from '../../common/schemas';

export const aiGetTicket = createAction({
  auth: freshserviceAuth,
  name: 'ai_get_ticket',
  displayName: 'Get Ticket (AI)',
  description: 'Retrieves a Freshservice ticket by ID.',
  audience: 'ai',
  classification: 'READ',
  outputSchema: freshserviceSchemas.ticketWithConversations,
  aiMetadata: {
    description:
      'Fetches one Freshservice ticket by numeric ticket id, with its status, priority, requester, assignment and custom fields. Set include_conversations to "yes" to also return replies and notes. Use Search Tickets to find a ticket id. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    ticket_id: Property.Number({ displayName: 'Ticket ID', required: true }),
    include_conversations: freshserviceCommon.yesNo({
      displayName: 'Include Conversations',
      description: 'Return the ticket replies and notes too.',
      required: false,
    }),
  },
  async run(context) {
    const { ticket_id, include_conversations } = context.propsValue;
    const response = await freshserviceApiCall<{ ticket: Record<string, unknown> }>({
      method: HttpMethod.GET,
      endpoint: `tickets/${ticket_id}`,
      auth: context.auth,
      queryParams: include_conversations === 'yes' ? { include: 'conversations' } : undefined,
    });
    return response.body.ticket;
  },
});
