import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { CursorMeta, zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskListTicketsOutputSchema } from '../../../output-schemas';

export const zendeskListTickets = createAction({
  auth: zendeskAuth,
  name: 'zendesk_list_tickets',
  outputSchema: zendeskListTicketsOutputSchema,
  displayName: 'List Tickets',
  description: 'List tickets in the account, newest or oldest first.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists tickets across the account one page at a time, optionally filtered by External ID. Use Search for filtering by status, requester, tag, text or dates; use this to page through all tickets or to find a ticket by your own external ID. Pass next_cursor back as Cursor while has_more is true.',
    idempotent: true,
  },
  props: {
    external_id: Property.ShortText({
      displayName: 'External ID',
      description: 'Only return tickets with this external ID.',
      required: false,
    }),
    sort: Property.StaticDropdown({
      displayName: 'Sort',
      required: false,
      options: {
        options: [
          { label: 'ID (oldest first)', value: 'id' },
          { label: 'ID (newest first)', value: '-id' },
          { label: 'Updated (oldest first)', value: 'updated_at' },
          { label: 'Updated (newest first)', value: '-updated_at' },
          { label: 'Status (ascending)', value: 'status' },
          { label: 'Status (descending)', value: '-status' },
        ],
      },
    }),
    limit: zendeskAiProps.limit(),
    cursor: zendeskAiProps.cursor(),
  },
  async run({ auth, propsValue }) {
    const response = await zendeskApi.request<{ tickets: unknown[]; meta?: CursorMeta }>({
      auth,
      method: HttpMethod.GET,
      path: '/tickets.json',
      queryParams: {
        ...zendeskApi.cursorQuery({ limit: propsValue.limit, cursor: propsValue.cursor }),
        ...(propsValue.external_id ? { external_id: propsValue.external_id } : {}),
        ...(propsValue.sort ? { sort: propsValue.sort } : {}),
      },
    });
    return {
      tickets: response.tickets,
      count: response.tickets.length,
      ...zendeskApi.cursorResult(response.meta),
    };
  },
});
