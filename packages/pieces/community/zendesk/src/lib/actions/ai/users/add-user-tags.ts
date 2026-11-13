import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskAddOrganizationTagsOutputSchema } from '../../../output-schemas';

export const zendeskAddUserTags = createAction({
  auth: zendeskAuth,
  name: 'zendesk_add_user_tags',
  outputSchema: zendeskAddOrganizationTagsOutputSchema,
  displayName: 'Add User Tags',
  description: 'Add tags to a user, keeping existing tags.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Adds tags to one user and keeps the tags already on them; re-adding an existing tag changes nothing. Returns the full tag list. Requires user tagging to be enabled in the account.',
    idempotent: true,
  },
  props: {
    user_id: zendeskAiProps.requiredId({ displayName: 'User ID', description: 'Numeric user ID, from Search Users, List Users or Get Current User.' }),
    tags: Property.Array({ displayName: 'Tags', description: 'Tags to add; tags are lowercase and cannot contain spaces.', required: true }),
  },
  async run({ auth, propsValue }) {
    const userId = zendeskApi.id({ value: propsValue.user_id, label: 'User ID' });
    const tags = zendeskApi.stringList(propsValue.tags);
    if (tags.length === 0) {
      throw new Error('Tags must contain at least one tag.');
    }
    const response = await zendeskApi.request<{ tags: unknown[] }>({
      auth,
      method: HttpMethod.PUT,
      path: `/users/${userId}/tags.json`,
      body: { tags },
    });
    return { tags: response.tags, count: response.tags.length };
  },
});
