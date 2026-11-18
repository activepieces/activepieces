import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostConvertUserToBotOutputSchema } from '../../../output-schemas';

export const convertUserToBotAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_convert_user_to_bot',
  outputSchema: mattermostConvertUserToBotOutputSchema,
  displayName: 'Convert User To Bot',
  description: 'Converts a regular user account into a bot account.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Converts a regular user into a bot account: the user can no longer log in with a password. Needs a system admin connection. Undo with Convert Bot To User. The new bot owns itself; give it another owner with Assign Bot before Disable Bot, which otherwise never returns.',
    idempotent: false,
  },
  props: {
    userId: mattermostAiProps.userId({
      required: true,
      description: 'ID of the user to convert (26 characters). Use Get User By Username to find it.',
    }),
  },
  async run(context) {
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/users/${encodeURIComponent(context.propsValue.userId)}/convert_to_bot`,
    });
  },
});
