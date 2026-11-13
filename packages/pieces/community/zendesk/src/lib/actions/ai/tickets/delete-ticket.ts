import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskDeleteTicketOutputSchema } from '../../../output-schemas';

export const zendeskDeleteTicket = createAction({
  auth: zendeskAuth,
  name: 'zendesk_delete_ticket',
  outputSchema: zendeskDeleteTicketOutputSchema,
  displayName: 'Delete Ticket',
  description: 'Move a ticket to deleted tickets.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Soft-deletes one ticket: it moves to deleted tickets for 30 days and can be brought back with Restore Ticket until Zendesk purges it. Requires an admin or an agent with permission to delete tickets. Use Mark Tickets as Spam instead for spam, which also suspends the requester.',
    idempotent: true,
  },
  props: {
    ticket_id: zendeskAiProps.ticketId(),
  },
  async run({ auth, propsValue }) {
    const ticketId = zendeskApi.id({ value: propsValue.ticket_id, label: 'Ticket ID' });
    await zendeskApi.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: `/tickets/${ticketId}.json`,
    });
    return { success: true, ticket_id: Number(ticketId) };
  },
});
