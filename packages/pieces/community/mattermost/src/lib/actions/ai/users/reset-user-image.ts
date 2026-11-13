import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostArchiveChannelOutputSchema } from '../../../output-schemas';

export const resetUserImageAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_reset_user_image',
  outputSchema: mattermostArchiveChannelOutputSchema,
  displayName: 'Reset User Image',
  description: 'Deletes a user\'s uploaded profile picture.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Deletes a user\'s uploaded profile picture so the generated default shows again; the uploaded image cannot be recovered. Resetting another user needs permission to edit other users.',
    idempotent: false,
  },
  props: {
    userId: mattermostAiProps.userId({ required: true }),
  },
  async run(context) {
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/users/${encodeURIComponent(context.propsValue.userId)}/image`,
    });
  },
});
