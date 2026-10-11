import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskDeleteUserOutputSchema } from '../../../output-schemas';

export const zendeskDeleteUser = createAction({
  auth: zendeskAuth,
  name: 'zendesk_delete_user',
  outputSchema: zendeskDeleteUserOutputSchema,
  displayName: 'Delete User',
  description: 'Delete a user.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Soft-deletes one user: they can no longer sign in and their tickets stay. Zendesk permanently removes deleted users later, so this cannot be undone from the API. Agents must be downgraded to end users first. Requires an admin, or an agent allowed to manage end users.',
    idempotent: true,
  },
  props: {
    user_id: zendeskAiProps.requiredId({ displayName: 'User ID', description: 'Numeric user ID, from Search Users, List Users or Get Current User.' }),
  },
  async run({ auth, propsValue }) {
    const userId = zendeskApi.id({ value: propsValue.user_id, label: 'User ID' });
    const response = await zendeskApi.request<{ user: Record<string, unknown> }>({
      auth,
      method: HttpMethod.DELETE,
      path: `/users/${userId}.json`,
    });
    return response.user;
  },
});
