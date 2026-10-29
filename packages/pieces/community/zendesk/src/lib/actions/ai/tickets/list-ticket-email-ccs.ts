import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskListTicketEmailCcsOutputSchema } from '../../../output-schemas';

export const zendeskListTicketEmailCcs = createAction({
  auth: zendeskAuth,
  name: 'zendesk_list_ticket_email_ccs',
  outputSchema: zendeskListTicketEmailCcsOutputSchema,
  displayName: 'List Ticket Email CCs',
  description: 'List the users copied on a ticket.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the users CCed on a ticket, who receive its public replies by email. Followers (agents notified internally) come from List Ticket Followers.',
    idempotent: true,
  },
  props: {
    ticket_id: zendeskAiProps.ticketId(),
  },
  async run({ auth, propsValue }) {
    const ticketId = zendeskApi.id({ value: propsValue.ticket_id, label: 'Ticket ID' });
    const response = await zendeskApi.request<{ users: unknown[] }>({
      auth,
      method: HttpMethod.GET,
      path: `/tickets/${ticketId}/email_ccs.json`,
    });
    return { users: response.users, count: response.users.length };
  },
});
