import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskListTicketIncidentsOutputSchema } from '../../../output-schemas';

export const zendeskListViewTickets = createAction({
  auth: zendeskAuth,
  name: 'zendesk_list_view_tickets',
  outputSchema: zendeskListTicketIncidentsOutputSchema,
  displayName: 'List View Tickets',
  description: 'List the tickets in a view.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the tickets currently matching one view, in the view sort order. View IDs come from List Views; the built-in views incoming, my and my_groups also work. Use Search for ad-hoc filters.',
    idempotent: true,
  },
  props: {
    view_id: zendeskAiProps.requiredId({ displayName: 'View ID', description: 'Numeric view ID from List Views, or incoming, my or my_groups.' }),
  },
  async run({ auth, propsValue }) {
    const viewId = zendeskApi.pathSegment({ value: propsValue.view_id, label: 'View ID' });
    const response = await zendeskApi.request<{ tickets: unknown[] }>({
      auth,
      method: HttpMethod.GET,
      path: `/views/${viewId}/tickets.json`,
    });
    return { tickets: response.tickets, count: response.tickets.length };
  },
});
