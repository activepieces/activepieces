import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { CursorMeta, zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskListDeletedTicketsOutputSchema } from '../../../output-schemas';

export const zendeskListDeletedTickets = createAction({
  auth: zendeskAuth,
  name: 'zendesk_list_deleted_tickets',
  outputSchema: zendeskListDeletedTicketsOutputSchema,
  displayName: 'List Deleted Tickets',
  description: 'List soft-deleted tickets that can still be restored.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists tickets deleted in the last 30 days, which Restore Ticket can bring back, with who deleted them and when. Requires an admin or an agent with permission to delete tickets. Pass next_cursor back as Cursor while has_more is true.',
    idempotent: true,
  },
  props: {
    limit: zendeskAiProps.limit(),
    cursor: zendeskAiProps.cursor(),
  },
  async run({ auth, propsValue }) {
    const response = await zendeskApi.request<{ deleted_tickets: unknown[]; meta?: CursorMeta }>({
      auth,
      method: HttpMethod.GET,
      path: '/deleted_tickets.json',
      queryParams: zendeskApi.cursorQuery({ limit: propsValue.limit, cursor: propsValue.cursor }),
    });
    return {
      deleted_tickets: response.deleted_tickets,
      count: response.deleted_tickets.length,
      ...zendeskApi.cursorResult(response.meta),
    };
  },
});
