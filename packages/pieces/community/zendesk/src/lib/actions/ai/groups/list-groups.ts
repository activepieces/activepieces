import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { CursorMeta, zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskListGroupsOutputSchema } from '../../../output-schemas';

export const zendeskListGroups = createAction({
  auth: zendeskAuth,
  name: 'zendesk_list_groups',
  outputSchema: zendeskListGroupsOutputSchema,
  displayName: 'List Groups',
  description: 'List agent groups.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the agent groups tickets can be assigned to, with their IDs for Create Ticket, Update Ticket and List Group Users.',
    idempotent: true,
  },
  props: {
    limit: zendeskAiProps.limit(),
    cursor: zendeskAiProps.cursor(),
  },
  async run({ auth, propsValue }) {
    const response = await zendeskApi.request<{ groups: unknown[]; meta?: CursorMeta }>({
      auth,
      method: HttpMethod.GET,
      path: `/groups.json`,
      queryParams: zendeskApi.cursorQuery({ limit: propsValue.limit, cursor: propsValue.cursor }),
    });
    return {
      groups: response.groups,
      count: response.groups.length,
      ...zendeskApi.cursorResult(response.meta),
    };
  },
});
