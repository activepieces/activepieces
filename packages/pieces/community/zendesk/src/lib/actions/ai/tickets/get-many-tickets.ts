import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskGetManyTicketsOutputSchema } from '../../../output-schemas';

export const zendeskGetManyTickets = createAction({
  auth: zendeskAuth,
  name: 'zendesk_get_many_tickets',
  outputSchema: zendeskGetManyTicketsOutputSchema,
  displayName: 'Get Many Tickets',
  description: 'Get up to 100 tickets by their IDs in one call.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fetches up to 100 tickets by numeric ID in a single request. Prefer it over repeated Get Ticket calls. IDs that do not exist or are deleted are silently left out, so compare count with the number of IDs requested.',
    idempotent: true,
  },
  props: {
    ticket_ids: Property.Array({
      displayName: 'Ticket IDs',
      description: 'Up to 100 numeric ticket IDs.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const ids = zendeskApi.idList({ values: propsValue.ticket_ids, label: 'Ticket IDs', max: 100 });
    const response = await zendeskApi.request<{ tickets: unknown[] }>({
      auth,
      method: HttpMethod.GET,
      path: '/tickets/show_many.json',
      queryParams: { ids: ids.join(',') },
    });
    return { tickets: response.tickets, count: response.tickets.length };
  },
});
