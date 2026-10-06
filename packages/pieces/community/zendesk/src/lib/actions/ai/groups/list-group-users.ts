import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskGetManyUsersOutputSchema } from '../../../output-schemas';

export const zendeskListGroupUsers = createAction({
  auth: zendeskAuth,
  name: 'zendesk_list_group_users',
  outputSchema: zendeskGetManyUsersOutputSchema,
  displayName: 'List Group Users',
  description: 'List the agents in a group.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the agents who belong to one group, e.g. to pick an assignee that matches the ticket group. Group IDs come from List Groups.',
    idempotent: true,
  },
  props: {
    group_id: zendeskAiProps.requiredId({ displayName: 'Group ID', description: 'Numeric group ID, from List Groups.' }),
  },
  async run({ auth, propsValue }) {
    const groupId = zendeskApi.id({ value: propsValue.group_id, label: 'Group ID' });
    const response = await zendeskApi.request<{ users: unknown[] }>({
      auth,
      method: HttpMethod.GET,
      path: `/groups/${groupId}/users.json`,
    });
    return { users: response.users, count: response.users.length };
  },
});
