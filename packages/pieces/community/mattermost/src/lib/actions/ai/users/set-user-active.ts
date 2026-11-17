import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostUtils } from '../../../common/utils';
import { mattermostArchiveChannelOutputSchema } from '../../../output-schemas';

export const setUserActiveAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_set_user_active',
  outputSchema: mattermostArchiveChannelOutputSchema,
  displayName: 'Activate or Deactivate User',
  description: 'Deactivates or reactivates a user account.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Deactivates a user (Active false: they are signed out and cannot sign in) or reactivates them (Active true); the account and its content are kept. Users can deactivate themselves; anything else needs a system admin connection.',
    idempotent: true,
  },
  props: {
    userId: mattermostAiProps.userId({ required: true }),
    active: mattermostAiProps.booleanFlag({
      required: true,
      displayName: 'Active',
      description: 'True to reactivate the user, false to deactivate them.',
    }),
  },
  async run(context) {
    const { userId, active } = context.propsValue;
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.PUT,
      path: `/users/${encodeURIComponent(userId)}/active`,
      body: { active: mattermostUtils.parseBoolean({ value: active }) },
    });
  },
});
