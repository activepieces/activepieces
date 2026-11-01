import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskGetUserOutputSchema } from '../../../output-schemas';

export const zendeskMergeUsers = createAction({
  auth: zendeskAuth,
  name: 'zendesk_merge_users',
  outputSchema: zendeskGetUserOutputSchema,
  displayName: 'Merge Users',
  description: 'Merge a duplicate end user into another user.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Merges the source end user into the target user: the source tickets, identities and memberships move to the target and the source is deleted. Irreversible. Only end users can be merged as the source. Returns the target user.',
    idempotent: false,
  },
  props: {
    source_user_id: zendeskAiProps.requiredId({
      displayName: 'Source User ID',
      description: 'The duplicate end user to merge away, from Search Users.',
    }),
    target_user_id: zendeskAiProps.requiredId({
      displayName: 'Target User ID',
      description: 'The user that remains and receives the data, from Search Users.',
    }),
  },
  async run({ auth, propsValue }) {
    const sourceId = zendeskApi.id({ value: propsValue.source_user_id, label: 'Source User ID' });
    const targetId = zendeskApi.id({ value: propsValue.target_user_id, label: 'Target User ID' });
    if (sourceId === targetId) {
      throw new Error('Source and target user must differ.');
    }
    const response = await zendeskApi.request<{ user: Record<string, unknown> }>({
      auth,
      method: HttpMethod.PUT,
      path: `/users/${sourceId}/merge.json`,
      body: { user: { id: Number(targetId) } },
    });
    return response.user;
  },
});
