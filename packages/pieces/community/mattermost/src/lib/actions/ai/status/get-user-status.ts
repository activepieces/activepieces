import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostGetUserStatusOutputSchema } from '../../../output-schemas';

export const getUserStatusAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_get_user_status',
  outputSchema: mattermostGetUserStatusOutputSchema,
  displayName: 'Get User Status',
  description: 'Gets a user\'s presence status.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns a user\'s presence (online, away, dnd or offline) and when it last changed; pass "me" for the connected account. For several users at once use Get User Statuses.',
    idempotent: true,
  },
  props: {
    userId: mattermostAiProps.userId({ required: true }),
  },
  async run(context) {
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/users/${encodeURIComponent(context.propsValue.userId)}/status`,
    });
  },
});
