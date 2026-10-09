import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { CursorMeta, zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskListViewTicketsOutputSchema } from '../../../output-schemas';

export const zendeskListViewTickets = createAction({
  auth: zendeskAuth,
  name: 'zendesk_list_view_tickets',
  outputSchema: zendeskListViewTicketsOutputSchema,
  displayName: 'List View Tickets',
  description: 'List the tickets in a view.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the tickets currently matching one view, in the view sort order. View IDs come from List Views; the built-in views incoming, my and my_groups also work. Use Search for ad-hoc filters. Pass next_cursor back as Cursor while has_more is true.',
    idempotent: true,
  },
  props: {
    view_id: zendeskAiProps.requiredId({ displayName: 'View ID', description: 'Numeric view ID from List Views, or incoming, my or my_groups.' }),
    limit: zendeskAiProps.limit(),
    cursor: zendeskAiProps.cursor(),
  },
  async run({ auth, propsValue }) {
    const viewId = zendeskApi.pathSegment({ value: propsValue.view_id, label: 'View ID' });
    const response = await zendeskApi.request<{ tickets: unknown[]; meta?: CursorMeta }>({
      auth,
      method: HttpMethod.GET,
      path: `/views/${viewId}/tickets.json`,
      queryParams: zendeskApi.cursorQuery({ limit: propsValue.limit, cursor: propsValue.cursor }),
    });
    return { tickets: response.tickets, count: response.tickets.length, ...zendeskApi.cursorResult(response.meta) };
  },
});
