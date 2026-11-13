import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostPatchPostOutputSchema } from '../../../output-schemas';

export const sendEphemeralPostAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_send_ephemeral_post',
  outputSchema: mattermostPatchPostOutputSchema,
  displayName: 'Send Ephemeral Post',
  description: 'Shows a temporary message in a channel to one user only.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Shows a temporary message in a channel that only the target user sees; it is not stored and disappears on reload. Use Create Post for a normal message. Needs system admin permission. Not idempotent: each call shows another message.',
    idempotent: false,
  },
  props: {
    userId: Property.ShortText({
      displayName: 'Target User ID',
      description:
        'ID (26 characters) of the user who will see the message. Use Get User By Username or Search Users to find it.',
      required: true,
    }),
    channelId: mattermostAiProps.channelId({ required: true }),
    message: Property.LongText({
      displayName: 'Message',
      description: 'Message text; Markdown is supported.',
      required: true,
    }),
  },
  async run(context) {
    const { userId, channelId, message } = context.propsValue;
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/posts/ephemeral',
      body: { user_id: userId, post: { channel_id: channelId, message } },
    });
  },
});
