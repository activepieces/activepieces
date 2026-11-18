import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostGetUserOutputSchema } from '../../../output-schemas';

export const getUserAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_get_user',
  outputSchema: mattermostGetUserOutputSchema,
  displayName: 'Get User',
  description: 'Gets a user by ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one user\'s profile by ID; pass "me" for the connected account. To look up by username or email use Get User By Username or Get User By Email.',
    idempotent: true,
  },
  props: {
    userId: mattermostAiProps.userId({ required: true }),
  },
  async run(context) {
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/users/${encodeURIComponent(context.propsValue.userId)}`,
    });
  },
});
