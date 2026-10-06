import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskCreateTicketOutputSchema } from '../../../output-schemas';

export const zendeskGetTicket = createAction({
  auth: zendeskAuth,
  name: 'zendesk_get_ticket',
  outputSchema: zendeskCreateTicketOutputSchema,
  displayName: 'Get Ticket',
  description: 'Get a ticket by its ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fetches one Zendesk ticket by numeric ID, including status, priority, requester, assignee, group, tags and custom field values. Use List Ticket Comments for the conversation and Get Many Tickets to read up to 100 tickets at once. Deleted tickets return not found; see List Deleted Tickets.',
    idempotent: true,
  },
  props: {
    ticket_id: zendeskAiProps.ticketId(),
  },
  async run({ auth, propsValue }) {
    const ticketId = zendeskApi.id({ value: propsValue.ticket_id, label: 'Ticket ID' });
    const response = await zendeskApi.request<{ ticket: Record<string, unknown> }>({
      auth,
      method: HttpMethod.GET,
      path: `/tickets/${ticketId}.json`,
    });
    return response.ticket;
  },
});
