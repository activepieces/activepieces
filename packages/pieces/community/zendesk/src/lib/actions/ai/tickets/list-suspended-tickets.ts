import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { CursorMeta, zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskListSuspendedTicketsOutputSchema } from '../../../output-schemas';

export const zendeskListSuspendedTickets = createAction({
  auth: zendeskAuth,
  name: 'zendesk_list_suspended_tickets',
  outputSchema: zendeskListSuspendedTicketsOutputSchema,
  displayName: 'List Suspended Tickets',
  description: 'List incoming messages held as suspended tickets.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists suspended tickets: incoming emails Zendesk held back (suspected spam, suspended sender, unverified address) with the cause of each. Recover them with Recover Suspended Tickets. Requires an unrestricted agent.',
    idempotent: true,
  },
  props: {
    limit: zendeskAiProps.limit(),
    cursor: zendeskAiProps.cursor(),
  },
  async run({ auth, propsValue }) {
    const response = await zendeskApi.request<{ suspended_tickets: unknown[]; meta?: CursorMeta }>({
      auth,
      method: HttpMethod.GET,
      path: `/suspended_tickets.json`,
      queryParams: zendeskApi.cursorQuery({ limit: propsValue.limit, cursor: propsValue.cursor }),
    });
    return {
      suspended_tickets: response.suspended_tickets,
      count: response.suspended_tickets.length,
      ...zendeskApi.cursorResult(response.meta),
    };
  },
});
