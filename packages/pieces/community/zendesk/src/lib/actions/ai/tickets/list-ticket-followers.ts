import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskGetManyUsersOutputSchema } from '../../../output-schemas';

export const zendeskListTicketFollowers = createAction({
  auth: zendeskAuth,
  name: 'zendesk_list_ticket_followers',
  outputSchema: zendeskGetManyUsersOutputSchema,
  displayName: 'List Ticket Followers',
  description: 'List the agents following a ticket.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the agents following a ticket, who get notified of its updates but are not emailed as CCs. Email CCs come from List Ticket Email CCs.',
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
      path: `/tickets/${ticketId}/followers.json`,
    });
    return { users: response.users, count: response.users.length };
  },
});
