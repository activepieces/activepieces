import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskAddOrganizationTagsOutputSchema } from '../../../output-schemas';

export const zendeskRemoveUserTags = createAction({
  auth: zendeskAuth,
  name: 'zendesk_remove_user_tags',
  outputSchema: zendeskAddOrganizationTagsOutputSchema,
  displayName: 'Remove User Tags',
  description: 'Remove tags from a user.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Removes the given tags from one user and keeps the rest; tags not on the user are ignored. Returns the remaining tag list.',
    idempotent: true,
  },
  props: {
    user_id: zendeskAiProps.requiredId({ displayName: 'User ID', description: 'Numeric user ID, from Search Users, List Users or Get Current User.' }),
    tags: Property.Array({ displayName: 'Tags', description: 'Tags to remove; tags are lowercase and cannot contain spaces.', required: true }),
  },
  async run({ auth, propsValue }) {
    const userId = zendeskApi.id({ value: propsValue.user_id, label: 'User ID' });
    const tags = zendeskApi.stringList(propsValue.tags);
    if (tags.length === 0) {
      throw new Error('Tags must contain at least one tag.');
    }
    const response = await zendeskApi.request<{ tags: unknown[] }>({
      auth,
      method: HttpMethod.DELETE,
      path: `/users/${userId}/tags.json`,
      queryParams: {
        tags: tags.join(','),
      },
    });
    return { tags: response.tags, count: response.tags.length };
  },
});
