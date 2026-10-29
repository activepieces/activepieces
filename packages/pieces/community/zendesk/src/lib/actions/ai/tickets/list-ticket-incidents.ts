import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskListTicketIncidentsOutputSchema } from '../../../output-schemas';

export const zendeskListTicketIncidents = createAction({
  auth: zendeskAuth,
  name: 'zendesk_list_ticket_incidents',
  outputSchema: zendeskListTicketIncidentsOutputSchema,
  displayName: 'List Ticket Incidents',
  description: 'List the incidents linked to a problem ticket.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the incident tickets linked to one problem ticket. Problem ticket IDs come from List Problem Tickets. Returns an empty list for tickets that are not problems.',
    idempotent: true,
  },
  props: {
    ticket_id: zendeskAiProps.ticketId({ description: 'Numeric ID of a ticket of type problem, from List Problem Tickets.' }),
  },
  async run({ auth, propsValue }) {
    const ticketId = zendeskApi.id({ value: propsValue.ticket_id, label: 'Ticket ID' });
    const response = await zendeskApi.request<{ tickets: unknown[] }>({
      auth,
      method: HttpMethod.GET,
      path: `/tickets/${ticketId}/incidents.json`,
    });
    return { tickets: response.tickets, count: response.tickets.length };
  },
});
