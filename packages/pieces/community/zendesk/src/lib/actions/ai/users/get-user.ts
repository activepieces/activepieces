import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskGetUserOutputSchema } from '../../../output-schemas';

export const zendeskGetUser = createAction({
  auth: zendeskAuth,
  name: 'zendesk_get_user',
  outputSchema: zendeskGetUserOutputSchema,
  displayName: 'Get User',
  description: 'Get a user by their ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fetches one user (end user, agent or admin) by numeric ID, with email, phone, role, organization, tags and user fields. Use Search Users to find a user by email or name, and Get Many Users for up to 100 IDs.',
    idempotent: true,
  },
  props: {
    user_id: zendeskAiProps.requiredId({ displayName: 'User ID', description: 'Numeric user ID, from Search Users, List Users or Get Current User.' }),
  },
  async run({ auth, propsValue }) {
    const userId = zendeskApi.id({ value: propsValue.user_id, label: 'User ID' });
    const response = await zendeskApi.request<{ user: Record<string, unknown> }>({
      auth,
      method: HttpMethod.GET,
      path: `/users/${userId}.json`,
    });
    return response.user;
  },
});
