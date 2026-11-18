import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { CursorMeta, zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskListGroupsOutputSchema } from '../../../output-schemas';

export const zendeskListUserGroups = createAction({
  auth: zendeskAuth,
  name: 'zendesk_list_user_groups',
  outputSchema: zendeskListGroupsOutputSchema,
  displayName: 'List User Groups',
  description: 'List the groups an agent belongs to.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the groups one agent belongs to. End users belong to no groups. Use List Group Users for the reverse lookup.',
    idempotent: true,
  },
  props: {
    user_id: zendeskAiProps.requiredId({ displayName: 'User ID', description: 'Numeric user ID, from Search Users, List Users or Get Current User.' }),
    limit: zendeskAiProps.limit(),
    cursor: zendeskAiProps.cursor(),
  },
  async run({ auth, propsValue }) {
    const userId = zendeskApi.id({ value: propsValue.user_id, label: 'User ID' });
    const response = await zendeskApi.request<{ groups: unknown[]; meta?: CursorMeta }>({
      auth,
      method: HttpMethod.GET,
      path: `/users/${userId}/groups.json`,
      queryParams: zendeskApi.cursorQuery({ limit: propsValue.limit, cursor: propsValue.cursor }),
    });
    return {
      groups: response.groups,
      count: response.groups.length,
      ...zendeskApi.cursorResult(response.meta),
    };
  },
});
