import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskAddOrganizationTagsOutputSchema } from '../../../output-schemas';

export const zendeskGetUserTags = createAction({
  auth: zendeskAuth,
  name: 'zendesk_get_user_tags',
  outputSchema: zendeskAddOrganizationTagsOutputSchema,
  displayName: 'Get User Tags',
  description: 'List the tags on a user.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Lists the tags on one user. Change them with Add User Tags or Remove User Tags.',
    idempotent: true,
  },
  props: {
    user_id: zendeskAiProps.requiredId({ displayName: 'User ID', description: 'Numeric user ID, from Search Users, List Users or Get Current User.' }),
  },
  async run({ auth, propsValue }) {
    const userId = zendeskApi.id({ value: propsValue.user_id, label: 'User ID' });
    const response = await zendeskApi.request<{ tags: unknown[] }>({
      auth,
      method: HttpMethod.GET,
      path: `/users/${userId}/tags.json`,
    });
    return { tags: response.tags, count: response.tags.length };
  },
});
