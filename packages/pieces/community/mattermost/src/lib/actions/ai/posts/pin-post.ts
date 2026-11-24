import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostArchiveChannelOutputSchema } from '../../../output-schemas';

export const pinPostAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_pin_post',
  outputSchema: mattermostArchiveChannelOutputSchema,
  displayName: 'Pin Post',
  description: 'Pins a post to its channel.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      "Pins a post to its channel so it shows in the channel's pinned list. Pinning an already pinned post keeps it pinned. Undo with Unpin Post.",
    idempotent: true,
  },
  props: {
    postId: mattermostAiProps.postId({ required: true }),
  },
  async run(context) {
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/posts/${encodeURIComponent(context.propsValue.postId)}/pin`,
    });
  },
});
