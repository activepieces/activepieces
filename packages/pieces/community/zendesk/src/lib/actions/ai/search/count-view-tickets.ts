import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskCountViewTicketsOutputSchema } from '../../../output-schemas';

export const zendeskCountViewTickets = createAction({
  auth: zendeskAuth,
  name: 'zendesk_count_view_tickets',
  outputSchema: zendeskCountViewTicketsOutputSchema,
  displayName: 'Count View Tickets',
  description: 'Count the tickets in a view.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns the number of tickets in one view. Counts are cached by Zendesk and can be a few minutes old; fresh is false while a new count is computed.',
    idempotent: true,
  },
  props: {
    view_id: zendeskAiProps.requiredId({ displayName: 'View ID', description: 'Numeric view ID from List Views, or incoming, my or my_groups.' }),
  },
  async run({ auth, propsValue }) {
    const viewId = zendeskApi.pathSegment({ value: propsValue.view_id, label: 'View ID' });
    const response = await zendeskApi.request<{ view_count: Record<string, unknown> }>({
      auth,
      method: HttpMethod.GET,
      path: `/views/${viewId}/count.json`,
    });
    return response.view_count;
  },
});
